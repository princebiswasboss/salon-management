import { Router } from 'express';
import { getCollection, findById, insert, update, remove } from '../db/jsonStore.js';

const router = Router();

// GET all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await getCollection('staff');
    const { active, specialty } = req.query;

    let filtered = staff;
    if (active !== undefined) {
      const isActive = active === 'true';
      filtered = filtered.filter(s => s.active === isActive);
    }
    if (specialty) {
      filtered = filtered.filter(s =>
        s.specialties && s.specialties.some(sp => sp.toLowerCase() === specialty.toLowerCase())
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve staff', details: err.message });
  }
});

// GET staff availability for a date
router.get('/:id/availability', async (req, res) => {
  try {
    const staffMember = await findById('staff', req.params.id);
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query param (YYYY-MM-DD) is required.' });
    }

    // Check if staff works on this day of week
    const targetDate = new Date(`${date}T00:00:00`);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const worksOnDay = staffMember.workingDays ? staffMember.workingDays.includes(dayName) : true;

    // Fetch existing confirmed/in-progress bookings for this staff on this date
    const bookings = await getCollection('bookings');
    const staffBookings = bookings.filter(b =>
      b.staffId === staffMember.id &&
      b.date === date &&
      !['cancelled'].includes(b.status)
    );

    res.json({
      staffId: staffMember.id,
      staffName: staffMember.name,
      date,
      dayName,
      worksOnDay,
      workingHours: staffMember.workingHours || { start: "09:00", end: "18:00" },
      bookedSlots: staffBookings.map(b => ({
        id: b.id,
        time: b.time,
        durationMinutes: b.durationMinutes,
        customerName: b.customerName,
        status: b.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check staff availability', details: err.message });
  }
});

// GET staff by ID
router.get('/:id', async (req, res) => {
  try {
    const staffMember = await findById('staff', req.params.id);
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(staffMember);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve staff member', details: err.message });
  }
});

// POST create staff
router.post('/', async (req, res) => {
  try {
    const { name, role, email, phone, avatar, specialties, workingDays, workingHours, active } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required.' });
    }

    const newStaff = await insert('staff', {
      name: name.trim(),
      role: role.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      avatar: avatar ? avatar.trim() : `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=200&q=80`,
      specialties: Array.isArray(specialties) ? specialties : (specialties ? [specialties] : ["Hair"]),
      workingDays: Array.isArray(workingDays) ? workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      workingHours: workingHours || { start: "09:00", end: "18:00" },
      active: active !== undefined ? Boolean(active) : true
    });

    res.status(201).json(newStaff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff member', details: err.message });
  }
});

// PUT update staff
router.put('/:id', async (req, res) => {
  try {
    const { name, role, email, phone, avatar, specialties, workingDays, workingHours, active } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role.trim();
    if (email !== undefined) updates.email = email.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();
    if (specialties !== undefined) updates.specialties = Array.isArray(specialties) ? specialties : [specialties];
    if (workingDays !== undefined) updates.workingDays = Array.isArray(workingDays) ? workingDays : [workingDays];
    if (workingHours !== undefined) updates.workingHours = workingHours;
    if (active !== undefined) updates.active = Boolean(active);

    const updated = await update('staff', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update staff member', details: err.message });
  }
});

// DELETE staff
router.delete('/:id', async (req, res) => {
  try {
    const success = await remove('staff', req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json({ message: 'Staff member successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete staff member', details: err.message });
  }
});

export default router;
