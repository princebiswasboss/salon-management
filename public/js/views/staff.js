import { API } from '../api.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderStaff(container) {
  let allStaff = [];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>Staff Management</h2>
        <p>Manage stylists, aestheticians, working days, and shift schedules</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-add-staff">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Stylist
        </button>
      </div>
    </div>

    <!-- Staff Grid -->
    <div class="staff-grid" id="staff-grid-wrapper">
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        Loading team members...
      </div>
    </div>
  `;

  async function loadData() {
    try {
      allStaff = await API.getStaff();
      renderGrid();
    } catch (err) {
      container.querySelector('#staff-grid-wrapper').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p style="color:var(--accent-rose);">Failed to load staff: ${err.message}</p>
        </div>
      `;
    }
  }

  function renderGrid() {
    const grid = container.querySelector('#staff-grid-wrapper');

    if (allStaff.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p>No stylists registered yet.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = allStaff.map(st => `
      <div class="staff-card">
        <div class="staff-avatar-wrapper">
          <img src="${st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}" alt="${st.name}" class="staff-avatar">
          <span class="staff-status-dot" style="background:${st.active ? 'var(--accent-emerald)' : 'var(--accent-rose)'};" title="${st.active ? 'Active' : 'Off Duty'}"></span>
        </div>
        <h4>${st.name}</h4>
        <div class="role-title">${st.role}</div>

        <div class="staff-specialties-box">
          ${(st.specialties || []).map(sp => `<span class="specialty-badge">${sp}</span>`).join('')}
        </div>

        <div class="staff-schedule-info">
          <div><strong>Hours:</strong> ${st.workingHours ? `${st.workingHours.start} - ${st.workingHours.end}` : '09:00 - 18:00'}</div>
          <div><strong>Days:</strong> ${(st.workingDays || []).join(', ')}</div>
          <div style="margin-top:4px;"><strong>Contact:</strong> ${st.phone || '--'}</div>
        </div>

        <div class="staff-card-actions">
          <button class="btn btn-secondary btn-sm btn-view-schedule" data-id="${st.id}">Schedule</button>
          <button class="btn btn-outline btn-sm btn-edit-staff" data-id="${st.id}">Edit</button>
          <button class="btn btn-danger btn-sm btn-delete-staff" data-id="${st.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Hook card action buttons
    grid.querySelectorAll('.btn-edit-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const member = allStaff.find(s => s.id === btn.dataset.id);
        if (member) openStaffModal(loadData, member);
      });
    });

    grid.querySelectorAll('.btn-view-schedule').forEach(btn => {
      btn.addEventListener('click', () => {
        const member = allStaff.find(s => s.id === btn.dataset.id);
        if (member) openScheduleModal(member);
      });
    });

    grid.querySelectorAll('.btn-delete-staff').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this staff member?')) {
          try {
            await API.delete(`/api/staff/${btn.dataset.id}`);
            showToast('Staff member deleted', 'success');
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  container.querySelector('#btn-add-staff').addEventListener('click', () => {
    openStaffModal(loadData);
  });

  loadData();
}

/**
 * Add / Edit Staff Modal
 */
function openStaffModal(onSuccess, existing = null) {
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const existingDays = existing && existing.workingDays ? existing.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const startHour = existing && existing.workingHours ? existing.workingHours.start : "09:00";
  const endHour = existing && existing.workingHours ? existing.workingHours.end : "18:00";

  const content = `
    <form id="staff-modal-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="stf-name" class="form-control" value="${existing ? existing.name : ''}" placeholder="Stylist name" required>
        </div>
        <div class="form-group">
          <label class="form-label">Role / Title *</label>
          <input type="text" id="stf-role" class="form-control" value="${existing ? existing.role : 'Senior Stylist'}" placeholder="e.g. Master Colorist" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone *</label>
          <input type="tel" id="stf-phone" class="form-control" value="${existing ? existing.phone : ''}" placeholder="+1 (555) 000-0000" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="stf-email" class="form-control" value="${existing ? (existing.email || '') : ''}" placeholder="staff@luxehaven.com">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Avatar Photo URL</label>
        <input type="url" id="stf-avatar" class="form-control" value="${existing ? (existing.avatar || '') : ''}" placeholder="https://images.unsplash.com/...">
      </div>

      <div class="form-group">
        <label class="form-label">Specialties (comma-separated)</label>
        <input type="text" id="stf-specialties" class="form-control" value="${existing && existing.specialties ? existing.specialties.join(', ') : 'Hair, Color'}" placeholder="Hair, Facial, Nails, Grooming">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Shift Start Time</label>
          <input type="time" id="stf-time-start" class="form-control" value="${startHour}">
        </div>
        <div class="form-group">
          <label class="form-label">Shift End Time</label>
          <input type="time" id="stf-time-end" class="form-control" value="${endHour}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Working Days</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${allDays.map(d => `
            <label style="display:flex; align-items:center; gap:4px; font-size:0.8rem; background:var(--bg-tertiary); padding:4px 8px; border-radius:var(--border-radius-sm); cursor:pointer;">
              <input type="checkbox" name="workingDays" value="${d}" ${existingDays.includes(d) ? 'checked' : ''}>
              ${d.slice(0, 3)}
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-group" style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="stf-active" ${!existing || existing.active ? 'checked' : ''} style="width:18px; height:18px;">
        <label for="stf-active" class="form-label" style="margin:0; cursor:pointer;">Active / On Duty</label>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-stf-submit">${existing ? 'Save Stylist' : 'Add Stylist'}</button>
  `;

  Modal.open({
    title: existing ? 'Edit Stylist Profile' : 'Add New Stylist',
    content,
    footer,
    onOpen: (modalEl) => {
      modalEl.querySelector('#modal-stf-submit').addEventListener('click', async () => {
        const name = modalEl.querySelector('#stf-name').value.trim();
        const role = modalEl.querySelector('#stf-role').value.trim();
        const phone = modalEl.querySelector('#stf-phone').value.trim();
        const email = modalEl.querySelector('#stf-email').value.trim();
        const avatar = modalEl.querySelector('#stf-avatar').value.trim();
        const specsRaw = modalEl.querySelector('#stf-specialties').value;
        const specialties = specsRaw.split(',').map(s => s.trim()).filter(Boolean);
        const startTime = modalEl.querySelector('#stf-time-start').value;
        const endTime = modalEl.querySelector('#stf-time-end').value;
        const active = modalEl.querySelector('#stf-active').checked;

        const workingDays = Array.from(modalEl.querySelectorAll('input[name="workingDays"]:checked')).map(cb => cb.value);

        if (!name || !role) {
          showToast('Name and role are required.', 'error');
          return;
        }

        try {
          const payload = {
            name,
            role,
            phone,
            email,
            avatar,
            specialties,
            workingDays,
            workingHours: { start: startTime, end: endTime },
            active
          };

          if (existing) {
            await API.put(`/api/staff/${existing.id}`, payload);
            showToast('Stylist profile updated', 'success');
          } else {
            await API.post('/api/staff', payload);
            showToast('New stylist added', 'success');
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
 * View Stylist Schedule Modal
 */
async function openScheduleModal(staffMember) {
  const today = new Date().toISOString().split('T')[0];
  const availability = await API.getStaffAvailability(staffMember.id, today);

  const content = `
    <div style="margin-bottom:16px;">
      <h4 style="font-size:1.1rem; font-weight:700;">${staffMember.name}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted);">${staffMember.role} · Shift: ${availability.workingHours.start} - ${availability.workingHours.end}</p>
    </div>

    <div style="background:var(--bg-tertiary); padding:12px; border-radius:var(--border-radius-md); margin-bottom:16px;">
      <strong>Schedule for Today (${today} - ${availability.dayName}):</strong>
      <div style="font-size:0.85rem; color:${availability.worksOnDay ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight:600; margin-top:4px;">
        ${availability.worksOnDay ? '✓ Scheduled on duty today' : '✕ Off duty today'}
      </div>
    </div>

    <h5 style="font-size:0.95rem; font-weight:700; margin-bottom:10px;">Booked Appointments Today:</h5>
    ${availability.bookedSlots.length === 0 ? `
      <p style="font-size:0.85rem; color:var(--text-muted);">No appointments booked for today yet.</p>
    ` : `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${availability.bookedSlots.map(slot => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-radius:var(--border-radius-sm); background:var(--bg-secondary); border:1px solid var(--border-color);">
            <div>
              <div style="font-weight:700; color:var(--accent-gold); font-size:0.9rem;">${slot.time} (${slot.durationMinutes} min)</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">${slot.customerName}</div>
            </div>
            <span class="badge badge-${slot.status}">${slot.status}</span>
          </div>
        `).join('')}
      </div>
    `}
  `;

  Modal.open({
    title: 'Stylist Daily Schedule',
    content,
    footer: `<button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Close</button>`
  });
}
