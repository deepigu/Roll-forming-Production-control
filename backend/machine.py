
import random
from datetime import datetime, timezone


def create_machine(machine_id, is_running=False):
    """
    Generate simulated readings for a roll forming machine.
    These are demo values, not physical sensor readings.
    """

    if is_running:
        speed = random.randint(250, 350)
        temperature = random.randint(45, 90)
        performance = round((speed / 350) * 100, 1)
        status = "RUNNING"
    else:
        speed = 0
        temperature = random.randint(25, 40)
        performance = 0.0
        status = "IDLE"

    alerts = []

    if temperature > 75:
        alerts.append("HIGH TEMPERATURE")

    if is_running and speed < 280:
        alerts.append("LOW MACHINE SPEED")

    return {
        "machine_id": machine_id,
        "status": status,
        "speed": speed,
        "temperature": temperature,
        "performance": performance,
        "alerts": alerts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def get_machine_readings(orders):
    """
    Generate readings for all three machines.
    A machine runs when it has a RUNNING production order.
    """

    machine_ids = ["RF-001", "RF-002", "RF-003"]

    readings = []

    for machine_id in machine_ids:
        is_running = any(
            order["machine_id"] == machine_id
            and order["status"] == "RUNNING"
            for order in orders
        )

        readings.append(
            create_machine(machine_id, is_running)
        )

    return readings
