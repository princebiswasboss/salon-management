import { API } from '../api.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderServices(container) {
  let allServices = [];
  let selectedCategory = 'all';

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2>Service Management</h2>
        <p>Configure salon treatments, categories, pricing, and durations</p>
      </div>
      <div class="view-header-actions">
        <button class="btn btn-primary" id="btn-add-service">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Service
        </button>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="services-category-tabs" id="services-tabs"></div>

    <!-- Search Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="service-search-input" placeholder="Search treatments, hair, facial, massage...">
      </div>
    </div>

    <!-- Services Grid -->
    <div class="services-grid" id="services-grid-wrapper">
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        Loading services...
      </div>
    </div>
  `;

  async function loadData() {
    try {
      allServices = await API.getServices();
      renderTabs();
      renderGrid();
    } catch (err) {
      container.querySelector('#services-grid-wrapper').innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p style="color:var(--accent-rose);">Failed to load services: ${err.message}</p>
        </div>
      `;
    }
  }

  function renderTabs() {
    const categories = ['all', ...new Set(allServices.map(s => s.category))];
    const tabsContainer = container.querySelector('#services-tabs');

    tabsContainer.innerHTML = categories.map(cat => `
      <button class="cat-tab-btn ${selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat === 'all' ? 'All Treatments' : cat}
      </button>
    `).join('');

    tabsContainer.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.cat;
        renderTabs();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const query = container.querySelector('#service-search-input').value.toLowerCase().trim();
    const grid = container.querySelector('#services-grid-wrapper');

    const filtered = allServices.filter(s => {
      const matchesCat = selectedCategory === 'all' || s.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesQuery = !query ||
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query));
      return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <p>No services found in this category.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(s => `
      <div class="service-card">
        <div>
          <div class="service-card-top">
            <span class="badge ${s.active ? 'badge-completed' : 'badge-cancelled'}">
              ${s.active ? 'Active' : 'Inactive'}
            </span>
            <div class="service-price">$${s.price}</div>
          </div>
          <div class="service-name">${s.name}</div>
          <div class="service-meta-tags">
            <span class="service-meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${s.durationMinutes} min
            </span>
            <span class="service-meta-chip">${s.category}</span>
          </div>
          <p class="service-desc">${s.description || 'No description provided.'}</p>
        </div>
        
        <div class="service-card-actions">
          <button class="btn btn-outline btn-sm btn-edit-srv" data-id="${s.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn btn-danger btn-sm btn-delete-srv" data-id="${s.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Hook card actions
    grid.querySelectorAll('.btn-edit-srv').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = allServices.find(item => item.id === btn.dataset.id);
        if (s) openServiceModal(loadData, s);
      });
    });

    grid.querySelectorAll('.btn-delete-srv').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this service?')) {
          try {
            await API.delete(`/api/services/${btn.dataset.id}`);
            showToast('Service deleted', 'success');
            loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  container.querySelector('#service-search-input').addEventListener('input', renderGrid);
  container.querySelector('#btn-add-service').addEventListener('click', () => {
    openServiceModal(loadData);
  });

  loadData();
}

/**
 * Add / Edit Service Modal
 */
function openServiceModal(onSuccess, existing = null) {
  const content = `
    <form id="service-modal-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Service Name *</label>
          <input type="text" id="srv-name" class="form-control" value="${existing ? existing.name : ''}" placeholder="e.g. Balayage & Gloss" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <input type="text" id="srv-category" class="form-control" list="cat-suggestions" value="${existing ? existing.category : 'Hair'}" required>
          <datalist id="cat-suggestions">
            <option value="Hair">
            <option value="Facial & Skin">
            <option value="Nails & Spa">
            <option value="Grooming">
            <option value="Bridal & Treatments">
          </datalist>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Price ($ USD) *</label>
          <input type="number" id="srv-price" class="form-control" min="0" step="1" value="${existing ? existing.price : '60'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Duration (Minutes) *</label>
          <input type="number" id="srv-duration" class="form-control" min="5" step="5" value="${existing ? existing.durationMinutes : '45'}" required>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="srv-desc" class="form-control" rows="3" placeholder="Describe the treatment, benefits, products used...">${existing ? (existing.description || '') : ''}</textarea>
      </div>

      <div class="form-group" style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="srv-active" ${!existing || existing.active ? 'checked' : ''} style="width:18px; height:18px;">
        <label for="srv-active" class="form-label" style="margin:0; cursor:pointer;">Active for Bookings</label>
      </div>
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
    <button class="btn btn-primary" id="modal-srv-submit">${existing ? 'Update Service' : 'Create Service'}</button>
  `;

  Modal.open({
    title: existing ? 'Edit Service' : 'Add New Service',
    content,
    footer,
    onOpen: (modalEl) => {
      modalEl.querySelector('#modal-srv-submit').addEventListener('click', async () => {
        const name = modalEl.querySelector('#srv-name').value.trim();
        const category = modalEl.querySelector('#srv-category').value.trim();
        const price = modalEl.querySelector('#srv-price').value;
        const durationMinutes = modalEl.querySelector('#srv-duration').value;
        const description = modalEl.querySelector('#srv-desc').value.trim();
        const active = modalEl.querySelector('#srv-active').checked;

        if (!name || !price || !durationMinutes) {
          showToast('Name, price, and duration are required.', 'error');
          return;
        }

        try {
          if (existing) {
            await API.put(`/api/services/${existing.id}`, {
              name, category, price, durationMinutes, description, active
            });
            showToast('Service updated successfully', 'success');
          } else {
            await API.post('/api/services', {
              name, category, price, durationMinutes, description, active
            });
            showToast('New service added', 'success');
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
