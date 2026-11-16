import { API } from '../api.js';
import { showToast } from '../components/toast.js';

export async function renderPortal(container) {
  let step = 1;
  let services = [];
  let staffList = [];
  let selectedService = null;
  let selectedStaff = null;
  let selectedDate = new Date().toISOString().split('T')[0];
  let selectedTime = null;
  let confirmedBooking = null;

  try {
    [services, staffList] = await Promise.all([
      API.getServices({ active: 'true' }),
      API.getStaff({ active: 'true' })
    ]);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Failed to load booking portal: ${err.message}</p></div>`;
    return;
  }

  function render() {
    container.innerHTML = `
      <div class="booking-portal-wrapper">
        <div class="portal-hero">
          <h1>Luxe Haven Salon & Spa</h1>
          <p style="color:var(--text-muted); font-size:1rem;">Book your signature beauty & wellness experience online</p>
        </div>

        <!-- Stepper -->
        <div class="portal-stepper">
          <div class="step-item ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}">1. Service</div>
          <div class="step-divider"></div>
          <div class="step-item ${step === 2 ? 'active' : (step > 2 ? 'completed' : '')}">2. Stylist</div>
          <div class="step-divider"></div>
          <div class="step-item ${step === 3 ? 'active' : (step > 3 ? 'completed' : '')}">3. Time Slot</div>
          <div class="step-divider"></div>
          <div class="step-item ${step === 4 ? 'active' : (step > 4 ? 'completed' : '')}">4. Your Info</div>
        </div>

        <!-- Dynamic Step Container -->
        <div class="portal-step-card" id="step-content"></div>
      </div>
    `;

    const stepEl = container.querySelector('#step-content');

    if (step === 1) renderStep1(stepEl);
    else if (step === 2) renderStep2(stepEl);
    else if (step === 3) renderStep3(stepEl);
    else if (step === 4) renderStep4(stepEl);
    else if (step === 5) renderStep5(stepEl);
  }

  // STEP 1: Select Service
  function renderStep1(el) {
    el.innerHTML = `
      <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">Choose Your Service</h3>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">Select from our premium hair, skin, and spa treatments</p>

      <div class="services-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        ${services.map(s => `
          <div class="service-card" style="cursor:pointer; border:${selectedService && selectedService.id === s.id ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)'};" data-id="${s.id}">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="service-meta-chip">${s.category}</span>
                <span class="service-price">$${s.price}</span>
              </div>
              <div class="service-name">${s.name}</div>
              <p class="service-desc" style="font-size:0.8rem; margin:8px 0;">${s.description || ''}</p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:10px;">
              <span style="font-size:0.75rem; color:var(--text-muted);">Duration: ${s.durationMinutes} min</span>
              <button class="btn btn-primary btn-sm">Select</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedService = services.find(s => s.id === card.dataset.id);
        step = 2;
        render();
      });
    });
  }

  // STEP 2: Choose Stylist
  function renderStep2(el) {
    el.innerHTML = `
      <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">Select a Specialist</h3>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">Selected service: <strong>${selectedService.name}</strong> ($${selectedService.price})</p>

      <div class="staff-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <div class="staff-card" style="cursor:pointer; border:1px dashed var(--accent-gold);" id="pick-any-staff">
          <div style="width:64px; height:64px; border-radius:50%; background:var(--accent-gold-bg); display:flex; align-items:center; justify-content:center; margin-bottom:12px; color:var(--accent-gold);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          </div>
          <h4>Any Available</h4>
          <div class="role-title">Fastest Availability</div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">We'll assign the top available stylist.</p>
          <button class="btn btn-outline btn-sm">Select Any</button>
        </div>

        ${staffList.map(st => `
          <div class="staff-card" style="cursor:pointer; border:${selectedStaff && selectedStaff.id === st.id ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)'};" data-id="${st.id}">
            <div class="staff-avatar-wrapper" style="width:64px; height:64px;">
              <img src="${st.avatar}" alt="${st.name}" class="staff-avatar">
            </div>
            <h4>${st.name}</h4>
            <div class="role-title">${st.role}</div>
            <div class="staff-specialties-box" style="margin-bottom:12px;">
              ${(st.specialties || []).map(sp => `<span class="specialty-badge">${sp}</span>`).join('')}
            </div>
            <button class="btn btn-primary btn-sm">Choose</button>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:24px; display:flex; justify-content:space-between;">
        <button class="btn btn-secondary" id="btn-portal-back">Back</button>
      </div>
    `;

    el.querySelector('#pick-any-staff').addEventListener('click', () => {
      selectedStaff = staffList[0]; // default to first available
      step = 3;
      render();
    });

    el.querySelectorAll('.staff-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        selectedStaff = staffList.find(s => s.id === card.dataset.id);
        step = 3;
        render();
      });
    });

    el.querySelector('#btn-portal-back').addEventListener('click', () => {
      step = 1;
      render();
    });
  }

  // STEP 3: Select Date & Time Slot
  async function renderStep3(el) {
    el.innerHTML = `
      <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">Choose Date & Time</h3>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">Stylist: <strong>${selectedStaff.name}</strong> · Service: <strong>${selectedService.name}</strong></p>

      <div class="form-group" style="max-width:300px;">
        <label class="form-label">Select Date</label>
        <input type="date" id="portal-date-input" class="form-control" value="${selectedDate}" min="${new Date().toISOString().split('T')[0]}">
      </div>

      <div style="margin-top:16px;">
        <label class="form-label">Available Time Slots</label>
        <div id="slots-container" class="slot-picker-grid">
          <div style="grid-column:1/-1; color:var(--text-muted); font-size:0.85rem;">Checking availability...</div>
        </div>
      </div>

      <div style="margin-top:28px; display:flex; justify-content:space-between;">
        <button class="btn btn-secondary" id="btn-portal-back-step2">Back</button>
        <button class="btn btn-primary" id="btn-portal-next-step4" ${!selectedTime ? 'disabled' : ''}>Continue to Contact Info</button>
      </div>
    `;

    const dateInput = el.querySelector('#portal-date-input');
    const slotsEl = el.querySelector('#slots-container');

    async function loadSlots() {
      slotsEl.innerHTML = `<div style="grid-column:1/-1; color:var(--text-muted); font-size:0.85rem;">Checking availability...</div>`;
      try {
        const availability = await API.getStaffAvailability(selectedStaff.id, selectedDate);
        const booked = (availability.bookedSlots || []).map(b => b.time);

        const possibleSlots = [
          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
          '16:00', '16:30', '17:00', '17:30', '18:00'
        ];

        slotsEl.innerHTML = possibleSlots.map(time => {
          const isTaken = booked.includes(time);
          const isSelected = selectedTime === time;
          return `
            <button class="time-slot-btn ${isSelected ? 'selected' : ''}" data-time="${time}" ${isTaken ? 'disabled' : ''}>
              ${time}
            </button>
          `;
        }).join('');

        slotsEl.querySelectorAll('.time-slot-btn:not(:disabled)').forEach(btn => {
          btn.addEventListener('click', () => {
            selectedTime = btn.dataset.time;
            loadSlots();
            const nextBtn = el.querySelector('#btn-portal-next-step4');
            if (nextBtn) nextBtn.disabled = false;
          });
        });
      } catch (err) {
        slotsEl.innerHTML = `<div style="grid-column:1/-1; color:var(--accent-rose);">Could not load slots: ${err.message}</div>`;
      }
    }

    dateInput.addEventListener('change', (e) => {
      selectedDate = e.target.value;
      selectedTime = null;
      loadSlots();
    });

    el.querySelector('#btn-portal-back-step2').addEventListener('click', () => {
      step = 2;
      render();
    });

    el.querySelector('#btn-portal-next-step4').addEventListener('click', () => {
      if (selectedTime) {
        step = 4;
        render();
      }
    });

    loadSlots();
  }

  // STEP 4: Customer Details & Confirmation Form
  function renderStep4(el) {
    const currentUser = API.getUser();

    el.innerHTML = `
      <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:8px;">Your Contact Details</h3>
      <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:20px;">We'll send your booking confirmation & reminder</p>

      ${currentUser ? `
        <div style="background:var(--accent-emerald-bg); border:1px solid rgba(16,185,129,0.3); border-radius:var(--border-radius-md); padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between;">
          <div style="font-size:0.85rem;">
            <strong style="color:var(--accent-emerald);">Logged In:</strong> ${currentUser.name} (${currentUser.phone})
          </div>
          <span class="badge badge-completed">${currentUser.role}</span>
        </div>
      ` : `
        <div style="background:var(--bg-tertiary); border:1px dashed var(--border-color); border-radius:var(--border-radius-md); padding:10px 14px; margin-bottom:16px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
          <span>Have an account? Log in for fast booking</span>
          <button type="button" class="btn btn-outline btn-sm" id="btn-portal-login">Log In / Register</button>
        </div>
      `}

      <div style="background:var(--bg-tertiary); padding:16px; border-radius:var(--border-radius-md); margin-bottom:20px; font-size:0.875rem; border-left:4px solid var(--accent-gold);">
        <div><strong>Service:</strong> ${selectedService.name} ($${selectedService.price} - ${selectedService.durationMinutes} min)</div>
        <div><strong>Stylist:</strong> ${selectedStaff.name} (${selectedStaff.role})</div>
        <div><strong>Appointment Date & Time:</strong> ${selectedDate} at ${selectedTime}</div>
      </div>

      <form id="portal-contact-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="portal-c-name" class="form-control" value="${currentUser ? currentUser.name : ''}" placeholder="Your full name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number *</label>
            <input type="tel" id="portal-c-phone" class="form-control" value="${currentUser ? currentUser.phone : ''}" placeholder="+1 (555) 000-0000" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email Address (Optional)</label>
          <input type="email" id="portal-c-email" class="form-control" value="${currentUser && currentUser.email ? currentUser.email : ''}" placeholder="name@example.com">
        </div>

        <div class="form-group">
          <label class="form-label">Special Requests / Notes</label>
          <textarea id="portal-c-notes" class="form-control" rows="2" placeholder="Let your stylist know about hair history, sensitivity, or preferences..."></textarea>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:space-between;">
          <button type="button" class="btn btn-secondary" id="btn-portal-back-step3">Back</button>
          <button type="submit" class="btn btn-primary" id="btn-portal-submit-booking">Book Appointment</button>
        </div>
      </form>
    `;

    el.querySelector('#btn-portal-login')?.addEventListener('click', () => {
      import('../components/authModal.js').then(({ openAuthModal }) => {
        openAuthModal('login', () => renderStep4(el));
      });
    });

    el.querySelector('#btn-portal-back-step3').addEventListener('click', () => {
      step = 3;
      render();
    });

    el.querySelector('#portal-contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = el.querySelector('#portal-c-name').value.trim();
      const phone = el.querySelector('#portal-c-phone').value.trim();
      const email = el.querySelector('#portal-c-email').value.trim();
      const notes = el.querySelector('#portal-c-notes').value.trim();

      if (!name || !phone) {
        showToast('Name and phone are required.', 'error');
        return;
      }

      const submitBtn = el.querySelector('#btn-portal-submit-booking');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Securing Appointment...';

      try {
        if (currentUser) {
          confirmedBooking = await API.bookCustomerSlot({
            serviceId: selectedService.id,
            staffId: selectedStaff.id,
            date: selectedDate,
            time: selectedTime,
            notes
          });
        } else {
          confirmedBooking = await API.post('/api/bookings', {
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            serviceId: selectedService.id,
            staffId: selectedStaff.id,
            date: selectedDate,
            time: selectedTime,
            notes
          });
        }

        step = 5;
        render();
        showToast('Appointment successfully confirmed!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
      }
    });
  }

  // STEP 5: Success Confirmation
  function renderStep5(el) {
    el.innerHTML = `
      <div style="text-align:center; padding:20px 0;">
        <div style="width:72px; height:72px; border-radius:50%; background:var(--accent-emerald-bg); color:var(--accent-emerald); display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        <h2 style="font-size:1.8rem; font-weight:800; margin-bottom:8px;">Booking Confirmed!</h2>
        <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;">We look forward to welcoming you to Luxe Haven Salon & Spa.</p>

        <div style="background:var(--bg-tertiary); padding:20px; border-radius:var(--border-radius-lg); text-align:left; max-width:440px; margin:0 auto 28px; border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--text-muted);">Appointment ID:</span>
            <span style="font-weight:700; color:var(--accent-gold);">${confirmedBooking ? confirmedBooking.id : 'BKG-01'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--text-muted);">Client:</span>
            <span style="font-weight:600;">${confirmedBooking ? confirmedBooking.customerName : ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--text-muted);">Service:</span>
            <span style="font-weight:600;">${confirmedBooking ? confirmedBooking.serviceName : ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--text-muted);">Stylist:</span>
            <span style="font-weight:600;">${confirmedBooking ? confirmedBooking.staffName : ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <span style="color:var(--text-muted);">Date & Time:</span>
            <span style="font-weight:700; color:var(--text-primary);">${confirmedBooking ? confirmedBooking.date : ''} at ${confirmedBooking ? confirmedBooking.time : ''}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid var(--border-color);">
            <span style="color:var(--text-muted);">Total:</span>
            <span style="font-size:1.1rem; font-weight:800; color:var(--accent-gold);">$${confirmedBooking ? confirmedBooking.price : ''}</span>
          </div>
        </div>

        <button class="btn btn-primary" id="btn-book-another">Book Another Appointment</button>
      </div>
    `;

    el.querySelector('#btn-book-another').addEventListener('click', () => {
      step = 1;
      selectedService = null;
      selectedStaff = null;
      selectedTime = null;
      confirmedBooking = null;
      render();
    });
  }

  render();
}
