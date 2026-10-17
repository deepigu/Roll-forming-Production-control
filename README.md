# Roll Forming Production Control System

A full-stack manufacturing production management application developed using **Python, FastAPI, React, and SQLite**.

The application helps manage production orders, track manufacturing progress, and monitor simulated roll-forming machine performance through an interactive dashboard.

## Project Overview

This project demonstrates the development of a production control application for a roll-forming manufacturing environment.

It combines backend API development, database management, frontend development, and simulated machine monitoring.

## Key Features

### Production Order Management
- Create production orders with unique order IDs.
- Assign orders to roll-forming machines.
- Specify product names and target quantities.
- Update completed production quantities.
- Manage order statuses: Pending, Running, Stopped, and Completed.
- Validate production quantities to prevent invalid updates.

### Production Dashboard
- Display total, running, completed, and pending orders.
- Track overall production completion percentage.
- Visualize order statuses using interactive charts.
- Automatically refresh dashboard information.

### Machine Monitoring
- Monitor three simulated roll-forming machines: RF-001, RF-002, and RF-003.
- Display machine status, production targets, and completed quantities.
- Show simulated speed, temperature, and performance metrics.
- Display machine alerts and reading timestamps.

### Backend and Database
- RESTful APIs built using FastAPI.
- SQLite database for production order persistence.
- API input validation and error handling.
- Interactive API documentation using Swagger UI.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, JavaScript |
| Database | SQLite |
| Charts | Recharts |
| Frontend Build Tool | Vite |
| API Testing | Swagger UI |
| Version Control | Git, GitHub |
| Development Environment | Visual Studio Code |

## Project Structure

```text
roll-forming-production-control/
├── backend/
│   ├── main.py
│   └── database.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health response |
| GET | `/orders` | Retrieve production orders |
| POST | `/orders` | Create a production order |
| GET | `/orders/{order_id}` | Retrieve a specific order |
| PUT | `/orders/{order_id}` | Update production progress and status |
| GET | `/dashboard/summary` | Retrieve dashboard statistics |
| GET | `/machines` | Retrieve simulated machine readings |

## Running the Application Locally

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the required Python packages:

```bash
pip install fastapi uvicorn
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend API: http://127.0.0.1:8000

Swagger API documentation: http://127.0.0.1:8000/docs

### Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Open the local address displayed by Vite, usually http://localhost:5173.

## Screenshots

Screenshots of the production dashboard, order management, and machine monitoring sections will be added here.

## Future Enhancements

- Production scheduling and machine assignments.
- Raw material and steel coil inventory tracking.
- Quality inspection and defect reporting.
- Production history and reporting.
- CSV export functionality.
- User authentication and role-based access.

## Project Purpose

This project was developed to strengthen practical software development skills in Python backend engineering, REST API design, database operations, React frontend development, and manufacturing-oriented applications.

**Note:** Machine readings are simulated for development and demonstration purposes. The application is not currently connected to physical manufacturing equipment.

## GitHub Repository

https://github.com/deepigu/Roll-forming-Production-control
