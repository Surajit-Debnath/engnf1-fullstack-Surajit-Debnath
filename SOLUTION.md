# TriageSync — Solution and Engineering Decisions

## Part A — Architecture and ticket lifecycle

### Architecture

```text
 USER / ADMIN browser
          |
 React + TypeScript + Tailwind CSS
 React Router -> RoleProtectedRoute -> Dashboard layouts
          |
 Pages / reusable components -> Axios services
          | HTTP JSON + JWT in token header
          v
 Express API (/api)
          |
 Authentication / administrator middleware
          |
 Routes -> Controllers -> Zod validation
          |
          +--> Ticket import / classifier / review services
          +--> Ticket listing / statistics
          +--> Resource management / availability
          +--> Booking service (MongoDB transactions)
          |
       Mongoose
          |
       MongoDB
          +-- Users
          +-- Tickets ---------> TicketEvents
          +-- Resources -------> Bookings <--- Users
                                   |
                                   +-- optional Ticket reference
```

The frontend handles presentation, input validation and navigation; the backend is the authority for validation, permissions, classification and booking conflicts. The classifier is deterministic keyword matching, not a trained machine-learning model.

### Function-by-function trace: imported ticket to dashboard

Example input:

```json
{"tickets":[{"externalId":"TRACE-001","subject":"Unable to login","body":"I forgot my password."}]}
```

| Step | Function / location | Behaviour |
|---|---|---|
| 1 | `parseTickets`, `handleImport` — `frontend/src/components/tickets/TicketImportModal.tsx:35,119` | Parse JSON, validate input and initiate import. |
| 2 | `importTickets` — `frontend/src/services/ticketService.ts:30` | POST the ticket array to `/tickets/import` through the shared Axios client. |
| 3 | `authMiddleware` — `backend/src/middleware/authmiddleware.js:3` | Verify JWT and attach decoded user ID/role. The router is mounted at `/api/tickets` in `backend/src/index.js:32`. |
| 4 | `importTicketsController` — `backend/src/controllers/ticketImport.controller.js:4` | Validate the body using `importTicketsSchema`; accept 1–500 tickets per request; return HTTP 400 for invalid input. |
| 5 | `importTickets` — `backend/src/services/ticketImport.service.js:44` | Look up each `externalId`; update an existing ticket or classify and create a new one. |
| 6 | `classifyTicket`, `containsKeyword` — `backend/src/utils/ticketClassifier.js:37,31` | Combine subject/body, match escaped whole-word keywords case-insensitively, use first matching rule. Category order: BILLING, LOGIN, DELIVERY, BUG; fallback FEATURE_REQUEST. Priority order: URGENT, HIGH; fallback MEDIUM. |
| 7 | `Ticket.create` — `backend/src/services/ticketImport.service.js:71` | Store the example as LOGIN/MEDIUM, OPEN, unreviewed, no override and no assignee. |
| 8 | `importTicketsController` | Return importedCount, updatedCount, skippedOverrideCount and total with HTTP 200. |
| 9 | `handleImportSuccess` — `frontend/src/Pages/Tickets.tsx:200` | Refresh ticket data and statistics after import. |
| 10 | `getTicketsController` -> `getTickets` — `backend/src/controllers/ticket.controller.js:4`, `backend/src/services/ticket.service.js:6` | Validate query, apply filters and escaped search, sort newest first, paginate and return total count. |
| 11 | `getTicketStats` -> `formatCounts` — `backend/src/routes/statsRouter.js:18,10` | Aggregate category, priority, status and reviewed-ticket agreement counts; zero-fill missing categories. |
| 12 | `fetchDashboard` — `frontend/src/Pages/Dashboard.tsx:98` | On dashboard load/refresh, request `/stats`, `/tickets` and `/bookings/mine` in parallel, update React state and render summary/recent tickets. |
| 13 | `fetchQueue` — `frontend/src/Pages/TriageQueue.tsx:85` | Fetch paginated tickets, select unreviewed tickets and order by priority then age for agent review. |

