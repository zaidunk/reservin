# Reservin — Backend PRD

> **Document scope:** Backend proof of concept only.  
> Business context, product vision, user value, and high-level product scope are defined in `Reservin.md` and are intentionally not repeated here.

## 1. Purpose

This document defines the backend requirements needed to validate that Reservin can reliably:

1. manage restaurant tables;
2. determine table availability for arbitrary reservation durations;
3. create reservations without double booking;
4. allow restaurant management to monitor and manage reservations.

The initial implementation supports **one restaurant only**.

---

## 2. Locked Decisions

### Product Scope

- Single restaurant.
- Customer reservation does not require customer authentication.
- Restaurant management requires authentication.
- Reservation duration is flexible.
- A reservation has an explicit `start_at` and `end_at`.
- No fixed reservation slots are required.
- A table may be booked back-to-back as long as reservation periods do not overlap.

### Infrastructure

- Database: PostgreSQL on Supabase.
- Authentication: Supabase Auth.
- Server-side business logic: Supabase Edge Functions using TypeScript where an application-level backend is required.
- Data-intensive availability logic may run as PostgreSQL database functions.
- Supabase Data API may be used for authenticated management operations protected by database authorization rules.

---

## 3. Backend Success Criteria

The backend proof of concept is considered successful when:

- management can create, read, update, and deactivate tables;
- availability queries return only tables that satisfy capacity and time requirements;
- reservations with flexible start and end times can be created;
- two active reservations for the same table can never overlap;
- concurrent attempts to reserve the same table and time cannot both succeed;
- management can retrieve reservations by schedule and update their operational status;
- public users cannot modify management-only data.

---

## 4. Core Domain Model

The backend contains the following primary entities.

### `restaurant_settings`

A singleton configuration for the restaurant.

Required data:

| Field | Purpose |
|---|---|
| `id` | Singleton record identifier |
| `name` | Restaurant display name |
| `timezone` | Restaurant timezone using an IANA timezone identifier |
| `reservation_enabled` | Allows reservation creation to be enabled or disabled globally |
| `created_at` | Record creation time |
| `updated_at` | Last modification time |

There must never be multiple active restaurant configuration records in this proof of concept.

---

### `opening_hours`

Defines when reservations are permitted.

Required data:

| Field | Purpose |
|---|---|
| `id` | Opening-hours record identifier |
| `day_of_week` | Day represented as a consistent numeric value |
| `open_time` | Opening time |
| `close_time` | Closing time |
| `is_closed` | Indicates that reservations are unavailable for the day |

Initial proof of concept assumes one opening period per day.

---

### `restaurant_tables`

Represents physical tables that may be reserved.

Required data:

| Field | Purpose |
|---|---|
| `id` | Table identifier |
| `code` | Unique short table code, for example `T01`, `T02`, or `T03` |
| `name` | Human-readable display name, for example `Window Table` or `Indoor Table 1` |
| `capacity` | Maximum supported guest count |
| `area` | Optional location label such as indoor or outdoor |
| `is_active` | Whether the table can accept new reservations |
| `created_at` | Record creation time |
| `updated_at` | Last modification time |

Constraints:

- `code` must be unique.
- `code` cannot be empty.
- `name` cannot be empty.
- `capacity` must be greater than zero.
- inactive tables must never appear in availability results.

A table with reservation history should be deactivated instead of physically removed so historical reservations remain valid.

---

### `reservations`

Represents a reservation assigned to exactly one table.

Required data:

| Field | Purpose |
|---|---|
| `id` | Reservation identifier |
| `confirmation_code` | Human-readable unique reservation reference |
| `table_id` | Reserved table |
| `customer_name` | Reservation or booking name; identifies the person the reservation is made under |
| `customer_phone` | Required customer contact number |
| `customer_email` | Optional customer email |
| `party_size` | Number of guests |
| `start_at` | Reservation start timestamp |
| `end_at` | Reservation end timestamp |
| `status` | Current reservation status |
| `notes` | Optional reservation note |
| `created_at` | Record creation time |
| `updated_at` | Last modification time |

Initial reservation statuses:

- `confirmed`
- `seated`
- `completed`
- `cancelled`
- `no_show`

Statuses that block table availability:

- `confirmed`
- `seated`

The backend must not hard-delete reservation history during normal operation.

---

### `staff_users`

Defines which authenticated Supabase users are allowed to access management capabilities.

Required data:

| Field | Purpose |
|---|---|
| `user_id` | Reference to the authenticated Supabase user |
| `created_at` | Staff registration time |

For the initial proof of concept, all staff users may have the same management permissions. Fine-grained staff roles are not required.

---

## 5. Reservation Time Model

Reservin uses flexible reservation periods rather than fixed slots.

Every reservation must provide:

```text
start_at
end_at
```

The following rule must always be true:

```text
start_at < end_at
```

The reservation interval is interpreted as:

```text
[start_at, end_at)
```

This means the start is inclusive and the end is exclusive.

Example:

```text
Reservation A
18:00 — 19:30

Reservation B
19:30 — 21:00
```

Both may use the same table.

However:

