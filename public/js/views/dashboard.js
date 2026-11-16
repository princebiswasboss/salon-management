import { API } from '../api.js';
import { showToast } from '../components/toast.js';
import { openBookingModal } from './bookings.js';
import { openWalkInModal } from './queue.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; height:300px;">
      <div style="font-size:1rem; color:var(--text-muted);">Loading dashboard data...</div>
    </div>
  `;

  try {
    const stats = await API.getDashboardStats();
    const { metrics, todaySchedule, activeQueue, popularServices, recentActivity } = stats;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-title">
          <h2>Salon Overview</h2>
          <p>Real-time performance, today's schedule and walk-in queue</p>
        </div>
        <div class="view-header-actions">
          <button class="btn btn-secondary" id="dash-btn-call-next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            Call Next Walk-in
          </button>
          <button class="btn btn-secondary" id="dash-btn-walkin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Walk-in
          </button>
          <button class="btn btn-primary" id="dash-btn-new-booking">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            New Appointment
          </button>
        </div>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon emerald">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Today's Revenue</div>
            <div class="stat-value">$${metrics.totalRevenueToday}</div>
            <div class="stat-meta">Projected: $${metrics.projectedRevenueToday}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon gold">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Appointments Today</div>
            <div class="stat-value">${metrics.appointmentsCountToday}</div>
            <div class="stat-meta">${metrics.appointmentsUpcomingToday} upcoming · ${metrics.appointmentsCompletedToday} finished</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rose">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Walk-in Queue</div>
            <div class="stat-value">${metrics.walkInsWaitingCount}</div>
            <div class="stat-meta">${metrics.walkInsInServiceCount} being served · Avg ~${metrics.averageWaitMinutes}m wait</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon indigo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Active Stylists</div>
            <div class="stat-value">${metrics.activeStaffCount}</div>
            <div class="stat-meta">${metrics.totalServicesCount} Services Offered</div>
          </div>
        </div>
      </div>

      <!-- Main Columns: Today's Schedule & Live Queue Board -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-bottom: 28px;" class="dash-columns">
        
        <!-- Left: Today's Appointments -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <h3 style="font-size:1.1rem; font-weight:700;">Today's Appointments</h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">${todaySchedule.length} scheduled</span>
          </div>

          ${todaySchedule.length === 0 ? `
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p>No appointments booked for today yet.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Service & Stylist</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${todaySchedule.map(b => `
                    <tr>
                      <td style="font-weight:700; color:var(--accent-gold);">${b.time}</td>
                      <td>
                        <div style="font-weight:600;">${b.customerName}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${b.customerPhone}</div>
                      </td>
                      <td>
                        <div style="font-weight:600;">${b.serviceName}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">with ${b.staffName} (${b.durationMinutes}m)</div>
                      </td>
                      <td style="font-weight:700;">$${b.price}</td>
                      <td>
                        <span class="badge badge-${b.status}">${b.status}</span>
                      </td>
                      <td>
                        <select class="dash-status-select filter-select" data-id="${b.id}" style="padding:4px 8px; font-size:0.75rem;">
                          <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                          <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                          <option value="in-progress" ${b.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                          <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                          <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Right: Live Walk-in Queue Preview -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <h3 style="font-size:1.1rem; font-weight:700;">Live Walk-in Queue</h3>
            <span class="badge badge-in-service">${activeQueue.length} In Line</span>
          </div>

          ${activeQueue.length === 0 ? `
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>Queue is empty. No walk-in guests waiting.</p>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${activeQueue.map(q => `
                <div class="queue-ticket-card ${q.status === 'in-service' ? 'in-service-card' : 'waiting-card'}" style="padding:12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:800; color:var(--accent-gold); font-size:0.95rem;">${q.ticketNumber}</span>
                    <span class="badge badge-${q.status}">${q.status}</span>
                  </div>
                  <div style="font-weight:700; margin-top:4px;">${q.customerName}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${q.serviceName} · ${q.staffName}</div>
                  ${q.status === 'waiting' ? `
                    <div style="font-size:0.75rem; color:var(--accent-amber); margin-top:4px; font-weight:600;">
                      Est. Wait: ~${q.estimatedWaitMinutes || 15} mins
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>

      <!-- Secondary Row: Popular Services & Recent Activity Feed -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;" class="dash-columns">
        <div class="card">
          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:16px;">Top Booked Services</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${popularServices.map((ps, idx) => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-radius:var(--border-radius-md); background:var(--bg-tertiary);">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-weight:800; color:var(--accent-gold); width:20px;">#${idx + 1}</span>
                  <span style="font-weight:600; font-size:0.9rem;">${ps.name}</span>
                </div>
                <span class="badge badge-confirmed">${ps.count} bookings</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:16px;">Recent Activity Stream</h3>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${recentActivity.map(act => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-radius:var(--border-radius-md); background:var(--bg-tertiary); font-size:0.85rem;">
                <div>
                  <div style="font-weight:600;">${act.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${act.subtitle} · ${act.time}</div>
                </div>
                <span class="badge badge-${act.status}">${act.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Hook quick actions
    container.querySelector('#dash-btn-new-booking')?.addEventListener('click', () => {
      openBookingModal(() => renderDashboard(container));
    });

    container.querySelector('#dash-btn-walkin')?.addEventListener('click', () => {
      openWalkInModal(() => renderDashboard(container));
    });

    container.querySelector('#dash-btn-call-next')?.addEventListener('click', async () => {
      try {
        const next = await API.post('/api/queue/call-next', {});
        showToast(`Calling next in line: ${next.customerName} (${next.ticketNumber})`, 'success');
        renderDashboard(container);
      } catch (err) {
        showToast(err.message, 'info');
      }
    });

    // Hook status change selects
    container.querySelectorAll('.dash-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.value;
        try {
          await API.patch(`/api/bookings/${id}/status`, { status: newStatus });
          showToast(`Booking updated to ${newStatus}`, 'success');
          renderDashboard(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color:var(--accent-rose);">Failed to load dashboard: ${err.message}</p>
        <button class="btn btn-secondary" onclick="location.reload()" style="margin-top:16px;">Retry</button>
      </div>
    `;
  }
}
