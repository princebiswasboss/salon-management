import { API } from './api.js';
import { renderDashboard } from './views/dashboard.js';
import { renderBookings } from './views/bookings.js';
import { renderQueue } from './views/queue.js';
import { renderServices } from './views/services.js';
import { renderStaff } from './views/staff.js';
import { renderCustomers } from './views/customers.js';
import { renderPortal } from './views/portal.js';
import { renderMyBookings } from './views/myBookings.js';
import { openAuthModal } from './components/authModal.js';
import { showToast } from './components/toast.js';

class SalonApp {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('salon_theme') || 'dark';
    this.user = API.getUser();
    this.initTheme();
    this.initElements();
    this.initEventListeners();
    this.updateAuthUI();
    this.handleRoute();
    this.updateBadges();
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('salon_theme', this.theme);
    this.updateThemeButton();
  }

  updateThemeButton() {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;
    const isDark = this.theme === 'dark';
    btn.innerHTML = isDark
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.title = `Switch to ${isDark ? 'Light' : 'Dark'} Mode`;
  }

  initElements() {
    this.sidebar = document.getElementById('app-sidebar');
    this.contentBody = document.getElementById('main-content');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.headerAuth = document.getElementById('header-auth-container');
    this.updateThemeButton();
  }

  initEventListeners() {
    // Theme toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Mobile sidebar toggle
    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    // Close mobile sidebar when clicking on main content
    document.getElementById('app-main')?.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && this.sidebar.classList.contains('open') && !e.target.closest('#btn-mobile-menu')) {
        this.sidebar.classList.remove('open');
      }
    });

    // Nav clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;
        window.location.hash = targetView;
        if (window.innerWidth <= 768) {
          this.sidebar.classList.remove('open');
        }
      });
    });

    // Sidebar footer auth button
    document.getElementById('btn-sidebar-auth-action')?.addEventListener('click', () => {
      if (this.user) {
        this.logout();
      } else {
        openAuthModal('login', (u) => {
          this.user = u;
          this.updateAuthUI();
          this.handleRoute();
        });
      }
    });

    // Custom auth changed event listener
    window.addEventListener('auth-changed', (e) => {
      this.user = e.detail;
      this.updateAuthUI();
      this.handleRoute();
    });

    // Hash change handler
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  async logout() {
    await API.logout();
    this.user = null;
    showToast('Logged out successfully', 'info');
    this.updateAuthUI();
    window.location.hash = 'dashboard';
  }

  updateAuthUI() {
    this.user = API.getUser();
    const sideName = document.getElementById('sidebar-auth-user-name');
    const sideRole = document.getElementById('sidebar-auth-user-role');
    const sideBtn = document.getElementById('btn-sidebar-auth-action');
    const sideSubtitle = document.getElementById('sidebar-role-subtitle');

    if (this.user) {
      if (sideName) sideName.textContent = this.user.name;
      if (sideRole) sideRole.textContent = this.user.role === 'admin' ? 'Administrator' : 'Customer Account';
      if (sideBtn) sideBtn.textContent = 'Log Out';
      if (sideSubtitle) sideSubtitle.textContent = this.user.role === 'admin' ? 'Admin Management' : 'Customer Portal';

      if (this.headerAuth) {
        this.headerAuth.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-size:0.85rem; text-align:right;">
              <div style="font-weight:700;">${this.user.name}</div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:capitalize;">${this.user.role}</div>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-header-logout" title="Log Out">Log Out</button>
          </div>
        `;
        this.headerAuth.querySelector('#btn-header-logout').addEventListener('click', () => this.logout());
      }
    } else {
      if (sideName) sideName.textContent = 'Guest Customer';
      if (sideRole) sideRole.textContent = 'Not signed in';
      if (sideBtn) sideBtn.textContent = 'Login';
      if (sideSubtitle) sideSubtitle.textContent = 'Salon & Spa';

      if (this.headerAuth) {
        this.headerAuth.innerHTML = `
          <button class="btn btn-outline btn-sm" id="btn-header-login">Customer Login</button>
          <button class="btn btn-primary btn-sm" id="btn-header-register">Register</button>
        `;
        this.headerAuth.querySelector('#btn-header-login').addEventListener('click', () => {
          openAuthModal('login', (u) => {
            this.user = u;
            this.updateAuthUI();
            this.handleRoute();
          });
        });
        this.headerAuth.querySelector('#btn-header-register').addEventListener('click', () => {
          openAuthModal('register', (u) => {
            this.user = u;
            this.updateAuthUI();
            this.handleRoute();
          });
        });
      }
    }
  }

  async updateBadges() {
    try {
      const queue = await API.getQueue();
      const waiting = queue.filter(q => q.status === 'waiting' || q.status === 'in-service');
      const badge = document.getElementById('sidebar-queue-badge');
      if (badge) {
        badge.textContent = waiting.length;
        badge.style.display = waiting.length > 0 ? 'inline-block' : 'none';
      }
    } catch {
      // ignore silently
    }
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.currentView = hash;

    // Update active nav state
    this.navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.view === hash);
    });

    // Update header title
    const titleEl = document.getElementById('header-view-title');
    const descEl = document.getElementById('header-view-desc');
    const viewMeta = {
      dashboard: { title: 'Dashboard', desc: 'Salon key metrics, bookings & queue status' },
      bookings: { title: 'Bookings (Admin)', desc: 'Manage, approve, reschedule & cancel customer appointments' },
      queue: { title: 'Walk-in Queue', desc: 'Live line management & wait times' },
      services: { title: 'Services Catalog', desc: 'Treatment catalog, pricing & durations' },
      staff: { title: 'Team & Stylists', desc: 'Specialists, schedules & active duty' },
      customers: { title: 'Client Directory (Admin)', desc: 'Customer accounts, visit histories & notes' },
      portal: { title: 'Book a Slot', desc: 'Customer self-service reservation wizard' },
      'my-bookings': { title: 'My Appointments', desc: 'Your booked salon visits & appointment status' }
    };

    if (titleEl && viewMeta[hash]) titleEl.textContent = viewMeta[hash].title;
    if (descEl && viewMeta[hash]) descEl.textContent = viewMeta[hash].desc;

    // Render corresponding view
    switch (hash) {
      case 'dashboard':
        renderDashboard(this.contentBody);
        break;
      case 'bookings':
        renderBookings(this.contentBody);
        break;
      case 'queue':
        renderQueue(this.contentBody);
        break;
      case 'services':
        renderServices(this.contentBody);
        break;
      case 'staff':
        renderStaff(this.contentBody);
        break;
      case 'customers':
        renderCustomers(this.contentBody);
        break;
      case 'portal':
        renderPortal(this.contentBody);
        break;
      case 'my-bookings':
        renderMyBookings(this.contentBody);
        break;
      default:
        renderDashboard(this.contentBody);
        break;
    }

    this.updateBadges();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SalonApp();
});