```text
Reservation A
18:00 — 19:30

Reservation B
19:00 — 20:00
```

must be rejected.

The proof of concept does not impose a fixed minimum or maximum reservation duration. Those rules may be introduced later through restaurant configuration if needed.

---

## 6. Availability Rules

A table is available only when all of the following are true:

1. the table is active;
2. the table capacity is greater than or equal to `party_size`;
3. the requested period is valid;
4. the requested period falls inside restaurant opening hours;
5. no blocking reservation for the same table overlaps the requested period.

Overlap is defined by:

```text
existing.start_at < requested.end_at
AND
existing.end_at > requested.start_at
```

Cancelled, completed, and no-show reservations must not block future availability.

Availability shown before reservation creation is informational only. The same conflict rule must be enforced again when the reservation is inserted.

---

## 7. Database-Level Double-Booking Protection

Preventing overlap must not depend only on TypeScript or on an availability check performed before insertion.

PostgreSQL must provide the final guarantee that two blocking reservations for the same table cannot contain overlapping time ranges.

The intended database behavior is equivalent to:

```text
same table
AND
overlapping reservation period
AND
blocking reservation status
=
database rejects the conflicting write
```

This constraint must remain effective under concurrent requests.

A reservation ending exactly when another reservation begins must not be considered overlapping.

---

## 8. Public Backend Capabilities

Public operations must not require a customer account.

### 8.1 Check Available Tables

Backend capability:

```text
get_available_tables
```

Inputs:

```text
start_at
end_at
party_size
```

Expected output for each available table:

```text
id
code
name
capacity
area
```

Validation errors must be returned when:

- `party_size <= 0`;
- `start_at >= end_at`;
- the requested time is outside opening hours;
- reservations are globally disabled.

This capability should execute the availability filtering close to the database rather than retrieving all reservations to the client and calculating availability there.

---

### 8.2 Create Reservation

Backend capability:

```text
POST /create-reservation
```

Implemented as a Supabase Edge Function.

Request:

```json
{
  "table_id": "uuid",
  "customer_name": "string",
  "customer_phone": "string",
  "customer_email": "string | null",
  "party_size": 4,
  "start_at": "ISO-8601 timestamp",
  "end_at": "ISO-8601 timestamp",
  "notes": "string | null"
}
```

The backend must perform the following validations before or during insertion:

1. required customer fields exist;
2. party size is valid;
3. start time is earlier than end time;
4. reservation creation is enabled;
5. requested period is inside opening hours;
6. selected table exists and is active;
7. table capacity is sufficient;
8. table period does not conflict with another blocking reservation.

Successful response:

```json
{
  "reservation_id": "uuid",
  "confirmation_code": "string",
  "status": "confirmed",
  "table_id": "uuid",
  "start_at": "ISO-8601 timestamp",
  "end_at": "ISO-8601 timestamp"
}
```

The client must never be allowed to set the initial reservation status directly.

---

## 9. Management Backend Capabilities

All management capabilities require an authenticated user present in `staff_users`.

### Table Management

Management must be able to:

- retrieve all tables;
- create a table;
- update table code;
- update table name;
- update capacity;
- update area;
- activate or deactivate a table.

If lowering table capacity would invalidate an existing future blocking reservation, the update must be rejected.

---

### Reservation Monitoring

Management must be able to retrieve reservations using:

- date/time range;
- table;
- status.

The backend must support ordering reservations chronologically by `start_at`.

Returned reservation data must include the information required to identify:

- customer;
- table;
- party size;
- reservation period;
- current status.

---

### Reservation Status Management

Management must be able to update reservation status.

Allowed transitions for the proof of concept:

```text
confirmed → seated
confirmed → cancelled
confirmed → no_show

seated → completed
seated → cancelled
```

Terminal states:

```text
completed
cancelled
no_show
```

Terminal reservations should not return to an active state through the normal API.

---

### Restaurant Configuration

Management must be able to update:

- restaurant name;
- timezone;
- reservation enabled/disabled state;
- opening hours.

Changes to opening hours apply to new reservations.

The proof of concept does not automatically cancel existing reservations when opening hours are changed.

---

## 10. Authentication and Authorization

### Public Access

Anonymous users may only access backend capabilities required to:

- check table availability;
- create a reservation.

Anonymous users must not receive direct write access to:

- restaurant tables;
- restaurant settings;
- opening hours;
- staff users;
- reservation status.

Anonymous users must not receive unrestricted read access to customer reservation records.

---

### Management Access

Management authentication uses Supabase Auth.

An authenticated user is considered management only when their user identifier exists in `staff_users`.

Management users may access the management operations defined in this document.

---

### Database Security

Row Level Security must be enabled for database tables exposed through the Supabase Data API.

Permissions must follow least privilege:

```text
anonymous
→ only explicitly public operations

authenticated staff
→ management operations

service role
→ server-side use only
```

The Supabase service-role credential must never be exposed to clients.

---

## 11. Validation Requirements

The backend must reject invalid input instead of relying on frontend validation.

At minimum:

### Reservation

