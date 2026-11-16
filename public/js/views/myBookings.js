import { API } from '../api.js';
import { openAuthModal } from '../components/authModal.js';
import { showToast } from '../components/toast.js';

export async function renderMyBookings(container) {
  const user = API.getUser();

  if (!user) {
    container.innerHTML = `
      <div class="empty-state" style="max-width:480px; margin:40px auto; background:var(--bg-secondary); padding:40px 24px; border-radius:var(--border-radius-xl); border:1px solid var(--border-color);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">Customer Sign-In Required</h3>
        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">Please log in or register to view your booked appointments and manage your salon visits.</p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <button class="btn btn-secondary" id="btn-guest-login">Log In</button>
          <button class="btn btn-primary" id="btn-guest-register">Register as Customer</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-guest-login').addEventListener('click', () => {
      openAuthModal('login', () => renderMyBookings(container));
    });

    container.querySelector('#btn-guest-register').addEventListener('click', () => {
      openAuthModal('register', () => renderMyBookings(container));
    });
    return;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>My Salon Appointments</h2>
        <p>Welcome back, <strong>${user.name}</strong> (${user.phone})</p>
      </div>
      <div class="view-header-actions">
        <a href="#portal" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Book New Slot
        </a>
      </div>
    </div>

    ${user.role === 'admin' ? `
      <div style="background:var(--accent-indigo-bg); border:1px solid rgba(99,102,241,0.3); border-radius:var(--border-radius-lg); padding:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--accent-indigo);">Logged in as Administrator</strong>
          <div style="font-size:0.8rem; color:var(--text-muted);">You can manage and approve all customer appointments from the Admin Console.</div>
        </div>
        <a href="#bookings" class="btn btn-secondary btn-sm">Go to Admin Bookings</a>
      </div>
    ` : ''}

    <div id="my-bookings-content">
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        Loading your appointments...
      </div>
    </div>
  `;

  async function loadBookings() {
    try {
      const myBookings = await API.getMyBookings();
      const contentEl = container.querySelector('#my-bookings-content');

      const today = new Date().toISOString().split('T')[0];
      const upcoming = myBookings.filter(b => b.date >= today && b.status !== 'cancelled');
      const past = myBookings.filter(b => b.date < today || b.status === 'cancelled');

      if (myBookings.length === 0) {
        contentEl.innerHTML = `
          <div class="card" style="text-align:center; padding:48px 24px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent-gold); margin-bottom:12px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:6px;">No Appointments Yet</h3>
            <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">You haven't booked any salon appointments under this account yet.</p>
            <a href="#portal" class="btn btn-primary">Book Your First Treatment</a>
          </div>
        `;
        return;
      }

      contentEl.innerHTML = `
        <!-- Upcoming Appointments -->
        <div class="card" style="margin-bottom:24px;">
          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span style="width:8px; height:8px; border-radius:50%; background:var(--accent-emerald);"></span>
            Upcoming Appointments (${upcoming.length})
          </h3>

          ${upcoming.length === 0 ? `
            <p style="color:var(--text-muted); font-size:0.85rem;">You have no upcoming appointments scheduled.</p>
          ` : `
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${upcoming.map(b => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-radius:var(--border-radius-md); background:var(--bg-tertiary); border:1px solid var(--border-color); flex-wrap:wrap; gap:12px;">
                  <div>
                    <div style="font-weight:700; font-size:1.05rem;">${b.serviceName}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px;">
                      With <strong>${b.staffName}</strong> · ${b.durationMinutes} minutes · <span style="font-weight:700; color:var(--accent-gold);">$${b.price}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-primary); margin-top:4px; font-weight:600;">
                      📅 ${b.date} at ⏰ ${b.time}
                    </div>
                    ${b.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; font-style:italic;">Notes: ${b.notes}</div>` : ''}
                  </div>

                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge badge-${b.status}">${b.status}</span>
                    ${b.status !== 'completed' && b.status !== 'cancelled' ? `
                      <button class="btn btn-danger btn-sm btn-cancel-booking" data-id="${b.id}">Cancel Booking</button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Past / Cancelled History -->
        <div class="card">
          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:16px;">Past & Cancelled Appointments (${past.length})</h3>
          ${past.length === 0 ? `
            <p style="color:var(--text-muted); font-size:0.85rem;">No past appointment history.</p>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Service</th>
                    <th>Stylist</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${past.map(b => `
                    <tr>
                      <td style="font-weight:600;">${b.date} ${b.time}</td>
                      <td>${b.serviceName}</td>
                      <td>${b.staffName}</td>
                      <td style="font-weight:700;">$${b.price}</td>
                      <td><span class="badge badge-${b.status}">${b.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

      // Cancel handlers
      contentEl.querySelectorAll('.btn-cancel-booking').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to cancel this appointment?')) {
            try {
              await API.cancelMyBooking(btn.dataset.id);
              showToast('Appointment successfully cancelled.', 'info');
              loadBookings();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      container.querySelector('#my-bookings-content').innerHTML = `
        <div class="empty-state">
          <p style="color:var(--accent-rose);">Failed to load appointments: ${err.message}</p>
        </div>
      `;
    }
  }

  loadBookings();
}
