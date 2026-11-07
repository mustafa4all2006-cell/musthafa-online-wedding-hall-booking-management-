// =====================================================================
// Project: Musthafa - Online Wedding Hall Booking Management System
// Frontend Client Logic
// Author: Musthafa
// =====================================================================

const API_BASE = '/api';

// State
let allHalls = [];
let selectedHallForBooking = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initHealthCheck();
  loadHalls();
  loadStats();
  setupEventListeners();
  setDefaultEventDate();
});

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Database & System Health Check
async function initHealthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const badge = document.getElementById('db-status-badge');
    const dot = document.getElementById('db-status-dot');
    const text = document.getElementById('db-status-text');

    if (badge && text) {
      if (data.database && data.database.status === 'Connected') {
        text.innerText = `MySQL: ${data.database.database}`;
        dot.style.background = '#38a169';
      } else {
        text.innerText = `${data.database.mode || 'Fallback JSON'}`;
        dot.style.background = '#dd6b20';
      }
    }
  } catch (err) {
    console.error('Health check failed:', err);
  }
}

// Load System Stats
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const stats = await res.json();
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };

    setVal('stat-total-halls', stats.totalHalls);
    setVal('stat-available-halls', stats.availableHalls);
    setVal('stat-total-bookings', stats.totalBookings);
    setVal('stat-confirmed-bookings', stats.confirmedBookings);
    setVal('stat-total-customers', stats.totalCustomers);
    setVal('stat-total-revenue', `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`);
  } catch (err) {
    console.error('Stats loading error:', err);
  }
}

// Set today + 7 days as default date in forms
function setDefaultEventDate() {
  const today = new Date();
  today.setDate(today.getDate() + 7);
  const formatted = today.toISOString().split('T')[0];
  
  const availDate = document.getElementById('check-date');
  if (availDate) availDate.value = formatted;

  const bookDate = document.getElementById('book-date');
  if (bookDate) bookDate.value = formatted;
}

// Load and Render Halls
async function loadHalls() {
  try {
    const res = await fetch(`${API_BASE}/halls`);
    allHalls = await res.json();
    renderHalls(allHalls);
    populateHallDropdowns(allHalls);
  } catch (err) {
    console.error('Failed to load halls:', err);
    showToast('Failed to load wedding halls', 'error');
  }
}