- customer name cannot be empty;
- customer phone cannot be empty;
- email, when provided, must be structurally valid;
- party size must be a positive integer;
- `start_at` must precede `end_at`;
- table must exist;
- table must be active;
- party size must not exceed table capacity;
- requested time must be inside opening hours;
- conflicting active reservations must be rejected.

### Table

- table code cannot be empty;
- table code must be unique;
- table name cannot be empty;
- capacity must be a positive integer.

### Opening Hours

- open time must precede close time for an open day;
- a closed day does not accept reservations.

---

## 12. Error Contract

Backend errors should use predictable machine-readable codes.

Minimum required errors:

| HTTP Status | Code | Meaning |
|---|---|---|
| `400` | `INVALID_INPUT` | Request data is malformed or incomplete |
| `400` | `INVALID_TIME_RANGE` | `start_at` is not earlier than `end_at` |
| `400` | `OUTSIDE_OPENING_HOURS` | Requested reservation is outside operating hours |
| `400` | `CAPACITY_EXCEEDED` | Party size exceeds table capacity |
| `401` | `UNAUTHORIZED` | Authentication is required |
| `403` | `FORBIDDEN` | Authenticated user is not management |
| `404` | `TABLE_NOT_FOUND` | Requested table does not exist |
| `409` | `TABLE_NOT_AVAILABLE` | Reservation conflicts with another active reservation |
| `503` | `RESERVATIONS_DISABLED` | Restaurant is temporarily not accepting reservations |

Responses should also contain a human-readable message, but application logic should rely on the error code.

---

## 13. Concurrency Requirements

The following scenario must be handled correctly:

```text
Customer A checks Table A → available
Customer B checks Table A → available

Customer A submits 18:00–20:00
Customer B submits 19:00–21:00
```

Expected result:

```text
one request succeeds
one request receives TABLE_NOT_AVAILABLE
```

There must never be two committed overlapping blocking reservations for the same table.

This guarantee must hold even when both requests reach the backend at nearly the same time.

---

## 14. Timestamp and Timezone Requirements

Database reservation timestamps must use timezone-aware timestamps.

API requests and responses use ISO 8601 timestamps.

The restaurant timezone is stored separately in `restaurant_settings`.

Opening-hours validation must interpret requested times according to the restaurant timezone.

The backend must not depend on the browser or caller's local timezone for reservation correctness.

---

## 15. Data Integrity Requirements

The database must enforce relationships and constraints wherever practical.

Required behavior:

- reservations cannot reference nonexistent tables;
- staff records cannot reference nonexistent authentication users;
- table codes remain unique;
- confirmation codes remain unique;
- invalid capacities cannot be stored;
- invalid reservation time ranges cannot be stored;
- overlapping blocking reservations for one table cannot be committed.

Application validation may provide friendlier errors, but it must not replace database constraints.

---

## 16. Observability

For the proof of concept, backend logging must make it possible to diagnose reservation failures.

The `create-reservation` Edge Function should log:

- request identifier;
- reservation creation attempt;
- validation failure category;
- conflict rejection;
- successful reservation identifier;
- unexpected server error.

Logs must not unnecessarily expose sensitive customer data.

---

## 17. Required Backend Tests

### Availability

- returns an active table when no reservation overlaps;
- excludes inactive tables;
- excludes tables with insufficient capacity;
- excludes tables with overlapping confirmed reservations;
- excludes tables with overlapping seated reservations;
- ignores cancelled reservations;
- allows a booking that starts exactly when another booking ends.

### Reservation Creation

- valid reservation succeeds;
- invalid time range fails;
- insufficient capacity fails;
- inactive table fails;
- outside-opening-hours request fails;
- overlap fails;
- back-to-back reservation succeeds.

### Concurrency

A test must send two conflicting reservation writes concurrently.

Pass condition:

```text
exactly one succeeds
exactly one fails with a conflict
```

### Authorization

- anonymous user cannot modify tables;
- anonymous user cannot read the full reservation dataset;
- non-staff authenticated user cannot access management operations;
- staff user can access allowed management operations.

---

## 18. Initial Backend Deliverables

The backend proof of concept is complete when the project contains:

1. Supabase database migrations;
2. required PostgreSQL extensions and constraints;
3. restaurant settings schema;
4. opening-hours schema;
5. restaurant-table schema;
6. reservation schema;
7. staff-user authorization schema;
8. availability database function;
9. `create-reservation` Edge Function;
10. Row Level Security policies and database grants;
11. seed data for one restaurant configuration and sample tables;
12. automated tests covering availability, overlap, concurrency, and authorization.

---

## 19. Explicitly Out of Scope for This Backend PRD

The following are not required for this proof of concept:

- multi-restaurant architecture;
- restaurant onboarding;
- customer accounts;
- frontend implementation;
- visual table/floor-plan positioning;
- payment or reservation deposits;
- food ordering;
- notifications through email, WhatsApp, or SMS;
- external calendar integrations;
- customer loyalty;
- waitlists;
- dynamic pricing;
- automatic table combination;
- analytics and reporting;
- fine-grained staff roles;
- automatic cancellation of existing reservations after opening-hours changes.

These may be evaluated after the core reservation model has been validated.
