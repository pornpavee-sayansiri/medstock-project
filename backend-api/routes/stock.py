from datetime import date
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from database import database
from routes.auth import get_current_user


router = APIRouter()


def get_user_id(current_user: dict) -> int:
    user_id = current_user.get("id")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Unable to identify the current user",
        )

    return int(user_id)

def is_professional(current_user: dict) -> bool:
    return (
        str(current_user.get("subscription", "Basic")).lower()
        == "professional"
    )

async def verify_warehouse(warehouse_id: int, user_id: int):
    warehouse = await database.fetch_one(
        query="""
            SELECT id, name
            FROM warehouses
            WHERE id = :warehouse_id AND user_id = :user_id
        """,
        values={
            "warehouse_id": warehouse_id,
            "user_id": user_id,
        },
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found",
        )

    return dict(warehouse)


async def verify_product(product_id: int, current_user: dict):
    organization_name = current_user.get("organization_name")

    product = await database.fetch_one(
        query="""
            SELECT id, name, plan_level
            FROM products
            WHERE id = :product_id
              AND (
                  organization_name IS NULL
                  OR organization_name = :organization_name
              )
        """,
        values={
            "product_id": product_id,
            "organization_name": organization_name,
        },
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    if (
        str(product["plan_level"]).lower() == "professional"
        and not is_professional(current_user)
    ):
        raise HTTPException(
            status_code=403,
            detail="This product requires the Professional plan",
        )

    return dict(product)

# -------------------------
# Request schemas
# -------------------------

class StockItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    warehouse_id: int = Field(..., gt=0)
    min_stock: int = Field(default=0, ge=0)
    expiration_date: Optional[date] = None
    storage_location: Optional[str] = Field(default=None, max_length=255)


class StockItemUpdate(BaseModel):
    min_stock: Optional[int] = Field(default=None, ge=0)
    expiration_date: Optional[date] = None
    storage_location: Optional[str] = Field(default=None, max_length=255)


class StockMovement(BaseModel):
    product_id: int = Field(..., gt=0)
    warehouse_id: int = Field(..., gt=0)
    transaction_type: Literal["Stock In", "Stock Out"]
    quantity: int = Field(..., gt=0)
    note: Optional[str] = None


# -------------------------
# List stock items
# -------------------------

@router.get("/stock")
async def list_stock(
    warehouse_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    if warehouse_id is not None:
        await verify_warehouse(warehouse_id, user_id)

    values = {
        "user_id": user_id,
        "organization_name": current_user.get("organization_name"),
    }

    warehouse_filter = ""
    if warehouse_id is not None:
        warehouse_filter = "AND w.id = :warehouse_id"
        values["warehouse_id"] = warehouse_id

    plan_filter = ""
    if not is_professional(current_user):
        plan_filter = "AND p.plan_level = 'Basic'"

    query = f"""
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.category,
            p.unit,
            p.manufacturer,
            p.plan_level,
            COALESCE(si.id, 0) AS stock_item_id,
            COALESCE(si.quantity, 0) AS quantity,
            COALESCE(si.min_stock, 0) AS min_stock,
            si.expiration_date,
            si.storage_location,
            w.id AS warehouse_id,
            w.name AS warehouse_name
        FROM products p
        CROSS JOIN warehouses w
        LEFT JOIN stock_items si
            ON si.product_id = p.id
            AND si.user_id = :user_id
            AND si.warehouse_id = w.id
        WHERE w.user_id = :user_id
          AND (
              p.organization_name IS NULL
              OR p.organization_name = :organization_name
          )
          {plan_filter}
          {warehouse_filter}
        ORDER BY p.id ASC, w.id ASC
    """

    rows = await database.fetch_all(
        query=query,
        values=values,
    )

    return [dict(row) for row in rows]


# -------------------------
# Add stock item to warehouse
# -------------------------

@router.post("/stock/items", status_code=status.HTTP_201_CREATED)
async def create_stock_item(
    item: StockItemCreate,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    await verify_warehouse(item.warehouse_id, user_id)
    await verify_product(item.product_id, current_user)

    existing = await database.fetch_one(
        query="""
            SELECT id
            FROM stock_items
            WHERE user_id = :user_id
              AND product_id = :product_id
              AND warehouse_id = :warehouse_id
        """,
        values={
            "user_id": user_id,
            "product_id": item.product_id,
            "warehouse_id": item.warehouse_id,
        },
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This product already exists in this warehouse",
        )

    query = """
        INSERT INTO stock_items (
            user_id, product_id, warehouse_id, quantity,
            min_stock, expiration_date, storage_location
        )
        VALUES (
            :user_id, :product_id, :warehouse_id, 0,
            :min_stock, :expiration_date, :storage_location
        )
        RETURNING id
    """

    row = await database.fetch_one(
        query=query,
        values={
            "user_id": user_id,
            "product_id": item.product_id,
            "warehouse_id": item.warehouse_id,
            "min_stock": item.min_stock,
            "expiration_date": item.expiration_date,
            "storage_location": item.storage_location,
        },
    )

    return {
        "message": "Stock item created successfully",
        "id": row["id"],
        "quantity": 0,
    }


# -------------------------
# Update stock settings
# -------------------------

@router.put("/stock/items/{stock_item_id}")
async def update_stock_item(
    stock_item_id: int,
    item: StockItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    updates = item.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    existing = await database.fetch_one(
        query="""
            SELECT id
            FROM stock_items
            WHERE id = :stock_item_id AND user_id = :user_id
        """,
        values={
            "stock_item_id": stock_item_id,
            "user_id": user_id,
        },
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Stock item not found",
        )

    set_clauses = [f"{key} = :{key}" for key in updates]
    updates["stock_item_id"] = stock_item_id
    updates["user_id"] = user_id

    await database.execute(
        query=f"""
            UPDATE stock_items
            SET {", ".join(set_clauses)},
                updated_at = NOW()
            WHERE id = :stock_item_id AND user_id = :user_id
        """,
        values=updates,
    )

    return {"message": "Stock settings updated successfully"}


# -------------------------
# Stock In / Stock Out
# -------------------------

@router.post("/stock/movements", status_code=status.HTTP_201_CREATED)
async def create_stock_movement(
    movement: StockMovement,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    await verify_warehouse(movement.warehouse_id, user_id)
    await verify_product(movement.product_id, current_user)

    # Ensure the inventory row exists.
    existing = await database.fetch_one(
        query="""
            SELECT id, quantity
            FROM stock_items
            WHERE user_id = :user_id
              AND product_id = :product_id
              AND warehouse_id = :warehouse_id
            FOR UPDATE
        """,
        values={
            "user_id": user_id,
            "product_id": movement.product_id,
            "warehouse_id": movement.warehouse_id,
        },
    )

    if not existing:
        await database.execute(
            query="""
                INSERT INTO stock_items (
                    user_id, product_id, warehouse_id, quantity
                )
                VALUES (
                    :user_id, :product_id, :warehouse_id, 0
                )
            """,
            values={
                "user_id": user_id,
                "product_id": movement.product_id,
                "warehouse_id": movement.warehouse_id,
            },
        )

        existing = await database.fetch_one(
            query="""
                SELECT id, quantity
                FROM stock_items
                WHERE user_id = :user_id
                  AND product_id = :product_id
                  AND warehouse_id = :warehouse_id
            """,
            values={
                "user_id": user_id,
                "product_id": movement.product_id,
                "warehouse_id": movement.warehouse_id,
            },
        )

    current_quantity = int(existing["quantity"])

    if movement.transaction_type == "Stock Out":
        if current_quantity < movement.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available quantity: {current_quantity}",
            )

        new_quantity = current_quantity - movement.quantity
    else:
        new_quantity = current_quantity + movement.quantity

    # Keep stock update and transaction history in one DB transaction.
    async with database.transaction():
        await database.execute(
            query="""
                UPDATE stock_items
                SET quantity = :quantity, updated_at = NOW()
                WHERE id = :stock_item_id AND user_id = :user_id
            """,
            values={
                "quantity": new_quantity,
                "stock_item_id": existing["id"],
                "user_id": user_id,
            },
        )

        await database.execute(
            query="""
                INSERT INTO stock_transactions (
                    user_id, product_id, warehouse_id,
                    transaction_type, quantity, stock_after, note
                )
                VALUES (
                    :user_id, :product_id, :warehouse_id,
                    :transaction_type, :quantity, :stock_after, :note
                )
            """,
            values={
                "user_id": user_id,
                "product_id": movement.product_id,
                "warehouse_id": movement.warehouse_id,
                "transaction_type": movement.transaction_type,
                "quantity": movement.quantity,
                "stock_after": new_quantity,
                "note": movement.note,
            },
        )

    return {
        "message": "Stock movement recorded successfully",
        "product_id": movement.product_id,
        "warehouse_id": movement.warehouse_id,
        "transaction_type": movement.transaction_type,
        "quantity": movement.quantity,
        "stock_after": new_quantity,
    }


# -------------------------
# Transaction history
# -------------------------

@router.get("/transactions")
async def list_transactions(
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    query = """
        SELECT
            t.id,
            t.product_id,
            p.name AS product_name,
            t.warehouse_id,
            w.name AS warehouse_name,
            t.transaction_type,
            t.quantity,
            t.stock_after,
            t.note,
            t.created_at
        FROM stock_transactions t
        JOIN products p ON p.id = t.product_id
        JOIN warehouses w ON w.id = t.warehouse_id
        WHERE t.user_id = :user_id
        ORDER BY t.created_at DESC, t.id DESC
    """

    rows = await database.fetch_all(
        query=query,
        values={"user_id": user_id},
    )

    return [dict(row) for row in rows]
