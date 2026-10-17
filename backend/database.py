
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "production.db"


def create_database():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS production_orders (
                order_id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                product_name TEXT NOT NULL,
                target_quantity INTEGER NOT NULL,
                completed_quantity INTEGER NOT NULL,
                status TEXT NOT NULL
            )
        """)


def save_order(order):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            INSERT INTO production_orders (
                order_id, machine_id, product_name,
                target_quantity, completed_quantity, status
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            order["order_id"],
            order["machine_id"],
            order["product_name"],
            order["target_quantity"],
            order["completed_quantity"],
            order["status"]
        ))


def get_orders():
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row

        cursor = connection.execute(
            "SELECT * FROM production_orders"
        )

        return [dict(row) for row in cursor.fetchall()]


def update_order(order_id, completed_quantity, status):
    with sqlite3.connect(DB_PATH) as connection:
        cursor = connection.execute("""
            UPDATE production_orders
            SET completed_quantity = ?, status = ?
            WHERE order_id = ?
        """, (completed_quantity, status, order_id))

        return cursor.rowcount > 0
