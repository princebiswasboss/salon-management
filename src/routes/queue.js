import { Router } from 'express';
import { getCollection, findById, insert, update, remove } from '../db/jsonStore.js';

const router = Router();

// Calculate dynamic wait time for waiting guests
function recalculateWaitTimes(queueList) {
  let accumulatedMinutes = 0;
  return queueList.map((item) => {
    if (item.status === 'in-service') {
      return { ...item, dynamicWait: 0 };
    }
    if (item.status === 'waiting') {
      const wait = accumulatedMinutes;
      // Add typical duration estimate (average 30 mins if not specified)
      accumulatedMinutes += 25;
      return { ...item, dynamicWait: wait };
    }
    return item;
  });
}

// GET queue list
router.get('/', async (req, res) => {
  try {
    const queue = await getCollection('queue');
    const { status } = req.query;

    let filtered = queue;
    if (status) {
      filtered = filtered.filter(q => q.status === status);
    }

    const calculated = recalculateWaitTimes(filtered);
    res.json(calculated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve walk-in queue', details: err.message });
  }
});

// GET single queue ticket
router.get('/:id', async (req, res) => {
  try {
    const item = await findById('queue', req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve queue item', details: err.message });
  }
});

// POST add new walk-in guest
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, serviceId, staffId, notes } = req.body;
    if (!customerName || !customerPhone || !serviceId) {
      return res.status(400).json({ error: 'Customer name, phone, and service are required.' });
    }

    // Lookup service
    const service = await findById('services', serviceId);
    if (!service) {
      return res.status(400).json({ error: 'Selected service does not exist.' });
    }

    // Lookup staff if assigned
    let staffName = 'Any Available Stylist';
    let assignedStaffId = 'any';
    if (staffId && staffId !== 'any') {
      const staffMember = await findById('staff', staffId);
      if (staffMember) {
        assignedStaffId = staffMember.id;
        staffName = staffMember.name;
      }
    }

    // Generate ticket number: e.g. W-105
    const queue = await getCollection('queue');
    const ticketIndex = 100 + (queue.length + 1);
    const ticketNumber = `W-${ticketIndex}`;

    // Estimated wait time calculation
    const waitingItems = queue.filter(q => q.status === 'waiting');
    const inServiceItems = queue.filter(q => q.status === 'in-service');
    const estimatedWaitMinutes = waitingItems.length * 20 + (inServiceItems.length > 0 ? 10 : 0);

    // Save/update customer
    const customers = await getCollection('customers');
    const existingCust = customers.find(c => c.phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, ''));
    if (!existingCust) {
      await insert('customers', {
        name: customerName.trim(),
        email: '',
        phone: customerPhone.trim(),
        notes: 'Created via walk-in check-in.',
        totalVisits: 0,
        totalSpend: 0
      });
    }

    const newQueueEntry = await insert('queue', {
      ticketNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes,
      staffId: assignedStaffId,
      staffName,
      status: 'waiting',
      estimatedWaitMinutes,
      checkInTime: new Date().toISOString(),
      serviceStartTime: null,
      completedTime: null,
      notes: notes ? notes.trim() : ''
    });

    res.status(201).json(newQueueEntry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add walk-in to queue', details: err.message });
  }
});

// POST call next waiting customer in line
router.post('/call-next', async (req, res) => {
  try {
    const queue = await getCollection('queue');
    const waiting = queue
      .filter(q => q.status === 'waiting')
      .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));

    if (waiting.length === 0) {
      return res.status(404).json({ message: 'No customers currently waiting in queue.' });
    }

    const nextGuest = waiting[0];
    const { staffId } = req.body;

    const updates = {
      status: 'in-service',
      serviceStartTime: new Date().toISOString()
    };

    if (staffId && staffId !== 'any') {
      const staffMember = await findById('staff', staffId);
      if (staffMember) {
        updates.staffId = staffMember.id;
        updates.staffName = staffMember.name;
      }
    }

    const updated = await update('queue', nextGuest.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to call next customer', details: err.message });
  }
});

// PATCH update status of queue entry
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, staffId } = req.body;
    const validStatuses = ['waiting', 'in-service', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const currentItem = await findById('queue', req.params.id);
    if (!currentItem) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    const newStatus = status.toLowerCase();
    const updates = { status: newStatus };

    if (newStatus === 'in-service' && !currentItem.serviceStartTime) {
      updates.serviceStartTime = new Date().toISOString();
    }
    if (newStatus === 'completed' && !currentItem.completedTime) {
      updates.completedTime = new Date().toISOString();
      // Update customer stats
      const customers = await getCollection('customers');
      const cust = customers.find(c => c.phone.replace(/\D/g, '') === currentItem.customerPhone.replace(/\D/g, ''));
      if (cust) {
        await update('customers', cust.id, {
          totalVisits: (cust.totalVisits || 0) + 1,
          totalSpend: (cust.totalSpend || 0) + (currentItem.servicePrice || 35)
        });
      }
    }

    if (staffId && staffId !== 'any') {
      const staffMember = await findById('staff', staffId);
      if (staffMember) {
        updates.staffId = staffMember.id;
        updates.staffName = staffMember.name;
      }
    }

    const updated = await update('queue', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update queue status', details: err.message });
  }
});

// DELETE remove from queue
router.delete('/:id', async (req, res) => {
  try {
    const success = await remove('queue', req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }
    res.json({ message: 'Walk-in successfully removed from queue', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete queue entry', details: err.message });
  }
});

export default router;
