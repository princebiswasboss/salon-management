import { Router } from 'express';
import { getCollection, updateSettings } from '../db/jsonStore.js';

const router = Router();

// GET salon settings
router.get('/', async (req, res) => {
  try {
    const settings = await getCollection('settings');
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings', details: err.message });
  }
});

// PUT update salon settings
router.put('/', async (req, res) => {
  try {
    const {
      salonName,
      tagline,
      phone,
      email,
      address,
      currency,
      slotIntervalMinutes,
      openingTime,
      closingTime,
      businessDays,
      theme
    } = req.body;

    const updates = {};
    if (salonName !== undefined) updates.salonName = salonName.trim();
    if (tagline !== undefined) updates.tagline = tagline.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (email !== undefined) updates.email = email.trim();
    if (address !== undefined) updates.address = address.trim();
    if (currency !== undefined) updates.currency = currency.trim();
    if (slotIntervalMinutes !== undefined) updates.slotIntervalMinutes = Number(slotIntervalMinutes);
    if (openingTime !== undefined) updates.openingTime = openingTime;
    if (closingTime !== undefined) updates.closingTime = closingTime;
    if (businessDays !== undefined) updates.businessDays = businessDays;
    if (theme !== undefined) updates.theme = theme;

    const updated = await updateSettings(updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

export default router;
