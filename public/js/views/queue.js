import { API } from '../api.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderQueue(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>Walk-in Line Management</h2>
        <p>Live digital queue board, ticket dispatching, and wait-time tracking</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-secondary" id="btn-call-next-queue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          Call Next Walk-in
        </button>
        <button class="btn btn-primary" id="btn-add-walkin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Check-in Walk-in
        </button>
      </div>
    </div>

    <div id="queue-board-wrapper">
      <div style="display:flex; justify-content:center; padding:40px; color:var(--text-muted);">
        Loading queue status...
      </div>
    </div>
  `;

  async function loadAndRender() {
    try {
      const queueItems = await API.getQueue();
      const inService = queueItems.filter(q => q.status === 'in-service');
      const waiting = queueItems.filter(q => q.status === 'waiting');
      const completed = queueItems.filter(q => q.status === 'completed' || q.status === 'cancelled');

      const wrapper = container.querySelector('#queue-board-wrapper');

      wrapper.innerHTML = `
        <div class="queue-board">
          
          <!-- Column 1: In Chair / Being Served -->
          <div class="queue-column">
            <div class="queue-column-header">
              <h3>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--accent-gold); box-shadow:0 0 8px var(--accent-gold);"></span>
                In Service (In Chair)
              </h3>
              <span class="count-badge">${inService.length} Active</span>
            </div>

            <div class="queue-card-list">
              ${inService.length === 0 ? `
                <div class="empty-state">
                  <p>No walk-in guests currently being served.</p>
                </div>
              ` : inService.map(item => `
                <div class="queue-ticket-card in-service-card">
                  <div class="ticket-header">
                    <span class="ticket-number">${item.ticketNumber}</span>
                    <span class="badge badge-in-service">Serving</span>
                  </div>
                  <div class="ticket-customer-name">${item.customerName}</div>
                  <div class="ticket-details">
                    <div><strong>Service:</strong> ${item.serviceName} ($${item.servicePrice || '--'})</div>
                    <div><strong>Stylist:</strong> ${item.staffName}</div>
                    <div><strong>Started:</strong> ${item.serviceStartTime ? new Date(item.serviceStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Just now'}</div>
                  </div>
                  <div class="ticket-actions">
                    <button class="btn btn-success btn-sm btn-finish-service" data-id="${item.id}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Finish & Pay
                    </button>
                    <button class="btn btn-outline btn-sm btn-reassign" data-id="${item.id}">Reassign</button>
                    <button class="btn btn-danger btn-sm btn-cancel-queue" data-id="${item.id}">Cancel</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Column 2: Waiting in Lounge -->
          <div class="queue-column">
            <div class="queue-column-header">
              <h3>
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--accent-amber);"></span>
                Waiting in Lounge
              </h3>
              <span class="count-badge">${waiting.length} Waiting</span>
            </div>

            <div class="queue-card-list">
              ${waiting.length === 0 ? `
                <div class="empty-state">
                  <p>Lounge queue is clear! Ready for walk-ins.</p>
                </div>
              ` : waiting.map((item, idx) => `
                <div class="queue-ticket-card waiting-card">
                  <div class="ticket-header">
                    <span class="ticket-number">${item.ticketNumber}</span>
                    <span class="badge badge-waiting">#${idx + 1} in line</span>
                  </div>
                  <div class="ticket-customer-name">${item.customerName}</div>
                  <div class="ticket-details">
                    <div><strong>Phone:</strong> ${item.customerPhone}</div>
                    <div><strong>Service:</strong> ${item.serviceName}</div>
                    <div><strong>Preferred Stylist:</strong> ${item.staffName}</div>
                    <div style="color:var(--accent-gold); font-weight:700;">
                      Est. Wait: ~${item.dynamicWait !== undefined ? item.dynamicWait : item.estimatedWaitMinutes} mins
                    </div>
                  </div>
                  <div class="ticket-actions">
                    <button class="btn btn-primary btn-sm btn-start-service" data-id="${item.id}">
                      Start Service
                    </button>
                    <button class="btn btn-danger btn-sm btn-cancel-queue" data-id="${item.id}">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- History / Completed Queue Log -->
        <div class="card" style="margin-top:24px;">
          <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:14px;">Today's Completed Walk-ins</h3>
          ${completed.length === 0 ? `
            <p style="color:var(--text-muted); font-size:0.85rem;">No completed walk-ins recorded today.</p>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Stylist</th>
                    <th>Status</th>
                    <th>Finished At</th>
                  </tr>
                </thead>
                <tbody>
                  ${completed.map(c => `
                    <tr>
                      <td style="font-weight:700; color:var(--accent-gold);">${c.ticketNumber}</td>
                      <td>${c.customerName}</td>
                      <td>${c.serviceName}</td>
                      <td>${c.staffName}</td>
                      <td><span class="badge badge-${c.status}">${c.status}</span></td>
                      <td style="color:var(--text-muted); font-size:0.8rem;">
                        ${c.completedTime ? new Date(c.completedTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

      // Event handlers
      wrapper.querySelectorAll('.btn-finish-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await API.patch(`/api/queue/${btn.dataset.id}/status`, { status: 'completed' });
            showToast('Service marked as completed & payment recorded!', 'success');
            loadAndRender();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      wrapper.querySelectorAll('.btn-start-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await API.patch(`/api/queue/${btn.dataset.id}/status`, { status: 'in-service' });
            showToast('Service started! Guest moved to chair.', 'success');
            loadAndRender();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      wrapper.querySelectorAll('.btn-cancel-queue').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Cancel / Remove this walk-in ticket?')) {
            try {
              await API.patch(`/api/queue/${btn.dataset.id}/status`, { status: 'cancelled' });
              showToast('Walk-in ticket cancelled', 'info');
              loadAndRender();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      });

      wrapper.querySelectorAll('.btn-reassign').forEach(btn => {
        btn.addEventListener('click', () => {
          openReassignModal(btn.dataset.id, loadAndRender);
        });
      });

    } catch (err) {
      container.querySelector('#queue-board-wrapper').innerHTML = `
        <div class="empty-state">
          <p style="color:var(--accent-rose);">Failed to load queue: ${err.message}</p>
        </div>
      `;
    }
  }

  loadAndRender();

  // Top Action: Add Walk-in
  container.querySelector('#btn-add-walkin').addEventListener('click', () => {
    openWalkInModal(loadAndRender);
  });

  // Top Action: Call Next
  container.querySelector('#btn-call-next-queue').addEventListener('click', async () => {
    try {
      const next = await API.post('/api/queue/call-next', {});
      showToast(`Now calling Ticket ${next.ticketNumber} - ${next.customerName}`, 'success');
      loadAndRender();
    } catch (err) {
      showToast(err.message, 'info');
    }
  });
}

/**
 * Open Walk-In Check-In Modal
 */
export async function openWalkInModal(onSuccess) {
  const [services, staffList] = await Promise.all([
    API.getServices({ active: 'true' }),
    API.getStaff({ active: 'true' })
  ]);

  const content = `
    <form id="walkin-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Guest Full Name *</label>
          <input type="text" id="modal-wi-name" class="form-control" placeholder="Guest name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input type="tel" id="modal-wi-phone" class="form-control" placeholder="+1 (555) 000-0000" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Requested Service *</label>
          <select id="modal-wi-service" class="form-control" required>
            <option value="">Select Service...</option>
            ${services.map(s => `
              <option value="${s.id}">${s.name} (~${s.durationMinutes}m - $${s.price})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Preferred Stylist</label>
          <select id="modal-wi-staff" class="form-control">
            <option value="any">First Available Stylist</option>
            ${staffList.map(st => `
              <option value="${st.id}">${st.name} (${st.role})</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes or Special Requests</label>
        <input type="text" id="modal-wi-notes" class="form-control" placeholder="E.g. in a rush, needs specific product">
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-wi-submit">Issue Queue Ticket</button>
  `;

  Modal.open({
    title: 'Walk-In Guest Check-In',
    content,
    footer,
    onOpen: (modalEl) => {
      modalEl.querySelector('#modal-wi-submit').addEventListener('click', async () => {
        const name = modalEl.querySelector('#modal-wi-name').value.trim();
        const phone = modalEl.querySelector('#modal-wi-phone').value.trim();
        const serviceId = modalEl.querySelector('#modal-wi-service').value;
        const staffId = modalEl.querySelector('#modal-wi-staff').value;
        const notes = modalEl.querySelector('#modal-wi-notes').value.trim();

        if (!name || !phone || !serviceId) {
          showToast('Please enter guest name, phone, and select a service.', 'error');
          return;
        }

        try {
          const ticket = await API.post('/api/queue', {
            customerName: name,
            customerPhone: phone,
            serviceId,
            staffId,
            notes
          });

          showToast(`Ticket ${ticket.ticketNumber} created! Est. wait: ${ticket.estimatedWaitMinutes}m`, 'success');
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
 * Reassign Stylist Modal
 */
async function openReassignModal(queueId, onSuccess) {
  const staffList = await API.getStaff({ active: 'true' });

  const content = `
    <div class="form-group">
      <label class="form-label">Assign to Stylist</label>
      <select id="modal-reassign-staff" class="form-control">
        <option value="any">Any Available</option>
        ${staffList.map(st => `<option value="${st.id}">${st.name} (${st.role})</option>`).join('')}
      </select>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-reassign-submit">Save Assignment</button>
  `;

  Modal.open({
    title: 'Reassign Stylist',
    content,
    footer,
    onOpen: (modalEl) => {
      modalEl.querySelector('#modal-reassign-submit').addEventListener('click', async () => {
        const staffId = modalEl.querySelector('#modal-reassign-staff').value;
        try {
          await API.patch(`/api/queue/${queueId}/status`, { status: 'in-service', staffId });
          showToast('Stylist reassigned', 'success');
          Modal.close();
          if (onSuccess) onSuccess();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  });
}
