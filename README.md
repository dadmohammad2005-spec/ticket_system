# Apex Tickets — Commercial Online Ticket Booking Platform

A production-grade, commercial-ready Online Ticket Booking System engineered with **Python Django REST Framework**, **PostgreSQL / SQLite**, **JWT Authentication**, and a high-performance **React 19 + TypeScript + Tailwind CSS** frontend with mobile-friendly API architecture.

---

## 🚀 Quick Start (One-Click)

You can launch both the backend and frontend simultaneously using the batch script:
- Double-click **`run_all.bat`** in the project root.

Or launch each service individually:
- **Backend**: Double-click **`run_backend.bat`** or follow the manual instructions below.
- **Frontend**: Double-click **`run_frontend.bat`** or follow the manual instructions below.

---

## 🛠 Manual Execution

### 1. Running the Backend Server (Django REST Framework)
Open PowerShell or Command Prompt:

```powershell
cd D:\online_ticket_system\backend
.\venv\Scripts\activate
python manage.py runserver
```

The backend will start at:
- **API Hub / Dashboard:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **🎫 Real Printable Boarding Pass:** [http://127.0.0.1:8000/ticket/APX-DEMO2026/](http://127.0.0.1:8000/ticket/APX-DEMO2026/)
- **📥 Download Official PDF Ticket:** [http://127.0.0.1:8000/api/tickets/download-pdf/APX-DEMO2026/](http://127.0.0.1:8000/api/tickets/download-pdf/APX-DEMO2026/)
- **Interactive Swagger / OpenAPI UI:** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **Django Admin Panel:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### 2. Running the Frontend Application (React + Vite)
In a second PowerShell terminal:

```powershell
cd D:\online_ticket_system\frontend
$env:PATH = "D:\online_ticket_system\tools\node;$env:PATH"
npm run dev
```

The web application will open at:
- **Web App:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo & Test Credentials

The database comes pre-seeded with 160 realistic trips, operators, stations, coupons, and verified accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@apextickets.com` | `Admin@12345` | Admin Dashboard, Analytics, User & Trip Management, Django Admin |
| **Transport Operator** | `operator@apextickets.com` | `Operator@12345` | Fleet management, Trip Schedules, Operator Portal |
| **Customer / Passenger** | `customer@apextickets.com` | `Customer@12345` | Booking trips, Seat selection, PDF Boarding passes, QR Verification |

---

## 🎫 Key Features Implemented

1. **Authentication & Authorization:**
   - JWT tokens (`access` and `refresh`) with role-based permissions (`CUSTOMER`, `OPERATOR`, `ADMIN`).
2. **Dynamic Search & Scheduling:**
   - Search by Origin City, Destination City, Date, and Transport Mode (Bus, Train, Ferry).
   - Real-time seat counts, fare multipliers, departure/arrival tracking.
3. **Interactive Seat Selection & Concurrency Control:**
   - Visual cabin layout with Window, Aisle, VIP, and Sleeper seats.
   - Temporary 10-minute hold (`SeatLock`) and database-level `select_for_update()` transaction locking to prevent double-booking.
4. **Checkout & Pluggable Payments:**
   - Modular payment architecture supporting Sandbox Mock, Stripe, and Mobile Wallets.
   - Promotional coupon code validation (e.g. `WELCOME10`, `APEXSUMMER`).
5. **Boarding Passes & Gate Verification:**
   - Dynamic QR codes generated for every ticket.
   - High-resolution, executive PDF boarding pass download (`reportlab`).
   - Dedicated gate verification scanner page for conductors/inspectors.
6. **Customer Portal & Operator Analytics:**
   - User bookings history, cancellation refunds calculation based on operator policies.
   - Support ticket messaging system.
   - Real-time Admin KPI metrics, revenue charts, and occupancy rates.
