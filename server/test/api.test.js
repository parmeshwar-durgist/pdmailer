const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('🧪 Starting Multi-User HR Bulk Email Sender Test Suite...');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('Health check endpoint returns ok', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. Admin Login
  let adminToken = null;
  await test('Admin login succeeds with default credentials', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@hrmailer.com', password: 'Admin@12345' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    adminToken = res.data.data.token;
  });

  // 3. User Registration (Multi-User)
  const newUserEmail = `developer.${Date.now()}@example.com`;
  let userToken = null;
  let newUserId = null;

  await test('New user can self-register', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Sarah Jenkins',
        email: newUserEmail,
        password: 'Password@123'
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    userToken = res.data.data.token;
    newUserId = res.data.data.user.id;
  });

  // 4. Data Isolation (Sarah has 0 contacts, Admin has 5)
  await test('New user starts with isolated empty contact list', async () => {
    const res = await request('/contacts', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.total, 0);
  });

  await test('Admin retains their own separate contacts', async () => {
    const res = await request('/contacts', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.total >= 1);
  });

  // 5. User adds contact
  let sarahContactId = null;
  await test('New user adds a contact to their private workspace', async () => {
    const res = await request('/contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        name: 'Tech Recruiter Alpha',
        email: 'alpha.recruiter@bigtech.com',
        title: 'Talent Acquisition Manager',
        company: 'BigTech Global'
      }
    });
    assert.strictEqual(res.status, 201);
    sarahContactId = res.data.data.id;
  });

  // 6. Admin cannot see or delete Sarah's contact
  await test('Admin cannot delete or view user’s contact', async () => {
    const res = await request(`/contacts/${sarahContactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 404); // returns clean 404 Not Found
    assert.strictEqual(res.data.success, false);
  });

  // 7. Auto-seeded template for new user
  await test('New user has auto-seeded starter email template', async () => {
    const res = await request('/templates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length >= 1);
    assert.ok(res.data.data[0].subject.includes('Sarah Jenkins'));
  });

  // 8. User Settings Isolation
  await test('User can update their private SMTP settings and delay', async () => {
    const res = await request('/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        sender_name: 'Sarah Jenkins',
        sender_email: 'sarah.jenkins@gmail.com',
        send_delay_seconds: 3
      }
    });
    assert.strictEqual(res.status, 200);

    const getRes = await request('/settings', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(getRes.data.data.sender_name, 'Sarah Jenkins');
    assert.strictEqual(getRes.data.data.send_delay_seconds, 3);
  });

  // 9. Role-Based Access Control (RBAC)
  await test('Standard user cannot access admin endpoints (403 Forbidden)', async () => {
    const res = await request('/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.success, false);
  });

  await test('Admin can access admin users list', async () => {
    const res = await request('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.some(u => u.email === 'admin@hrmailer.com' && u.role === 'admin'));
  });

  await test('Admin can fetch platform-wide overview statistics', async () => {
    const res = await request('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Number(res.data.data.total_users) >= 2);
    assert.ok(Number(res.data.data.total_admins) >= 1);
  });

  await test('Admin can update user role', async () => {
    const res = await request(`/admin/users/${newUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'admin' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.role, 'admin');

    // Demote back to user
    const demoteRes = await request(`/admin/users/${newUserId}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'user' }
    });
    assert.strictEqual(demoteRes.status, 200);
    assert.strictEqual(demoteRes.data.data.role, 'user');
  });

  await test('Admin cannot demote their own account', async () => {
    const res = await request('/admin/users/1/role', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'user' }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  // 15. View Credentials & Reset Password (Login Details)
  await test('Admin can view user login details (username and password)', async () => {
    const res = await request(`/admin/users/${newUserId}/credentials`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.email, newUserEmail);
    assert.strictEqual(res.data.data.password, 'Password@123');
  });

  await test('Admin can reset a user password', async () => {
    const res = await request(`/admin/users/${newUserId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { newPassword: 'NewSecret@2026' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    // Verify user can log in with new password
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: newUserEmail, password: 'NewSecret@2026' }
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
  });

  // 16. WhatsApp Integration Tests
  await test('Contact can be created with a WhatsApp phone number and retrieved', async () => {
    const res = await request('/contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        name: 'WhatsApp Recruiter',
        email: `wa_recruiter_${Date.now()}@example.com`,
        phone: '+91 98765 43210',
        company: 'WA Tech',
        title: 'Lead Talent Partner'
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.phone, '+91 98765 43210');

    // Fetch contact list and verify phone is returned
    const listRes = await request('/contacts', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const contactsList = listRes.data.data.contacts || listRes.data.data;
    const found = contactsList.find(c => c.name === 'WhatsApp Recruiter');
    assert.ok(found);
    assert.strictEqual(found.phone, '+91 98765 43210');
  });

  await test('WhatsApp session status returns disconnected by default', async () => {
    const res = await request('/whatsapp/session/status', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.connected, false);
  });

  let createdTemplateId = null;
  await test('User can create and retrieve custom WhatsApp templates', async () => {
    const createRes = await request('/whatsapp/templates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        name: 'Urgent Outreach',
        body: 'Hello {{Name}}, reaching out from {{Company}} regarding the role!'
      }
    });
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.data.success, true);
    createdTemplateId = createRes.data.data.id;

    const listRes = await request('/whatsapp/templates', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const item = listRes.data.data.find(t => t.id === createdTemplateId);
    assert.ok(item);
    assert.strictEqual(item.name, 'Urgent Outreach');
  });

  await test('User can delete custom WhatsApp template', async () => {
    const delRes = await request(`/whatsapp/templates/${createdTemplateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.success, true);
  });

  await test('Direct WhatsApp send returns error if WhatsApp session is not connected', async () => {
    const res = await request('/whatsapp/send-direct', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        phone: '+91 98765 43210',
        message: 'Hello HR!'
      }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.ok(res.data.message.includes('not connected') || res.data.message.includes('QR code'));
  });

  console.log('----------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log('----------------------------------------------------');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests();
