
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import "./App.css";

const API_URL = "https://roll-forming-production-control.onrender.com";

const initialForm = {
  order_id: "",
  machine_id: "RF-001",
  product_name: "",
  target_quantity: ""
};

const STATUS_COLORS = {
  COMPLETED: "#22c55e",
  PENDING: "#eab308",
  RUNNING: "#2563eb",
  STOPPED: "#ef4444"
};

const MACHINES = ["RF-001", "RF-002", "RF-003"];

function App() {
  const [orders, setOrders] = useState([]);
  const [machineReadings, setMachineReadings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [machineError, setMachineError] = useState("");
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editStatus, setEditStatus] = useState("PENDING");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [ordersResponse, summaryResponse] =
        await Promise.all([
          fetch(`${API_URL}/orders`),
          fetch(`${API_URL}/dashboard/summary`)
        ]);

      if (!ordersResponse.ok || !summaryResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const ordersData = await ordersResponse.json();
      const summaryData = await summaryResponse.json();

      setOrders(ordersData);
      setSummary(summaryData);
      setError("");
    } catch (err) {
      setError(
        "Cannot connect to FastAPI. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }

    try {
      const machinesResponse = await fetch(`${API_URL}/machines`);
      if (!machinesResponse.ok) {
        throw new Error("Unable to load simulated machine readings.");
      }
      const machinesData = await machinesResponse.json();
      if (!Array.isArray(machinesData)) {
        throw new Error("Unexpected machine data format.");
      }
      setMachineReadings(machinesData);
      setMachineError("");
    } catch (err) {
      setMachineError(err.message || "Machine readings unavailable.");
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  async function createOrder(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          target_quantity: Number(form.target_quantity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to create production order."
        );
      }

      setForm(initialForm);
      setMessage("Production order created successfully!");

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(order) {
    setEditingId(order.order_id);
    setEditQuantity(String(order.completed_quantity));
    setEditStatus(order.status);
    setError("");
    setMessage("");
  }

  async function saveOrder(order) {
    const quantity = Number(editQuantity);

    if (
      editQuantity.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError("Completed quantity must be a non-negative whole number.");
      return;
    }

    if (quantity > order.target_quantity) {
      setError("Completed quantity cannot exceed target quantity.");
      return;
    }

    if (
      editStatus === "COMPLETED" &&
      quantity !== order.target_quantity
    ) {
      setError(
        "To mark an order COMPLETED, enter the full target quantity."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(order.order_id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            completed_quantity: quantity,
            status: editStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to update order."
        );
      }

      setEditingId(null);
      setMessage("Production order updated successfully!");

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const statusData = [
    {
      name: "Completed",
      value: summary?.completed_orders ?? 0,
      color: STATUS_COLORS.COMPLETED
    },
    {
      name: "Pending",
      value: summary?.pending_orders ?? 0,
      color: STATUS_COLORS.PENDING
    },
    {
      name: "Running",
      value: summary?.running_orders ?? 0,
      color: STATUS_COLORS.RUNNING
    },
    {
      name: "Stopped",
      value: summary?.stopped_orders ?? 0,
      color: STATUS_COLORS.STOPPED
    }
  ];

  const overallProgress = Math.min(
    100,
    Math.max(0, summary?.overall_progress_percentage ?? 0)
  );

  const machineData = MACHINES.map(machineId => {
    const machineOrders = orders.filter(
      order => order.machine_id === machineId
    );

    const target = machineOrders.reduce(
      (total, order) => total + order.target_quantity,
      0
    );

    const completed = machineOrders.reduce(
      (total, order) => total + order.completed_quantity,
      0
    );

    const running = machineOrders.some(
      order => order.status === "RUNNING"
    );

    const stopped = machineOrders.some(
      order => order.status === "STOPPED"
    );

    const progress =
      target > 0
        ? Math.min(100, (completed / target) * 100)
        : 0;

    return {
      machineId,
      orders: machineOrders.length,
      target,
      completed,
      progress,
      status: running
        ? "RUNNING"
        : stopped
          ? "STOPPED"
          : "IDLE"
    };
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Roll Forming Production Control System</h1>
        <p>Production Orders & Machine Monitoring Dashboard</p>
      </header>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

      {loading && <p>Loading production data...</p>}

      <section className="summary-section">
        {[
          ["Total Orders", summary?.total_orders ?? 0],
          ["Running Orders", summary?.running_orders ?? 0],
          ["Completed Orders", summary?.completed_orders ?? 0],
          ["Pending Orders", summary?.pending_orders ?? 0]
        ].map(([label, value]) => (
          <div className="summary-card" key={label}>
            <h3>{label}</h3>
            <h2>{value}</h2>
          </div>
        ))}
      </section>

      <section className="production-progress-card">
        <h2>Overall Production Progress</h2>

        <h3>{overallProgress.toFixed(1)}%</h3>

        <div className="overall-progress-bar">
          <div
            className="overall-progress-fill"
            style={{
              width: `${overallProgress}%`
            }}
          />
        </div>

        <p>
          {summary?.total_completed_quantity ?? 0} of{" "}
          {summary?.total_target_quantity ?? 0} units completed
        </p>
      </section>

      <section className="orders-section">
        <h2>Production Order Status</h2>

        {statusData.some(item => item.value > 0) ? (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="45%"
                  outerRadius={105}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) =>
                    `${name}: ${value}`
                  }
                >
                  {statusData
                    .filter(item => item.value > 0)
                    .map(item => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                      />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No production orders available.</p>
        )}
      </section>

      <section className="orders-section">
        <h2>Create Production Order</h2>

        <form onSubmit={createOrder} className="order-form">
          <label>
            Order ID
            <input
              type="text"
              value={form.order_id}
              onChange={event =>
                setForm({
                  ...form,
                  order_id: event.target.value
                })
              }
              placeholder="ORD-004"
              required
            />
          </label>

          <label>
            Machine
            <select
              value={form.machine_id}
              onChange={event =>
                setForm({
                  ...form,
                  machine_id: event.target.value
                })
              }
            >
              {MACHINES.map(machine => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>
          </label>

          <label>
            Product Name
            <input
              type="text"
              value={form.product_name}
              onChange={event =>
                setForm({
                  ...form,
                  product_name: event.target.value
                })
              }
              placeholder="Steel Roofing Panel"
              required
            />
          </label>

          <label>
            Target Quantity
            <input
              type="number"
              min="1"
              step="1"
              value={form.target_quantity}
              onChange={event =>
                setForm({
                  ...form,
                  target_quantity: event.target.value
                })
              }
              placeholder="1500"
              required
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create Order"}
          </button>
        </form>
      </section>

      <section className="orders-section">
        <h2>Production Orders</h2>

        <div style={{ overflowX: "auto" }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Machine</th>
                <th>Product</th>
                <th>Target</th>
                <th>Completed</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map(order => {
                const isEditing = editingId === order.order_id;

                return (
                  <tr key={order.order_id}>
                    <td>{order.order_id}</td>
                    <td>{order.machine_id}</td>
                    <td>{order.product_name}</td>
                    <td>{order.target_quantity}</td>

                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max={order.target_quantity}
                          step="1"
                          value={editQuantity}
                          onChange={event =>
                            setEditQuantity(event.target.value)
                          }
                          style={{ width: 90 }}
                        />
                      ) : (
                        order.completed_quantity
                      )}
                    </td>

                    <td>
                      <div className="overall-progress-bar">
                        <div
                          className="overall-progress-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                order.progress_percentage ?? 0
                              )
                            )}%`
                          }}
                        />
                      </div>

                      {Number(
                        order.progress_percentage ?? 0
                      ).toFixed(1)}%
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={event =>
                            setEditStatus(event.target.value)
                          }
                        >
                          {[
                            "PENDING",
                            "RUNNING",
                            "STOPPED",
                            "COMPLETED"
                          ].map(status => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            color:
                              STATUS_COLORS[order.status] ??
                              "#64748b",
                            fontWeight: "bold"
                          }}
                        >
                          {order.status}
                        </span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveOrder(order)}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(order)}
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan="8">
                    No production orders created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="orders-section">
        <h2>Machine Monitoring</h2>
        <p>
          Production activity summarized by machine
        </p>

        {machineError && (
          <p className="error-message" role="alert">{machineError}</p>
        )}

        <div className="machine-container">
          {machineData.map(machine => (
            <div
              className="machine-card"
              key={machine.machineId}
            >
              <h3>{machine.machineId}</h3>

              <p>
                Status:{" "}
                <strong
                  style={{
                    color:
                      STATUS_COLORS[machine.status] ??
                      "#64748b"
                  }}
                >
                  {machine.status}
                </strong>
              </p>

              <p>
                Production Orders:{" "}
                <strong>{machine.orders}</strong>
              </p>

              <p>
                Target Quantity:{" "}
                <strong>{machine.target}</strong>
              </p>

              <p>
                Completed Quantity:{" "}
                <strong>{machine.completed}</strong>
              </p>

              <p>
                Progress:{" "}
                <strong>{machine.progress.toFixed(1)}%</strong>
              </p>

              <div className="overall-progress-bar">
                <div
                  className="overall-progress-fill"
                  style={{
                    width: `${machine.progress}%`
                  }}
                />
              </div>

              {(() => {
                const reading = machineReadings.find(
                  item => item.machine_id === machine.machineId
                );
                if (!reading) {
                  return <p>Waiting for simulated machine readings...</p>;
                }
                return (
                  <div style={{ marginTop: 20, borderTop: "1px solid #ddd", paddingTop: 12 }}>
                    <h4>Simulated Machine Readings</h4>
                    <p>Machine Status: <strong>{reading.status}</strong></p>
                    <p>Speed: <strong>{reading.speed ?? "N/A"}</strong></p>
                    <p>Temperature: <strong>{reading.temperature ?? "N/A"} °C</strong></p>
                    <p>Performance: <strong>{reading.performance ?? "N/A"}%</strong></p>
                    <p>Updated: {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : "N/A"}</p>
                    {Array.isArray(reading.alerts) && reading.alerts.length > 0 ? (
                      <div style={{ color: "#b91c1c" }}>
                        {reading.alerts.map((alert, index) => (
                          <p key={index}>⚠️ {alert}</p>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "#15803d" }}>✓ No active alerts</p>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, marginTop: 16 }}>
          Production status is inferred from orders. Machine speed, temperature,
          performance and alerts are simulated by the FastAPI backend, not real sensors.
        </p>
      </section>
    </div>
  );
}

export default App;
