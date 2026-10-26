import databases
import sqlalchemy


DATABASE_URL = "postgresql://temp:temp@localhost:5432/medstock"

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Users table
users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, nullable=False),
    sqlalchemy.Column("password", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("token", sqlalchemy.String, nullable=True),
)

# Products table
products = sqlalchemy.Table(
    "products",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("category", sqlalchemy.String(100), nullable=False),
    sqlalchemy.Column("unit", sqlalchemy.String(100), nullable=False),
    sqlalchemy.Column("manufacturer", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("description", sqlalchemy.Text, nullable=True),
    sqlalchemy.Column(
        "price", sqlalchemy.Numeric(10, 2),
        nullable=False, server_default="0"
    ),
    sqlalchemy.Column(
        "stock", sqlalchemy.Integer,
        nullable=False, server_default="0"
    ),
    # Basic = included in Basic plan
    # Professional = additional Professional-only item
    sqlalchemy.Column(
        "plan_level", sqlalchemy.String(30),
        nullable=False, server_default="Basic"
    ),
    sqlalchemy.Column(
        "created_at", sqlalchemy.DateTime,
        nullable=False, server_default=sqlalchemy.func.now()
    ),
)

# Tracks whether initial products have already been seeded
seed_state = sqlalchemy.Table(
    "seed_state",
    metadata,
    sqlalchemy.Column("seed_name", sqlalchemy.String(100), primary_key=True),
    sqlalchemy.Column(
        "completed_at", sqlalchemy.DateTime,
        nullable=False, server_default=sqlalchemy.func.now()
    ),
)


# -------------------------
# Warehouses table
# -------------------------

warehouses = sqlalchemy.Table(
    "warehouses",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "name",
        sqlalchemy.String(255),
        nullable=False,
    ),
    sqlalchemy.Column(
        "location",
        sqlalchemy.String(500),
        nullable=True,
    ),
    sqlalchemy.Column(
        "description",
        sqlalchemy.Text,
        nullable=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
)


# -------------------------
# Stock inventory table
# -------------------------

stock_items = sqlalchemy.Table(
    "stock_items",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "product_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "warehouse_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("warehouses.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "quantity",
        sqlalchemy.Integer,
        nullable=False,
        server_default="0",
    ),
    sqlalchemy.Column(
        "min_stock",
        sqlalchemy.Integer,
        nullable=False,
        server_default="0",
    ),
    sqlalchemy.Column(
        "expiration_date",
        sqlalchemy.Date,
        nullable=True,
    ),
    sqlalchemy.Column(
        "storage_location",
        sqlalchemy.String(255),
        nullable=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
    sqlalchemy.Column(
        "updated_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
    sqlalchemy.UniqueConstraint(
        "user_id",
        "product_id",
        "warehouse_id",
        name="uq_stock_user_product_warehouse",
    ),
)


# -------------------------
# Stock transactions table
# -------------------------

stock_transactions = sqlalchemy.Table(
    "stock_transactions",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "product_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "warehouse_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("warehouses.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "transaction_type",
        sqlalchemy.String(20),
        nullable=False,
    ),
    sqlalchemy.Column(
        "quantity",
        sqlalchemy.Integer,
        nullable=False,
    ),
    sqlalchemy.Column(
        "stock_after",
        sqlalchemy.Integer,
        nullable=False,
    ),
    sqlalchemy.Column(
        "note",
        sqlalchemy.Text,
        nullable=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
)
# -------------------------
# Robot Tasks table
# -------------------------

robot_tasks = sqlalchemy.Table(
    "robot_tasks",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column("task_name", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column("task_type", sqlalchemy.String(50), nullable=False),
    sqlalchemy.Column(
        "from_warehouse_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("warehouses.id"),
        nullable=False,
    ),
    sqlalchemy.Column(
        "to_warehouse_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("warehouses.id"),
        nullable=True,
    ),
    sqlalchemy.Column("product_name", sqlalchemy.String(255), nullable=False),
    sqlalchemy.Column(
        "quantity",
        sqlalchemy.Integer,
        nullable=False,
        server_default="0",
    ),
    sqlalchemy.Column(
        "status",
        sqlalchemy.String(30),
        nullable=False,
        server_default="Pending",
    ),
    sqlalchemy.Column("created_by", sqlalchemy.String(255), nullable=True),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
)

INITIAL_PRODUCTS = [
    ("Paracetamol 500mg", "Tablet", "Tablets", "GSK", "Pain relief and fever reduction medicine", "Basic"),
    ("Amoxicillin 500mg", "Capsule", "Capsules", "Pfizer", "Antibiotic medicine", "Basic"),
    ("Insulin Glargine", "Injection", "Vials", "Sanofi", "Long-acting insulin", "Basic"),
    ("Ibuprofen 400mg", "Tablet", "Tablets", "Bayer", "Pain relief and anti-inflammatory medicine", "Basic"),
    ("Ceftriaxone 1g", "Injection", "Vials", "Roche", "Broad-spectrum antibiotic", "Basic"),
    ("Omeprazole 20mg", "Capsule", "Capsules", "AstraZeneca", "Reduces stomach acid", "Basic"),
    ("Aspirin 100mg", "Tablet", "Tablets", "Bayer", "Low-dose antiplatelet medicine", "Basic"),
    ("Cetirizine 10mg", "Tablet", "Tablets", "UCB", "Antihistamine for allergy symptoms", "Basic"),
    ("Azithromycin 500mg", "Tablet", "Tablets", "Pfizer", "Macrolide antibiotic", "Basic"),
    ("Metformin 500mg", "Tablet", "Tablets", "Merck", "Medicine for blood glucose control", "Basic"),
    ("Loratadine 10mg", "Tablet", "Tablets", "Bayer", "Non-drowsy allergy medicine", "Basic"),
    ("Pantoprazole 40mg", "Tablet", "Tablets", "Takeda", "Medicine that reduces stomach acid", "Basic"),
    ("Normal Saline 0.9%", "Injection", "Vials", "Baxter", "Intravenous saline solution", "Basic"),
    ("Dextrose 5%", "Injection", "Vials", "Baxter", "Intravenous glucose solution", "Basic"),
    ("Diclofenac 75mg", "Injection", "Vials", "Novartis", "Non-steroidal anti-inflammatory medicine", "Basic"),
    ("Syringe 5ml", "Medical Supply", "Pieces", "BD", "Sterile disposable medical syringe", "Basic"),
    ("Syringe 10ml", "Medical Supply", "Pieces", "BD", "Sterile disposable medical syringe", "Basic"),
    ("Nitrile Gloves", "Medical Supply", "Boxes", "Ansell", "Disposable medical examination gloves", "Basic"),
    ("Surgical Mask", "Medical Supply", "Boxes", "3M", "Disposable surgical face mask", "Basic"),
    ("IV Administration Set", "Medical Supply", "Pieces", "B. Braun", "Intravenous administration equipment", "Basic"),
    ("Sterile Gauze 4x4", "Medical Supply", "Packs", "Cardinal Health", "Sterile wound dressing gauze", "Basic"),
    ("Alcohol Swab", "Medical Supply", "Boxes", "3M", "Alcohol preparation swabs", "Basic"),
    ("Insulin Syringe", "Medical Supply", "Boxes", "BD", "Disposable syringe for insulin administration", "Basic"),
    ("Salbutamol 4mg", "Tablet", "Tablets", "GSK", "Medicine used to relieve breathing problems", "Basic"),
    ("Amoxicillin-Clavulanate", "Tablet", "Tablets", "GSK", "Broad-spectrum antibiotic combination", "Basic"),
    ("Ondansetron 4mg", "Tablet", "Tablets", "Novartis", "Medicine used to prevent nausea and vomiting", "Basic"),
    ("Lisinopril 10mg", "Tablet", "Tablets", "Merck", "Medicine used to control high blood pressure", "Basic"),
    ("Amlodipine 5mg", "Tablet", "Tablets", "Pfizer", "Calcium channel blocker for blood pressure control", "Basic"),
    ("Atorvastatin 20mg", "Tablet", "Tablets", "Pfizer", "Medicine used to lower cholesterol", "Basic"),
    ("Hydrocortisone 100mg", "Injection", "Vials", "Pfizer", "Corticosteroid medicine for inflammation", "Basic"),

    ("Morphine 10mg", "Injection", "Vials", "Pfizer", "Opioid analgesic medicine", "Professional"),
    ("Furosemide 40mg", "Tablet", "Tablets", "Sanofi", "Diuretic medicine", "Professional"),
    ("Losartan 50mg", "Tablet", "Tablets", "Merck", "Medicine used to treat high blood pressure", "Professional"),
    ("Warfarin 5mg", "Tablet", "Tablets", "Bristol Myers Squibb", "Anticoagulant medicine", "Professional"),
    ("Clopidogrel 75mg", "Tablet", "Tablets", "Sanofi", "Antiplatelet medicine", "Professional"),
    ("Prednisolone 5mg", "Tablet", "Tablets", "Sanofi", "Corticosteroid medicine", "Professional"),
    ("Dexamethasone 4mg", "Injection", "Vials", "Pfizer", "Corticosteroid injection", "Professional"),
    ("Ciprofloxacin 500mg", "Tablet", "Tablets", "Bayer", "Fluoroquinolone antibiotic", "Professional"),
    ("Clindamycin 300mg", "Capsule", "Capsules", "Pfizer", "Antibiotic medicine", "Professional"),
    ("Metronidazole 500mg", "Tablet", "Tablets", "Pfizer", "Antimicrobial medicine", "Professional"),
    ("Levofloxacin 500mg", "Tablet", "Tablets", "Johnson & Johnson", "Broad-spectrum antibiotic", "Professional"),
    ("Fluconazole 150mg", "Capsule", "Capsules", "Pfizer", "Antifungal medicine", "Professional"),
    ("Acyclovir 400mg", "Tablet", "Tablets", "GSK", "Antiviral medicine", "Professional"),
    ("Montelukast 10mg", "Tablet", "Tablets", "Merck", "Medicine for asthma and allergy symptoms", "Professional"),
    ("Budesonide 200mcg", "Injection", "Vials", "AstraZeneca", "Corticosteroid used for respiratory conditions", "Professional"),
    ("Salbutamol Inhaler", "Medical Supply", "Pieces", "GSK", "Inhaler for relief of breathing problems", "Professional"),
    ("Oxygen Mask", "Medical Supply", "Pieces", "Teleflex", "Medical oxygen delivery mask", "Professional"),
    ("Nasal Cannula", "Medical Supply", "Pieces", "Medline", "Device for delivering supplemental oxygen", "Professional"),
    ("Urinary Catheter", "Medical Supply", "Pieces", "B. Braun", "Sterile urinary catheter", "Professional"),
    ("IV Cannula 20G", "Medical Supply", "Pieces", "BD", "Peripheral intravenous cannula", "Professional"),
    ("IV Cannula 22G", "Medical Supply", "Pieces", "BD", "Peripheral intravenous cannula", "Professional"),
    ("Blood Collection Tube", "Medical Supply", "Boxes", "BD", "Tube used for blood specimen collection", "Professional"),
    ("Surgical Gloves", "Medical Supply", "Boxes", "Ansell", "Sterile surgical gloves", "Professional"),
    ("Face Shield", "Medical Supply", "Pieces", "3M", "Protective medical face shield", "Professional"),
    ("Disposable Gown", "Medical Supply", "Pieces", "Medline", "Disposable protective medical gown", "Professional"),
    ("Surgical Cap", "Medical Supply", "Boxes", "3M", "Disposable surgical head covering", "Professional"),
    ("Thermometer", "Medical Supply", "Pieces", "Omron", "Digital body temperature measurement device", "Professional"),
    ("Blood Pressure Monitor", "Medical Supply", "Pieces", "Omron", "Electronic blood pressure measurement device", "Professional"),
    ("Pulse Oximeter", "Medical Supply", "Pieces", "Masimo", "Device for measuring blood oxygen saturation", "Professional"),
    ("Nebulizer Kit", "Medical Supply", "Pieces", "Omron", "Equipment for delivering inhaled medication", "Professional"),
]


# -------------------------
# Payment Requests table
# -------------------------

payment_requests = sqlalchemy.Table(
    "payment_requests",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.Integer,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "user_id",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    ),
    sqlalchemy.Column(
        "plan",
        sqlalchemy.String(30),
        nullable=False,
        server_default="Professional",
    ),
    sqlalchemy.Column(
        "amount",
        sqlalchemy.Integer,
        nullable=False,
        server_default="1990",
    ),
    sqlalchemy.Column(
        "slip_path",
        sqlalchemy.Text,
        nullable=False,
    ),
    sqlalchemy.Column(
        "status",
        sqlalchemy.String(30),
        nullable=False,
        server_default="Pending",
    ),
    sqlalchemy.Column(
        "submitted_at",
        sqlalchemy.DateTime,
        nullable=False,
        server_default=sqlalchemy.func.now(),
    ),
    sqlalchemy.Column(
        "reviewed_by",
        sqlalchemy.Integer,
        sqlalchemy.ForeignKey("users.id"),
        nullable=True,
    ),
    sqlalchemy.Column(
        "reviewed_at",
        sqlalchemy.DateTime,
        nullable=True,
    ),
    sqlalchemy.Column(
        "admin_note",
        sqlalchemy.Text,
        nullable=True,
    ),
)


engine = sqlalchemy.create_engine(DATABASE_URL)


async def connect_db():
    await database.connect()


async def disconnect_db():
    await database.disconnect()



async def setup_db():
    # Create database tables if they do not exist
    metadata.create_all(engine)
    
    # Add missing user columns without deleting existing data
    await database.execute(
        query="""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)
        """
    )

    await database.execute(
        query="""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role VARCHAR(30)
            NOT NULL DEFAULT 'CUSTOMER'
        """
    )

    await database.execute(
        query="""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS subscription VARCHAR(30)
            NOT NULL DEFAULT 'Basic'
        """
    )


    seed_name = "initial_products_v2"

    # Check whether this seed version has already completed
    seeded = await database.fetch_one(
        query="""
            SELECT seed_name
            FROM seed_state
            WHERE seed_name = :seed_name
        """,
        values={"seed_name": seed_name},
    )

    if seeded:
        print("Initial products already seeded.")
        return

    # Remove old test products before inserting the new set.
    # This runs only when initial_products_v2 has not been seeded.
    await database.execute(
        query="DELETE FROM products"
    )

    # Insert the 60 initial products
    await database.execute_many(
        query="""
            INSERT INTO products (
                name,
                category,
                unit,
                manufacturer,
                description,
                price,
                stock,
                plan_level
            )
            VALUES (
                :name,
                :category,
                :unit,
                :manufacturer,
                :description,
                :price,
                :stock,
                :plan_level
            )
        """,
        values=[
            {
                "name": name,
                "category": category,
                "unit": unit,
                "manufacturer": manufacturer,
                "description": description,
                "price": 0,
                "stock": 0,
                "plan_level": plan_level,
            }
            for (
                name,
                category,
                unit,
                manufacturer,
                description,
                plan_level,
            ) in INITIAL_PRODUCTS
        ],
    )

    # Record successful seeding
    await database.execute(
        query="""
            INSERT INTO seed_state (seed_name)
            VALUES (:seed_name)
        """,
        values={"seed_name": seed_name},
    )

    print("Successfully seeded 60 initial products.")




async def get_user_by_email(email: str):
    query = """
        SELECT current_database() AS db_name,
               inet_server_addr() AS server_addr,
               inet_server_port() AS server_port
    """
    info = await database.fetch_one(query=query)
    print("BACKEND DB INFO:", dict(info))

    query = """
        SELECT * FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email))
    """
    user = await database.fetch_one(
        query=query,
        values={"email": email},
    )
    print("EMAIL SEARCH RESULT:", user is not None)
    return user



async def create_user(
    email: str,
    password_hash: str,
    organization_name: str,
):
    async with database.transaction():
        # 1. Create the user account
        user = await database.fetch_one(
            query="""
                INSERT INTO users (
                    email,
                    password,
                    organization_name,
                    role,
                    subscription
                )
                VALUES (
                    :email,
                    :password,
                    :organization_name,
                    'STAFF',
                    'Basic'
                )
                RETURNING id
            """,
            values={
                "email": email.strip().lower(),
                "password": password_hash,
                "organization_name": organization_name.strip(),
            },
        )

        # 2. Automatically create the default warehouse
        await database.execute(
            query="""
                INSERT INTO warehouses (name, user_id)
                VALUES ('Main Warehouse', :user_id)
            """,
            values={
                "user_id": user["id"],
            },
        )

    return user["id"]


    

async def create_admin_user(
    email: str,
    password_hash: str,
):
    query = """
        INSERT INTO users (
            email,
            password,
            organization_name,
            role,
            subscription
        )
        VALUES (
            :email,
            :password,
            NULL,
            'ADMIN',
            'Basic'
        )
    """

    await database.execute(
        query=query,
        values={
            "email": email.strip().lower(),
            "password": password_hash,
        },
    )


async def update_user_token(email: str, token: str):
    query = """
        UPDATE users
        SET token = :token
        WHERE email = :email
    """
    await database.execute(
        query=query,
        values={"email": email, "token": token},
    )
