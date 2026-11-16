import { API } from '../api.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderCustomers(container) {
  let allCustomers = [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>Customer Management</h2>
        <p>Client directory, visit histories, lifetime spend, and personal preferences</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-add-customer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Customer
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="customer-search-input" placeholder="Search by client name, email, or phone number...">
      </div>
    </div>

    <!-- Customer Cards Grid -->
    <div class="customer-grid" id="customers-grid-wrapper">
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        Loading customer directory...
      </div>
    </div>
  `;

  async function loadData() {
    try {
      allCustomers = await API.getCustomers();
      renderGrid();
    } catch (err) {
      container.querySelector('#customers-grid-wrapper').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p style="color:var(--accent-rose);">Failed to load customers: ${err.message}</p>
        </div>
      `;
    }
  }

  function getInitials(name) {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function renderGrid() {
    const query = container.querySelector('#customer-search-input').value.toLowerCase().trim();
    const grid = container.querySelector('#customers-grid-wrapper');

    const filtered = allCustomers.filter(c => {
      if (!query) return true;
      return (
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
      );
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
          <p>No customers found matching your search.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(c => `
      <div class="customer-card">
        <div>
          <div class="customer-header">
            <div class="customer-avatar-initials">${getInitials(c.name)}</div>
            <div>
              <h4 style="font-size:1.1rem; font-weight:700;">${c.name}</h4>
              <div style="font-size:0.8rem; color:var(--text-muted);">${c.phone}</div>
              ${c.email ? `<div style="font-size:0.75rem; color:var(--text-secondary);">${c.email}</div>` : ''}
            </div>
          </div>

          <div style="margin: 14px 0;" class="customer-stats-row">
            <div>
              <div style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">Total Visits</div>
              <div style="font-size:1.1rem; font-weight:700; color:var(--accent-gold);">${c.totalVisits || 0}</div>
            </div>
            <div>
              <div style="color:var(--text-muted); font-size:0.7rem; text-transform:uppercase;">Total Spend</div>
              <div style="font-size:1.1rem; font-weight:700; color:var(--accent-emerald);">$${c.totalSpend || 0}</div>
            </div>
          </div>

          ${c.notes ? `
            <div style="font-size:0.8rem; color:var(--text-secondary); background:var(--bg-tertiary); padding:8px 10px; border-radius:var(--border-radius-sm); border-left:3px solid var(--accent-gold);">
              ${c.notes}
            </div>
          ` : ''}
        </div>

        <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
          <button class="btn btn-secondary btn-sm btn-view-history" data-id="${c.id}" style="flex:1;">History</button>
          <button class="btn btn-outline btn-sm btn-edit-customer" data-id="${c.id}">Edit</button>
          <button class="btn btn-danger btn-sm btn-delete-customer" data-id="${c.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Actions
    grid.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', () => openCustomerHistory(btn.dataset.id));
    });

    grid.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = allCustomers.find(item => item.id === btn.dataset.id);
        if (c) openCustomerModal(loadData, c);
      });
    });

    grid.querySelectorAll('.btn-delete-customer').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this customer profile?')) {
          try {
            await API.delete(`/api/customers/${btn.dataset.id}`);
            showToast('Customer deleted', 'success');
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  container.querySelector('#customer-search-input').addEventListener('input', renderGrid);
  container.querySelector('#btn-add-customer').addEventListener('click', () => {
    openCustomerModal(loadData);
  });

  loadData();
}

/**
 * Add / Edit Customer Modal
 */
function openCustomerModal(onSuccess, existing = null) {
  const content = `
    <form id="customer-modal-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="cust-name" class="form-control" value="${existing ? existing.name : ''}" placeholder="Jane Doe" required>
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input type="tel" id="cust-phone" class="form-control" value="${existing ? existing.phone : ''}" placeholder="+1 (555) 000-0000" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" id="cust-email" class="form-control" value="${existing ? (existing.email || '') : ''}" placeholder="jane.doe@example.com">
      </div>

      <div class="form-group">
        <label class="form-label">Client Notes & Formulas</label>
        <textarea id="cust-notes" class="form-control" rows="3" placeholder="Styling preferences, allergy alerts, preferred drinks...">${existing ? (existing.notes || '') : ''}</textarea>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-cust-submit">${existing ? 'Save Customer' : 'Create Customer'}</button>
  `;

  Modal.open({
    title: existing ? 'Edit Client Profile' : 'New Client Registration',
    content,
    footer,
    onOpen: (modalEl) => {
      modalEl.querySelector('#modal-cust-submit').addEventListener('click', async () => {
        const name = modalEl.querySelector('#cust-name').value.trim();
        const phone = modalEl.querySelector('#cust-phone').value.trim();
        const email = modalEl.querySelector('#cust-email').value.trim();
        const notes = modalEl.querySelector('#cust-notes').value.trim();

        if (!name || !phone) {
          showToast('Name and phone are required.', 'error');
          return;
        }

        try {
          if (existing) {
            await API.put(`/api/customers/${existing.id}`, { name, phone, email, notes });
            showToast('Customer profile updated', 'success');
          } else {
            await API.post('/api/customers', { name, phone, email, notes });
            showToast('New client created', 'success');
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

/**
 * View Customer Full History
 */
async function openCustomerHistory(customerId) {
  try {
    const data = await API.getCustomerById(customerId);
    const { history } = data;
    const bookings = history ? history.bookings : [];
    const walkIns = history ? history.walkIns : [];

    const content = `
      <div style="margin-bottom:18px;">
        <h4 style="font-size:1.2rem; font-weight:700;">${data.name}</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">${data.phone} ${data.email ? `· ${data.email}` : ''}</p>
        <div style="display:flex; gap:16px; margin-top:8px; font-size:0.85rem;">
          <span><strong>Total Visits:</strong> ${data.totalVisits || 0}</span>
          <span><strong>Total Spent:</strong> $${data.totalSpend || 0}</span>
        </div>
      </div>

      <h5 style="font-size:0.95rem; font-weight:700; margin-bottom:8px;">Appointments (${bookings.length})</h5>
      ${bookings.length === 0 ? `
        <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:16px;">No appointments on record.</p>
      ` : `
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
          ${bookings.map(b => `
            <div style="padding:10px; border-radius:var(--border-radius-sm); background:var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:600; font-size:0.875rem;">${b.serviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${b.date} at ${b.time} with ${b.staffName}</div>
              </div>
              <span class="badge badge-${b.status}">${b.status}</span>
            </div>
          `).join('')}
        </div>
      `}

      <h5 style="font-size:0.95rem; font-weight:700; margin-bottom:8px;">Walk-ins Log (${walkIns.length})</h5>
      ${walkIns.length === 0 ? `
        <p style="color:var(--text-muted); font-size:0.8rem;">No walk-in visits on record.</p>
      ` : `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${walkIns.map(w => `
            <div style="padding:10px; border-radius:var(--border-radius-sm); background:var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:600; font-size:0.875rem;">Ticket ${w.ticketNumber}: ${w.serviceName}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${w.checkInTime ? new Date(w.checkInTime).toLocaleDateString() : ''} (${w.staffName})</div>
              </div>
              <span class="badge badge-${w.status}">${w.status}</span>
            </div>
          `).join('')}
        </div>
      `}
    `;

    Modal.open({
      title: 'Customer Visit History',
      content,
      footer: `<button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Close</button>`
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}
