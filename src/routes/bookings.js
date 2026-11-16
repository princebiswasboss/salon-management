import { Router } from 'express';
import { getCollection, findById, insert, update, remove } from '../db/jsonStore.js';

const router = Router();

// GET all bookings with rich filters
router.get('/', async (req, res) => {
  try {
    const bookings = await getCollection('bookings');
    const { date, staffId, customerId, status, search } = req.query;

    let filtered = bookings;

    if (date) {
      filtered = filtered.filter(b => b.date === date);
    }
    if (staffId) {
      filtered = filtered.filter(b => b.staffId === staffId);
    }
    if (customerId) {
      filtered = filtered.filter(b => b.customerId === customerId);
    }
    if (status) {
      filtered = filtered.filter(b => b.status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.customerName.toLowerCase().includes(term) ||
        b.serviceName.toLowerCase().includes(term) ||
        b.staffName.toLowerCase().includes(term) ||
        b.customerPhone.includes(term)
      );
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bookings', details: err.message });
  }
});

// GET single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve booking', details: err.message });
  }
});

// Helper to convert time "HH:mm" to minutes from start of day
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// POST create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      date,
      time,
      notes
    } = req.body;

    if (!customerName || !customerPhone || !serviceId || !staffId || !date || !time) {
      return res.status(400).json({
        error: 'Missing required fields: customerName, customerPhone, serviceId, staffId, date, time are required.'
      });
    }

    // Fetch service info
    const service = await findById('services', serviceId);
    if (!service) {
      return res.status(400).json({ error: 'Selected service does not exist.' });
    }

    // Fetch staff info
    const staffMember = await findById('staff', staffId);
    if (!staffMember) {
      return res.status(400).json({ error: 'Selected staff member does not exist.' });
    }

    // Check staff availability / conflict
    const allBookings = await getCollection('bookings');
    const newStart = timeToMinutes(time);
    const newEnd = newStart + Number(service.durationMinutes);

    const hasConflict = allBookings.some(b => {
      if (b.date !== date || b.staffId !== staffId || ['cancelled'].includes(b.status)) {
        return false;
      }
      const existingStart = timeToMinutes(b.time);
      const existingEnd = existingStart + Number(b.durationMinutes);
      // Overlap condition: start < existingEnd && end > existingStart
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      return res.status(409).json({
        error: `Staff member ${staffMember.name} already has an appointment scheduled during this time slot (${time}).`
      });
    }

    // Find or create customer
    let linkedCustomerId = customerId;
    const customers = await getCollection('customers');
    let matchedCustomer = customers.find(c =>
      (customerId && c.id === customerId) ||
      (c.phone && c.phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, ''))
    );

    if (matchedCustomer) {
      linkedCustomerId = matchedCustomer.id;
    } else {
      const newCust = await insert('customers', {
        name: customerName.trim(),
        email: customerEmail ? customerEmail.trim() : '',
        phone: customerPhone.trim(),
        notes: 'Created via appointment booking.',
        totalVisits: 0,
        totalSpend: 0
      });
      linkedCustomerId = newCust.id;
    }

    const newBooking = await insert('bookings', {
      customerId: linkedCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : '',
      serviceId: service.id,
      serviceName: service.name,
      staffId: staffMember.id,
      staffName: staffMember.name,
      date,
      time,
      durationMinutes: Number(service.durationMinutes),
      price: Number(service.price),
      status: 'confirmed',
      notes: notes ? notes.trim() : ''
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

// PATCH fast status update
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const currentBooking = await findById('bookings', req.params.id);
    if (!currentBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const newStatus = status.toLowerCase();
    const updated = await update('bookings', req.params.id, { status: newStatus });

    // If marked as completed and wasn't completed before, update customer totalVisits and totalSpend
    if (newStatus === 'completed' && currentBooking.status !== 'completed' && updated.customerId) {
      const customer = await findById('customers', updated.customerId);
      if (customer) {
        await update('customers', customer.id, {
          totalVisits: (customer.totalVisits || 0) + 1,
          totalSpend: (customer.totalSpend || 0) + (updated.price || 0)
        });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status', details: err.message });
  }
});

// PUT full update booking
router.put('/:id', async (req, res) => {
  try {
    const currentBooking = await findById('bookings', req.params.id);
    if (!currentBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      date,
      time,
      status,
      notes
    } = req.body;

    const updates = {};
    if (customerName) updates.customerName = customerName.trim();
    if (customerPhone) updates.customerPhone = customerPhone.trim();
    if (customerEmail !== undefined) updates.customerEmail = customerEmail.trim();
    if (notes !== undefined) updates.notes = notes.trim();
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (status) updates.status = status.toLowerCase();

    if (serviceId && serviceId !== currentBooking.serviceId) {
      const service = await findById('services', serviceId);
      if (service) {
        updates.serviceId = service.id;
        updates.serviceName = service.name;
        updates.durationMinutes = service.durationMinutes;
        updates.price = service.price;
      }
    }

    if (staffId && staffId !== currentBooking.staffId) {
      const staffMember = await findById('staff', staffId);
      if (staffMember) {
        updates.staffId = staffMember.id;
        updates.staffName = staffMember.name;
      }
    }

    const updated = await update('bookings', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking', details: err.message });
  }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
  try {
    const success = await remove('bookings', req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking', details: err.message });
  }
});

export default router;
