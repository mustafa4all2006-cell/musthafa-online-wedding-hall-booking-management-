// =====================================================================
// Project Title: Musthafa - Online Wedding Hall Booking Management System
// Backend: Express.js + MySQL2 (with Fallback Mock Support)
// Author: Musthafa
// =====================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Also serve root directory files if any

// ---------------------------------------------------------------------
// MySQL Database Connection & Auto-Initialization
// ---------------------------------------------------------------------
let dbPool = null;
let isUsingMySQL = false;
let dbStatusInfo = {
  status: 'Disconnected',
  database: process.env.DB_NAME || 'wedding_hall_db',
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  mode: 'Unknown'
};

// Fallback in-memory/JSON data stores
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const HALLS_FILE = path.join(DATA_DIR, 'halls.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

const INITIAL_CUSTOMERS = [
  { customer_id: 1, name: 'Mohammed Musthafa', email: 'musthafa@example.com', phone: '9876543210', address: '124 Grand Palace Road, Chennai' },
  { customer_id: 2, name: 'Ayesha Siddiqua', email: 'ayesha.s@example.com', phone: '9845123456', address: '45 Anna Nagar West, Chennai' },
  { customer_id: 3, name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phone: '9789012345', address: '78 Jubilee Hills, Hyderabad' },
  { customer_id: 4, name: 'Sneha Patel', email: 'sneha.patel@example.com', phone: '9900112233', address: '12 MG Road, Bangalore' },
  { customer_id: 5, name: 'Vikram Sharma', email: 'vikram.s@example.com', phone: '9811223344', address: '56 South Extension, Delhi' }
];

const INITIAL_HALLS = [
  { hall_id: 1, hall_name: 'The Royal Grand Palace Banquet', location: 'T. Nagar, Chennai', capacity: 1200, price: 150000.00, facilities: 'Central AC, Grand Bridal Suite, Valet Parking (300 Cars), Stage Decoration, Audio-Visual LED Walls, Dining Hall (500 capacity), Generator Backup', status: 'Available' },
  { hall_id: 2, hall_name: 'Emerald Convention Center', location: 'Whitefield, Bangalore', capacity: 800, price: 95000.00, facilities: 'Centralized AC, Luxury Green Rooms, Dedicated Dining Area, In-house Sound & Lighting, 200 Car Parking, Power Backup', status: 'Available' },
  { hall_id: 3, hall_name: 'Kohinoor Pearl Luxury Lawn & Hall', location: 'Banjara Hills, Hyderabad', capacity: 1500, price: 185000.00, facilities: 'Open Lawn + Indoor AC Hall, Chandelier Stage, Royal Bride/Groom Suites, 500 Car Parking, Live Kitchen Stalls, Full Generator Backup', status: 'Available' },
  { hall_id: 4, hall_name: 'Grand Sapphire Celebration Hall', location: 'Koramangala, Bangalore', capacity: 500, price: 65000.00, facilities: 'Full AC, Designer Mandap/Stage, Sound System, Buffet Dining Area, 100 Car Parking, Lift Access', status: 'Available' },
  { hall_id: 5, hall_name: 'Mayflower Heritage Wedding Hall', location: 'Mylapore, Chennai', capacity: 650, price: 75000.00, facilities: 'Traditional Heritage Architecture, AC Mandapam, Large Dining Hall, Nadaswaram Stage, 120 Car Parking, Backup Generator', status: 'Available' },
  { hall_id: 6, hall_name: 'Paradise Crown Banquet', location: 'Velachery, Chennai', capacity: 400, price: 48000.00, facilities: 'Split AC, Modern Stage Lighting, Dining Section, DJ Music Setup, 60 Car Parking, CCTV Surveillance', status: 'Available' }
];

const INITIAL_BOOKINGS = [
  { booking_id: 1, customer_id: 1, hall_id: 1, event_name: 'Musthafa & Sarah Wedding Reception', event_date: '2026-11-20', start_time: '18:00:00', end_time: '23:30:00', total_amount: 150000.00, status: 'Confirmed' },
  { booking_id: 2, customer_id: 2, hall_id: 2, event_name: 'Ayesha & Zayd Nikah & Walima Ceremony', event_date: '2026-11-25', start_time: '09:00:00', end_time: '16:00:00', total_amount: 95000.00, status: 'Confirmed' },
  { booking_id: 3, customer_id: 3, hall_id: 3, event_name: 'Rajesh & Pooja Grand Sangeet Night', event_date: '2026-12-05', start_time: '17:30:00', end_time: '23:00:00', total_amount: 185000.00, status: 'Pending' },
  { booking_id: 4, customer_id: 4, hall_id: 4, event_name: 'Sneha & Rohan Engagement Celebration', event_date: '2026-12-12', start_time: '10:00:00', end_time: '15:00:00', total_amount: 65000.00, status: 'Confirmed' }
];

const INITIAL_PAYMENTS = [
  { payment_id: 1, booking_id: 1, amount: 150000.00, payment_date: '2026-11-01', payment_status: 'Paid' },
  { payment_id: 2, booking_id: 2, amount: 50000.00, payment_date: '2026-11-03', payment_status: 'Partially Paid' },
  { payment_id: 3, booking_id: 3, amount: 30000.00, payment_date: '2026-11-05', payment_status: 'Pending' },
  { payment_id: 4, booking_id: 4, amount: 65000.00, payment_date: '2026-11-06', payment_status: 'Paid' }
];

function readJSON(file, defaultData) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return defaultData;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${file}:`, err.message);
  }
}

// Initialize JSON files
readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
readJSON(HALLS_FILE, INITIAL_HALLS);
readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'wedding_hall_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  const candidatePasswords = [
    process.env.DB_PASSWORD,
    'root',
    '',
    'password',
    'admin',
    '1234',
    '123456'
  ].filter(p => p !== undefined);

  for (const pwd of candidatePasswords) {
    try {
      // Connect to server (without db first, to ensure DB exists)
      const rootConn = await mysql.createConnection({
        host,
        port,
        user,
        password: pwd
      });

      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await rootConn.end();

      // Now create pool with database
      const pool = mysql.createPool({
        host,
        port,
        user,
        password: pwd,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      await pool.query('SELECT 1 + 1 AS solution');

      // Create Tables if not exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          customer_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL,
          phone VARCHAR(15) NOT NULL,
          address VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS halls (
          hall_id INT AUTO_INCREMENT PRIMARY KEY,
          hall_name VARCHAR(100) NOT NULL,
          location VARCHAR(150) NOT NULL,
          capacity INT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          facilities TEXT,
          status VARCHAR(20) DEFAULT 'Available'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS bookings (
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
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
          payment_id INT AUTO_INCREMENT PRIMARY KEY,
          booking_id INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_status VARCHAR(30) DEFAULT 'Paid',
          FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed if tables are empty
      const [hallsRows] = await pool.query('SELECT COUNT(*) AS count FROM halls');
      if (hallsRows[0].count === 0) {
        for (const c of INITIAL_CUSTOMERS) {
          await pool.query('INSERT IGNORE INTO customers (customer_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)', [c.customer_id, c.name, c.email, c.phone, c.address]);
        }
        for (const h of INITIAL_HALLS) {
          await pool.query('INSERT IGNORE INTO halls (hall_id, hall_name, location, capacity, price, facilities, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [h.hall_id, h.hall_name, h.location, h.capacity, h.price, h.facilities, h.status]);
        }
        for (const b of INITIAL_BOOKINGS) {
          await pool.query('INSERT IGNORE INTO bookings (booking_id, customer_id, hall_id, event_name, event_date, start_time, end_time, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [b.booking_id, b.customer_id, b.hall_id, b.event_name, b.event_date, b.start_time, b.end_time, b.total_amount, b.status]);
        }
        for (const p of INITIAL_PAYMENTS) {
          await pool.query('INSERT IGNORE INTO payments (payment_id, booking_id, amount, payment_date, payment_status) VALUES (?, ?, ?, ?, ?)', [p.payment_id, p.booking_id, p.amount, p.payment_date, p.payment_status]);
        }
        console.log('Seeded initial data into MySQL successfully.');
      }

      dbPool = pool;
      isUsingMySQL = true;
      dbStatusInfo = {
        status: 'Connected',
        database: dbName,
        host,
        user,
        mode: 'MySQL 8.0'
      };
      console.log(`Connected to MySQL database [${dbName}] on ${host}:${port} as ${user}`);
      return;
    } catch (err) {
      // Try next password
    }
  }

  console.warn('MySQL connection failed or server not reachable. Running with JSON fallback mode.');
  isUsingMySQL = false;
  dbStatusInfo = {
    status: 'Running (Fallback JSON Storage)',
    database: 'local_storage',
    host: 'localhost',
    user: 'app',
    mode: 'JSON Fallback'
  };
}

// ---------------------------------------------------------------------
// API Routes: System Health & Statistics
// ---------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    project: 'Musthafa - Online Wedding Hall Booking Management System',
    author: 'Musthafa',
    database: dbStatusInfo,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    if (isUsingMySQL && dbPool) {
      const [hallsCount] = await dbPool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN status = "Available" THEN 1 ELSE 0 END) AS available FROM halls');
      const [custCount] = await dbPool.query('SELECT COUNT(*) AS total FROM customers');
      const [bookCount] = await dbPool.query(`
        SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM bookings
      `);
      const [payStats] = await dbPool.query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total_revenue,
          COALESCE(SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END), 0) AS pending_revenue
        FROM payments
      `);

      return res.json({
        totalHalls: hallsCount[0].total || 0,
        availableHalls: hallsCount[0].available || 0,
        totalCustomers: custCount[0].total || 0,
        totalBookings: bookCount[0].total || 0,
        confirmedBookings: bookCount[0].confirmed || 0,
        pendingBookings: bookCount[0].pending || 0,
        cancelledBookings: bookCount[0].cancelled || 0,
        totalRevenue: parseFloat(payStats[0].total_revenue) || 0,
        pendingRevenue: parseFloat(payStats[0].pending_revenue) || 0,
        database: dbStatusInfo
      });
    }

    // JSON Fallback Stats
    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);

    const totalRevenue = payments
      .filter(p => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingRevenue = payments
      .filter(p => p.payment_status === 'Pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      totalHalls: halls.length,
      availableHalls: halls.filter(h => h.status === 'Available').length,
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
      pendingBookings: bookings.filter(b => b.status === 'Pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'Cancelled').length,
      totalRevenue,
      pendingRevenue,
      database: dbStatusInfo
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

// ---------------------------------------------------------------------
// API Routes: Halls (Table 2: halls)
// ---------------------------------------------------------------------
app.get('/api/halls', async (req, res) => {
  try {
    const { search, location, minCapacity, maxPrice, status } = req.query;

    if (isUsingMySQL && dbPool) {
      let query = 'SELECT * FROM halls WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (hall_name LIKE ? OR location LIKE ? OR facilities LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (location) {
        query += ' AND location LIKE ?';
        params.push(`%${location}%`);
      }
      if (minCapacity) {
        query += ' AND capacity >= ?';
        params.push(parseInt(minCapacity, 10));
      }
      if (maxPrice) {
        query += ' AND price <= ?';
        params.push(parseFloat(maxPrice));
      }
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY hall_id ASC';
      const [rows] = await dbPool.query(query, params);
      return res.json(rows);
    }

    // JSON Fallback
    let halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    if (search) {
      const q = search.toLowerCase();
      halls = halls.filter(h =>
        h.hall_name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        (h.facilities && h.facilities.toLowerCase().includes(q))
      );
    }
    if (location) {
      halls = halls.filter(h => h.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (minCapacity) {
      halls = halls.filter(h => h.capacity >= parseInt(minCapacity, 10));
    }
    if (maxPrice) {
      halls = halls.filter(h => h.price <= parseFloat(maxPrice));
    }
    if (status) {
      halls = halls.filter(h => h.status === status);
    }
    res.json(halls);
  } catch (err) {
    console.error('Error fetching halls:', err);
    res.status(500).json({ error: 'Failed to retrieve halls', details: err.message });
  }
});

app.get('/api/halls/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      const [rows] = await dbPool.query('SELECT * FROM halls WHERE hall_id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Hall not found' });
      return res.json(rows[0]);
    }

    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const hall = halls.find(h => h.hall_id === id);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json(hall);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve hall', details: err.message });
  }
});

app.post('/api/halls', async (req, res) => {
  try {
    const { hall_name, location, capacity, price, facilities, status } = req.body;
    if (!hall_name || !location || !capacity || !price) {
      return res.status(400).json({ error: 'Missing required fields: hall_name, location, capacity, price' });
    }

    const hallStatus = status || 'Available';

    if (isUsingMySQL && dbPool) {
      const [result] = await dbPool.query(
        'INSERT INTO halls (hall_name, location, capacity, price, facilities, status) VALUES (?, ?, ?, ?, ?, ?)',
        [hall_name, location, parseInt(capacity, 10), parseFloat(price), facilities || '', hallStatus]
      );
      const [newRow] = await dbPool.query('SELECT * FROM halls WHERE hall_id = ?', [result.insertId]);
      return res.status(201).json(newRow[0]);
    }

    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const newId = halls.length > 0 ? Math.max(...halls.map(h => h.hall_id)) + 1 : 1;
    const newHall = {
      hall_id: newId,
      hall_name,
      location,
      capacity: parseInt(capacity, 10),
      price: parseFloat(price),
      facilities: facilities || '',
      status: hallStatus
    };
    halls.push(newHall);
    writeJSON(HALLS_FILE, halls);
    res.status(201).json(newHall);
  } catch (err) {
    console.error('Error creating hall:', err);
    res.status(500).json({ error: 'Failed to create hall', details: err.message });
  }
});

app.put('/api/halls/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { hall_name, location, capacity, price, facilities, status } = req.body;

    if (isUsingMySQL && dbPool) {
      await dbPool.query(
        'UPDATE halls SET hall_name = ?, location = ?, capacity = ?, price = ?, facilities = ?, status = ? WHERE hall_id = ?',
        [hall_name, location, parseInt(capacity, 10), parseFloat(price), facilities || '', status, id]
      );
      const [updated] = await dbPool.query('SELECT * FROM halls WHERE hall_id = ?', [id]);
      if (updated.length === 0) return res.status(404).json({ error: 'Hall not found' });
      return res.json(updated[0]);
    }

    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const index = halls.findIndex(h => h.hall_id === id);
    if (index === -1) return res.status(404).json({ error: 'Hall not found' });

    halls[index] = {
      ...halls[index],
      hall_name: hall_name || halls[index].hall_name,
      location: location || halls[index].location,
      capacity: capacity ? parseInt(capacity, 10) : halls[index].capacity,
      price: price ? parseFloat(price) : halls[index].price,
      facilities: facilities !== undefined ? facilities : halls[index].facilities,
      status: status || halls[index].status
    };
    writeJSON(HALLS_FILE, halls);
    res.json(halls[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hall', details: err.message });
  }
});

app.delete('/api/halls/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      await dbPool.query('DELETE FROM halls WHERE hall_id = ?', [id]);
      return res.json({ message: 'Hall deleted successfully', hall_id: id });
    }

    let halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    halls = halls.filter(h => h.hall_id !== id);
    writeJSON(HALLS_FILE, halls);
    res.json({ message: 'Hall deleted successfully', hall_id: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hall', details: err.message });
  }
});