The dashboard is refreshed on navigation or explicit refresh, not via a live push subscription. Administrator overview separately uses `/admin/stats`.

### Definition of reviewed

A ticket becomes reviewed when a successful update changes its current category or moves its status from OPEN to IN_PROGRESS, RESOLVED or CLOSED. Priority-only updates, assignment-only updates and unchanged category/status values do not qualify. `isReviewed` remains true once set. A category change also sets `isHumanOverride`; a status-only review does not. See `backend/src/services/updateTicket.service.js:21–83` and `frontend/src/components/tickets/TicketReviewForm.tsx:117–154,848`.

Agreement rate is `100 × reviewed tickets whose category equals autoCategory / reviewed tickets`, rounded to two decimals (zero if none). This is an agreement indicator, not independently validated model accuracy. The import service can refresh `autoCategory` for non-overridden tickets, despite the model comment describing it as original; it is not a permanently frozen prediction in every case.

## Part B — Concurrency (B6) and idempotent human override (T-B2)

### B6: race-safe booking creation

A simple read-then-insert overlap check is insufficient: two concurrent requests can both see an empty slot. `createBooking` in `backend/src/services/booking.service.js:15–137` instead uses `session.withTransaction` and writes shared documents before checking invariants:

1. Increment the active resource's `bookingLockVersion` (lines 24–43). Competing transactions for that resource contend on the same document.
2. Increment the user's `bookingLockVersion` (45–61), protecting the three-future-bookings limit even across different resources.
3. Validate the optional ticket reference (63–76).
4. Count future PENDING/APPROVED bookings for the user; reject at three with HTTP 409 (78–91).
5. Check resource overlap against PENDING/APPROVED bookings (93–116): `existing.startTime < requested.endTime && existing.endTime > requested.startTime`. Adjacent intervals are allowed.
6. Insert PENDING booking inside the same transaction (118–131); end the session in `finally`.

The transaction helper can retry transient write conflicts. After a competing transaction commits, a retried transaction rechecks the invariant and rejects a conflicting slot. The resource/time index in `backend/src/models/Booking.js` supports overlap lookup; it is not itself a uniqueness constraint on intervals. This design requires a transaction-capable MongoDB deployment (replica set or sharded cluster). Resource and user document writes increase contention but protect correctness across application instances.

**Verification:** `backend/tests/booking-race.test.js` sends ten concurrent requests for one resource and one user. Run `npm run test:booking-race` from backend with a valid `JWT_TOKEN`, active `RESOURCE_ID` and `API_URL=http://localhost:3000` (no `/api/bookings` suffix). Use a free slot and a user below the active limit. Expected: one HTTP 201, nine HTTP 409, zero unexpected responses. Also test different users competing for the same slot and one user competing across different resources. These are expected outcomes, not recorded test results.

### T-B2: idempotent import and human override

`externalId` is unique (`backend/src/models/Ticket.js:5–10`). `importTickets` looks up that key before inserting. A duplicate-key error (11000) from concurrent creation is handled by re-reading the existing ticket and applying the existing-ticket path (`ticketImport.service.js:85–108`).

`processExistingTicket` (lines 4–42) updates changed subject/body fields, but only reruns classification and updates autoCategory/category/priority when `isHumanOverride` is false. It saves only when something changes. Repeating an identical import does not create another document or reset the review flag. For overridden tickets, changed text is still accepted while classification fields remain protected. Updated and skipped-override counts can overlap.

Example sequential trace:

| Operation | autoCategory | category | isReviewed | isHumanOverride |
|---|---|---|---|---|
| Import TRACE-001 | LOGIN | LOGIN | false | false |
| Agent changes category to BUG | LOGIN | BUG | true | true |
| Repeat same import | LOGIN | BUG | true | true |
| Import changed subject/body | LOGIN | BUG | true | true |

