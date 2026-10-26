
import asyncio
import getpass
import bcrypt
import database


async def main():
    email = input("Admin email: ").strip().lower()
    password = getpass.getpass("Admin password: ")
    confirm = getpass.getpass("Confirm password: ")

    if not email or len(password) < 6:
        print("Email is required and password must be at least 6 characters.")
        return

    if password != confirm:
        print("Passwords do not match.")
        return

    await database.connect_db()

    try:
        existing_user = await database.get_user_by_email(email)

        if existing_user:
            print("This email already exists. No changes were made.")
            return

        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        await database.create_admin_user(
            email=email,
            password_hash=password_hash,
        )

        print("Admin account created successfully.")

    finally:
        await database.disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
