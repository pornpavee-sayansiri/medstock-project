
from typing import Optional

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


def require_professional(current_user: dict):
    subscription = str(
        current_user.get("subscription", "Basic")
    ).lower()

    if subscription != "professional":
        raise HTTPException(
            status_code=403,
            detail=(
                "Robot Task Automation is available only "
                "for Professional customers. Please upgrade."
            ),
        )


class RobotTaskCreate(BaseModel):
    taskName: str = Field(..., min_length=1, max_length=255)
    type: str = "Restock"
    fromWarehouseId: int
    toWarehouseId: Optional[int] = None
    product: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)


class RobotTaskUpdate(BaseModel):
    status: str


ALLOWED_TYPES = {"Restock"}

ALLOWED_STATUSES = {
    "Pending",
    "In Progress",
    "Completed",
    "Failed",
}


async def warehouse_belongs_to_user(
    warehouse_id: int,
    user_id: int,
) -> bool:
    row = await database.fetch_one(
        query="""
            SELECT id
            FROM warehouses
            WHERE id = :warehouse_id
              AND user_id = :user_id
        """,
        values={
            "warehouse_id": warehouse_id,
            "user_id": user_id,
        },
    )

    return row is not None


async def find_product(
    product_name: str,
    current_user: dict,
):
    organization_name = current_user.get("organization_name")

    return await database.fetch_one(
        query="""
            SELECT id, name
            FROM products
            WHERE LOWER(name) = LOWER(:product_name)
              AND (
                    organization_name IS NULL
                    OR organization_name = :organization_name
                  )
            ORDER BY id
            LIMIT 1
        """,
        values={
            "product_name": product_name,
            "organization_name": organization_name,
        },
    )


async def get_task(task_id: int, user_id: int):
    row = await database.fetch_one(
        query="""
            SELECT
                t.id,
                t.task_name,
                t.task_type,
                t.from_warehouse_id,
                w.name AS from_warehouse,
                t.to_warehouse_id,
                NULL AS to_warehouse,
                t.product_name,
                t.quantity,
                t.status,
                t.created_by,
                t.created_at
            FROM robot_tasks t
            JOIN warehouses w
              ON w.id = t.from_warehouse_id
             AND w.user_id = t.user_id
            WHERE t.id = :task_id
              AND t.user_id = :user_id
        """,
        values={
            "task_id": task_id,
            "user_id": user_id,
        },
    )

    return dict(row) if row else None


@router.get("/robot/tasks")
async def list_robot_tasks(
    current_user: dict = Depends(get_current_user),
):
    require_professional(current_user)
    user_id = get_user_id(current_user)

    rows = await database.fetch_all(
        query="""
            SELECT
                t.id,
                t.task_name,
                t.task_type,
                t.from_warehouse_id,
                w.name AS from_warehouse,
                t.to_warehouse_id,
                NULL AS to_warehouse,
                t.product_name,
                t.quantity,
                t.status,
                t.created_by,
                t.created_at
            FROM robot_tasks t
            JOIN warehouses w
              ON w.id = t.from_warehouse_id
             AND w.user_id = t.user_id
            WHERE t.user_id = :user_id
            ORDER BY t.created_at DESC, t.id DESC
        """,
        values={"user_id": user_id},
    )

    return [dict(row) for row in rows]


@router.post(
    "/robot/tasks",
    status_code=status.HTTP_201_CREATED,
)
async def create_robot_task(
    task: RobotTaskCreate,
    current_user: dict = Depends(get_current_user),
):
    require_professional(current_user)
    user_id = get_user_id(current_user)

    task_name = task.taskName.strip()
    product_name = task.product.strip()

    if not task_name or not product_name:
        raise HTTPException(
            status_code=422,
            detail="Task name and product are required",
        )

    if task.type != "Restock":
        raise HTTPException(
            status_code=422,
            detail="Only Restock tasks are supported",
        )

    if not await warehouse_belongs_to_user(
        task.fromWarehouseId, user_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found",
        )

    product = await find_product(product_name, current_user)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found for your organization",
        )

    # The selected product must already be registered
    # in Stock for the selected warehouse.
    stock_item = await database.fetch_one(
        query="""
            SELECT id
            FROM stock_items
            WHERE user_id = :user_id
              AND product_id = :product_id
              AND warehouse_id = :warehouse_id
        """,
        values={
            "user_id": user_id,
            "product_id": product["id"],
            "warehouse_id": task.fromWarehouseId,
        },
    )

    if not stock_item:
        raise HTTPException(
            status_code=400,
            detail=(
                "Add this product to Stock for the selected "
                "warehouse before creating a Restock task."
            ),
        )

    row = await database.fetch_one(
        query="""
            INSERT INTO robot_tasks (
                user_id,
                task_name,
                task_type,
                from_warehouse_id,
                to_warehouse_id,
                product_name,
                quantity,
                status,
                created_by
            )
            VALUES (
                :user_id,
                :task_name,
                'Restock',
                :warehouse_id,
                NULL,
                :product_name,
                :quantity,
                'Pending',
                :created_by
            )
            RETURNING id
        """,
        values={
            "user_id": user_id,
            "task_name": task_name,
            "warehouse_id": task.fromWarehouseId,
            "product_name": product["name"],
            "quantity": task.quantity,
            "created_by": current_user.get("email", "Staff"),
        },
    )

    return await get_task(row["id"], user_id)


