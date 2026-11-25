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
          +--> Booking expiration service (scheduled + read-triggered)
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

### Automatic booking expiration — Time ran out

A pending booking must not remain actionable after its scheduled start time simply because an administrator has not reviewed it. The backend expiration solution uses the booking's `startTime` as the deadline, rather than its `endTime`.

| File / component | Responsibility |
|---|---|
| `backend/src/services/bookingExpiry.service.js` | `expirePendingBookings()` performs a conditional bulk update; `startBookingExpiryJob()` runs it immediately and every 10 seconds, prevents overlapping scheduled runs within one process and logs failures. |
| `backend/src/index.js` | Starts the expiration job after MongoDB connects. |
| `backend/src/models/Booking.js` | Adds the compound index `{status: 1, startTime: 1}` to support expiration queries. |
| Booking list/detail and resource availability controllers; `backend/src/routes/adminRouter.js` | Run expiration before reading booking data or administrator statistics to reduce stale results between scheduled checks. |

The central database operation is:

```js
await Booking.updateMany(
  { status: "PENDING", startTime: { $lte: new Date() } },
  { $set: { status: "REJECTED", decisionNote: "Time ran out" } }
);
```

The conditional update is atomic per booking and idempotent: once a booking leaves PENDING, later sweeps cannot overwrite its status or decision note. APPROVED, CANCELLED and previously REJECTED bookings remain unchanged. Existing lifecycle guards reject late approval requests with HTTP 409. The expiration index is not a TTL index; booking records are retained for history and reporting. Rejected bookings no longer participate in PENDING/APPROVED resource overlap checks.

The frontend uses the existing booking status and decision-note fields to display REJECTED and “Time ran out” in My Bookings and Manage Bookings after fetching fresh data. No separate frontend timer is required for persistence.

**Trade-offs:** Scheduled expiration is eventually consistent, normally within a 10-second polling interval while the backend and database are healthy. Startup processing catches up after downtime. Read-triggered sweeps add database operations; a booking can still cross its deadline between a sweep and a subsequent read. An already-open frontend page requires a refresh or refetch. No distributed scheduler or real-time push mechanism is introduced.

**Verification plan:** In a disposable test database, create a PENDING booking, move its start/end timestamps into the past, wait for the scheduled sweep and verify the persisted status and decision note. Confirm future PENDING and past APPROVED bookings remain unchanged, existing rejection notes are preserved, late approval returns HTTP 409, and booking lists, resource availability and administrator counts reflect the new state. Restart the backend with an expired PENDING booking to verify startup catch-up. These are expected results, not recorded test outcomes.

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

The booking expiration section documents the subsequent backend changes discussed after that snapshot; the updated source and runtime behavior have not been independently verified.
