// =====================================================================
// Project: Musthafa - Online Wedding Hall Booking Management System
// Admin Dashboard Logic (Halls, Reservations, Customers, Payments CRUD)
// Author: Musthafa
// =====================================================================

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  loadAdminStats();
  loadAdminHalls();
  loadAdminBookings();
  loadAdminCustomers();
  loadAdminPayments();
  setupAdminTabs();
});

function showAdminToast(msg, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------------------------------------------------------------------
// Tab Switching
// ---------------------------------------------------------------------
function setupAdminTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.admin-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');

      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => (s.style.display = 'none'));

      btn.classList.add('active');
      const pane = document.getElementById(target);
      if (pane) pane.style.display = 'block';
    });
  });
}

// ---------------------------------------------------------------------
// Load Dashboard Stats
// ---------------------------------------------------------------------
async function loadAdminStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();

    document.getElementById('stat-halls-total').innerText = data.totalHalls;
    document.getElementById('stat-halls-avail').innerText = `${data.availableHalls} Available`;
    document.getElementById('stat-book-total').innerText = data.totalBookings;
    document.getElementById('stat-book-confirmed').innerText = `${data.confirmedBookings} Confirmed`;
    document.getElementById('stat-cust-total').innerText = data.totalCustomers;
    document.getElementById('stat-revenue-total').innerText = `₹${Number(data.totalRevenue).toLocaleString('en-IN')}`;

    const dbBadge = document.getElementById('admin-db-badge');
    if (dbBadge && data.database) {
      dbBadge.innerText = `${data.database.mode} - ${data.database.database} (${data.database.status})`;
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

// ---------------------------------------------------------------------
// Manage Halls (Table 2: halls)
// ---------------------------------------------------------------------
let currentHalls = [];

async function loadAdminHalls() {
  try {
    const res = await fetch(`${API_BASE}/halls`);
    currentHalls = await res.json();
    renderAdminHallsTable(currentHalls);
    populateAdminDropdowns(currentHalls);
  } catch (err) {
    console.error('Error loading halls for admin:', err);
  }
}

function renderAdminHallsTable(halls) {
  const tbody = document.getElementById('admin-halls-tbody');
  if (!tbody) return;

  if (halls.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">No halls found</td></tr>`;
    return;
  }

  tbody.innerHTML = halls.map(h => {
    const statusBadge = h.status === 'Available' ? 'badge-available' : h.status === 'Booked' ? 'badge-pending' : 'badge-maintenance';
    return `
      <tr>
        <td><strong>#${h.hall_id}</strong></td>
        <td><strong>${h.hall_name}</strong></td>
        <td>${h.location}</td>
        <td>👥 ${Number(h.capacity).toLocaleString()}</td>
        <td><strong>₹${Number(h.price).toLocaleString('en-IN')}</strong></td>
        <td><span class="badge ${statusBadge}">${h.status}</span></td>
        <td>
          <button class="btn-outline btn-sm" onclick="editHallModal(${h.hall_id})">✏️ Edit</button>
          <button class="btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger); margin-left: 4px;" onclick="deleteHall(${h.hall_id})">🗑️ Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddHallModal() {
  document.getElementById('hall-modal-title').innerText = 'Add New Wedding Hall';
  document.getElementById('hall-form-id').value = '';
  document.getElementById('hall-name').value = '';
  document.getElementById('hall-location').value = '';
  document.getElementById('hall-capacity').value = '';
  document.getElementById('hall-price').value = '';
  document.getElementById('hall-facilities').value = 'Central AC, Bridal Suite, Valet Parking, Audio-Visual LED, Power Backup';
  document.getElementById('hall-status').value = 'Available';

  document.getElementById('hall-crud-modal').style.display = 'flex';
}

function editHallModal(id) {
  const hall = currentHalls.find(h => h.hall_id === id);
  if (!hall) return;

  document.getElementById('hall-modal-title').innerText = `Edit Hall #${id}`;
  document.getElementById('hall-form-id').value = hall.hall_id;
  document.getElementById('hall-name').value = hall.hall_name;
  document.getElementById('hall-location').value = hall.location;
  document.getElementById('hall-capacity').value = hall.capacity;
  document.getElementById('hall-price').value = hall.price;
  document.getElementById('hall-facilities').value = hall.facilities;
  document.getElementById('hall-status').value = hall.status;

  document.getElementById('hall-crud-modal').style.display = 'flex';
}

function closeHallCrudModal() {
  document.getElementById('hall-crud-modal').style.display = 'none';
}

async function saveHallForm(e) {
  e.preventDefault();
  const id = document.getElementById('hall-form-id').value;
  const payload = {
    hall_name: document.getElementById('hall-name').value.trim(),
    location: document.getElementById('hall-location').value.trim(),
    capacity: parseInt(document.getElementById('hall-capacity').value, 10),
    price: parseFloat(document.getElementById('hall-price').value),
    facilities: document.getElementById('hall-facilities').value.trim(),
    status: document.getElementById('hall-status').value
  };

  try {
    const url = id ? `${API_BASE}/halls/${id}` : `${API_BASE}/halls`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to save wedding hall');

    closeHallCrudModal();
    showAdminToast(id ? 'Hall updated successfully!' : 'Hall added successfully!');
    loadAdminHalls();
    loadAdminStats();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

async function deleteHall(id) {
  if (!confirm(`Are you sure you want to delete Hall #${id}? All related bookings and payments will be removed.`)) return;

  try {
    const res = await fetch(`${API_BASE}/halls/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete hall');

    showAdminToast('Hall deleted successfully!');
    loadAdminHalls();
    loadAdminBookings();
    loadAdminStats();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------
// Manage Bookings (Table 3: bookings)
// ---------------------------------------------------------------------
let currentBookings = [];

async function loadAdminBookings() {
  try {
    const res = await fetch(`${API_BASE}/bookings`);
    currentBookings = await res.json();
    renderAdminBookingsTable(currentBookings);
  } catch (err) {
    console.error('Failed to load bookings:', err);
  }
}

function renderAdminBookingsTable(bookings) {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">No bookings found</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const statusClass = b.status === 'Confirmed' ? 'badge-confirmed' : b.status === 'Pending' ? 'badge-pending' : 'badge-cancelled';
    const isPaid = Number(b.balance_amount) <= 0;

    return `
      <tr>
        <td><strong>#${b.booking_id}</strong></td>
        <td>
          <div style="font-weight: 700; color: var(--primary);">${b.event_name}</div>
          <div style="font-size: 0.8rem; color: #718096;">Hall: ${b.hall_name}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${b.customer_name}</div>
          <div style="font-size: 0.8rem; color: #718096;">📞 ${b.customer_phone}</div>
        </td>
        <td>
          <div style="font-weight: 600;">📅 ${b.event_date}</div>
          <div style="font-size: 0.78rem; color: #718096;">⏰ ${b.start_time} - ${b.end_time}</div>
        </td>
        <td>
          <div>₹${Number(b.total_amount).toLocaleString('en-IN')}</div>
          <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}" style="font-size: 0.7rem;">
            ${isPaid ? 'Paid' : `Due: ₹${Number(b.balance_amount).toLocaleString('en-IN')}`}
          </span>
        </td>
        <td><span class="badge ${statusClass}">${b.status}</span></td>
        <td>
          <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.8rem;" onchange="updateBookingStatus(${b.booking_id}, this.value)">
            <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn-outline btn-sm" onclick="viewBookingDetails(${b.booking_id})">👁️</button>
          <button class="btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="deleteBooking(${b.booking_id})">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateBookingStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    showAdminToast(`Booking #${id} status changed to ${newStatus}`);
    loadAdminStats();
    loadAdminBookings();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

async function deleteBooking(id) {
  if (!confirm(`Are you sure you want to cancel and delete Booking #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete booking');
    showAdminToast('Booking removed successfully');
    loadAdminBookings();
    loadAdminPayments();
    loadAdminStats();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

function viewBookingDetails(id) {
  // Leverage existing receipt modal
  if (typeof openReceiptModal === 'function') {
    openReceiptModal(id);
  } else {
    window.open(`/receipt.html?booking_id=${id}`, '_blank');
  }
}

// ---------------------------------------------------------------------
// Manage Customers (Table 1: customers)
// ---------------------------------------------------------------------
let currentCustomers = [];

async function loadAdminCustomers() {
  try {
    const res = await fetch(`${API_BASE}/customers`);
    currentCustomers = await res.json();
    renderAdminCustomersTable(currentCustomers);
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
}

function renderAdminCustomersTable(customers) {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No customers found</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>#${c.customer_id}</strong></td>
      <td><strong>${c.name}</strong></td>
      <td>📧 ${c.email}</td>
      <td>📞 ${c.phone}</td>
      <td>${c.address || 'N/A'}</td>
      <td><span class="badge badge-confirmed">${c.total_bookings || 0} Bookings</span></td>
    </tr>
  `).join('');
}

// ---------------------------------------------------------------------
// Manage Payments (Table 4: payments)
// ---------------------------------------------------------------------
let currentPayments = [];

async function loadAdminPayments() {
  try {
    const res = await fetch(`${API_BASE}/payments`);
    currentPayments = await res.json();
    renderAdminPaymentsTable(currentPayments);
  } catch (err) {
    console.error('Failed to load payments:', err);
  }
}

function renderAdminPaymentsTable(payments) {
  const tbody = document.getElementById('admin-payments-tbody');
  if (!tbody) return;

  if (payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">No payments found</td></tr>`;
    return;
  }

  tbody.innerHTML = payments.map(p => {
    const statusClass = p.payment_status === 'Paid' ? 'badge-paid' : p.payment_status === 'Partially Paid' ? 'badge-partially-paid' : 'badge-refunded';
    return `
      <tr>
        <td><strong>#PAY-${p.payment_id}</strong></td>
        <td>
          <a href="javascript:void(0)" onclick="viewBookingDetails(${p.booking_id})" style="font-weight: 700;">
            #${p.booking_id} - ${p.event_name}
          </a>
        </td>
        <td>${p.customer_name} (📞 ${p.customer_phone})</td>
        <td><strong>₹${Number(p.amount).toLocaleString('en-IN')}</strong></td>
        <td>📅 ${p.payment_date}</td>
        <td><span class="badge ${statusClass}">${p.payment_status}</span></td>
        <td>
          <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.8rem;" onchange="updatePaymentStatus(${p.payment_id}, this.value)">
            <option value="Paid" ${p.payment_status === 'Paid' ? 'selected' : ''}>Paid</option>
            <option value="Partially Paid" ${p.payment_status === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
            <option value="Pending" ${p.payment_status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Refunded" ${p.payment_status === 'Refunded' ? 'selected' : ''}>Refunded</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

async function updatePaymentStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update payment status');
    showAdminToast(`Payment #${id} marked as ${newStatus}`);
    loadAdminStats();
    loadAdminPayments();
    loadAdminBookings();
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

function populateAdminDropdowns(halls) {
  // Any extra dropdowns if needed
}
