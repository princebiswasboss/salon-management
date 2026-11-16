import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

// Initial seed data
const DEFAULT_SERVICES = [
  {
    id: "srv-1",
    name: "Signature Haircut & Style",
    category: "Hair",
    durationMinutes: 45,
    price: 45,
    description: "Consultation, precision haircut, relaxing scalp massage, blow dry, and custom styling.",
    active: true
  },
  {
    id: "srv-2",
    name: "Balayage & Color Gloss",
    category: "Hair",
    durationMinutes: 120,
    price: 160,
    description: "Hand-painted sun-kissed highlights finished with a nourishing botanical gloss.",
    active: true
  },
  {
    id: "srv-3",
    name: "Keratin Smooth Treatment",
    category: "Hair",
    durationMinutes: 90,
    price: 180,
    description: "Deep conditioning and anti-frizz smoothing treatment for silky, manageable hair.",
    active: true
  },
  {
    id: "srv-4",
    name: "Hydra-Glow Facial",
    category: "Facial & Skin",
    durationMinutes: 60,
    price: 85,
    description: "Deep ultrasonic pore cleansing, lactic acid exfoliation, antioxidant serum infusion, and LED therapy.",
    active: true
  },
  {
    id: "srv-5",
    name: "Anti-Aging Collagen Facial",
    category: "Facial & Skin",
    durationMinutes: 75,
    price: 110,
    description: "Firming peptide mask, micro-current lifting, and intensive lymphatic massage.",
    active: true
  },
  {
    id: "srv-6",
    name: "Gel Deluxe Manicure & Pedicure",
    category: "Nails & Spa",
    durationMinutes: 60,
    price: 70,
    description: "Nail shaping, cuticle care, exfoliating organic scrub, hot towel massage, and long-lasting gel polish.",
    active: true
  },
  {
    id: "srv-7",
    name: "Aromatherapy Deep Tissue Massage",
    category: "Nails & Spa",
    durationMinutes: 60,
    price: 95,
    description: "Therapeutic full body massage utilizing essential botanical oils to relieve tension.",
    active: true
  },
  {
    id: "srv-8",
    name: "Gentleman's Beard Sculpt & Hot Towel Shave",
    category: "Grooming",
    durationMinutes: 35,
    price: 38,
    description: "Straight razor shave, beard oil nourishment, hot steam towel, and precision edge line.",
    active: true
  }
];

const DEFAULT_STAFF = [
  {
    id: "stf-1",
    name: "Elena Vance",
    role: "Senior Master Stylist",
    email: "elena@luxehaven.com",
    phone: "+1 (555) 234-5678",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    specialties: ["Hair", "Grooming"],
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "09:00", end: "18:00" },
    active: true
  },
  {
    id: "stf-2",
    name: "Marcus Sterling",
    role: "Color Director & Stylist",
    email: "marcus@luxehaven.com",
    phone: "+1 (555) 345-6789",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    specialties: ["Hair"],
    workingDays: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "10:00", end: "19:00" },
    active: true
  },
  {
    id: "stf-3",
    name: "Sophia Chen",
    role: "Aesthetician & Skin Specialist",
    email: "sophia@luxehaven.com",
    phone: "+1 (555) 456-7890",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    specialties: ["Facial & Skin", "Nails & Spa"],
    workingDays: ["Monday", "Wednesday", "Thursday", "Friday", "Sunday"],
    workingHours: { start: "09:30", end: "18:30" },
    active: true
  },
  {
    id: "stf-4",
    name: "Liam O'Connor",
    role: "Grooming & Barber Specialist",
    email: "liam@luxehaven.com",
    phone: "+1 (555) 567-8901",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    specialties: ["Grooming", "Hair"],
    workingDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
    workingHours: { start: "10:00", end: "19:00" },
    active: true
  }
];

const DEFAULT_CUSTOMERS = [
  {
    id: "cst-1",
    name: "Clara Hawthorne",
    email: "clara.h@example.com",
    phone: "+1 (555) 891-2345",
    notes: "Prefers sulfate-free organic shampoo. Scalp sensitivity.",
    totalVisits: 6,
    totalSpend: 540,
    createdAt: "2026-08-14T10:00:00.000Z"
  },
  {
    id: "cst-2",
    name: "Julian Rivera",
    email: "julian.r@example.com",
    phone: "+1 (555) 912-3456",
    notes: "Likes medium fade on sides, textured scissor cut on top.",
    totalVisits: 4,
    totalSpend: 180,
    createdAt: "2026-09-02T11:30:00.000Z"
  },
  {
    id: "cst-3",
    name: "Amara Patel",
    email: "amara.p@example.com",
    phone: "+1 (555) 432-1987",
    notes: "Regular Hydra-Glow facial every 4 weeks.",
    totalVisits: 8,
    totalSpend: 780,
    createdAt: "2026-07-10T14:20:00.000Z"
  },
  {
    id: "cst-4",
    name: "Ethan Wright",
    email: "ethan.w@example.com",
    phone: "+1 (555) 678-9012",
    notes: "Walk-in converted client. Prefers evening appointments.",
    totalVisits: 2,
    totalSpend: 90,
    createdAt: "2026-10-05T16:00:00.000Z"
  }
];

