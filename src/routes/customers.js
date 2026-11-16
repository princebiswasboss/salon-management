import { Router } from 'express';
import { getCollection, findById, insert, update, remove } from '../db/jsonStore.js';

const router = Router();

// GET all customers with search support
router.get('/', async (req, res) => {
  try {
    const customers = await getCollection('customers');
    const { q } = req.query;

    let filtered = customers;
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term))
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customers', details: err.message });
  }
});

// GET customer by ID with full booking history
router.get('/:id', async (req, res) => {
  try {
    const customer = await findById('customers', req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const bookings = await getCollection('bookings');
    const customerBookings = bookings.filter(b => b.customerId === customer.id || b.customerPhone === customer.phone);

    const queue = await getCollection('queue');
    const customerQueue = queue.filter(q => q.customerPhone === customer.phone);

    res.json({
      ...customer,
      history: {
        bookings: customerBookings,
        walkIns: customerQueue
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer', details: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required.' });
    }

    // Check if customer already exists by phone
    const customers = await getCollection('customers');
    const existing = customers.find(c => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
    if (existing) {
      return res.status(409).json({ error: 'A customer with this phone number already exists.', existingId: existing.id });
    }

    const newCustomer = await insert('customers', {
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone.trim(),
      notes: notes ? notes.trim() : '',
      totalVisits: 0,
      totalSpend: 0
    });

    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, notes, totalVisits, totalSpend } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (notes !== undefined) updates.notes = notes.trim();
    if (totalVisits !== undefined) updates.totalVisits = Number(totalVisits);
    if (totalSpend !== undefined) updates.totalSpend = Number(totalSpend);

    const updated = await update('customers', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer', details: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const success = await remove('customers', req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

export default router;
