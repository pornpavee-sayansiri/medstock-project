
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from database import database, warehouses
from routes.auth import get_current_user
from routes.robot import router as robot_router

router = APIRouter()


class WarehouseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None


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


@router.get("/warehouses")
async def list_warehouses(
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    query = """
        SELECT id, user_id, name, location, description, created_at
        FROM warehouses
        WHERE user_id = :user_id
        ORDER BY id ASC
    """

    rows = await database.fetch_all(
        query=query,
        values={"user_id": user_id},
    )

    return [dict(row) for row in rows]


@router.post(
    "/warehouses",
    status_code=status.HTTP_201_CREATED,
)
async def create_warehouse(
    warehouse: WarehouseCreate,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    count = await database.fetch_one(
        query="""
            SELECT COUNT(*) AS total
            FROM warehouses
            WHERE user_id = :user_id
        """,
        values={"user_id": user_id},
    )

    if not is_professional(current_user) and count["total"] >= 1:
        raise HTTPException(
            status_code=403,
            detail="Basic plan allows only one warehouse. Upgrade to Professional.",
        )

    name = warehouse.name.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Warehouse name cannot be empty",
        )

    query = """
        INSERT INTO warehouses (
            user_id, name, location, description
        )
        VALUES (
            :user_id, :name, :location, :description
        )
        RETURNING id, user_id, name, location, description, created_at
    """

    row = await database.fetch_one(
        query=query,
        values={
            "user_id": user_id,
            "name": name,
            "location": warehouse.location,
            "description": warehouse.description,
        },
    )

    return dict(row)


@router.put("/warehouses/{warehouse_id}")
async def update_warehouse(
    warehouse_id: int,
    warehouse: WarehouseUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)
    updates = warehouse.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    if "name" in updates:
        updates["name"] = updates["name"].strip()

        if not updates["name"]:
            raise HTTPException(
                status_code=422,
                detail="Warehouse name cannot be empty",
            )

    existing = await database.fetch_one(
        query="""
            SELECT id
            FROM warehouses
            WHERE id = :warehouse_id AND user_id = :user_id
        """,
        values={
            "warehouse_id": warehouse_id,
            "user_id": user_id,
        },
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found",
        )

    allowed_fields = {"name", "location", "description"}
    updates = {
        key: value
        for key, value in updates.items()
        if key in allowed_fields
    }

    set_clauses = [
        f"{column} = :{column}"
        for column in updates
    ]

    query = f"""
        UPDATE warehouses
        SET {", ".join(set_clauses)}
        WHERE id = :warehouse_id AND user_id = :user_id
        RETURNING id, user_id, name, location, description, created_at
    """

    row = await database.fetch_one(
        query=query,
        values={
            **updates,
            "warehouse_id": warehouse_id,
            "user_id": user_id,
        },
    )

    return dict(row)


@router.delete("/warehouses/{warehouse_id}")
async def delete_warehouse(
    warehouse_id: int,
    current_user: dict = Depends(get_current_user),
):
    user_id = get_user_id(current_user)

    # Keep at least one warehouse for a user.
    count = await database.fetch_one(
        query="""
            SELECT COUNT(*) AS total
            FROM warehouses
            WHERE user_id = :user_id
        """,
        values={"user_id": user_id},
    )

    if count["total"] <= 1:
        raise HTTPException(
            status_code=400,
            detail="You must keep at least one warehouse",
        )

    row = await database.fetch_one(
        query="""
            DELETE FROM warehouses
            WHERE id = :warehouse_id AND user_id = :user_id
            RETURNING id
        """,
        values={
            "warehouse_id": warehouse_id,
            "user_id": user_id,
        },
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found",
        )

    return {
        "message": "Warehouse deleted successfully",
        "id": warehouse_id,
    }
