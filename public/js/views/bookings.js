import { API } from '../api.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderBookings(container) {
  let allBookings = [];
  let allStaff = [];
  let allServices = [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>Booking Management</h2>
        <p>Schedule, filter, update, and manage all salon appointments</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-create-booking">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Appointment
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="booking-search" placeholder="Search client, service, or phone...">
      </div>

      <div class="filter-group">
        <input type="date" id="booking-filter-date" class="filter-select">
        
        <select id="booking-filter-status" class="filter-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select id="booking-filter-staff" class="filter-select">
          <option value="">All Stylists</option>
        </select>

        <button class="btn btn-outline btn-sm" id="booking-filter-reset">Reset</button>
      </div>
    </div>

    <!-- Bookings Table Card -->
    <div class="card" id="bookings-card">
      <div style="display:flex; justify-content:center; padding:40px; color:var(--text-muted);">
        Loading bookings...
      </div>
    </div>
  `;

  // Fetch initial data
  try {
    [allBookings, allStaff, allServices] = await Promise.all([
      API.getBookings(),
      API.getStaff({ active: 'true' }),
      API.getServices({ active: 'true' })
    ]);

    // Populate staff filter
    const staffSelect = container.querySelector('#booking-filter-staff');
    allStaff.forEach(stf => {
      const opt = document.createElement('option');
      opt.value = stf.id;
      opt.textContent = stf.name;
      staffSelect.appendChild(opt);
    });

    renderTable();

  } catch (err) {
    container.querySelector('#bookings-card').innerHTML = `
      <div class="empty-state">
        <p style="color:var(--accent-rose);">Error loading bookings: ${err.message}</p>
      </div>
    `;
  }

  function getFilteredList() {
    const searchVal = container.querySelector('#booking-search').value.toLowerCase().trim();
    const dateVal = container.querySelector('#booking-filter-date').value;
    const statusVal = container.querySelector('#booking-filter-status').value;
    const staffVal = container.querySelector('#booking-filter-staff').value;

    return allBookings.filter(b => {
      const matchesSearch = !searchVal ||
        b.customerName.toLowerCase().includes(searchVal) ||
        b.serviceName.toLowerCase().includes(searchVal) ||
        b.staffName.toLowerCase().includes(searchVal) ||
        b.customerPhone.includes(searchVal);

      const matchesDate = !dateVal || b.date === dateVal;
      const matchesStatus = !statusVal || b.status.toLowerCase() === statusVal.toLowerCase();
      const matchesStaff = !staffVal || b.staffId === staffVal;

      return matchesSearch && matchesDate && matchesStatus && matchesStaff;
    });
  }

  function renderTable() {
    const filtered = getFilteredList();
    const cardEl = container.querySelector('#bookings-card');

    if (filtered.length === 0) {
      cardEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No bookings found matching your filters.</p>
        </div>
      `;
      return;
    }

    cardEl.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Stylist</th>
              <th>Price</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(b => `
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--text-primary);">${b.date}</div>
                  <div style="font-size:0.8rem; color:var(--accent-gold); font-weight:600;">${b.time} (${b.durationMinutes} min)</div>
                </td>
                <td>
                  <div style="font-weight:600;">${b.customerName}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${b.customerPhone}</div>
                </td>
                <td>
                  <div style="font-weight:600;">${b.serviceName}</div>
                  ${b.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">"${b.notes}"</div>` : ''}
                </td>
                <td>
                  <div style="font-weight:600;">${b.staffName}</div>
                </td>
                <td style="font-weight:700;">$${b.price}</td>
                <td>
                  <span class="badge badge-${b.status}">${b.status}</span>
                </td>
                <td style="text-align:right;">
                  <div style="display:inline-flex; gap:6px;">
                    <select class="table-status-select filter-select" data-id="${b.id}" style="padding:4px 8px; font-size:0.75rem;">
                      <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="in-progress" ${b.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                      <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                      <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="btn btn-outline btn-sm btn-edit-booking" data-id="${b.id}" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-booking" data-id="${b.id}" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Hook listeners
    cardEl.querySelectorAll('.table-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        try {
          await API.patch(`/api/bookings/${id}/status`, { status: newStatus });
          showToast(`Status updated to ${newStatus}`, 'success');
          allBookings = await API.getBookings();
          renderTable();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    cardEl.querySelectorAll('.btn-edit-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        const booking = allBookings.find(b => b.id === btn.dataset.id);
        if (booking) {
          openBookingModal(async () => {
            allBookings = await API.getBookings();
            renderTable();
          }, booking);
        }
      });
    });

    cardEl.querySelectorAll('.btn-delete-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this appointment?')) {
          try {
            await API.delete(`/api/bookings/${btn.dataset.id}`);
            showToast('Booking deleted', 'success');
            allBookings = await API.getBookings();
            renderTable();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  // Filter Event Listeners
  container.querySelector('#booking-search').addEventListener('input', renderTable);
  container.querySelector('#booking-filter-date').addEventListener('change', renderTable);
  container.querySelector('#booking-filter-status').addEventListener('change', renderTable);
  container.querySelector('#booking-filter-staff').addEventListener('change', renderTable);
  container.querySelector('#booking-filter-reset').addEventListener('click', () => {
    container.querySelector('#booking-search').value = '';
    container.querySelector('#booking-filter-date').value = '';
    container.querySelector('#booking-filter-status').value = '';
    container.querySelector('#booking-filter-staff').value = '';
    renderTable();
  });

  container.querySelector('#btn-create-booking').addEventListener('click', () => {
    openBookingModal(async () => {
      allBookings = await API.getBookings();
      renderTable();
    });
  });
}

/**
 * Universal New/Edit Booking Modal
 */
export async function openBookingModal(onSuccess, existingBooking = null) {
  const [services, staffList, customers] = await Promise.all([
    API.getServices({ active: 'true' }),
    API.getStaff({ active: 'true' }),
    API.getCustomers()
  ]);

  const todayStr = new Date().toISOString().split('T')[0];

  const content = `
    <form id="booking-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client Name *</label>
          <input type="text" id="modal-bk-name" class="form-control" list="existing-clients-list" value="${existingBooking ? existingBooking.customerName : ''}" required placeholder="Client full name">
          <datalist id="existing-clients-list">
            ${customers.map(c => `<option value="${c.name}">${c.phone}</option>`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">Client Phone *</label>
          <input type="tel" id="modal-bk-phone" class="form-control" value="${existingBooking ? existingBooking.customerPhone : ''}" required placeholder="+1 (555) 000-0000">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client Email (Optional)</label>
          <input type="email" id="modal-bk-email" class="form-control" value="${existingBooking ? (existingBooking.customerEmail || '') : ''}" placeholder="client@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Service *</label>
          <select id="modal-bk-service" class="form-control" required>
            <option value="">Select Service...</option>
            ${services.map(s => `
              <option value="${s.id}" data-duration="${s.durationMinutes}" data-price="${s.price}" ${existingBooking && existingBooking.serviceId === s.id ? 'selected' : ''}>
                ${s.name} (${s.durationMinutes}m - $${s.price})
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Stylist / Specialist *</label>
          <select id="modal-bk-staff" class="form-control" required>
            <option value="">Select Stylist...</option>
            ${staffList.map(st => `
              <option value="${st.id}" ${existingBooking && existingBooking.staffId === st.id ? 'selected' : ''}>
                ${st.name} (${st.role})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input type="date" id="modal-bk-date" class="form-control" value="${existingBooking ? existingBooking.date : todayStr}" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Time Slot *</label>
          <input type="time" id="modal-bk-time" class="form-control" value="${existingBooking ? existingBooking.time : '10:00'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Appointment Notes</label>
          <input type="text" id="modal-bk-notes" class="form-control" value="${existingBooking ? (existingBooking.notes || '') : ''}" placeholder="Style preferences, allergies, etc.">
        </div>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-bk-submit">
      ${existingBooking ? 'Save Changes' : 'Confirm Appointment'}
    </button>
  `;

  Modal.open({
    title: existingBooking ? 'Edit Appointment' : 'Book New Appointment',
    content,
    footer,
    onOpen: (modalEl) => {
      // Auto-fill customer phone if picked from datalist
      const nameInput = modalEl.querySelector('#modal-bk-name');
      nameInput.addEventListener('change', () => {
        const found = customers.find(c => c.name.toLowerCase() === nameInput.value.toLowerCase());
        if (found) {
          modalEl.querySelector('#modal-bk-phone').value = found.phone;
          if (found.email) modalEl.querySelector('#modal-bk-email').value = found.email;
        }
      });

      modalEl.querySelector('#modal-bk-submit').addEventListener('click', async () => {
        const name = modalEl.querySelector('#modal-bk-name').value.trim();
        const phone = modalEl.querySelector('#modal-bk-phone').value.trim();
        const email = modalEl.querySelector('#modal-bk-email').value.trim();
        const serviceId = modalEl.querySelector('#modal-bk-service').value;
        const staffId = modalEl.querySelector('#modal-bk-staff').value;
        const date = modalEl.querySelector('#modal-bk-date').value;
        const time = modalEl.querySelector('#modal-bk-time').value;
        const notes = modalEl.querySelector('#modal-bk-notes').value.trim();

        if (!name || !phone || !serviceId || !staffId || !date || !time) {
          showToast('Please fill in all required fields.', 'error');
          return;
        }

        try {
          if (existingBooking) {
            await API.put(`/api/bookings/${existingBooking.id}`, {
              customerName: name,
              customerPhone: phone,
              customerEmail: email,
              serviceId,
              staffId,
              date,
              time,
              notes
            });
            showToast('Appointment successfully updated.', 'success');
          } else {
            await API.post('/api/bookings', {
              customerName: name,
              customerPhone: phone,
              customerEmail: email,
              serviceId,
              staffId,
              date,
              time,
              notes
            });
            showToast('Appointment booked successfully!', 'success');
          }

          Modal.close();
          if (onSuccess) onSuccess();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
}
