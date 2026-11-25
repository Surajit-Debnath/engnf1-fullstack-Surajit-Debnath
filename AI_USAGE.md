# AI Usage — TriageSync

## 1. AI tools used during the two-day development window

| AI tool | Purpose |
| --- | --- |
| OpenAI ChatGPT | Frontend planning, React and TypeScript component generation, Tailwind CSS styling, React Router integration, Axios API integration, debugging, code review, test planning and project documentation. |

## 2. How AI was used

- Planned the frontend structure and separated user and administrator dashboard functionality.
- Generated and refined components for ticket management, the triage queue, audit trail, resource availability, booking forms and booking management.
- Matched frontend types, API requests, validation rules and booking lifecycle actions to the existing Express/MongoDB backend.
- Helped diagnose React hook placement issues and TypeScript/ESLint problems.
- Assisted with integration test scenarios and drafting `README.md` and `SOLUTION.md`.

AI was used as a development assistant rather than as a substitute for checking the project's requirements and backend behavior. Generated suggestions were adapted to the existing application. Suggested tests and performance measurements are not treated as successful results unless actually executed.

## 3. Example of verifying and overriding an AI suggestion

**Ticket review and human-override logic**

During development, I clarified that submitting a ticket review should not automatically mark a ticket as reviewed. A review must involve an actual category change or a transition from `OPEN` to a non-`OPEN` status.

The review logic was refined to distinguish these two conditions:

```js
const categoryChanged =
    updates.category !== undefined && updates.category !== ticket.category;

const statusChangedFromOpen =
    ticket.status === "OPEN" &&
    updates.status !== undefined &&
    updates.status !== "OPEN";
```

The intended behavior is:

- Set `isReviewed` when either condition is true.
- Set `isHumanOverride` only when the category actually changes.
- Do not mark a ticket as reviewed solely because its priority or assignee changes.
- Preserve an existing human override during subsequent ticket imports.

I requested that the frontend review form enforce the same eligibility rules as the backend, rather than allowing an unchanged review to be submitted. This correction illustrates why AI-generated logic must be checked against the application's business rules.

## 4. Responsibility and verification

I remain responsible for the submitted implementation, its correctness and its compliance with the project requirements. AI-assisted code and documentation require local compilation, integration testing and review. Benchmark values must come from actual measurements, not AI-generated estimates.
