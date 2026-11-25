## Ticket Review and Human Override

A ticket is marked as reviewed (`isReviewed = true`) only when an authenticated agent successfully performs at least one of the following actions:

- Changes the existing ticket category to a different valid category.
- Transitions the ticket status from `OPEN` to `IN_PROGRESS`, `RESOLVED`, or `CLOSED`.

Submitting an unchanged category or status does not count as a review. Updating only the priority or assignee also does not mark the ticket as reviewed.

The frontend disables the Save Review button until at least one qualifying change has been made. The backend independently enforces the same review definition.

The `isHumanOverride` flag is set to `true` only when the agent changes the ticket category. A status transition alone does not activate human override protection.

Once set, the review and human override flags are not reset by subsequent ticket updates.

Actual field changes are recorded in the ticket audit trail with their previous value, new value, actor, and timestamp.