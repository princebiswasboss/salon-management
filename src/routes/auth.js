import { Router } from 'express';
import crypto from 'node:crypto';
import { getCollection, findById, insert, update } from '../db/jsonStore.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';

const router = Router();

// In-memory token storage (token -> session data)
const activeSessions = new Map();

// Helper to convert time "HH:mm" to minutes
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Authentication Middleware helper
export function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return activeSessions.get(token) || null;
}

// POST /api/auth/register - Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone number, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check if customer already exists by email or phone
    const customers = await getCollection('customers');
    const existing = customers.find(c =>
      (c.email && c.email.toLowerCase() === cleanEmail) ||
      (c.phone && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))
    );

    if (existing && existing.passwordHash) {
      return res.status(409).json({ error: 'An account with this email or phone number already exists. Please log in.' });
    }

    const { hash, salt } = hashPassword(password);

    let customerRecord;
    if (existing && !existing.passwordHash) {
      // Upgraded existing walk-in / guest customer record with a password
      customerRecord = await update('customers', existing.id, {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'customer'
      });
    } else {
      // Create new customer
      customerRecord = await insert('customers', {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'customer',
        notes: 'Self-registered customer account.',
        totalVisits: 0,
        totalSpend: 0
      });
    }

    // Generate Session Token
    const token = crypto.randomUUID();
    const sessionUser = {
      id: customerRecord.id,
      name: customerRecord.name,
      email: customerRecord.email,
      phone: customerRecord.phone,
      role: 'customer'
    };

    activeSessions.set(token, sessionUser);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: sessionUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// POST /api/auth/login - Customer & Admin Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();

    // 1. Check if Admin credentials
    // Default Admin: admin@luxehaven.com / admin123
    if ((cleanId === 'admin@luxehaven.com' || cleanId === 'admin') && password === 'admin123') {
      const token = crypto.randomUUID();
      const adminUser = {
        id: 'admin-1',
        name: 'Salon Administrator',
        email: 'admin@luxehaven.com',
        phone: '+1 (555) 777-LUXE',
        role: 'admin'
      };

      activeSessions.set(token, adminUser);
      return res.json({
        message: 'Admin login successful',
        token,
        user: adminUser
      });
    }

    // 2. Check Customer in database
    const customers = await getCollection('customers');
    const customer = customers.find(c =>
      (c.email && c.email.toLowerCase() === cleanId) ||
      (c.phone && c.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, ''))
    );

    if (!customer) {
      return res.status(401).json({ error: 'Account not found. Please register first.' });
    }

    // Check password
    if (customer.passwordHash && customer.passwordSalt) {
      const isValid = verifyPassword(password, customer.passwordHash, customer.passwordSalt);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }
    } else {
      // Default demo password for pre-seeded clients without explicit hashes
      if (password !== 'password123') {
        return res.status(401).json({ error: 'Invalid password. Default demo password is password123.' });
      }
    }

    // Generate Session Token
    const token = crypto.randomUUID();
    const sessionUser = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: 'customer'
    };

    activeSessions.set(token, sessionUser);

    res.json({
      message: 'Login successful',
      token,
      user: sessionUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET /api/auth/me - Check current session
router.get('/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

// POST /api/auth/logout - End session
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/my-bookings - Get authenticated customer's own bookings
router.get('/my-bookings', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to view your bookings.' });
    }

    const bookings = await getCollection('bookings');
    const myBookings = bookings.filter(b =>
      b.customerId === user.id ||
      (b.customerPhone && b.customerPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')) ||
      (b.customerEmail && user.email && b.customerEmail.toLowerCase() === user.email.toLowerCase())
    );

    // Sort newest to oldest
    myBookings.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    res.json(myBookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve your bookings', details: err.message });
  }
});

// POST /api/auth/book-slot - Authenticated customer books a slot
router.post('/book-slot', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to book a slot.' });
    }

    const { serviceId, staffId, date, time, notes } = req.body;

    if (!serviceId || !staffId || !date || !time) {
      return res.status(400).json({ error: 'Service, stylist, date, and time slot are required.' });
    }

    // Verify service
    const service = await findById('services', serviceId);
    if (!service) {
      return res.status(400).json({ error: 'Selected service was not found.' });
    }

    // Verify staff
    const staffMember = await findById('staff', staffId);
    if (!staffMember) {
      return res.status(400).json({ error: 'Selected stylist was not found.' });
    }

    // Check staff conflict
    const allBookings = await getCollection('bookings');
    const newStart = timeToMinutes(time);
    const newEnd = newStart + Number(service.durationMinutes);

    const hasConflict = allBookings.some(b => {
      if (b.date !== date || b.staffId !== staffId || ['cancelled'].includes(b.status)) {
        return false;
      }
      const existingStart = timeToMinutes(b.time);
      const existingEnd = existingStart + Number(b.durationMinutes);
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      return res.status(409).json({
        error: `Stylist ${staffMember.name} is already booked at ${time}. Please select another time slot.`
      });
    }

    // Create booking tied to the customer account
    const newBooking = await insert('bookings', {
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email || '',
      serviceId: service.id,
      serviceName: service.name,
      staffId: staffMember.id,
      staffName: staffMember.name,
      date,
      time,
      durationMinutes: Number(service.durationMinutes),
      price: Number(service.price),
      status: 'confirmed',
      notes: notes ? notes.trim() : 'Booked via Customer Portal'
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to book slot', details: err.message });
  }
});

// PATCH /api/auth/my-bookings/:id/cancel - Customer cancels own booking
router.patch('/my-bookings/:id/cancel', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to manage your appointments.' });
    }

    const booking = await findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Ensure this customer owns this booking
    const isOwner = (
      booking.customerId === user.id ||
      (booking.customerPhone && booking.customerPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')) ||
      (booking.customerEmail && user.email && booking.customerEmail.toLowerCase() === user.email.toLowerCase())
    );

    if (!isOwner && user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to cancel this booking.' });
    }

    const updated = await update('bookings', req.params.id, { status: 'cancelled' });
    res.json({ message: 'Appointment successfully cancelled.', booking: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel appointment', details: err.message });
  }
});

export default router;