function getTodayIsoString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const DEFAULT_BOOKINGS = [
  {
    id: "bkg-1",
    customerId: "cst-1",
    customerName: "Clara Hawthorne",
    customerPhone: "+1 (555) 891-2345",
    customerEmail: "clara.h@example.com",
    serviceId: "srv-2",
    serviceName: "Balayage & Color Gloss",
    staffId: "stf-2",
    staffName: "Marcus Sterling",
    date: getTodayIsoString(0),
    time: "10:00",
    durationMinutes: 120,
    price: 160,
    status: "in-progress",
    notes: "Touch up natural roots and blend warm caramel tones.",
    createdAt: new Date().toISOString()
  },
  {
    id: "bkg-2",
    customerId: "cst-2",
    customerName: "Julian Rivera",
    customerPhone: "+1 (555) 912-3456",
    customerEmail: "julian.r@example.com",
    serviceId: "srv-1",
    serviceName: "Signature Haircut & Style",
    staffId: "stf-1",
    staffName: "Elena Vance",
    date: getTodayIsoString(0),
    time: "13:00",
    durationMinutes: 45,
    price: 45,
    status: "confirmed",
    notes: "Regular refresh cut.",
    createdAt: new Date().toISOString()
  },
  {
    id: "bkg-3",
    customerId: "cst-3",
    customerName: "Amara Patel",
    customerPhone: "+1 (555) 432-1987",
    customerEmail: "amara.p@example.com",
    serviceId: "srv-4",
    serviceName: "Hydra-Glow Facial",
    staffId: "stf-3",
    staffName: "Sophia Chen",
    date: getTodayIsoString(0),
    time: "15:00",
    durationMinutes: 60,
    price: 85,
    status: "confirmed",
    notes: "Special event prep.",
    createdAt: new Date().toISOString()
  },
  {
    id: "bkg-4",
    customerId: "cst-4",
    customerName: "Ethan Wright",
    customerPhone: "+1 (555) 678-9012",
    customerEmail: "ethan.w@example.com",
    serviceId: "srv-8",
    serviceName: "Gentleman's Beard Sculpt & Hot Towel Shave",
    staffId: "stf-4",
    staffName: "Liam O'Connor",
    date: getTodayIsoString(1),
    time: "11:30",
    durationMinutes: 35,
    price: 38,
    status: "pending",
    notes: "First time trying hot towel shave.",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_QUEUE = [
  {
    id: "que-1",
    ticketNumber: "W-101",
    customerName: "Sarah Jenkins",
    customerPhone: "+1 (555) 321-7654",
    serviceId: "srv-1",
    serviceName: "Signature Haircut & Style",
    staffId: "stf-1",
    staffName: "Elena Vance",
    status: "in-service",
    estimatedWaitMinutes: 0,
    checkInTime: new Date(Date.now() - 25 * 60000).toISOString(),
    serviceStartTime: new Date(Date.now() - 10 * 60000).toISOString(),
    completedTime: null,
    notes: "Walk-in requested quick trim."
  },
  {
    id: "que-2",
    ticketNumber: "W-102",
    customerName: "David Miller",
    customerPhone: "+1 (555) 789-0123",
    serviceId: "srv-8",
    serviceName: "Gentleman's Beard Sculpt & Hot Towel Shave",
    staffId: "any",
    staffName: "Any Available Stylist",
    status: "waiting",
    estimatedWaitMinutes: 15,
    checkInTime: new Date(Date.now() - 12 * 60000).toISOString(),
    serviceStartTime: null,
    completedTime: null,
    notes: "Needs to leave by 2:00 PM."
  },
  {
    id: "que-3",
    ticketNumber: "W-103",
    customerName: "Chloe Dupont",
    customerPhone: "+1 (555) 654-9871",
    serviceId: "srv-6",
    serviceName: "Gel Deluxe Manicure & Pedicure",
    staffId: "stf-3",
    staffName: "Sophia Chen",
    status: "waiting",
    estimatedWaitMinutes: 30,
    checkInTime: new Date(Date.now() - 5 * 60000).toISOString(),
    serviceStartTime: null,
    completedTime: null,
    notes: "First time walk-in guest."
  }
];

const DEFAULT_SETTINGS = {
  salonName: "Luxe Haven Salon & Spa",
  tagline: "Elegance, Wellness & Signature Styling",
  phone: "+1 (555) 777-LUXE",
  email: "concierge@luxehaven.com",
  address: "450 Promenade Blvd, Suite 200, Beverly Hills, CA 90210",
  currency: "$",
  currencyCode: "USD",
  slotIntervalMinutes: 15,
  openingTime: "09:00",
  closingTime: "20:00",
  businessDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  theme: "dark"
};

const SEED_MAP = {
  services: DEFAULT_SERVICES,
  staff: DEFAULT_STAFF,
  customers: DEFAULT_CUSTOMERS,
  bookings: DEFAULT_BOOKINGS,
  queue: DEFAULT_QUEUE,
  settings: DEFAULT_SETTINGS
};

// Memory cache & write queue lock
const memoryCache = new Map();
const writeQueues = new Map();

/**
 * Ensures data directory exists and collections are initialized
 */
export async function initializeDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  for (const [name, defaultData] of Object.entries(SEED_MAP)) {
    const filePath = path.join(, `${name}.json`);
    try {
      await fs.access(filePath);
      // Validate readable JSON
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      memoryCache.set(name, parsed);
    } catch {
      // File doesn't exist or is corrupted, create with defaults
      await writeCollectionAtomic(name, defaultData);
      memoryCache.set(name, defaultData);
    }
  }
}

/**
 * Atomic write helper that avoids corruption
 */
async function writeCollectionAtomic(name, data) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  const tempPath = path.join(DATA_DIR, `${name}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`);

  const jsonStr = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, jsonStr, 'utf-8');
  await fs.rename(tempPath, filePath);
  memoryCache.set(name, data);
}