// ---------------------------------------------------------------------
// API Routes: Customers (Table 1: customers)
// ---------------------------------------------------------------------
app.get('/api/customers', async (req, res) => {
  try {
    if (isUsingMySQL && dbPool) {
      const [rows] = await dbPool.query(`
        SELECT c.*, COUNT(b.booking_id) AS total_bookings
        FROM customers c
        LEFT JOIN bookings b ON c.customer_id = b.customer_id
        GROUP BY c.customer_id
        ORDER BY c.customer_id DESC
      `);
      return res.json(rows);
    }

    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const result = customers.map(c => ({
      ...c,
      total_bookings: bookings.filter(b => b.customer_id === c.customer_id).length
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customers', details: err.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      const [rows] = await dbPool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
      return res.json(rows[0]);
    }

    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const cust = customers.find(c => c.customer_id === id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer', details: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required customer fields: name, email, phone' });
    }

    if (isUsingMySQL && dbPool) {
      const [result] = await dbPool.query(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [name, email, phone, address || '']
      );
      const [newRow] = await dbPool.query('SELECT * FROM customers WHERE customer_id = ?', [result.insertId]);
      return res.status(201).json(newRow[0]);
    }

    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.customer_id)) + 1 : 1;
    const newCustomer = {
      customer_id: newId,
      name,
      email,
      phone,
      address: address || ''
    };
    customers.push(newCustomer);
    writeJSON(CUSTOMERS_FILE, customers);
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, email, phone, address } = req.body;

    if (isUsingMySQL && dbPool) {
      await dbPool.query(
        'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?',
        [name, email, phone, address || '', id]
      );
      const [updated] = await dbPool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
      if (updated.length === 0) return res.status(404).json({ error: 'Customer not found' });
      return res.json(updated[0]);
    }

    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const idx = customers.findIndex(c => c.customer_id === id);
    if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
    customers[idx] = {
      ...customers[idx],
      name: name || customers[idx].name,
      email: email || customers[idx].email,
      phone: phone || customers[idx].phone,
      address: address !== undefined ? address : customers[idx].address
    };
    writeJSON(CUSTOMERS_FILE, customers);
    res.json(customers[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer', details: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      await dbPool.query('DELETE FROM customers WHERE customer_id = ?', [id]);
      return res.json({ message: 'Customer deleted successfully', customer_id: id });
    }

    let customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    customers = customers.filter(c => c.customer_id !== id);
    writeJSON(CUSTOMERS_FILE, customers);
    res.json({ message: 'Customer deleted successfully', customer_id: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

// ---------------------------------------------------------------------
// API Routes: Bookings (Table 3: bookings) & Availability Check
// ---------------------------------------------------------------------
app.get('/api/check-availability', async (req, res) => {
  try {
    const { hall_id, event_date } = req.query;
    if (!hall_id || !event_date) {
      return res.status(400).json({ error: 'Please provide both hall_id and event_date' });
    }

    const hallId = parseInt(hall_id, 10);
    const formattedDate = event_date.substring(0, 10);

    if (isUsingMySQL && dbPool) {
      const [bookings] = await dbPool.query(
        `SELECT b.*, h.hall_name 
         FROM bookings b
         JOIN halls h ON b.hall_id = h.hall_id
         WHERE b.hall_id = ? AND DATE(b.event_date) = ? AND b.status != 'Cancelled'`,
        [hallId, formattedDate]
      );

      const isAvailable = bookings.length === 0;
      return res.json({
        hall_id: hallId,
        event_date: formattedDate,
        is_available: isAvailable,
        existing_bookings: bookings
      });
    }

    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const matched = bookings.filter(b =>
      b.hall_id === hallId &&
      b.event_date.substring(0, 10) === formattedDate &&
      b.status !== 'Cancelled'
    );

    res.json({
      hall_id: hallId,
      event_date: formattedDate,
      is_available: matched.length === 0,
      existing_bookings: matched
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability', details: err.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { customer_id, hall_id, status, search } = req.query;

    if (isUsingMySQL && dbPool) {
      let query = `
        SELECT 
          b.booking_id,
          b.customer_id,
          b.hall_id,
          b.event_name,
          DATE_FORMAT(b.event_date, '%Y-%m-%d') AS event_date,
          b.start_time,
          b.end_time,
          b.total_amount,
          b.status,
          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          h.hall_name,
          h.location AS hall_location,
          h.capacity AS hall_capacity,
          COALESCE(SUM(p.amount), 0) AS total_paid,
          (b.total_amount - COALESCE(SUM(p.amount), 0)) AS balance_amount,
          MAX(p.payment_status) AS latest_payment_status
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN halls h ON b.hall_id = h.hall_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE 1=1
      `;
      const params = [];

      if (customer_id) {
        query += ' AND b.customer_id = ?';
        params.push(parseInt(customer_id, 10));
      }
      if (hall_id) {
        query += ' AND b.hall_id = ?';
        params.push(parseInt(hall_id, 10));
      }
      if (status) {
        query += ' AND b.status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (b.event_name LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR h.hall_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ' GROUP BY b.booking_id ORDER BY b.event_date DESC, b.booking_id DESC';
      const [rows] = await dbPool.query(query, params);
      return res.json(rows);
    }

    // JSON Fallback
    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);

    let list = bookings.map(b => {
      const cust = customers.find(c => c.customer_id === b.customer_id) || {};
      const hall = halls.find(h => h.hall_id === b.hall_id) || {};
      const bookPayments = payments.filter(p => p.booking_id === b.booking_id);
      const total_paid = bookPayments.reduce((s, p) => s + Number(p.amount), 0);
      return {
        ...b,
        customer_name: cust.name || 'Unknown',
        customer_email: cust.email || '',
        customer_phone: cust.phone || '',
        hall_name: hall.hall_name || 'Unknown',
        hall_location: hall.location || '',
        hall_capacity: hall.capacity || 0,
        total_paid,
        balance_amount: b.total_amount - total_paid,
        latest_payment_status: bookPayments.length > 0 ? bookPayments[bookPayments.length - 1].payment_status : 'Pending'
      };
    });

    if (customer_id) list = list.filter(b => b.customer_id === parseInt(customer_id, 10));
    if (hall_id) list = list.filter(b => b.hall_id === parseInt(hall_id, 10));
    if (status) list = list.filter(b => b.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.event_name.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.includes(q) ||
        b.customer_email.toLowerCase().includes(q) ||
        b.hall_name.toLowerCase().includes(q)
      );
    }

    res.json(list);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to retrieve bookings', details: err.message });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      const [rows] = await dbPool.query(`
        SELECT 
          b.booking_id,
          b.customer_id,
          b.hall_id,
          b.event_name,
          DATE_FORMAT(b.event_date, '%Y-%m-%d') AS event_date,
          b.start_time,
          b.end_time,
          b.total_amount,
          b.status,
          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          c.address AS customer_address,
          h.hall_name,
          h.location AS hall_location,
          h.capacity AS hall_capacity,
          h.price AS hall_price,
          h.facilities AS hall_facilities
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN halls h ON b.hall_id = h.hall_id
        WHERE b.booking_id = ?
      `, [id]);

      if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
      
      const [payments] = await dbPool.query(
        'SELECT payment_id, booking_id, amount, DATE_FORMAT(payment_date, "%Y-%m-%d") AS payment_date, payment_status FROM payments WHERE booking_id = ? ORDER BY payment_date ASC',
        [id]
      );

      const bookingData = rows[0];
      bookingData.payments = payments;
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      bookingData.total_paid = totalPaid;
      bookingData.balance_amount = bookingData.total_amount - totalPaid;

      return res.json(bookingData);
    }

    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const booking = bookings.find(b => b.booking_id === id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);

    const cust = customers.find(c => c.customer_id === booking.customer_id) || {};
    const hall = halls.find(h => h.hall_id === booking.hall_id) || {};
    const bookPayments = payments.filter(p => p.booking_id === id);
    const totalPaid = bookPayments.reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      ...booking,
      customer_name: cust.name || '',
      customer_email: cust.email || '',
      customer_phone: cust.phone || '',
      customer_address: cust.address || '',
      hall_name: hall.hall_name || '',
      hall_location: hall.location || '',
      hall_capacity: hall.capacity || 0,
      hall_price: hall.price || 0,
      hall_facilities: hall.facilities || '',
      payments: bookPayments,
      total_paid: totalPaid,
      balance_amount: booking.total_amount - totalPaid
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve booking', details: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    let {
      customer_id,
      name, email, phone, address, // If new customer
      hall_id,
      event_name,
      event_date,
      start_time,
      end_time,
      total_amount,
      status,
      initial_payment_amount,
      payment_status
    } = req.body;

    if (!hall_id || !event_name || !event_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required booking fields: hall_id, event_name, event_date, start_time, end_time' });
    }

    const formattedDate = event_date.substring(0, 10);
    const bookingStatus = status || 'Confirmed';

    if (isUsingMySQL && dbPool) {
      // 1. Resolve customer
      let resolvedCustomerId = customer_id ? parseInt(customer_id, 10) : null;
      if (!resolvedCustomerId) {
        if (!name || !email || !phone) {
          return res.status(400).json({ error: 'Either select an existing customer or provide name, email, and phone' });
        }
        // Check if customer already exists with this email or phone
        const [existingCust] = await dbPool.query('SELECT customer_id FROM customers WHERE email = ? OR phone = ?', [email, phone]);
        if (existingCust.length > 0) {
          resolvedCustomerId = existingCust[0].customer_id;
        } else {
          const [insertCust] = await dbPool.query('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)', [name, email, phone, address || '']);
          resolvedCustomerId = insertCust.insertId;
        }
      }

      // 2. Fetch hall price if total_amount not provided
      let finalTotal = total_amount ? parseFloat(total_amount) : 0;
      const [hallRow] = await dbPool.query('SELECT price FROM halls WHERE hall_id = ?', [parseInt(hall_id, 10)]);
      if (hallRow.length === 0) return res.status(404).json({ error: 'Selected hall not found' });
      if (!finalTotal || finalTotal <= 0) {
        finalTotal = parseFloat(hallRow[0].price);
      }

      // 3. Create Booking
      const [bookRes] = await dbPool.query(
        'INSERT INTO bookings (customer_id, hall_id, event_name, event_date, start_time, end_time, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [resolvedCustomerId, parseInt(hall_id, 10), event_name, formattedDate, start_time, end_time, finalTotal, bookingStatus]
      );
      const newBookingId = bookRes.insertId;

      // 4. Create Initial Payment if provided
      let paymentRecord = null;
      const initialAmt = initial_payment_amount !== undefined ? parseFloat(initial_payment_amount) : finalTotal;
      if (initialAmt > 0) {
        const payStatus = payment_status || (initialAmt >= finalTotal ? 'Paid' : 'Partially Paid');
        const today = new Date().toISOString().substring(0, 10);
        const [payRes] = await dbPool.query(
          'INSERT INTO payments (booking_id, amount, payment_date, payment_status) VALUES (?, ?, ?, ?)',
          [newBookingId, initialAmt, today, payStatus]
        );
        paymentRecord = {
          payment_id: payRes.insertId,
          booking_id: newBookingId,
          amount: initialAmt,
          payment_date: today,
          payment_status: payStatus
        };
      }

      return res.status(201).json({
        message: 'Booking created successfully',
        booking_id: newBookingId,
        customer_id: resolvedCustomerId,
        hall_id: parseInt(hall_id, 10),
        event_name,
        event_date: formattedDate,
        start_time,
        end_time,
        total_amount: finalTotal,
        status: bookingStatus,
        payment: paymentRecord
      });
    }

    // JSON Fallback
    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);
    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);

    let resolvedCustomerId = customer_id ? parseInt(customer_id, 10) : null;
    if (!resolvedCustomerId) {
      const found = customers.find(c => c.email === email || c.phone === phone);
      if (found) {
        resolvedCustomerId = found.customer_id;
      } else {
        resolvedCustomerId = customers.length > 0 ? Math.max(...customers.map(c => c.customer_id)) + 1 : 1;
        customers.push({ customer_id: resolvedCustomerId, name, email, phone, address: address || '' });
        writeJSON(CUSTOMERS_FILE, customers);
      }
    }

    const hall = halls.find(h => h.hall_id === parseInt(hall_id, 10));
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    const finalTotal = total_amount ? parseFloat(total_amount) : hall.price;

    const newBookingId = bookings.length > 0 ? Math.max(...bookings.map(b => b.booking_id)) + 1 : 1;
    const newBooking = {
      booking_id: newBookingId,
      customer_id: resolvedCustomerId,
      hall_id: parseInt(hall_id, 10),
      event_name,
      event_date: formattedDate,
      start_time,
      end_time,
      total_amount: finalTotal,
      status: bookingStatus
    };
    bookings.push(newBooking);
    writeJSON(BOOKINGS_FILE, bookings);

    let paymentRecord = null;
    const initialAmt = initial_payment_amount !== undefined ? parseFloat(initial_payment_amount) : finalTotal;
    if (initialAmt > 0) {
      const newPayId = payments.length > 0 ? Math.max(...payments.map(p => p.payment_id)) + 1 : 1;
      const today = new Date().toISOString().substring(0, 10);
      paymentRecord = {
        payment_id: newPayId,
        booking_id: newBookingId,
        amount: initialAmt,
        payment_date: today,
        payment_status: payment_status || (initialAmt >= finalTotal ? 'Paid' : 'Partially Paid')
      };
      payments.push(paymentRecord);
      writeJSON(PAYMENTS_FILE, payments);
    }

    res.status(201).json({
      message: 'Booking created successfully',
      ...newBooking,
      payment: paymentRecord
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { event_name, event_date, start_time, end_time, total_amount, status } = req.body;

    if (isUsingMySQL && dbPool) {
      await dbPool.query(
        'UPDATE bookings SET event_name = COALESCE(?, event_name), event_date = COALESCE(?, event_date), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), total_amount = COALESCE(?, total_amount), status = COALESCE(?, status) WHERE booking_id = ?',
        [event_name || null, event_date || null, start_time || null, end_time || null, total_amount || null, status || null, id]
      );
      const [updated] = await dbPool.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
      if (updated.length === 0) return res.status(404).json({ error: 'Booking not found' });
      return res.json(updated[0]);
    }

    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const index = bookings.findIndex(b => b.booking_id === id);
    if (index === -1) return res.status(404).json({ error: 'Booking not found' });

    bookings[index] = {
      ...bookings[index],
      event_name: event_name || bookings[index].event_name,
      event_date: event_date || bookings[index].event_date,
      start_time: start_time || bookings[index].start_time,
      end_time: end_time || bookings[index].end_time,
      total_amount: total_amount !== undefined ? parseFloat(total_amount) : bookings[index].total_amount,
      status: status || bookings[index].status
    };
    writeJSON(BOOKINGS_FILE, bookings);
    res.json(bookings[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking', details: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      await dbPool.query('DELETE FROM bookings WHERE booking_id = ?', [id]);
      return res.json({ message: 'Booking deleted successfully', booking_id: id });
    }

    let bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    bookings = bookings.filter(b => b.booking_id !== id);
    writeJSON(BOOKINGS_FILE, bookings);

    let payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);
    payments = payments.filter(p => p.booking_id !== id);
    writeJSON(PAYMENTS_FILE, payments);

    res.json({ message: 'Booking deleted successfully', booking_id: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking', details: err.message });
  }
});

// ---------------------------------------------------------------------
// API Routes: Payments (Table 4: payments)
// ---------------------------------------------------------------------
app.get('/api/payments', async (req, res) => {
  try {
    const { booking_id, status } = req.query;

    if (isUsingMySQL && dbPool) {
      let query = `
        SELECT 
          p.payment_id,
          p.booking_id,
          p.amount,
          DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date,
          p.payment_status,
          b.event_name,
          b.total_amount AS booking_total,
          c.name AS customer_name,
          c.phone AS customer_phone,
          h.hall_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN halls h ON b.hall_id = h.hall_id
        WHERE 1=1
      `;
      const params = [];

      if (booking_id) {
        query += ' AND p.booking_id = ?';
        params.push(parseInt(booking_id, 10));
      }
      if (status) {
        query += ' AND p.payment_status = ?';
        params.push(status);
      }

      query += ' ORDER BY p.payment_id DESC';
      const [rows] = await dbPool.query(query, params);
      return res.json(rows);
    }

    // JSON Fallback
    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);
    const bookings = readJSON(BOOKINGS_FILE, INITIAL_BOOKINGS);
    const customers = readJSON(CUSTOMERS_FILE, INITIAL_CUSTOMERS);
    const halls = readJSON(HALLS_FILE, INITIAL_HALLS);

    let list = payments.map(p => {
      const b = bookings.find(item => item.booking_id === p.booking_id) || {};
      const c = customers.find(item => item.customer_id === b.customer_id) || {};
      const h = halls.find(item => item.hall_id === b.hall_id) || {};
      return {
        ...p,
        event_name: b.event_name || 'N/A',
        booking_total: b.total_amount || 0,
        customer_name: c.name || 'Unknown',
        customer_phone: c.phone || '',
        hall_name: h.hall_name || 'Unknown'
      };
    });

    if (booking_id) list = list.filter(p => p.booking_id === parseInt(booking_id, 10));
    if (status) list = list.filter(p => p.payment_status === status);

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payments', details: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { booking_id, amount, payment_date, payment_status } = req.body;
    if (!booking_id || amount === undefined) {
      return res.status(400).json({ error: 'Missing required payment fields: booking_id, amount' });
    }

    const payDate = payment_date ? payment_date.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const payStatus = payment_status || 'Paid';
    const payAmount = parseFloat(amount);

    if (isUsingMySQL && dbPool) {
      // Validate booking exists
      const [bk] = await dbPool.query('SELECT total_amount FROM bookings WHERE booking_id = ?', [parseInt(booking_id, 10)]);
      if (bk.length === 0) return res.status(404).json({ error: 'Booking not found' });

      const [result] = await dbPool.query(
        'INSERT INTO payments (booking_id, amount, payment_date, payment_status) VALUES (?, ?, ?, ?)',
        [parseInt(booking_id, 10), payAmount, payDate, payStatus]
      );
      const [newRow] = await dbPool.query('SELECT * FROM payments WHERE payment_id = ?', [result.insertId]);
      return res.status(201).json(newRow[0]);
    }

    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);
    const newId = payments.length > 0 ? Math.max(...payments.map(p => p.payment_id)) + 1 : 1;
    const newPayment = {
      payment_id: newId,
      booking_id: parseInt(booking_id, 10),
      amount: payAmount,
      payment_date: payDate,
      payment_status: payStatus
    };
    payments.push(newPayment);
    writeJSON(PAYMENTS_FILE, payments);
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment', details: err.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { amount, payment_date, payment_status } = req.body;

    if (isUsingMySQL && dbPool) {
      await dbPool.query(
        'UPDATE payments SET amount = COALESCE(?, amount), payment_date = COALESCE(?, payment_date), payment_status = COALESCE(?, payment_status) WHERE payment_id = ?',
        [amount ? parseFloat(amount) : null, payment_date || null, payment_status || null, id]
      );
      const [updated] = await dbPool.query('SELECT * FROM payments WHERE payment_id = ?', [id]);
      if (updated.length === 0) return res.status(404).json({ error: 'Payment not found' });
      return res.json(updated[0]);
    }

    const payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);
    const idx = payments.findIndex(p => p.payment_id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment not found' });

    payments[idx] = {
      ...payments[idx],
      amount: amount !== undefined ? parseFloat(amount) : payments[idx].amount,
      payment_date: payment_date || payments[idx].payment_date,
      payment_status: payment_status || payments[idx].payment_status
    };
    writeJSON(PAYMENTS_FILE, payments);
    res.json(payments[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment', details: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isUsingMySQL && dbPool) {
      await dbPool.query('DELETE FROM payments WHERE payment_id = ?', [id]);
      return res.json({ message: 'Payment deleted successfully', payment_id: id });
    }

    let payments = readJSON(PAYMENTS_FILE, INITIAL_PAYMENTS);
    payments = payments.filter(p => p.payment_id !== id);
    writeJSON(PAYMENTS_FILE, payments);
    res.json({ message: 'Payment deleted successfully', payment_id: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment', details: err.message });
  }
});

// Catch-all route to serve index.html for frontend navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------
// Server Start
// ---------------------------------------------------------------------
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log('===============================================================');
    console.log(' Musthafa - Online Wedding Hall Booking Management System');
    console.log(` Web Application running at: http://localhost:${PORT}`);
    console.log(` Database: ${dbStatusInfo.mode} (${dbStatusInfo.database})`);
    console.log('===============================================================');
  });
}

startServer();