@router.patch("/robot/tasks/{task_id}")
async def update_robot_task(
    task_id: int,
    update: RobotTaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    require_professional(current_user)
    user_id = get_user_id(current_user)

    if update.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=422,
            detail="Invalid task status",
        )

    async with database.transaction():
        task = await database.fetch_one(
            query="""
                SELECT *
                FROM robot_tasks
                WHERE id = :task_id
                  AND user_id = :user_id
                FOR UPDATE
            """,
            values={
                "task_id": task_id,
                "user_id": user_id,
            },
        )

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Robot task not found",
            )

        old_status = task["status"]

        if old_status == "Completed":
            if update.status == "Completed":
                # Already processed; do not add stock again.
                pass
            else:
                raise HTTPException(
                    status_code=400,
                    detail="A completed task cannot be changed.",
                )
        else:
            if update.status == "Completed":
                if task["task_type"] != "Restock":
                    raise HTTPException(
                        status_code=400,
                        detail="Only Restock tasks can be completed.",
                    )

                product = await find_product(
                    task["product_name"],
                    current_user,
                )

                if not product:
                    raise HTTPException(
                        status_code=404,
                        detail="Product not found",
                    )

                stock_item = await database.fetch_one(
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
                        "product_id": product["id"],
                        "warehouse_id": task["from_warehouse_id"],
                    },
                )

                if not stock_item:
                    raise HTTPException(
                        status_code=404,
                        detail="Stock item not found in this warehouse",
                    )

                new_stock = (
                    stock_item["quantity"] + task["quantity"]
                )

                await database.execute(
                    query="""
                        UPDATE stock_items
                        SET quantity = :quantity,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = :stock_item_id
                    """,
                    values={
                        "quantity": new_stock,
                        "stock_item_id": stock_item["id"],
                    },
                )

                await database.execute(
                    query="""
                        INSERT INTO stock_transactions (
                            user_id,
                            product_id,
                            warehouse_id,
                            transaction_type,
                            quantity,
                            stock_after,
                            note,
                            created_at
                        )
                        VALUES (
                            :user_id,
                            :product_id,
                            :warehouse_id,
                            'Stock In',
                            :quantity,
                            :stock_after,
                            :note,
                            CURRENT_TIMESTAMP
                        )
                    """,
                    values={
                        "user_id": user_id,
                        "product_id": product["id"],
                        "warehouse_id": task["from_warehouse_id"],
                        "quantity": task["quantity"],
                        "stock_after": new_stock,
                        "note": f"Robot Restock Task #{task_id}: {task['task_name']}",
                    },
                )

            await database.execute(
                query="""
                    UPDATE robot_tasks
                    SET status = :status
                    WHERE id = :task_id
                      AND user_id = :user_id
                """,
                values={
                    "status": update.status,
                    "task_id": task_id,
                    "user_id": user_id,
                },
            )

    return await get_task(task_id, user_id)


@router.delete("/robot/tasks/{task_id}")
async def delete_robot_task(
    task_id: int,
    current_user: dict = Depends(get_current_user),
):
    require_professional(current_user)
    user_id = get_user_id(current_user)

    row = await database.fetch_one(
        query="""
            DELETE FROM robot_tasks
            WHERE id = :task_id
              AND user_id = :user_id
              AND status <> 'Completed'
            RETURNING id
        """,
        values={
            "task_id": task_id,
            "user_id": user_id,
        },
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail=(
                "Task not found or already completed. "
                "Completed tasks cannot be deleted."
            ),
        )

    return {
        "message": "Robot task deleted successfully",
        "id": task_id,
    }
