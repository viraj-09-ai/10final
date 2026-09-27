# Visitor Pass Management System (MERN)

A digital visitor management system that replaces manual entry registers with
online pre-registration, QR-code passes, printable PDF badges, and role-based
check-in/check-out tracking.

Built with **MongoDB, Express, React (Vite), Node.js**.

---

## 1. User Roles & Features

| Role | Capabilities |
|---|---|
| **Admin** | Manage staff accounts (create/enable/disable), view all visitors & check-in/out logs, search & filter, export to Excel |
| **Security / Frontdesk** | Register walk-in visitors (with photo), issue passes (QR + PDF badge), scan QR to check visitors in/out |
| **Employee / Host** | Invite visitors (auto-approved), review & approve/reject visitor pre-registration requests, view own appointments |
| **Visitor** | Self pre-register a visit request to a host, view their digital pass (QR), download the PDF badge, view visit history |

Core features implemented:
1. **Authentication & Authorization** — JWT-based login, `verifyToken` + `checkRole` middleware protect every non-public route.
2. **Visitor Registration** — name, phone, email, company, ID proof, and a **photo upload** (multer).
3. **Appointments / Pre-Registration** — visitors request a visit → host **approves/rejects** → visitor is **notified** by email (and SMS if configured).
4. **Pass Issuance** — Security issues a pass which generates a **QR code** and a **printable PDF badge** (photo + QR + details).
5. **Check-In / Check-Out** — scanning a badge **toggles** between Check-In and Check-Out automatically and writes a `CheckLog` entry.
6. **Notifications** — email via Nodemailer (Gmail) and an SMS stub ready to wire up to Twilio.
7. **Dashboard & Reports** — search/filter visitors and logs, **export to Excel** (`xlsx`).

---

## 2. Project Structure

```
visitor-pass-system/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── seed.js                # Seeds demo Admin/Security/Employee/Visitor accounts
│   ├── .env.example
│   └── src/
│       ├── config/db.js
│       ├── models/            # User, Visitor, Appointment, Pass, CheckLog
│       ├── controllers/       # auth, user, visitor, appointment, pass
│       ├── middleware/        # authMiddleware (JWT + role check), uploadMiddleware (multer)
│       ├── routes/
│       └── utils/             # mailer.js, sms.js, pdfGenerator.js
└── frontend/
    ├── .env.example
    └── src/
        ├── api/axios.js       # axios instance, attaches JWT automatically
        ├── context/AuthContext.jsx
        ├── components/        # Navbar, ProtectedRoute, QrScanner
        └── pages/
            ├── Login.jsx / Register.jsx
            ├── admin/AdminDashboard.jsx
            ├── security/SecurityDashboard.jsx
            ├── employee/EmployeeDashboard.jsx
            └── visitor/VisitorDashboard.jsx
```

---

## 3. Setup Guide

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 3.1 Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/visitor-pass-system
JWT_SECRET=replace_this_with_a_long_random_secret

# Optional — leave blank to skip email/SMS in dev; the app logs to console instead
EMAIL_USER=
EMAIL_PASS=
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

Install dependencies and seed demo data:

```bash
npm install
npm run seed
```

This creates 4 demo accounts (password for all: `password123`):

| Role | Email |
|---|---|
| Admin | admin@demo.com |
| Security | security@demo.com |
| Employee | employee@demo.com |
| Visitor | visitor@demo.com |

Start the API:

```bash
npm run dev      # nodemon, http://localhost:5000
```

### 3.2 Frontend

```bash
cd frontend
cp .env.example .env      # set VITE_API_URL if your backend isn't on localhost:5000
npm install
npm run dev                # http://localhost:5173
```

Log in with any of the demo accounts above and you'll land on the dashboard for that role.

### 3.3 Try the full flow
1. Log in as **Employee** → *Invite Visitor* → fill in details → the visitor gets an appointment marked `Approved`.
2. Log in as **Security** → *Issue Pass* tab → register the visitor (or use one from an appointment) → a QR code + downloadable PDF badge are generated instantly.
3. Log in as **Security** → *Scan QR* tab → scan the QR shown in the browser (or printed badge) with a webcam. First scan = Check-In, the same badge scanned again = Check-Out.
4. Log in as **Admin** → see visitor counts, search/filter the logs, and export everything to Excel.
5. Log in as **Visitor** (or register a new visitor account) → *Pre-Register* a visit request to any employee, then check *My Pass* once security issues it.

---

## 4. API Overview

All protected routes require `Authorization: Bearer <token>`.

| Method | Route | Roles | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Self sign-up (creates a Visitor account) |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET  | `/api/auth/me` | Any | Current user profile |
| GET/POST/PATCH/DELETE | `/api/users` | Admin | Manage staff accounts |
| GET/POST/PATCH/DELETE | `/api/visitors` | Security, Employee, Admin | Visitor profiles, photo upload, search/filter |
| POST | `/api/appointments/invite` | Employee, Admin | Host invites a visitor |
| POST | `/api/appointments/pre-register` | Visitor | Self pre-registration request |
| PATCH | `/api/appointments/:id/approve` | Employee, Admin | Approve/reject a request |
| POST | `/api/passes/issue` | Security, Admin | Generate QR + PDF badge |
| POST | `/api/passes/scan` | Security, Admin | Toggle Check-In / Check-Out |
| GET | `/api/passes/logs` | Security, Employee, Admin | Check-in/out history (search/filter) |
| GET | `/api/passes/mine` | Visitor | The visitor's own passes |

---

## 5. Database Collections

`Users`, `Visitors`, `Appointments`, `Passes`, `CheckLogs` — see `backend/src/models/` for full schemas.

---

## 6. Deliverables Checklist

- [x] Source code (this repo)
- [x] Setup guide (this README)
- [x] Demo seed script (`backend/seed.js`)
- [ ] Screenshots / demo video — add these to a `/screenshots` folder and link them here before submission

---

## 7. Known Limitations / Next Steps

- SMS sending is a stub (`backend/src/utils/sms.js`) — install `twilio` and add credentials to `.env` to enable it for real.
- Email requires a Gmail **App Password** in `EMAIL_USER`/`EMAIL_PASS`; without it, notifications are safely logged to the console instead of failing.
- Bonus ideas not yet implemented: OTP verification, multi-organization support, Docker/Nginx deployment, a dedicated analytics/audit-log page.
