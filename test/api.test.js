import assert from 'node:assert';

process.env.PORT = '3099';
const baseUrl = `http://localhost:${process.env.PORT}`;

async function runTests() {
  console.log(`--- Starting Full API & Auth Integration Tests on ${baseUrl} ---`);

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok');
  console.log('✓ Health check passed');

  // 2. Services list
  const servicesRes = await fetch(`${baseUrl}/api/services`);
  assert.strictEqual(servicesRes.status, 200);
  const services = await servicesRes.json();
  assert(services.length >= 8);
  console.log(`✓ Services endpoint passed (${services.length} services found)`);

  // 3. Staff list
  const staffRes = await fetch(`${baseUrl}/api/staff`);
  assert.strictEqual(staffRes.status, 200);
  const staff = await staffRes.json();
  assert(staff.length >= 4);
  console.log(`✓ Staff endpoint passed (${staff.length} staff found)`);

  // 4. Customer Registration
  const testEmail = `newcustomer_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jessica Jones',
      email: testEmail,
      phone: '+1 (555) 777-9911',
      password: 'password123'
    })
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  assert(regData.token);
  assert.strictEqual(regData.user.role, 'customer');
  console.log(`✓ Customer registration passed (Customer: ${regData.user.name})`);

  const customerToken = regData.token;

  // 5. Customer Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'password123'
    })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert(loginData.token);
  console.log('✓ Customer login verified');

  // 6. Admin Login
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@luxehaven.com',
      password: 'admin123'
    })
  });
  assert.strictEqual(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  assert.strictEqual(adminData.user.role, 'admin');
  console.log('✓ Admin login verified');

  // 7. Customer books slot via Customer Portal endpoint
  const bookSlotRes = await fetch(`${baseUrl}/api/auth/book-slot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      serviceId: services[0].id,
      staffId: staff[0].id,
      date: '2026-11-25',
      time: '11:00',
      notes: 'Customer self-booked slot'
    })
  });
  assert.strictEqual(bookSlotRes.status, 201);
  const bookedSlot = await bookSlotRes.json();
  assert.strictEqual(bookedSlot.customerName, 'Jessica Jones');
  console.log(`✓ Customer slot booking passed (Booking ID: ${bookedSlot.id})`);

  // 8. Customer fetches their own bookings
  const myBookingsRes = await fetch(`${baseUrl}/api/auth/my-bookings`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(myBookingsRes.status, 200);
  const myBookings = await myBookingsRes.json();
  assert(myBookings.some(b => b.id === bookedSlot.id));
  console.log(`✓ Customer my-bookings retrieved (${myBookings.length} booking(s))`);

  // 9. Admin views all bookings & manages this slot (e.g. approve / set to in-progress)
  const adminUpdateRes = await fetch(`${baseUrl}/api/bookings/${bookedSlot.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in-progress' })
  });
  assert.strictEqual(adminUpdateRes.status, 200);
  const updatedByAdmin = await adminUpdateRes.json();
  assert.strictEqual(updatedByAdmin.status, 'in-progress');
  console.log('✓ Admin managed and updated customer booking status to in-progress');

  // 10. Customer cancels their appointment
  const cancelRes = await fetch(`${baseUrl}/api/auth/my-bookings/${bookedSlot.id}/cancel`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert.strictEqual(cancelRes.status, 200);
  const cancelData = await cancelRes.json();
  assert.strictEqual(cancelData.booking.status, 'cancelled');
  console.log('✓ Customer cancelled own booking successfully');

  // 11. Cleanup test booking
  await fetch(`${baseUrl}/api/bookings/${bookedSlot.id}`, { method: 'DELETE' });
  await fetch(`${baseUrl}/api/customers/${regData.user.id}`, { method: 'DELETE' });
  console.log('✓ Cleanup completed');

  console.log('--- ALL INTEGRATION & AUTH TESTS PASSED SUCCESSFULLY! ---');
}

// Start server in-process and run tests
import('../server.js').then(() => {
  setTimeout(() => {
    runTests()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Integration test failed:', err);
        process.exit(1);
      });
  }, 1000);
});