function renderHalls(halls) {
  const container = document.getElementById('halls-container');
  if (!container) return;

  if (halls.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 12px; border: 1px dashed #cbd5e0;">
        <span style="font-size: 3rem;">🏛️</span>
        <h4 style="margin: 0.5rem 0; color: #4a5568;">No Wedding Halls Found</h4>
        <p style="color: #718096;">Try adjusting your search criteria or capacity filter.</p>
      </div>
    `;
    return;
  }

  const icons = ['🏰', '🏛️', '💎', '👑', '🌸', '✨'];

  container.innerHTML = halls.map((hall, idx) => {
    const icon = icons[idx % icons.length];
    const statusClass = hall.status === 'Available' ? 'status-available' : hall.status === 'Booked' ? 'status-booked' : 'status-maintenance';
    const facilitiesList = (hall.facilities || '')
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    return `
      <div class="hall-card" data-id="${hall.hall_id}">
        <div class="hall-image-box">
          <div class="hall-image-pattern"></div>
          <span class="hall-image-icon">${icon}</span>
          <span class="hall-badge-id">Hall #${hall.hall_id}</span>
          <span class="hall-badge-status ${statusClass}">${hall.status}</span>
        </div>
        <div class="hall-body">
          <h4 class="hall-title">${hall.hall_name}</h4>
          <div class="hall-location">
            <span>📍</span>
            <span>${hall.location}</span>
          </div>

          <div class="hall-highlights">
            <div class="highlight-item">
              <span class="highlight-label">Guest Capacity</span>
              <span class="highlight-value">👥 ${Number(hall.capacity).toLocaleString()}</span>
            </div>
            <div class="highlight-item">
              <span class="highlight-label">Booking Rate</span>
              <span class="highlight-value">₹${Number(hall.price).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="hall-facilities">
            <div class="facilities-title">Key Amenities</div>
            <div class="facility-tags">
              ${facilitiesList.slice(0, 4).map(fac => `<span class="facility-tag">${fac}</span>`).join('')}
              ${facilitiesList.length > 4 ? `<span class="facility-tag">+${facilitiesList.length - 4} more</span>` : ''}
            </div>
          </div>

          <div class="hall-footer">
            <button class="btn-outline btn-sm" onclick="checkHallSpecificAvailability(${hall.hall_id})">
              📅 Check Dates
            </button>
            <button class="btn-primary btn-sm" onclick="openBookingModal(${hall.hall_id})">
              💍 Book Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateHallDropdowns(halls) {
  const checkSelect = document.getElementById('check-hall-select');
  const bookSelect = document.getElementById('book-hall-select');

  const options = halls.map(h => `<option value="${h.hall_id}">${h.hall_name} - ₹${Number(h.price).toLocaleString('en-IN')} (Cap: ${h.capacity})</option>`).join('');

  if (checkSelect) {
    checkSelect.innerHTML = `<option value="">-- Choose a Hall --</option>` + options;
  }
  if (bookSelect) {
    bookSelect.innerHTML = `<option value="">-- Select Hall --</option>` + options;
  }
}

// Filter Halls in Catalog
function filterHalls() {
  const search = document.getElementById('search-query')?.value.toLowerCase().trim() || '';
  const location = document.getElementById('filter-location')?.value.toLowerCase().trim() || '';
  const minCap = parseInt(document.getElementById('filter-capacity')?.value || '0', 10);
  const maxPrice = parseFloat(document.getElementById('filter-price')?.value || '999999999');

  const filtered = allHalls.filter(hall => {
    const matchSearch = !search ||
      hall.hall_name.toLowerCase().includes(search) ||
      hall.location.toLowerCase().includes(search) ||
      (hall.facilities && hall.facilities.toLowerCase().includes(search));

    const matchLoc = !location || hall.location.toLowerCase().includes(location);
    const matchCap = !minCap || hall.capacity >= minCap;
    const matchPrice = !maxPrice || hall.price <= maxPrice;

    return matchSearch && matchLoc && matchCap && matchPrice;
  });

  renderHalls(filtered);
}

// ---------------------------------------------------------------------
// Check Hall Availability
// ---------------------------------------------------------------------
async function checkAvailability(e) {
  if (e) e.preventDefault();
  const hallId = document.getElementById('check-hall-select')?.value;
  const dateVal = document.getElementById('check-date')?.value;
  const resultBox = document.getElementById('availability-result-box');

  if (!hallId || !dateVal) {
    showToast('Please select both a hall and a date', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/check-availability?hall_id=${hallId}&event_date=${dateVal}`);
    const data = await res.json();

    if (!resultBox) return;
    resultBox.style.display = 'flex';

    const selected = allHalls.find(h => h.hall_id === parseInt(hallId, 10));
    const hallName = selected ? selected.hall_name : `Hall #${hallId}`;

    if (data.is_available) {
      resultBox.className = 'availability-result result-available';
      resultBox.innerHTML = `
        <div>
          <strong>🎉 Hall is Available!</strong>
          <p style="font-size: 0.9rem; margin-top: 0.2rem;">
            <strong>${hallName}</strong> has no reservations on <strong>${dateVal}</strong>.
          </p>
        </div>
        <button class="btn-success" onclick="openBookingModal(${hallId}, '${dateVal}')">
          Proceed to Book
        </button>
      `;
    } else {
      const bookedEvent = data.existing_bookings[0]?.event_name || 'Booked Event';
      resultBox.className = 'availability-result result-booked';
      resultBox.innerHTML = `
        <div>
          <strong>❌ Hall is Reserved!</strong>
          <p style="font-size: 0.9rem; margin-top: 0.2rem;">
            <strong>${hallName}</strong> is already booked on <strong>${dateVal}</strong> for: <em>${bookedEvent}</em>.
          </p>
        </div>
        <button class="btn-outline btn-sm" onclick="document.getElementById('check-date').focus()">
          Select Another Date
        </button>
      `;
    }
  } catch (err) {
    console.error('Error checking availability:', err);
    showToast('Failed to check availability', 'error');
  }
}

function checkHallSpecificAvailability(hallId) {
  const checkSection = document.getElementById('section-availability');
  if (checkSection) {
    checkSection.scrollIntoView({ behavior: 'smooth' });
    const select = document.getElementById('check-hall-select');
    if (select) {
      select.value = hallId;
      checkAvailability();
    }
  }
}

// ---------------------------------------------------------------------
// Booking Modal & Creation
// ---------------------------------------------------------------------
function openBookingModal(hallId = null, prefilledDate = null) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  const hallSelect = document.getElementById('book-hall-select');
  if (hallId && hallSelect) {
    hallSelect.value = hallId;
    updateBookingSummary();
  }

  if (prefilledDate) {
    const dateInput = document.getElementById('book-date');
    if (dateInput) dateInput.value = prefilledDate;
  }

  modal.style.display = 'flex';
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.style.display = 'none';
}

function updateBookingSummary() {
  const hallId = parseInt(document.getElementById('book-hall-select')?.value, 10);
  const hall = allHalls.find(h => h.hall_id === hallId);

  const priceEl = document.getElementById('book-hall-rate');
  const totalEl = document.getElementById('book-total-amount');
  const advanceEl = document.getElementById('book-advance-suggest');
  const payInput = document.getElementById('book-payment-amount');

  if (hall) {
    const rate = Number(hall.price);
    if (priceEl) priceEl.innerText = `₹${rate.toLocaleString('en-IN')}`;
    if (totalEl) totalEl.innerText = `₹${rate.toLocaleString('en-IN')}`;
    if (advanceEl) advanceEl.innerText = `₹${(rate * 0.25).toLocaleString('en-IN')} (25% Advance)`;
    if (payInput && (!payInput.value || payInput.value == '0')) {
      payInput.value = rate; // Default to full payment
    }
  } else {
    if (priceEl) priceEl.innerText = '₹0.00';
    if (totalEl) totalEl.innerText = '₹0.00';
    if (advanceEl) advanceEl.innerText = '₹0.00';
  }
}

async function submitBookingForm(e) {
  e.preventDefault();

  const hall_id = document.getElementById('book-hall-select').value;
  const event_name = document.getElementById('book-event-name').value.trim();
  const event_date = document.getElementById('book-date').value;
  const start_time = document.getElementById('book-start-time').value;
  const end_time = document.getElementById('book-end-time').value;

  // Customer info
  const name = document.getElementById('book-cust-name').value.trim();
  const email = document.getElementById('book-cust-email').value.trim();
  const phone = document.getElementById('book-cust-phone').value.trim();
  const address = document.getElementById('book-cust-address').value.trim();

  // Payment
  const initial_payment_amount = parseFloat(document.getElementById('book-payment-amount').value || '0');
  const payment_status = document.getElementById('book-payment-status').value;

  if (!hall_id || !event_name || !event_date || !name || !email || !phone) {
    showToast('Please fill in all mandatory fields', 'error');
    return;
  }

  // Double check availability
  const checkRes = await fetch(`${API_BASE}/check-availability?hall_id=${hall_id}&event_date=${event_date}`);
  const checkData = await checkRes.json();
  if (!checkData.is_available) {
    showToast('This hall is already reserved for the selected date!', 'error');
    return;
  }

  const payload = {
    hall_id,
    event_name,
    event_date,
    start_time,
    end_time,
    name,
    email,
    phone,
    address,
    initial_payment_amount,
    payment_status,
    status: 'Confirmed'
  };

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to complete booking');
    }

    closeBookingModal();
    showToast(`Booking #${data.booking_id} Confirmed Successfully!`, 'success');
    loadStats();
    loadHalls();

    // Open Printable Receipt View
    openReceiptModal(data.booking_id);
  } catch (err) {
    console.error('Booking submission error:', err);
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------
// Customer Booking & Payment Lookup
// ---------------------------------------------------------------------
async function lookupCustomerBookings() {
  const query = document.getElementById('lookup-query')?.value.trim();
  const container = document.getElementById('lookup-results');

  if (!query) {
    showToast('Enter your Phone number, Email, or Booking ID', 'info');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings?search=${encodeURIComponent(query)}`);
    const bookings = await res.json();

    if (!container) return;

    if (bookings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; border: 1px dashed #cbd5e0;">
          <p style="color: #718096;">No reservations found matching "<strong>${query}</strong>".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.map(b => {
      const isPaid = Number(b.balance_amount) <= 0;
      const statusBadge = b.status === 'Confirmed' ? 'badge-confirmed' : b.status === 'Pending' ? 'badge-pending' : 'badge-cancelled';
      const payBadge = isPaid ? 'badge-paid' : 'badge-partially-paid';

      return `
        <div class="card-box" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; border-bottom: 1px solid #edf2f7; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
            <div>
              <span class="badge ${statusBadge}">${b.status}</span>
              <span class="badge ${payBadge}" style="margin-left: 0.4rem;">${isPaid ? 'Fully Paid' : 'Payment Due'}</span>
              <h4 style="color: var(--primary); margin-top: 0.4rem; font-size: 1.15rem;">${b.event_name}</h4>
              <p style="font-size: 0.85rem; color: #718096;">Booking ID: #${b.booking_id} | Hall: <strong>${b.hall_name}</strong> (${b.hall_location})</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: #718096;">Event Date</span>
              <div style="font-weight: 700; color: #2d3748;">📅 ${b.event_date}</div>
              <div style="font-size: 0.8rem; color: #718096;">⏰ ${b.start_time} - ${b.end_time}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; background: #fdfbf7; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem;">
            <div>
              <span style="font-size: 0.75rem; color: #718096; text-transform: uppercase;">Customer</span>
              <div style="font-weight: 600;">${b.customer_name}</div>
              <div style="font-size: 0.8rem; color: #718096;">${b.customer_phone}</div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #718096; text-transform: uppercase;">Total Hall Cost</span>
              <div style="font-weight: 700; color: #2d3748;">₹${Number(b.total_amount).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #718096; text-transform: uppercase;">Amount Paid</span>
              <div style="font-weight: 700; color: var(--success);">₹${Number(b.total_paid).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #718096; text-transform: uppercase;">Balance Due</span>
              <div style="font-weight: 800; color: ${isPaid ? '#718096' : 'var(--danger)'};">₹${Number(b.balance_amount).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.6rem; align-items: center;">
            <button class="btn-outline btn-sm" onclick="openReceiptModal(${b.booking_id})">
              🧾 View Receipt / Invoice
            </button>
            ${!isPaid ? `
              <button class="btn-success btn-sm" onclick="openPaymentModal(${b.booking_id}, ${b.balance_amount})">
                💳 Pay Balance Due
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Customer lookup failed:', err);
    showToast('Failed to search bookings', 'error');
  }
}

// ---------------------------------------------------------------------
// Payment Modal & Recording
// ---------------------------------------------------------------------
function openPaymentModal(bookingId, balanceAmount) {
  const modal = document.getElementById('payment-modal');
  if (!modal) return;

  document.getElementById('pay-booking-id').value = bookingId;
  document.getElementById('pay-amount').value = balanceAmount || '';
  document.getElementById('pay-balance-label').innerText = `₹${Number(balanceAmount).toLocaleString('en-IN')}`;

  modal.style.display = 'flex';
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.style.display = 'none';
}

async function submitPaymentRecord(e) {
  e.preventDefault();

  const booking_id = parseInt(document.getElementById('pay-booking-id').value, 10);
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const payment_status = document.getElementById('pay-status').value;
  const payment_date = new Date().toISOString().split('T')[0];

  if (!booking_id || isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid payment amount', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id, amount, payment_date, payment_status })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to record payment');

    closePaymentModal();
    showToast('Payment recorded successfully!', 'success');
    loadStats();
    lookupCustomerBookings();
    openReceiptModal(booking_id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------
// Receipt / Invoice Viewer Modal
// ---------------------------------------------------------------------
async function openReceiptModal(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`);
    const b = await res.json();

    if (!res.ok) throw new Error(b.error || 'Receipt not found');

    const modal = document.getElementById('receipt-modal');
    const content = document.getElementById('receipt-content');
    if (!modal || !content) return;

    const paymentsList = b.payments || [];
    const isPaid = Number(b.balance_amount) <= 0;

    content.innerHTML = `
      <div class="receipt-wrapper">
        <div class="receipt-header">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 1px;">
              Reservation Confirmation & Invoice
            </div>
            <div class="receipt-title">Musthafa Wedding Venues</div>
            <div style="color: #718096; font-size: 0.85rem;">Online Wedding Hall Booking Management System</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">RECEIPT #${b.booking_id}</div>
            <div style="font-size: 0.8rem; color: #718096;">Date: ${new Date().toLocaleDateString()}</div>
            <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}" style="margin-top: 0.4rem;">
              ${isPaid ? 'Fully Paid' : 'Balance Pending'}
            </span>
          </div>
        </div>

        <div class="receipt-info-grid">
          <div class="receipt-box">
            <h5>Customer Details</h5>
            <div style="font-weight: 700; color: #2d3748;">${b.customer_name}</div>
            <div style="font-size: 0.85rem; color: #718096;">📧 ${b.customer_email}</div>
            <div style="font-size: 0.85rem; color: #718096;">📞 ${b.customer_phone}</div>
            <div style="font-size: 0.85rem; color: #718096;">🏠 ${b.customer_address || 'Address on file'}</div>
          </div>
          <div class="receipt-box">
            <h5>Venue & Event Details</h5>
            <div style="font-weight: 700; color: #2d3748;">${b.event_name}</div>
            <div style="font-size: 0.85rem; color: #718096;">🏛️ ${b.hall_name}</div>
            <div style="font-size: 0.85rem; color: #718096;">📍 ${b.hall_location} (Cap: ${b.hall_capacity})</div>
            <div style="font-size: 0.85rem; color: #718096;">📅 <strong>Date: ${b.event_date}</strong></div>
            <div style="font-size: 0.85rem; color: #718096;">⏰ Timing: ${b.start_time} - ${b.end_time}</div>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h5 style="font-size: 0.85rem; text-transform: uppercase; color: #718096; margin-bottom: 0.6rem;">Payment Ledger</h5>
          <table class="data-table" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsList.length > 0 ? paymentsList.map(p => `
                <tr>
                  <td>#PAY-${p.payment_id}</td>
                  <td>${p.payment_date}</td>
                  <td><strong>₹${Number(p.amount).toLocaleString('en-IN')}</strong></td>
                  <td><span class="badge ${p.payment_status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${p.payment_status}</span></td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" style="text-align: center; color: #a0aec0;">No payments recorded yet</td></tr>
              `}
            </tbody>
          </table>
        </div>

        <div class="pricing-summary-card" style="margin-top: 1rem;">
          <div class="pricing-summary-row">
            <span>Hall Booking Total:</span>
            <strong>₹${Number(b.total_amount).toLocaleString('en-IN')}</strong>
          </div>
          <div class="pricing-summary-row">
            <span>Total Amount Paid:</span>
            <strong style="color: var(--success);">₹${Number(b.total_paid).toLocaleString('en-IN')}</strong>
          </div>
          <div class="pricing-summary-row total-row">
            <span>Balance Due:</span>
            <span>₹${Number(b.balance_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem; text-align: center; color: #718096; font-size: 0.78rem;">
          Thank you for choosing Musthafa Online Wedding Hall Booking System. For inquiries or rescheduling, contact management.
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) modal.style.display = 'none';
}

function printReceipt() {
  window.print();
}

// ---------------------------------------------------------------------
// Event Listeners Setup
// ---------------------------------------------------------------------
function setupEventListeners() {
  // Search & filter
  document.getElementById('search-query')?.addEventListener('input', filterHalls);
  document.getElementById('filter-location')?.addEventListener('change', filterHalls);
  document.getElementById('filter-capacity')?.addEventListener('change', filterHalls);
  document.getElementById('filter-price')?.addEventListener('input', filterHalls);

  // Availability check form
  document.getElementById('availability-form')?.addEventListener('submit', checkAvailability);

  // Booking form
  document.getElementById('booking-form')?.addEventListener('submit', submitBookingForm);
  document.getElementById('book-hall-select')?.addEventListener('change', updateBookingSummary);

  // Payment form
  document.getElementById('payment-record-form')?.addEventListener('submit', submitPaymentRecord);

  // Close modals on background click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.style.display = 'none';
    }
  });
}
