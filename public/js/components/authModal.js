import { API } from '../api.js';
import { Modal } from './modal.js';
import { showToast } from './toast.js';

export function openAuthModal(defaultTab = 'login', onSuccess = null) {
  let activeTab = defaultTab;

  function getModalContent() {
    return `
      <div>
        <!-- Tabs -->
        <div style="display:flex; border-bottom:1px solid var(--border-color); margin-bottom:20px;">
          <button type="button" class="btn btn-outline" id="auth-tab-login" style="flex:1; border-radius:0; border:none; border-bottom:2px solid ${activeTab === 'login' ? 'var(--accent-gold)' : 'transparent'}; font-weight:700; color:${activeTab === 'login' ? 'var(--accent-gold)' : 'var(--text-muted)'};">
            Log In
          </button>
          <button type="button" class="btn btn-outline" id="auth-tab-register" style="flex:1; border-radius:0; border:none; border-bottom:2px solid ${activeTab === 'register' ? 'var(--accent-gold)' : 'transparent'}; font-weight:700; color:${activeTab === 'register' ? 'var(--accent-gold)' : 'var(--text-muted)'};">
            Customer Register
          </button>
        </div>

        ${activeTab === 'login' ? `
          <!-- Login Form -->
          <form id="auth-login-form">
            <div class="form-group">
              <label class="form-label">Email or Phone Number</label>
              <input type="text" id="login-identifier" class="form-control" placeholder="client@example.com or phone" required>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
            </div>

            <div style="background:var(--bg-tertiary); padding:12px; border-radius:var(--border-radius-md); margin-bottom:18px; font-size:0.775rem; color:var(--text-muted);">
              <div style="font-weight:600; margin-bottom:4px; color:var(--text-primary);">Demo Quick Login:</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                <button type="button" class="btn btn-outline btn-sm" id="btn-demo-admin" style="font-size:0.75rem; padding:3px 8px;">Admin: admin@luxehaven.com</button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-demo-cust" style="font-size:0.75rem; padding:3px 8px;">Customer: clara.h@example.com</button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" id="btn-submit-login" style="width:100%;">
              Log In to My Account
            </button>
          </form>
        ` : `
          <!-- Register Form -->
          <form id="auth-register-form">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="reg-name" class="form-control" placeholder="Sophia Miller" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="reg-email" class="form-control" placeholder="sophia@example.com" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="reg-phone" class="form-control" placeholder="+1 (555) 000-0000" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Create Password * (min 6 chars)</label>
              <input type="password" id="reg-password" class="form-control" placeholder="••••••••" minlength="6" required>
            </div>

            <button type="submit" class="btn btn-primary" id="btn-submit-reg" style="width:100%; margin-top:8px;">
              Create Customer Account
            </button>
          </form>
        `}
      </div>
    `;
  }

  function bindEvents(modalEl) {
    // Switch tabs
    modalEl.querySelector('#auth-tab-login')?.addEventListener('click', () => {
      activeTab = 'login';
      renderContent();
    });

    modalEl.querySelector('#auth-tab-register')?.addEventListener('click', () => {
      activeTab = 'register';
      renderContent();
    });

    // Demo buttons
    modalEl.querySelector('#btn-demo-admin')?.addEventListener('click', () => {
      modalEl.querySelector('#login-identifier').value = 'admin@luxehaven.com';
      modalEl.querySelector('#login-password').value = 'admin123';
    });

    modalEl.querySelector('#btn-demo-cust')?.addEventListener('click', () => {
      modalEl.querySelector('#login-identifier').value = 'clara.h@example.com';
      modalEl.querySelector('#login-password').value = 'password123';
    });

    // Login Submission
    modalEl.querySelector('#auth-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = modalEl.querySelector('#login-identifier').value.trim();
      const password = modalEl.querySelector('#login-password').value;

      const submitBtn = modalEl.querySelector('#btn-submit-login');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      try {
        const res = await API.login(identifier, password);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        Modal.close();
        if (onSuccess) onSuccess(res.user);
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: res.user }));
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In to My Account';
      }
    });

    // Register Submission
    modalEl.querySelector('#auth-register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = modalEl.querySelector('#reg-name').value.trim();
      const email = modalEl.querySelector('#reg-email').value.trim();
      const phone = modalEl.querySelector('#reg-phone').value.trim();
      const password = modalEl.querySelector('#reg-password').value;

      const submitBtn = modalEl.querySelector('#btn-submit-reg');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await API.register(name, email, phone, password);
        showToast(`Registration complete! Welcome, ${res.user.name}.`, 'success');
        Modal.close();
        if (onSuccess) onSuccess(res.user);
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: res.user }));
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Customer Account';
      }
    });
  }

  function renderContent() {
    const modalEl = document.getElementById('global-modal');
    if (modalEl) {
      const body = modalEl.querySelector('#global-modal-body');
      body.innerHTML = getModalContent();
      bindEvents(modalEl);
    }
  }

  Modal.open({
    title: 'Customer & Admin Account Access',
    content: getModalContent(),
    footer: null,
    onOpen: (modalEl) => {
      bindEvents(modalEl);
    }
  });
}
