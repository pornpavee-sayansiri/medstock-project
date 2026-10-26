from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import connect_db, disconnect_db, setup_db
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.warehouses import router as warehouses_router
from routes.stock import router as stock_router
from routes.robot import router as robot_router
from routes.payments import router as payments_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await setup_db()
    yield
    await disconnect_db()


app = FastAPI(title="ACP App API", lifespan=lifespan)

# ตั้งค่า CORS ป้องกันบล็อกคำขอจาก Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(warehouses_router, prefix="/api")
# ลงทะเบียน Router ทั้งหมด
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(stock_router, prefix="/api")
app.include_router(robot_router, prefix="/api")
app.include_router(payments_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ACP App API"}
