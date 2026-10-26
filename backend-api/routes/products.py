
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from database import database
from routes.auth import get_current_user
from routes.robot import router as robot_router


router = APIRouter()



# -------------------------
# Product schemas
# -------------------------

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = "Medical Supply"
    unit: str = "Units"
    manufacturer: str = "Unknown"
    description: Optional[str] = None
    price: float = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)
    plan_level: str = "Basic"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    plan_level: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------
# Helper functions
# -------------------------

def format_product_row(row):
    if row is None:
        return None

    result = dict(row)

    if isinstance(result.get("price"), Decimal):
        result["price"] = float(result["price"])

    return result


def get_organization_name(current_user: dict) -> str:
    organization_name = (
        current_user.get("organization_name") or ""
    ).strip()

    if not organization_name:
        raise HTTPException(
            status_code=400,
            detail="Your account has no organization assigned"
        )

    return organization_name


def check_product_access(product, current_user):
    subscription = current_user.get("subscription", "Basic")

    if (
        subscription != "Professional"
        and product["plan_level"] == "Professional"
    ):
        raise HTTPException(
            status_code=403,
            detail="Professional subscription required"
        )


async def get_accessible_product(product_id: int, current_user: dict):
    organization_name = get_organization_name(current_user)

    query = """
        SELECT *
        FROM products
        WHERE id = :id
          AND (
              organization_name IS NULL
              OR organization_name = :organization_name
          )
    """

    row = await database.fetch_one(
        query=query,
        values={
            "id": product_id,
            "organization_name": organization_name,
        },
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    check_product_access(row, current_user)
    return row


# -------------------------
# Get products
# -------------------------

@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    current_user: dict = Depends(get_current_user)
):
    organization_name = get_organization_name(current_user)
    subscription = current_user.get("subscription", "Basic")

    query = """
        SELECT *
        FROM products
        WHERE (
            organization_name IS NULL
            OR organization_name = :organization_name
        )
    """

    values = {
        "organization_name": organization_name,
    }

    if subscription != "Professional":
        query += " AND plan_level = 'Basic'"

    query += " ORDER BY id ASC"

    rows = await database.fetch_all(
        query=query,
        values=values,
    )

    return [format_product_row(row) for row in rows]


# -------------------------
# Get one product
# -------------------------

@router.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
async def get_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):
    row = await get_accessible_product(
        product_id,
        current_user
    )

    return format_product_row(row)


# -------------------------
# Create product
# -------------------------

@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    # Keep the existing permission rules.
    if current_user.get("role") not in ("ADMIN", "STAFF"):
        raise HTTPException(
            status_code=403,
            detail="Only staff or administrators can create products"
        )

    organization_name = get_organization_name(current_user)
    subscription = current_user.get("subscription", "Basic")

    if product.plan_level not in ("Basic", "Professional"):
        raise HTTPException(
            status_code=400,
            detail="Invalid plan_level"
        )

    if (
        product.plan_level == "Professional"
        and subscription != "Professional"
    ):
        raise HTTPException(
            status_code=403,
            detail="Professional subscription required"
        )

    # Basic quota counts only products owned by this organization.
    # Shared products have organization_name = NULL and do not count.
    if subscription != "Professional":
        count_query = """
            SELECT COUNT(*) AS total
            FROM products
            WHERE organization_name = :organization_name
        """

        count_row = await database.fetch_one(
            query=count_query,
            values={
                "organization_name": organization_name,
            },
        )

        product_count = count_row["total"]

        if product_count >= 500:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Basic plan limit reached: "
                    "500 products per organization. "
                    "Upgrade to Professional for unlimited products."
                )
            )

    insert_query = """
        INSERT INTO products (
            name,
            category,
            unit,
            manufacturer,
            description,
            price,
            stock,
            plan_level,
            organization_name,
            created_at
        )
        VALUES (
            :name,
            :category,
            :unit,
            :manufacturer,
            :description,
            :price,
            :stock,
            :plan_level,
            :organization_name,
            NOW()
        )
        RETURNING *
    """

    values = product.dict()
    values["organization_name"] = organization_name

    row = await database.fetch_one(
        query=insert_query,
        values=values,
    )

    return format_product_row(row)


# -------------------------
# Update product
# -------------------------

@router.put(
    "/products/{product_id}",
    response_model=ProductResponse
)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ("ADMIN", "STAFF"):
        raise HTTPException(
            status_code=403,
            detail="Only staff or administrators can update products"
        )

    organization_name = get_organization_name(current_user)

    # Only update products owned by this organization.
    # Shared seed products cannot be modified through this endpoint.
    existing = await database.fetch_one(
        query="""
            SELECT *
            FROM products
            WHERE id = :id
              AND organization_name = :organization_name
        """,
        values={
            "id": product_id,
            "organization_name": organization_name,
        },
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = product.dict(exclude_unset=True)

    if not update_data:
        return format_product_row(existing)

    if (
        "plan_level" in update_data
        and update_data["plan_level"] not in ("Basic", "Professional")
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid plan_level"
        )

    if (
        update_data.get("plan_level") == "Professional"
        and current_user.get("subscription", "Basic") != "Professional"
    ):
        raise HTTPException(
            status_code=403,
            detail="Professional subscription required"
        )

    set_clauses = [
        f"{column} = :{column}"
        for column in update_data
    ]

    query = f"""
        UPDATE products
        SET {", ".join(set_clauses)}
        WHERE id = :id
          AND organization_name = :organization_name
        RETURNING *
    """

    row = await database.fetch_one(
        query=query,
        values={
            **update_data,
            "id": product_id,
            "organization_name": organization_name,
        },
    )

    return format_product_row(row)


# -------------------------
# Delete product
# -------------------------

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can delete products"
        )

    organization_name = get_organization_name(current_user)

    # Prevent deleting shared seed products or another organization's items.
    row = await database.fetch_one(
        query="""
            DELETE FROM products
            WHERE id = :id
              AND organization_name = :organization_name
            RETURNING id
        """,
        values={
            "id": product_id,
            "organization_name": organization_name,
        },
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product deleted successfully",
        "id": product_id,
    }


# -------------------------
# Buy product / reduce stock
# -------------------------

@router.post(
    "/products/{product_id}/buy",
    response_model=ProductResponse
)
async def buy_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):
    existing = await get_accessible_product(
        product_id,
        current_user
    )

    organization_name = get_organization_name(current_user)

    row = await database.fetch_one(
        query="""
            UPDATE products
            SET stock = stock - 1
            WHERE id = :id
              AND stock > 0
              AND (
                  organization_name IS NULL
                  OR organization_name = :organization_name
              )
            RETURNING *
        """,
        values={
            "id": product_id,
            "organization_name": organization_name,
        },
    )

    if not row:
        raise HTTPException(
            status_code=400,
            detail="Product is out of stock"
        )

    return format_product_row(row)
