// API Client Module with Auth Integration
export const API = {
  getToken() {
    return localStorage.getItem('salon_auth_token');
  },

  setAuth(token, user) {
    if (token) {
      localStorage.setItem('salon_auth_token', token);
      localStorage.setItem('salon_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('salon_auth_token');
      localStorage.removeItem('salon_auth_user');
    }
  },

  getUser() {
    const raw = localStorage.getItem('salon_auth_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getHeaders(custom = {}) {
    const headers = { 'Content-Type': 'application/json', ...custom };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async get(url) {
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async patch(url, data) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async delete(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  // Auth Endpoints
  async register(name, email, phone, password) {
    const data = await this.post('/api/auth/register', { name, email, phone, password });
    if (data.token) this.setAuth(data.token, data.user);
    return data;
  },

  async login(identifier, password) {
    const data = await this.post('/api/auth/login', { identifier, password });
    if (data.token) this.setAuth(data.token, data.user);
    return data;
  },

  async logout() {
    try {
      await this.post('/api/auth/logout', {});
    } catch {}
    this.setAuth(null, null);
  },

  async getMe() {
    return this.get('/api/auth/me');
  },

  async getMyBookings() {
    return this.get('/api/auth/my-bookings');
  },

  async bookCustomerSlot(bookingData) {
    return this.post('/api/auth/book-slot', bookingData);
  },

  async cancelMyBooking(id) {
    return this.patch(`/api/auth/my-bookings/${id}/cancel`, {});
  },

  // Specialized Endpoints
  getDashboardStats() { return this.get('/api/dashboard/stats'); },
  getServices(query = '') { return this.get(`/api/services${query}`); },
  getStaff(query = '') { return this.get(`/api/staff${query}`); },
  getStaffAvailability(id, date) { return this.get(`/api/staff/${id}/availability?date=${date}`); },
  getCustomers(query = '') { return this.get(`/api/customers${query}`); },
  getCustomerById(id) { return this.get(`/api/customers/${id}`); },
  getBookings(query = '') { return this.get(`/api/bookings${query}`); },
  getQueue(query = '') { return this.get(`/api/queue${query}`); },
  getSettings() { return this.get('/api/settings'); }
};
