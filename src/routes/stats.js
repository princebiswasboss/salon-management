import { Router } from 'express';
import { getCollection } from '../db/jsonStore.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [bookings, queue, services, staff, customers] = await Promise.all([
      getCollection('bookings'),
      getCollection('queue'),
      getCollection('services'),
      getCollection('staff'),
      getCollection('customers')
    ]);

    // Bookings today
    const bookingsToday = bookings.filter(b => b.date === today);
    const completedBookingsToday = bookingsToday.filter(b => b.status === 'completed');
    const upcomingBookingsToday = bookingsToday.filter(b => ['confirmed', 'in-progress'].includes(b.status));

    // Calculate Today's Revenue (Bookings completed today + walk-ins completed today)
    const queueCompletedToday = queue.filter(q =>
      q.status === 'completed' &&
      q.completedTime &&
      q.completedTime.startsWith(today)
    );

    const bookingRevenueToday = completedBookingsToday.reduce((sum, b) => sum + (b.price || 0), 0);
    const queueRevenueToday = queueCompletedToday.reduce((sum, q) => sum + (q.servicePrice || 0), 0);
    const totalRevenueToday = bookingRevenueToday + queueRevenueToday;

    // Projected revenue if all confirmed bookings today are completed
    const projectedRevenueToday = bookingsToday
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.price || 0), 0) + queueRevenueToday;

    // Walk-in queue stats
    const activeWaiting = queue.filter(q => q.status === 'waiting');
    const inService = queue.filter(q => q.status === 'in-service');
    const avgWaitTime = activeWaiting.length > 0
      ? Math.round(activeWaiting.reduce((acc, q) => acc + (q.estimatedWaitMinutes || 15), 0) / activeWaiting.length)
      : 0;

    // Staff stats
    const activeStaff = staff.filter(s => s.active);

    // Most popular services
    const serviceCounts = {};
    bookings.forEach(b => {
      serviceCounts[b.serviceName] = (serviceCounts[b.serviceName] || 0) + 1;
    });
    queue.forEach(q => {
      serviceCounts[q.serviceName] = (serviceCounts[q.serviceName] || 0) + 1;
    });

    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent combined activity feed
    const activityFeed = [];

    bookings.slice(0, 5).forEach(b => {
      activityFeed.push({
        type: 'booking',
        title: `Appointment: ${b.customerName}`,
        subtitle: `${b.serviceName} with ${b.staffName}`,
        time: `${b.date} at ${b.time}`,
        status: b.status,
        timestamp: b.createdAt
      });
    });

    queue.slice(0, 5).forEach(q => {
      activityFeed.push({
        type: 'queue',
        title: `Walk-in (${q.ticketNumber}): ${q.customerName}`,
        subtitle: `${q.serviceName} (${q.staffName})`,
        time: q.checkInTime ? new Date(q.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        status: q.status,
        timestamp: q.checkInTime
      });
    });

    activityFeed.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    res.json({
      today,
      metrics: {
        totalRevenueToday,
        projectedRevenueToday,
        appointmentsCountToday: bookingsToday.length,
        appointmentsCompletedToday: completedBookingsToday.length,
        appointmentsUpcomingToday: upcomingBookingsToday.length,
        walkInsWaitingCount: activeWaiting.length,
        walkInsInServiceCount: inService.length,
        averageWaitMinutes: avgWaitTime,
        activeStaffCount: activeStaff.length,
        totalCustomersCount: customers.length,
        totalServicesCount: services.length
      },
      todaySchedule: bookingsToday,
      popularServices,
      activeQueue: [...inService, ...activeWaiting],
      recentActivity: activityFeed.slice(0, 8)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dashboard stats', details: err.message });
  }
});

export default router;
