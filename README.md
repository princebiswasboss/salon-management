# ✦ Luxe Haven — Salon Booking & Management System

A full-stack, responsive Salon Booking and Management System built with modern **Node.js 22**, Express, and an atomic **JSON file-based database storage engine**. Designed with a luxury beauty salon aesthetic, persistent **Light/Dark theme support**, and a responsive layout for mobile, tablet, and desktop devices.

---

## 🌟 Key Features

### 1. Customer Registration & Login (Self-Service)
- **Customer Registration**: New customers can register with their Full Name, Email, Phone Number, and Password (hashed with native PBKDF2 + salt).
- **Customer Login**: Secure login using Email or Phone and Password. Session state persists in `localStorage` with Bearer token authentication.
- **My Appointments Area**: Customers can view their active upcoming appointments and historical salon visits.
- **Cancel Own Booking**: Customers can cancel an upcoming appointment directly from their dashboard.

### 2. Admin Management Console
- **Admin Authentication**: Admin login with dedicated administrative privileges (`admin@luxehaven.com` / `admin123`).
- **Complete Booking Supervision**: Admin can view all customer-booked slots, approve/confirm them, reschedule times, reassign stylists, or change status to *In-Progress*, *Completed*, or *Cancelled*.
- **Client Directory Supervision**: Admin can inspect all customer accounts, visit histories, lifetime spend, and add private stylist notes/formulas.
- **Staff, Services & Walk-in Line Control**: Full control over staff shifts, service pricing, and walk-in queue management.

### 3. Booking Management & Conflict Prevention
- **Create, View, Reschedule, and Cancel Appointments**: Complete lifecycle management.
- **Conflict Prevention**: Validates stylist availability to prevent overlapping reservations.
- **Smart Filters**: Filter appointments by date, status (*Pending*, *Confirmed*, *In-Progress*, *Completed*, *Cancelled*), and stylist.
- **Dynamic Pricing & Duration**: Automatically calculates durations and price totals based on selected treatments.
- **Fast Status Toggling**: Change status directly from the table or dashboard with instant feedback.

### 2. Service Management
- **Full Catalog CRUD**: Add, edit, and deactivate salon services.
- **Categorization**: Hair, Facial & Skin, Nails & Spa, Grooming, and Bridal & Special Treatments.
- **Pricing & Timing**: Custom durations (in minutes) and pricing ($ USD) with active booking toggles.

### 3. Staff Management
- **Stylist Profiles**: Manage stylists, titles, specialties, photo avatars, and contact information.
- **Weekly Schedule & Shift Hours**: Define working days (e.g., Monday through Saturday) and daily shift hours (e.g., 09:00 - 18:00).
- **Live Availability Checker**: Real-time slot calculation checking existing bookings on any selected date.
- **On-Duty Status**: Quick toggle between Active (on-duty) and Off-Duty.

### 4. Customer Management
- **Client Directory**: Track client contact information, visit frequency, lifetime spend, and custom notes.
- **Personalized Formulas & Preferences**: Record scalp sensitivities, dye formulas, allergy warnings, or favorite refreshments.
- **Visit History**: Inspect a client's past appointments and walk-in tickets.

### 5. Line Management (Walk-in Queue System)
- **Digital Queue Board**: Dedicated lounge board for walk-ins with unique ticket numbers (`#W-101`, `#W-102`...).
- **Real-Time Wait Estimates**: Dynamic wait-time computation based on waiting customers and typical service durations.
- **Call Next Walk-in**: One-click action to advance the next customer into service.
- **Queue State Machine**: Track status from `waiting` ➔ `in-service` ➔ `completed` / `cancelled`.

### 6. Light / Dark Mode
- **Persistent Theme System**: Persisted via `localStorage` and synchronized across app views.
- **Luxury Theme Palettes**:
  - **Dark Mode**: Deep obsidian and slate surfaces with warm champagne gold and rose accents.
  - **Light Mode**: Clean alabaster and crisp porcelain surfaces with warm amber and emerald accents.
- Accessible contrast ratios and smooth CSS transitions.

### 7. Responsive Mobile, Tablet & Desktop Support
- **Adaptive Layout**: Desktop sidebar navigation with mobile collapsible drawer and touch-friendly targets.
- **Fluid Grid System**: Flexbox and CSS grid layouts optimized for smartphones, iPads/tablets, and wide monitors.

### 8. Self-Service Client Booking Wizard
- **Client Portal**: Includes an interactive 4-step guest booking wizard (Choose Service ➔ Choose Stylist ➔ Pick Date & Available Slot ➔ Enter Details ➔ Instant Confirmation).

---

## 📁 JSON File-Based Database Store

The database is powered by thread-safe, atomic JSON file storage located in the `./data` directory:

| Collection File | Description |
|---|---|
| `data/services.json` | Salon treatments, categories, pricing, duration, and status |
| `data/staff.json` | Stylist records, working hours, shifts, and specialties |
| `data/customers.json` | Customer profiles, lifetime spend, visit count, and notes |
| `data/bookings.json` | Scheduled appointments, dates, times, and statuses |
| `data/queue.json` | Live walk-in queue tickets, wait times, and status |
| `data/settings.json` | Salon configuration, business hours, and preferences |