`updateTicket` records actual changes to category, priority, status and assigneeId as separate TicketEvent documents containing old/new values, actor and creation timestamp. No public event-edit/delete route is exposed. However, this is application-level append-only behaviour, not database-enforced immutability. Ticket save and event insertion are separate operations, and actor attribution currently trusts `X-Agent`. A simultaneous import and manual review can also race because the override check is a read followed by save. Sequential T-B2 protection is implemented; stronger concurrent protection and atomic audit writes are improvements in Part D.

## Part C — Measure First, Then Optimise

### Existing optimizations and measurement status

`backend/src/models/Ticket.js:71–78` declares indexes on `{status:1, category:1}`, `{assigneeId:1}` and `{createdAt:-1}`, in addition to the unique externalId index. `backend/src/services/ticket.service.js:27–33` uses server-side pagination, newest-first sorting, `.lean()` and parallel list/count queries. The creation-time index is the relevant candidate for the unfiltered `GET /api/tickets?limit=100` request. The other indexes serve different query patterns.

**Actual before/after latency has not been measured in the supplied source or this environment.** The following controlled experiment must be run before claiming a performance improvement. It isolates the creation-time index while keeping the current query implementation unchanged; it is a reconstructed baseline, not a historical measurement.

### Reproducible experiment (600 tickets)

Use a disposable database, the same backend process/configuration and a valid test-user JWT. Never drop indexes in production. Start the backend and ensure the index build is complete. Save the following as `backend/tests/ticket-latency.test.js` locally. Requires Node.js with native fetch. The script imports 600 deterministic test tickets in two batches (the API permits at most 500 per import), warms the endpoint five times and measures 30 sequential requests, including full response consumption. It checks HTTP success, at least 500 total tickets and exactly 100 returned rows.

```js
require('dotenv').config();
const { performance } = require('node:perf_hooks');
const base = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
const token = process.env.JWT_TOKEN;
if (!token) throw new Error('Set JWT_TOKEN for a test user');
const headers = { token, 'Content-Type': 'application/json' };
async function request(path, options = {}) {
  const res = await fetch(base + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  if (process.argv.includes('--seed')) {
    const tickets = Array.from({length: 600}, (_, i) => ({
      externalId: `PERF-${String(i).padStart(4, '0')}`,
      subject: `Benchmark login issue ${i}`,
      body: `Password reset support request number ${i}.`
    }));
    for (let i = 0; i < tickets.length; i += 300) {
      console.log(await request('/api/tickets/import', {
        method: 'POST', body: JSON.stringify({tickets: tickets.slice(i, i + 300)})
      }));
    }
    return;
  }
  const samples = [];
  let total;
  for (let i = 0; i < 35; i++) {
    const start = performance.now();
    const data = await request('/api/tickets?limit=100');
    const ms = performance.now() - start;
    if (data.total < 500 || data.tickets.length !== 100) {
      throw new Error('Need at least 500 tickets and 100 returned rows');
    }
    total = data.total;
    if (i >= 5) samples.push(ms);
  }
  const sorted = [...samples].sort((a,b) => a-b);
  const round = n => Number(n.toFixed(2));
  console.log(JSON.stringify({
    total, requests: samples.length,
    meanMs: round(samples.reduce((a,b) => a+b,0)/samples.length),
    medianMs: round((sorted[14]+sorted[15])/2),
    p95Ms: round(sorted[Math.ceil(sorted.length*0.95)-1]),
    samplesMs: samples.map(round)
  }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
```

From backend, set `API_URL` to the server origin and `JWT_TOKEN` in the local `.env` (do not commit secrets). Run:

```bash
node tests/ticket-latency.test.js --seed
```

Connect mongosh to the same disposable database. Check the actual collection/index names and record the execution plan before changing anything:

