
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import sqlite3

from database import (
    create_database,
    save_order,
    get_orders as db_get_orders,
    update_order as db_update_order
)

from machine import get_machine_readings
# Create FastAPI application
app = FastAPI(
    title="Roll Forming Production Control System",
    description="API for managing roll forming production orders",
    version="1.0.0"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"]
)


# Initialize SQLite database
create_database()


# Model for creating production orders
class ProductionOrder(BaseModel):
    order_id: str = Field(min_length=1)
    machine_id: str = Field(min_length=1)
    product_name: str = Field(min_length=1)
    target_quantity: int = Field(gt=0)


# Model for updating production orders
class OrderUpdate(BaseModel):
    completed_quantity: int = Field(ge=0)
    status: Literal[
        "PENDING",
        "RUNNING",
        "STOPPED",
        "COMPLETED"
    ]


# Calculate production progress percentage
def calculate_progress(order):
    target = order["target_quantity"]
    completed = order["completed_quantity"]

    if target <= 0:
        return 0.0

    return round((completed / target) * 100, 2)


# Add progress percentage to order response
def add_progress(order):
    order = dict(order)
    order["progress_percentage"] = calculate_progress(order)
    return order


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Roll Forming Production Control API is running",
        "version": "1.0.0"
    }


# Create a new production order
@app.post("/orders", status_code=201)
def create_order(order: ProductionOrder):

    new_order = {
        "order_id": order.order_id,
        "machine_id": order.machine_id,
        "product_name": order.product_name,
        "target_quantity": order.target_quantity,
        "completed_quantity": 0,
        "status": "PENDING"
    }

    try:
        save_order(new_order)

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Order ID already exists"
        )

    return add_progress(new_order)


# Get all production orders
@app.get("/orders")
def list_orders():

    orders = db_get_orders()

    return [
        add_progress(order)
        for order in orders
    ]


# Get a single production order
@app.get("/orders/{order_id}")
def get_order(order_id: str):

    orders = db_get_orders()

    order = next(
        (
            item for item in orders
            if item["order_id"] == order_id
        ),
        None
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Production order not found"
        )

    return add_progress(order)


# Update production order
@app.put("/orders/{order_id}")
def update_production_order(
    order_id: str,
    update: OrderUpdate
):

    orders = db_get_orders()

    order = next(
        (
            item for item in orders
            if item["order_id"] == order_id
        ),
        None
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Production order not found"
        )

    if update.completed_quantity > order["target_quantity"]:
        raise HTTPException(
            status_code=400,
            detail="Completed quantity exceeds target"
        )

    if (
        update.status == "COMPLETED"
        and update.completed_quantity != order["target_quantity"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Completed orders must reach target quantity"
        )

    db_update_order(
        order_id,
        update.completed_quantity,
        update.status
    )

    order["completed_quantity"] = update.completed_quantity
    order["status"] = update.status

    return add_progress(order)


# Production dashboard summary
@app.get("/dashboard/summary")
def dashboard_summary():

    orders = db_get_orders()

    total_orders = len(orders)

    running_orders = sum(
        1 for order in orders
        if order["status"] == "RUNNING"
    )

    completed_orders = sum(
        1 for order in orders
        if order["status"] == "COMPLETED"
    )

    pending_orders = sum(
        1 for order in orders
        if order["status"] == "PENDING"
    )

    stopped_orders = sum(
        1 for order in orders
        if order["status"] == "STOPPED"
    )

    total_target = sum(
        order["target_quantity"]
        for order in orders
    )

    total_produced = sum(
        order["completed_quantity"]
        for order in orders
    )

    overall_progress = (
        round((total_produced / total_target) * 100, 2)
        if total_target > 0
        else 0.0
    )

    return {
        "total_orders": total_orders,
        "running_orders": running_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "stopped_orders": stopped_orders,
        "total_target_quantity": total_target,
        "total_completed_quantity": total_produced,
        "overall_progress_percentage": overall_progress
    }
# Get simulated machine monitoring data
@app.get("/machines")
def list_machines():
    orders = db_get_orders()
    return get_machine_readings(orders)