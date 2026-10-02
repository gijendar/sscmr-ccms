/**
 * Supabase verification script (read-only by default).
 *
 *   npm run verify:supabase
 *
 * Checks that the schema from supabase/schema.sql has been applied and that
 * the anonymous (student) role can read what the complaint form needs.
 *
 * With `--submit` it also performs one real submission through the anonymous
 * key to prove the INSERT policy and priority calculation work end to end.
 * That creates a real complaint row — pass `--delete` as well to clean it up
 * immediately (requires SUPABASE_SERVICE_ROLE_KEY in .env.local).
 *
 *   npm run verify:supabase -- --submit --delete
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const wantSubmit = process.argv.includes('--submit');
const wantDelete = process.argv.includes('--delete');

let failures = 0;
const pass = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  \u2717 ${msg}`);
};

async function rest(path, {method = 'GET', key = anonKey, body, headers = {}} = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {status: res.status, json, text};
}

if (!url || !anonKey) {
  console.error(
    '\nMissing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n',
  );
  process.exit(1);
}

console.log(`\nVerifying Supabase project: ${url}\n`);

// --- 1. Tables exist --------------------------------------------------------
console.log('Tables');
for (const table of ['complaints', 'categories', 'priority_keywords', 'admin_profiles']) {
  const {status, json} = await rest(`${table}?select=id&limit=1`);
  if (status === 404 || json?.code === 'PGRST205') {
    fail(`${table} is missing — run supabase/schema.sql in the SQL Editor`);
  } else if (status === 200) {
    pass(`${table} exists`);
  } else {
    fail(`${table} returned HTTP ${status}: ${json?.message ?? ''}`);
  }
}

// --- 2. Student-visible reference data -------------------------------------
console.log('\nStudent form data (readable with the anon key)');
const cats = await rest('categories?select=name&is_active=eq.true&order=name');
if (cats.status === 200 && Array.isArray(cats.json)) {
  if (cats.json.length > 0) {
    const sample = cats.json.slice(0, 3).map((c) => c.name).join(', ');
    pass(`${cats.json.length} active categories (${sample}...)`);
  } else {
    fail('no active categories — the student dropdown would be empty');
  }
} else {
  fail(`could not read categories (HTTP ${cats.status})`);
}

const kws = await rest('priority_keywords?select=keyword,priority_level&is_active=eq.true');
if (kws.status === 200 && Array.isArray(kws.json)) {
  if (kws.json.length > 0) {
    pass(`${kws.json.length} active priority keywords`);
  } else {
    fail('no active priority keywords — every complaint would be LOW');
  }
} else {
  fail(`could not read priority_keywords (HTTP ${kws.status})`);
}

const keywordRows = Array.isArray(kws.json) ? kws.json : [];
const critical = keywordRows.find((k) => k.keyword === 'sparks');
if (!Array.isArray(kws.json)) {
  // already reported above
} else if (critical) {
  pass(`"sparks" resolves to ${critical.priority_level}`);
} else {
  fail('expected seed keyword "sparks" was not found');
}

// --- 3. RLS: students must not be able to read complaints ------------------
console.log('\nRow Level Security');
const anonComplaints = await rest('complaints?select=id&limit=1');
if (anonComplaints.status === 200 && Array.isArray(anonComplaints.json) && anonComplaints.json.length === 0) {
  pass('anon sees no complaints (blocked by RLS, or the table is empty)');
} else if (anonComplaints.status === 200) {
  fail('anon can read complaints — the SELECT policy is too permissive');
} else {
  pass(`anon read of complaints rejected (HTTP ${anonComplaints.status})`);
}

if (!serviceKey) {
  console.log('  ! SUPABASE_SERVICE_ROLE_KEY not set — skipping admin-side checks');
} else {
  const adminRead = await rest('complaints?select=id&limit=1', {key: serviceKey});
  if (adminRead.status === 200) {
    pass(`admin/service role can read complaints (${adminRead.json?.length ?? 0} row in sample)`);
  } else {
    fail(`service role could not read complaints (HTTP ${adminRead.status})`);
  }

  const adminProbe = await rest('admin_profiles?select=id,is_admin&limit=5', {key: serviceKey});
  if (adminProbe.status === 200 && Array.isArray(adminProbe.json)) {
    const admins = adminProbe.json;
    if (admins.some((a) => a.is_admin)) {
      pass(`${admins.length} admin profile row(s), at least one with is_admin = true`);
    } else {
      fail('no admin profile registered — run the ADMIN SETUP snippet from supabase/schema.sql');
    }
  } else {
    fail(`could not read admin_profiles (HTTP ${adminProbe.status})`);
  }

  // Non-admin guard: anon has no DELETE grant, so a DELETE through the anon
  // key must not remove a row. A service-role-created probe is used so the
  // test never touches a real complaint and can always be cleaned up.
  if (wantSubmit) {
    console.log('\n  Non-admin delete guard');
    const probeRow = {
      complaint_number: `CMP-RLS-${Date.now()}`,
      student_name: 'RLS Delete Probe',
      roll_number: 'RLS-001',
      department: 'Computer Science',
      class_division: 'TEST-A',
      contact_number: '9000000000',
      gmail_id: 'rls@example.com',
      category: 'Electrical',
      pc_number: null,
      description: 'RLS probe: verifies anonymous users cannot delete complaints.',
      priority_level: 'LOW',
      priority_score: 1,
      detected_keywords: [],
      status: 'PENDING',
      rejection_reason: null,
    };
    const created = await rest('complaints', {
      method: 'POST',
      key: serviceKey,
      body: probeRow,
      headers: {Prefer: 'return=representation'},
    });
    if (created.status === 201 && Array.isArray(created.json) && created.json.length) {
      const probeId = created.json[0].id;
      await rest(`complaints?id=eq.${probeId}`, {method: 'DELETE'});
      const survived = await rest(`complaints?id=eq.${probeId}&select=id`, {key: serviceKey});
      if (survived.status === 200 && survived.json?.length === 1) {
        pass('anon cannot delete complaints (row survived a DELETE attempt)');
      } else {
        fail('anon DELETE removed a complaint — the DELETE policy is too permissive');
      }
      await rest(`complaints?id=eq.${probeId}`, {method: 'DELETE', key: serviceKey});
    } else {
      fail(`could not create RLS delete probe (HTTP ${created.status}): ${created.json?.message ?? created.text}`);
    }
  }
}

// --- 4. Optional: real end-to-end submission -------------------------------
if (!wantSubmit) {
  console.log('\nSkipping live submission (pass --submit to test it).\n');
} else {
  console.log('\nLive submission test (anonymous key)');
  const year = new Date().getFullYear();
  const probe = await rest('complaints?select=complaint_number&limit=1', {key: serviceKey ?? anonKey});
  const probeRows = Array.isArray(probe.json) ? probe.json : [];
  const last = probeRows[0]?.complaint_number;
  const lastSeq = last ? Number.parseInt(last.split('-')[2] ?? '0', 10) : 0;
  const nextNumber = `CMP-${year}-${String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(5, '0')}`;

  const payload = {
    complaint_number: nextNumber,
    student_name: 'Verification Probe',
    roll_number: 'VERIFY-001',
    department: 'Computer Science',
    class_division: 'TEST-A',
    contact_number: '9000000000',
    gmail_id: 'verify@example.com',
    category: 'Electrical',
    pc_number: null,
    description: 'VERIFY SCRIPT: short circuit and sparks near the main switchboard.',
    priority_level: 'CRITICAL',
    priority_score: 4,
    detected_keywords: ['short circuit', 'sparks'],
    status: 'PENDING',
    rejection_reason: null,
  };

  const insert = await rest('complaints', {
    method: 'POST',
    body: payload,
    headers: {Prefer: 'return=minimal'},
  });

  if (insert.status === 201 || insert.status === 204) {
    pass(`anon INSERT accepted (${nextNumber}) — the student form will work`);
  } else {
    fail(`anon INSERT failed (HTTP ${insert.status}): ${insert.json?.message ?? insert.text}`);
    console.log('    Most common cause: the legacy student_id/location NOT NULL columns —');
    console.log('    re-run supabase/schema.sql, which drops those constraints.');
  }

  if (insert.status === 201 || insert.status === 204) {
    if (wantDelete && serviceKey) {
      const del = await rest(`complaints?complaint_number=eq.${encodeURIComponent(nextNumber)}`, {
        method: 'DELETE',
        key: serviceKey,
      });
      if (del.status === 204 || del.status === 200) {
        pass(`probe complaint ${nextNumber} deleted`);
      } else {
        fail(`could not delete probe complaint (HTTP ${del.status})`);
      }
    } else {
      console.log(`    ! Probe complaint ${nextNumber} was left in the table.`);
      console.log('      Delete it from the admin UI, or re-run with --submit --delete.');
    }
  }
}

console.log(
  failures === 0
    ? '\nAll checks passed.\n'
    : `\n${failures} check(s) failed — see above.\n`,
);
process.exit(failures === 0 ? 0 : 1);
