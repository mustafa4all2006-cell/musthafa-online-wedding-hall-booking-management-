# Musthafa - Online Wedding Hall Booking Management System

A full-stack web application designed to manage marriage halls, banquet venues, and event reservations. Customers can easily discover venues, check real-time date availability, review guest capacity and amenities, book halls for weddings/receptions, and track payment schedules. Hall administrators have complete control to manage venue listings, approve or update reservations, and monitor revenue ledgers.

---

## 📋 Project Specifications

* **Project Title:** Musthafa - Online Wedding Hall Booking Management System
* **Author / Developer:** Musthafa
* **Core Functionalities:**
  * **Venue Discovery:** Browse luxury banquet halls with capacity, pricing, amenities, and location filters.
  * **Real-time Availability:** Live calendar slot verification preventing double-booking.
  * **Customer Reservations:** Seamless booking wizard with guest contact info, schedule selection, and advance deposit.
  * **Financial Tracking:** Detailed payments ledger tracking initial deposits, outstanding balance, and printable receipts.
  * **Admin Control Center:** Comprehensive CRUD for marriage halls, reservations, client directories, and transactions.

---

## 🗄️ Database Design (MySQL)

Database Name: `wedding_hall_db`

### Table 1: `customers`
Stores registered customer and event organizer contact details.
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `customer_id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique identifier for the customer |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full name of the customer |
| `email` | `VARCHAR(100)` | `NOT NULL` | Customer email address |
| `phone` | `VARCHAR(15)` | `NOT NULL` | Primary mobile contact number |
| `address` | `VARCHAR(255)` | `NULL` | Residential / billing address |

### Table 2: `halls`
Stores wedding halls, banquet facilities, and rental pricing.
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `hall_id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique identifier for each hall |
| `hall_name` | `VARCHAR(100)` | `NOT NULL` | Name of the wedding / banquet hall |
| `location` | `VARCHAR(150)` | `NOT NULL` | City and neighborhood location |
| `capacity` | `INT` | `NOT NULL` | Maximum guest capacity |
| `price` | `DECIMAL(10,2)` | `NOT NULL` | Standard booking rate per event / day |
| `facilities` | `TEXT` | `NULL` | Amenities (e.g. AC, Parking, Bridal Suite) |
| `status` | `VARCHAR(20)` | `DEFAULT 'Available'` | Operational status (`Available`, `Booked`, `Maintenance`) |

### Table 3: `bookings`
Stores reservation records for wedding and reception events.
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `booking_id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique booking reservation reference |
| `customer_id` | `INT` | `FOREIGN KEY` (customers) | Reference to customer making reservation |
| `hall_id` | `INT` | `FOREIGN KEY` (halls) | Reference to reserved wedding hall |
| `event_name` | `VARCHAR(100)` | `NOT NULL` | Name of celebration (e.g., Wedding Reception) |
| `event_date` | `DATE` | `NOT NULL` | Scheduled date of the event |
| `start_time` | `TIME` | `NOT NULL` | Event commencement time |
| `end_time` | `TIME` | `NOT NULL` | Event conclusion time |
| `total_amount` | `DECIMAL(10,2)` | `NOT NULL` | Total cost calculated for the hall booking |
| `status` | `VARCHAR(30)` | `DEFAULT 'Confirmed'` | Reservation status (`Confirmed`, `Pending`, `Cancelled`, `Completed`) |

### Table 4: `payments`
Tracks transactions, advance deposits, and settlement status.
| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique transaction ID |
| `booking_id` | `INT` | `FOREIGN KEY` (bookings) | Reference to related reservation |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Transaction amount paid |
| `payment_date` | `DATE` | `NOT NULL` | Date when payment was received |
| `payment_status`| `VARCHAR(30)` | `DEFAULT 'Paid'` | Status (`Paid`, `Partially Paid`, `Pending`, `Refunded`) |

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, Modern CSS3 (Warm Ivory & Royal Burgundy Theme), Vanilla JavaScript (ES6+)
* **Backend:** Express.js (Node.js REST API)
* **Database:** MySQL 8.0+ / MySQL Workbench / XAMPP MariaDB (via `mysql2/promise`)
* **Environment Configuration:** `dotenv`
* **Version Control:** Git

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16.0 or higher)
* [MySQL Server](https://dev.mysql.com/downloads/mysql/) or XAMPP running locally on port 3306

### 2. Configure Environment (`.env`)
Create or edit `.env` in the project root:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=wedding_hall_db
```

### 3. Initialize Database
You can import `database.sql` directly using MySQL Workbench or the MySQL command line:
```bash
mysql -u root -p < database.sql
```
*(Note: `server.js` also features automatic database & table creation upon startup).*

### 4. Install Dependencies & Run
```bash
# Install npm packages
npm install

# Start the application
npm start
```
Or simply double-click `start.bat` on Windows!

The application will be live at:
* **Customer Portal:** `http://localhost:3000`
* **Admin Dashboard:** `http://localhost:3000/admin.html`

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health & live MySQL database status |
| `GET` | `/api/stats` | Platform metrics (halls, reservations, revenue) |
| `GET` | `/api/halls` | Retrieve halls catalog with search & filters |
| `POST` | `/api/halls` | Add new hall (Admin) |
| `PUT` | `/api/halls/:id` | Update hall details |
| `DELETE`| `/api/halls/:id` | Remove hall from catalog |
| `GET` | `/api/check-availability?hall_id=1&event_date=YYYY-MM-DD` | Real-time date slot availability checker |
| `GET` | `/api/customers` | Retrieve customer directory |
| `POST` | `/api/customers` | Register new customer |
| `GET` | `/api/bookings` | List reservations with joined customer & hall data |
| `POST` | `/api/bookings` | Create new reservation with optional initial payment |
| `PUT` | `/api/bookings/:id` | Update booking status (`Confirmed`, `Cancelled`, etc.) |
| `DELETE`| `/api/bookings/:id` | Cancel reservation |
| `GET` | `/api/payments` | Retrieve payments ledger |
| `POST` | `/api/payments` | Record new payment transaction |

---

## 📤 Uploading to GitHub / Git

Follow these commands to push the project to your GitHub repository:

```bash
# Navigate to the project directory
cd "C:\Users\Dell\.gemini\antigravity\scratch\wedding-hall-booking"

# Initialize git repository (if not already initialized)
git init

# Set the default branch to main
git branch -M main

# Add all files
git add .

# Commit with project title & author
git commit -m "Initial commit: Musthafa - Online Wedding Hall Booking Management System"

# Link your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/online-wedding-hall-booking.git

# Push the codebase to GitHub
git push -u origin main
```

---

## 👨‍💻 Author
**Musthafa**  
*Online Wedding Hall Booking Management System*