### Atomic Writes & Data Integrity
To prevent file corruption during simultaneous writes:
- Data is written to an isolated temporary file (`.tmp`) before being renamed atomically.
- In-memory caching and sequential promise queues protect against race conditions.
- Auto-seeds realistic luxury salon data if files are not present.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 22.x** (or later)
- **npm** (included with Node.js)

### Demo Credentials
- **Administrator**:
  - Email: `admin@luxehaven.com`
  - Password: `admin123`
- **Sample Customer**:
  - Email: `clara.h@example.com`
  - Password: `password123`
  *(Or register any new customer account directly from the UI!)*

### Installation & Run

1. Clone or navigate to the project directory:
   ```bash
   cd Salon-website-node
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   *Or launch standard production mode:*
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

5. Run automated integration tests:
   ```bash
   npm test
   ```

---

## 📡 REST API Reference

### Authentication & Customer Account (`/api/auth`)
- `POST /api/auth/register` - Register a new customer account
- `POST /api/auth/login` - Login customer or admin (supports email/phone + password)
- `GET /api/auth/me` - Get current session profile
- `POST /api/auth/logout` - Invalidate current session
- `GET /api/auth/my-bookings` - Fetch authenticated customer's booked slots
- `POST /api/auth/book-slot` - Customer books a slot (automatically tied to their account)
- `PATCH /api/auth/my-bookings/:id/cancel` - Customer cancels their own booking

### Services (`/api/services`)
- `GET /api/services` - List services (supports `?category=` and `?active=`)
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update existing service
- `DELETE /api/services/:id` - Delete service

### Staff (`/api/staff`)
- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff member details
- `GET /api/staff/:id/availability?date=YYYY-MM-DD` - Check daily booked slots
- `POST /api/staff` - Create staff profile
- `PUT /api/staff/:id` - Update staff profile and schedule
- `DELETE /api/staff/:id` - Remove staff member

### Bookings (`/api/bookings`)
- `GET /api/bookings` - List bookings (supports `?date=`, `?staffId=`, `?status=`, `?search=`)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Schedule appointment (with conflict checks)
- `PUT /api/bookings/:id` - Update booking details
- `PATCH /api/bookings/:id/status` - Fast status update (`pending`, `confirmed`, `in-progress`, `completed`, `cancelled`)
- `DELETE /api/bookings/:id` - Delete appointment

### Walk-in Queue (`/api/queue`)
- `GET /api/queue` - Get live queue with computed wait times
- `POST /api/queue` - Check in walk-in guest (generates ticket `#W-xxx`)
- `POST /api/queue/call-next` - Call the next waiting guest
- `PATCH /api/queue/:id/status` - Advance ticket status (`waiting` ➔ `in-service` ➔ `completed`)
- `DELETE /api/queue/:id` - Remove ticket

### Dashboard & Analytics (`/api/dashboard/stats`)
- `GET /api/dashboard/stats` - Returns today's revenue, active appointments, queue count, top services, and activity stream.

---

## 🛠️ Project Structure

```
Salon-website-node/
├── data/                       # JSON file-based database store
│   ├── bookings.json
│   ├── customers.json
│   ├── queue.json
│   ├── services.json
│   ├── settings.json
│   └── staff.json
├── public/                     # Frontend client assets
│   ├── css/
│   │   ├── style.css           # Core design system & light/dark variables
│   │   └── views.css           # View-specific cards, queue board, tables
│   ├── js/
│   │   ├── api.js              # Fetch client wrapper
│   │   ├── app.js              # SPA router, theme toggle, mobile drawer
│   │   ├── components/
│   │   │   ├── modal.js        # Universal dialog modal
│   │   │   └── toast.js        # Toast notifications
│   │   └── views/
│   │       ├── bookings.js     # Booking management view
│   │       ├── customers.js    # Client directory view
│   │       ├── dashboard.js    # Dashboard view
│   │       ├── portal.js       # Customer online booking view
│   │       ├── queue.js        # Walk-in queue board view
│   │       ├── services.js     # Services catalog view
│   │       └── staff.js        # Team and schedule view
│   └── index.html              # Main single-page application entry
├── src/
│   ├── db/
│   │   └── jsonStore.js        # Thread-safe atomic JSON file store & seeds
│   └── routes/
│       ├── bookings.js         # Appointment API endpoints
│       ├── customers.js        # Customer API endpoints
│       ├── queue.js            # Walk-in queue API endpoints
│       ├── services.js         # Service catalog API endpoints
│       ├── settings.js         # Settings API endpoints
│       ├── staff.js            # Staff & availability API endpoints
│       └── stats.js            # Dashboard KPIs & metrics API endpoints
├── test/
│   └── api.test.js             # Automated integration test suite
├── package.json
└── server.js                   # Node 22 Express server entrypoint
```
#   s a l o n - m a n a g e m e n t  
 