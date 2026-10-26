import os
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel


import database
from routes.auth import get_current_user, require_admin


router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "payment-slips"
MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def require_staff(current_user: dict):
    role = str(current_user.get("role", "")).upper()
    print("Payment submission user role:", role)

    if role != "STAFF":
        raise HTTPException(
            status_code=403,
            detail=f"Staff access required. Current role: {role or 'missing'}",
        )

@router.post("/payments")
async def submit_payment(
    slip: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    require_staff(current_user)

    if str(current_user.get("subscription", "Basic")).lower() == "professional":
        raise HTTPException(
            status_code=400,
            detail="Your account already has Professional access",
        )

    content_type = (slip.content_type or "").lower()
    extension = ALLOWED_TYPES.get(content_type)

    if not extension:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP, and PDF files are allowed",
        )

    content = await slip.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(status_code=400, detail="The file is empty")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 5 MB",
        )

    # Avoid accepting a file whose contents disagree with its declared type.
    if extension == ".pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    if extension == ".jpg" and not content.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="Invalid JPEG file")

    if extension == ".png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=400, detail="Invalid PNG file")

    if extension == ".webp" and (
        len(content) < 12
        or content[:4] != b"RIFF"
        or content[8:12] != b"WEBP"
    ):
        raise HTTPException(status_code=400, detail="Invalid WEBP file")

    existing = await database.database.fetch_one(
        query="""
            SELECT id
            FROM payment_requests
            WHERE user_id = :user_id
              AND status = 'Pending'
            LIMIT 1
        """,
        values={"user_id": current_user["id"]},
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending payment request",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    try:
        file_path.write_bytes(content)

        
        result = await database.database.fetch_one(
            query="""
                INSERT INTO payment_requests
                    (user_id, plan, amount, slip_path, status)
                VALUES
                    (:user_id, 'Professional', 1990, :slip_path, 'Pending')
                RETURNING id
            """,
            values={
                "user_id": current_user["id"],
                "slip_path": str(file_path),
            },
        )
        payment_id = result["id"]

    except Exception:
        file_path.unlink(missing_ok=True)
        raise
    finally:
        await slip.close()

    return {
        "message": "Payment submitted for verification",
        "id": payment_id,
        "status": "Pending",
        "plan": "Professional",
        "amount": 1990,
    }


@router.get("/payments/mine")
async def get_my_payments(
    current_user: dict = Depends(get_current_user),
):
    require_staff(current_user)

    rows = await database.database.fetch_all(
        query="""
            SELECT id, plan, amount, status, submitted_at,
                   reviewed_at, admin_note
            FROM payment_requests
            WHERE user_id = :user_id
            ORDER BY submitted_at DESC
        """,
        values={"user_id": current_user["id"]},
    )

    return [dict(row) for row in rows]


@router.get("/admin/payments")
async def get_all_payment_requests(
    admin: dict = Depends(require_admin),
):
    rows = await database.database.fetch_all(
        query="""
            SELECT
                p.id,
                p.user_id,
                u.email,
                u.organization_name,
                p.plan,
                p.amount,
                p.status,
                p.submitted_at,
                p.reviewed_at,
                p.admin_note
            FROM payment_requests p
            JOIN users u ON u.id = p.user_id
            ORDER BY p.submitted_at DESC
        """
    )

    return [dict(row) for row in rows]


@router.get("/admin/payments/{payment_id}/slip")
async def get_payment_slip(
    payment_id: int,
    admin: dict = Depends(require_admin),
):
    row = await database.database.fetch_one(
        query="""
            SELECT slip_path
            FROM payment_requests
            WHERE id = :payment_id
        """,
        values={"payment_id": payment_id},
    )

    if not row:
        raise HTTPException(status_code=404, detail="Payment request not found")

    path = Path(row["slip_path"]).resolve()

    if not path.is_relative_to(UPLOAD_DIR.resolve()) or not path.is_file():
        raise HTTPException(status_code=404, detail="Payment slip not found")

    media_type = {
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
    }.get(path.suffix.lower(), "application/octet-stream")

    return FileResponse(path, media_type=media_type)

from pydantic import BaseModel


class PaymentReview(BaseModel):
    action: str
    admin_note: str | None = None


@router.patch("/admin/payments/{payment_id}/review")
async def review_payment(
    payment_id: int,
    review: PaymentReview,
    admin: dict = Depends(require_admin),
):
    action = review.action.strip().lower()

    if action not in ("approve", "reject"):
        raise HTTPException(
            status_code=400,
            detail="Action must be approve or reject",
        )

    payment = await database.database.fetch_one(
        query="""
            SELECT id, user_id, plan, status
            FROM payment_requests
            WHERE id = :payment_id
        """,
        values={"payment_id": payment_id},
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment request not found",
        )

    if payment["status"] != "Pending":
        raise HTTPException(
            status_code=409,
            detail="This payment request has already been reviewed",
        )

    new_status = "Approved" if action == "approve" else "Rejected"

    if action == "approve":
        await database.database.execute(
            query="""
                UPDATE users
                SET subscription = 'Professional'
                WHERE id = :user_id
            """,
            values={"user_id": payment["user_id"]},
        )

    await database.database.execute(
        query="""
            UPDATE payment_requests
            SET status = :status,
                reviewed_by = :reviewed_by,
                reviewed_at = CURRENT_TIMESTAMP,
                admin_note = :admin_note
            WHERE id = :payment_id
              AND status = 'Pending'
        """,
        values={
            "status": new_status,
            "reviewed_by": admin["id"],
            "admin_note": review.admin_note,
            "payment_id": payment_id,
        },
    )

    return {
        "message": f"Payment request {new_status.lower()}",
        "payment_id": payment_id,
        "user_id": payment["user_id"],
        "status": new_status,
    }


from datetime import datetime, timezone


@router.get("/admin/dashboard")
async def get_admin_dashboard(
    admin: dict = Depends(require_admin),
):
    # Summary counts
    summary = await database.database.fetch_one(
        query="""
            SELECT
                COUNT(*) FILTER (
                    WHERE UPPER(role) = 'STAFF'
                ) AS total_users,
                COUNT(DISTINCT organization_name) FILTER (
                    WHERE UPPER(role) = 'STAFF'
                      AND organization_name IS NOT NULL
                      AND organization_name <> ''
                ) AS total_organizations,
                COUNT(*) FILTER (
                    WHERE UPPER(role) = 'STAFF'
                      AND LOWER(subscription) = 'professional'
                ) AS professional_users,
                COUNT(*) FILTER (
                    WHERE UPPER(role) = 'STAFF'
                      AND LOWER(subscription) = 'basic'
                ) AS basic_users
            FROM users
        """
    )

    payments = await database.database.fetch_one(
        query="""
            SELECT
                COUNT(*) FILTER (
                    WHERE status = 'Pending'
                ) AS pending_payments,
                COALESCE(
                    SUM(amount) FILTER (
                        WHERE status = 'Approved'
                          AND reviewed_at >= date_trunc('month', CURRENT_TIMESTAMP)
                    ),
                    0
                ) AS monthly_revenue
            FROM payment_requests
        """
    )

    organizations = await database.database.fetch_all(
        query="""
            SELECT
                organization_name AS name,
                MIN(email) AS email,
                COUNT(*) AS users,
                CASE
                    WHEN BOOL_OR(LOWER(subscription) = 'professional')
                    THEN 'Professional'
                    ELSE 'Basic'
                END AS plan
            FROM users
            WHERE UPPER(role) = 'STAFF'
              AND organization_name IS NOT NULL
              AND organization_name <> ''
            GROUP BY organization_name
            ORDER BY organization_name
            LIMIT 5
        """
    )

    recent_payments = await database.database.fetch_all(
        query="""
            SELECT
                u.organization_name AS organization,
                p.plan,
                p.amount,
                p.status,
                p.submitted_at AS date
            FROM payment_requests p
            JOIN users u ON u.id = p.user_id
            ORDER BY p.submitted_at DESC
            LIMIT 3
        """
    )

    return {
        "summary": dict(summary),
        "payments": dict(payments),
        "organizations": [dict(row) for row in organizations],
        "recent_payments": [dict(row) for row in recent_payments],
    }
