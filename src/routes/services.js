import { Router } from 'express';
import { getCollection, findById, insert, update, remove } from '../db/jsonStore.js';

const router = Router();

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await getCollection('services');
    const { category, active } = req.query;

    let filtered = services;
    if (category) {
      filtered = filtered.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    if (active !== undefined) {
      const isActive = active === 'true';
      filtered = filtered.filter(s => s.active === isActive);
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve services', details: err.message });
  }
});

// GET service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await findById('services', req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve service', details: err.message });
  }
});

// POST create service
router.post('/', async (req, res) => {
  try {
    const { name, category, durationMinutes, price, description, active } = req.body;
    if (!name || !price || !durationMinutes) {
      return res.status(400).json({ error: 'Name, price, and duration are required.' });
    }

    const newService = await insert('services', {
      name: name.trim(),
      category: category ? category.trim() : 'General',
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      description: description ? description.trim() : '',
      active: active !== undefined ? Boolean(active) : true
    });

    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service', details: err.message });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    const { name, category, durationMinutes, price, description, active } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category.trim();
    if (durationMinutes !== undefined) updates.durationMinutes = Number(durationMinutes);
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description.trim();
    if (active !== undefined) updates.active = Boolean(active);

    const updated = await update('services', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service', details: err.message });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  try {
    const success = await remove('services', req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ message: 'Service successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service', details: err.message });
  }
});

export default router;
