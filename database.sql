-- =====================================================================
-- Project Title: Musthafa - Online Wedding Hall Booking Management System
-- Database Name: wedding_hall_db
-- Designed for: MySQL 8.0+ / MySQL Workbench / XAMPP MariaDB
-- Author: Musthafa
-- =====================================================================

CREATE DATABASE IF NOT EXISTS wedding_hall_db;
USE wedding_hall_db;

-- ---------------------------------------------------------------------
-- Table 1: customers
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS halls;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Table 2: halls
-- ---------------------------------------------------------------------
CREATE TABLE halls (
    hall_id INT AUTO_INCREMENT PRIMARY KEY,
    hall_name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    facilities TEXT,
    status VARCHAR(20) DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Table 3: bookings
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    hall_id INT NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Confirmed',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hall_id) REFERENCES halls(hall_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Table 4: payments
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'Paid',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Sample Initial Data Seed
-- ---------------------------------------------------------------------

-- Customers
INSERT INTO customers (customer_id, name, email, phone, address) VALUES
(1, 'Mohammed Musthafa', 'musthafa@example.com', '9876543210', '124 Grand Palace Road, Chennai'),
(2, 'Ayesha Siddiqua', 'ayesha.s@example.com', '9845123456', '45 Anna Nagar West, Chennai'),
(3, 'Rajesh Kumar', 'rajesh.kumar@example.com', '9789012345', '78 Jubilee Hills, Hyderabad'),
(4, 'Sneha Patel', 'sneha.patel@example.com', '9900112233', '12 MG Road, Bangalore'),
(5, 'Vikram Sharma', 'vikram.s@example.com', '9811223344', '56 South Extension, Delhi');

-- Halls
INSERT INTO halls (hall_id, hall_name, location, capacity, price, facilities, status) VALUES
(1, 'The Royal Grand Palace Banquet', 'T. Nagar, Chennai', 1200, 150000.00, 'Central AC, Grand Bridal Suite, Valet Parking (300 Cars), Stage Decoration, Audio-Visual LED Walls, Dining Hall (500 capacity), Generator Backup', 'Available'),
(2, 'Emerald Convention Center', 'Whitefield, Bangalore', 800, 95000.00, 'Centralized AC, Luxury Green Rooms, Dedicated Dining Area, In-house Sound & Lighting, 200 Car Parking, Power Backup', 'Available'),
(3, 'Kohinoor Pearl Luxury Lawn & Hall', 'Banjara Hills, Hyderabad', 1500, 185000.00, 'Open Lawn + Indoor AC Hall, Chandelier Stage, Royal Bride/Groom Suites, 500 Car Parking, Live Kitchen Stalls, Full Generator Backup', 'Available'),
(4, 'Grand Sapphire Celebration Hall', 'Koramangala, Bangalore', 500, 65000.00, 'Full AC, Designer Mandap/Stage, Sound System, Buffet Dining Area, 100 Car Parking, Lift Access', 'Available'),
(5, 'Mayflower Heritage Wedding Hall', 'Mylapore, Chennai', 650, 75000.00, 'Traditional Heritage Architecture, AC Mandapam, Large Dining Hall, Nadaswaram Stage, 120 Car Parking, Backup Generator', 'Available'),
(6, 'Paradise Crown Banquet', 'Velachery, Chennai', 400, 48000.00, 'Split AC, Modern Stage Lighting, Dining Section, DJ Music Setup, 60 Car Parking, CCTV Surveillance', 'Available');

-- Bookings
INSERT INTO bookings (booking_id, customer_id, hall_id, event_name, event_date, start_time, end_time, total_amount, status) VALUES
(1, 1, 1, 'Musthafa & Sarah Wedding Reception', '2026-11-20', '18:00:00', '23:30:00', 150000.00, 'Confirmed'),
(2, 2, 2, 'Ayesha & Zayd Nikah & Walima Ceremony', '2026-11-25', '09:00:00', '16:00:00', 95000.00, 'Confirmed'),
(3, 3, 3, 'Rajesh & Pooja Grand Sangeet Night', '2026-12-05', '17:30:00', '23:00:00', 185000.00, 'Pending'),
(4, 4, 4, 'Sneha & Rohan Engagement Celebration', '2026-12-12', '10:00:00', '15:00:00', 65000.00, 'Confirmed');

-- Payments
INSERT INTO payments (payment_id, booking_id, amount, payment_date, payment_status) VALUES
(1, 1, 150000.00, '2026-11-01', 'Paid'),
(2, 2, 50000.00, '2026-11-03', 'Partially Paid'),
(3, 3, 30000.00, '2026-11-05', 'Pending'),
(4, 4, 65000.00, '2026-11-06', 'Paid');