```javascript
db.tickets.countDocuments({})
db.tickets.getIndexes()
// Baseline: remove only the creation-time index if present.
db.tickets.dropIndex('createdAt_-1')
db.tickets.find({}).sort({createdAt:-1}).limit(100).explain('executionStats')
```

Do not restart the backend between phases, since Mongoose may recreate the index. Run the baseline and retain its output:

```bash
node tests/ticket-latency.test.js > latency-before.json
```

Restore the index in mongosh, wait for completion, and inspect the optimized plan:

```javascript
db.tickets.createIndex({createdAt:-1})
db.tickets.find({}).sort({createdAt:-1}).limit(100).explain('executionStats')
```

```bash
node tests/ticket-latency.test.js > latency-after.json
```

Keep dataset, machine, database location, Node version, network, authentication and request parameters identical. Avoid concurrent imports/updates during measurement. Record execution plan stages, totalDocsExamined and totalKeysExamined. The countDocuments query is also part of endpoint latency; the find explain alone does not measure the entire endpoint. Repeat the paired runs if network variability is high.

### Results (fill using actual output)

| Metric | Before: no creation-time index | After: creation-time index |
|---|---|---|
| Total tickets | Pending measurement | Pending measurement |
| Warm-up / measured requests | 5 / 30 planned | 5 / 30 planned |
| Mean latency (ms) | Not measured | Not measured |
| Median latency (ms) | Not measured | Not measured |
| P95 latency (ms) | Not measured | Not measured |
| Find execution plan | Not measured | Not measured |
| Documents examined | Not measured | Not measured |

Median improvement (%) = `(beforeMedian - afterMedian) / beforeMedian × 100`. A negative value means a regression. Do not claim a speedup without actual results. Attach both JSON outputs or transcribe their measured values before submission.

**Trade-off:** the creation-time index can avoid a blocking sort and reduce the work needed to retrieve the newest 100 documents, but consumes storage and increases write/index maintenance cost during imports. At only 600 documents, network and count-query overhead may dominate; the measured improvement may be small or absent. Escaped case-insensitive substring regex search is a separate workload and is not optimized by this experiment.

## Part D — What I would improve with one more day

The following references are relative to the submitted ZIP snapshot, not to this document. These are proposed improvements, not implemented changes.

| Priority | File:line | Improvement and verification |
|---|---|---|
| 1 | `backend/src/services/updateTicket.service.js:85–90` | Make ticket update and audit insertion one transaction. Inject an audit-write failure and verify neither write commits. Restrict event updates/deletes at the database permission layer. |
| 2 | `backend/src/services/ticketImport.service.js:15–35` | Replace read-then-save classification writes with a conditional update guarded by `isHumanOverride:false` (and version checks where appropriate). Race imports against manual category changes and assert the human decision survives. |
| 3 | `backend/src/controllers/updateTicket.controller.js:30`; `backend/src/middleware/authmiddleware.js:5–10` | Derive audit actor from authenticated identity, not client-controlled X-Agent; handle missing/invalid/expired JWTs with a consistent 401 response. Test spoofed headers and expired tokens. |
| 4 | `backend/src/services/booking.service.js:21–22,79–108` | Revalidate future start inside transaction retries; add multi-user slot contention and cross-resource quota tests. Evaluate a user/status/startTime index using explain before adding it. |
| 5 | `backend/src/services/ticket.service.js:27–33` | Complete Part C measurements, then evaluate deterministic sort using createdAt and _id, compound indexes for measured filter workloads, and cursor pagination for deep pages. |

The first three improvements are higher priority than cosmetic changes because they protect the correctness and attribution of human decisions. The main goal is to strengthen guarantees without replacing the existing architecture.

---

Evidence status: implementation details are based on the uploaded project snapshot `engnf1-fullstack-Surajit-Debnath-main(20261125-054219).zip`. No live database, authenticated endpoint, benchmark or concurrency test was executed during preparation of this document. Part C remains incomplete until actual measurements are collected.