/**
 * Sequential queue for write operations per collection to prevent race conditions
 */
function queueWrite(name, writeFn) {
  if (!writeQueues.has(name)) {
    writeQueues.set(name, Promise.resolve());
  }

  const currentPromise = writeQueues.get(name);
  const nextPromise = currentPromise
    .then(() => writeFn())
    .catch((err) => {
      console.error(`Error during write to ${name}:`, err);
      throw err;
    });

  writeQueues.set(name, nextPromise);
  return nextPromise;
}

/**
 * Read collection data
 */
export async function getCollection(name) {
  if (memoryCache.has(name)) {
    return structuredClone(memoryCache.get(name));
  }

  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    memoryCache.set(name, parsed);
    return structuredClone(parsed);
  } catch (err) {
    if (SEED_MAP[name]) {
      await writeCollectionAtomic(name, SEED_MAP[name]);
      return structuredClone(SEED_MAP[name]);
    }
    throw new Error(`Collection ${name} not found`);
  }
}

/**
 * Overwrite collection data
 */
export async function saveCollection(name, data) {
  return queueWrite(name, async () => {
    await writeCollectionAtomic(name, data);
    return structuredClone(data);
  });
}

/**
 * Find item by ID
 */
export async function findById(name, id) {
  const items = await getCollection(name);
  if (!Array.isArray(items)) return null;
  return items.find(item => item.id === id) || null;
}

/**
 * Insert item into collection
 */
export async function insert(name, item) {
  return queueWrite(name, async () => {
    const items = await getCollection(name);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${name} is not an array`);
    }

    const newItem = {
      id: item.id || `${name.slice(0, 3)}-${crypto.randomUUID()}`,
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };

    items.unshift(newItem);
    await writeCollectionAtomic(name, items);
    return structuredClone(newItem);
  });
}

/**
 * Update item by ID
 */
export async function update(name, id, updates) {
  return queueWrite(name, async () => {
    const items = await getCollection(name);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${name} is not an array`);
    }

    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await writeCollectionAtomic(name, items);
    return structuredClone(items[index]);
  });
}

/**
 * Delete item by ID
 */
export async function remove(name, id) {
  return queueWrite(name, async () => {
    const items = await getCollection(name);
    if (!Array.isArray(items)) {
      throw new Error(`Collection ${name} is not an array`);
    }

    const initialLength = items.length;
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    await writeCollectionAtomic(name, filtered);
    return true;
  });
}

/**
 * Update or patch settings object
 */
export async function updateSettings(updates) {
  return queueWrite('settings', async () => {
    const current = await getCollection('settings');
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await writeCollectionAtomic('settings', updated);
    return structuredClone(updated);
  });
}
