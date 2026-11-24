### Ticket Review Definition

A ticket is considered reviewed when an authenticated agent:

1. Changes the ticket category to a different category.
2. Changes the ticket status from OPEN to any other status.

Changing only priority or assigneeId does not mark a ticket as reviewed.

### Audit Trail

For every changed field among category, priority,
status, and assigneeId, a TicketEvent record is created.

Each event stores:
- ticketId
- field
- oldValue
- newValue
- actor (X-Agent header, falling back to authenticated user's email)
- createdAt
## Database Seeding

TriageSync provides an idempotent database seed script.

### Run the seed script

From the backend directory:

```bash
npm run seed
```

The script connects to MongoDB using `MONGODB_URL` from `.env`.

### Seeded accounts

| Role | Name | Email | Password |
|---|---|---|---|
| ADMIN | Admin Lead | admin@triagesync.test | Admin@123 |
| USER | Agent Demo | user@triagesync.test | User@123 |

Public registration creates USER accounts only.
The ADMIN account is created through the seed script.

### Seeded resources

- 2 ROOM resources
- 2 LAB resources
- 2 EQUIPMENT resources
- At least 1 inactive resource

### Seeded tickets

- 22 initial tickets
- All 5 ticket categories
- All 4 priority levels
- 3 tickets marked as reviewed
- Tickets containing raw HTML and script tags for XSS testing
- Audit events for the reviewed tickets

### Idempotency

The seed script uses MongoDB upserts and stable identifiers:

- Users are identified by email.
- Resources are identified by case-insensitive name.
- Tickets are identified by externalId.
- Review events are checked using ticket ID, field, actor, and new value.

Running the seed script multiple times does not create duplicate seeded records.

### Security

Passwords are hashed using bcrypt with a cost factor of 10.
Seed credentials are for development and assessment demonstration only.
Change them before using the application in a real environment.
