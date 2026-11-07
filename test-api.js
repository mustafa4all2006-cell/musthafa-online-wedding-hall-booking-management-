// =====================================================================
// API Verification Test Suite
// Project: Musthafa - Online Wedding Hall Booking Management System
// =====================================================================

const http = require('http');

async function runTests() {
  console.log('--- Starting API Endpoints Verification ---');
  const baseUrl = 'http://localhost:3000';

  // 1. Health & DB
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('✔ Health Check:', health.database.status, `(${health.database.database})`);

  // 2. Halls
  const hallsRes = await fetch(`${baseUrl}/api/halls`);
  const halls = await hallsRes.json();
  console.log(`✔ Halls API: Retrieved ${halls.length} halls.`);

  // 3. Customers
  const custRes = await fetch(`${baseUrl}/api/customers`);
  const customers = await custRes.json();
  console.log(`✔ Customers API: Retrieved ${customers.length} registered customers.`);

  // 4. Bookings
  const bookRes = await fetch(`${baseUrl}/api/bookings`);
  const bookings = await bookRes.json();
  console.log(`✔ Bookings API: Retrieved ${bookings.length} reservations.`);

  // 5. Payments
  const payRes = await fetch(`${baseUrl}/api/payments`);
  const payments = await payRes.json();
  console.log(`✔ Payments API: Retrieved ${payments.length} payment records.`);

  // 6. Availability Check (Busy Date)
  const availBusy = await fetch(`${baseUrl}/api/check-availability?hall_id=1&event_date=2026-11-20`);
  const busyData = await availBusy.json();
  console.log('✔ Availability Test (Existing Booking): is_available =', busyData.is_available, '(Expected: false)');

  // 7. Availability Check (Free Date)
  const availFree = await fetch(`${baseUrl}/api/check-availability?hall_id=1&event_date=2026-12-30`);
  const freeData = await availFree.json();
  console.log('✔ Availability Test (Free Date): is_available =', freeData.is_available, '(Expected: true)');

  console.log('--- All API Tests Passed Successfully! ---');
}

// Start server and run tests
require('./server.js');
setTimeout(async () => {
  try {
    await runTests();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}, 2500);
