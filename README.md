# Backend Challenge - TypeScript

## Solution Overview

This solution implements a robust booking management system with the following key improvements:

### Bug Fixed: Booking Conflicts
- **Issue**: A guest would arrive at their booked unit only to find that it's already occupied by someone else
- **Root Cause**: The initial implementation only checked for bookings with the same check-in date, but the real requirement is preventing **preventing overlapping date ranges bookings**
- **Solution**: To detect overlaps, we need to calculate checkout dates from the `numberOfNights` field and compare date ranges

#### Overview of Possible Solutions

**1. Process in Application Code**
- ✅ Simple to implement, no schema changes
- ❌ Poor performance (O(n) for each booking check)
- ❌ Business logic mixed with data access

**2. Add checkOutDate Column to Schema**  
- ✅ Best query performance
- ✅ Simple queries
- ❌ Data duplication (calculated from existing fields)
- ❌ Risk of data inconsistency

**3. Complex Query with Date Calculation**
```sql
WHERE checkInDate < DATE(?, '+' || ? || ' days') 
AND DATE(checkInDate, '+' || numberOfNights || ' days') > ?
```
- ✅ No schema changes
- ✅ Accurate calculations
- ❌ Complex, hard-to-read queries  
- ❌ Date logic duplicated across multiple queries
- ❌ No easy way to visualize/query checkout dates for debugging

**4. Database View**
```sql
CREATE VIEW BookingWithCheckOut AS
SELECT *, DATE(checkInDate, '+' || numberOfNights || ' days') as checkOutDate
FROM booking;
```
- ✅ Clean, reusable abstraction
- ✅ Simple queries: `WHERE checkInDate < ? AND checkOutDate > ?`
- ✅ Database optimizes the view
- ✅ Single source of truth for date calculations
- ❌ Adds database object to maintain
- ❌ Requires raw SQL with complex query building

**5. Two Parallel Queries with ORM (Chosen Solution)**
```typescript
// Find nearest past and future bookings in parallel
const [pastBooking, futureBooking] = await Promise.all([
    prisma.booking.findFirst({ where: { guestName, checkInDate: { lte: date } }, orderBy: { checkInDate: 'desc' } }),
    prisma.booking.findFirst({ where: { guestName, checkInDate: { gt: date } }, orderBy: { checkInDate: 'asc' } })
]);
```
- ✅ Type-safe ORM operations (no raw SQL)
- ✅ Predictable performance (always processes exactly 2 records)
- ✅ Simple application logic for overlap detection
- ✅ Parallelized queries for optimal performance
- ✅ Easy to test and debug
- ✅ Leverages proper database indexing
- ❌ Two database queries instead of one

**Why I Chose the Two-Query ORM Approach (After Initial Database View Implementation):**

**Initial Approach:** I first implemented a database view solution with calculated `checkOutDate` fields.

**Why I Changed:** Upon reflection, I realized the view approach introduced unnecessary complexity for this specific challenge:
- Required raw SQL query building with `Prisma.$queryRaw`
- Complex dynamic query templating with `Prisma.join()`
- Manual TypeScript type definitions for `BookingWithCheckOut`
- Added database schema objects to maintain

**Final Solution Benefits:** The two-query ORM approach provides:
- Type-safe operations using standard Prisma methods
- Predictable performance (always processes exactly 2 records)
- Parallelized queries with `Promise.all()` for optimal speed
- Simple application logic that's easy to test and debug
- No raw SQL complexity while maintaining excellent performance
- Proper composite indexing: `(guestName, checkInDate)` and `(unitID, checkInDate)` enable O(log n) performance

**Solution Limitation:** This approach can only detect *if* overlapping bookings exist, but not *how many* bookings overlap. If you needed to find all overlapping bookings within a date range (for reporting, complex business rules, or detailed conflict analysis), the database view approach would be superior. However, for the current requirements, simple conflict detection for booking creation and extension, this limitation is acceptable and the code simplicity benefits outweigh this constraint.

**Performance Context:** The composite indexes ensure that even with millions of bookings, conflict detection remains consistently fast  regardless of dataset size.

### New Feature: Booking Extensions
- **Endpoint**: `POST /api/v1/booking/:id/extend`
- **Functionality**: Allows guests to extend their stay if no conflicts exist
- **Validation**: Prevents extending expired bookings and checks availability using the same conflict detection logic

### 🏗️ Architecture Decisions

**Database Design:**
- Strategic composite indexes: `(guestName, checkInDate)` and `(unitID, checkInDate)`
- Optimized for the two-query pattern with O(log n) performance
- Separate databases for development (`app.db`) and testing (`test.db`)

**Code Patterns and Organization:**
- Function-based architecture appropriate for the domain complexity (2 use cases, 6 business rules, single aggregate)
- Clear separation: Controllers → Services → Repositories
- Two-layer validation: Input validation (middleware) + Business validation (services)
- Middleware validation over OpenAPI: Ensures input validation works in production regardless of deployment setup, not just during development
- No layered DDD architecture: Right-sized complexity to avoid over-engineering for this domain scope
- No dependency inversion: Used direct imports for simplicity to avoid over-engineering for this scope

**Testing Strategy:**
- Integration tests over unit tests for better confidence
- Complete database isolation between environments
- Comprehensive coverage of all business rules and edge cases

All decisions prioritize code quality, developer experience, and maintainable performance while avoiding unnecessary complexity.

---

## Context

We would like you to help us with a small service that we have for handling bookings. A booking for us simply tells us which guest will be staying in which unit, and when they arrive and the number of nights that guest will be enjoying our amazing suites, comfortable beds, great snac.. apologies - I got distracted. Bookings are at the very core of our business and it's important that we get these right - we want to make sure that guests always get what they paid for, and also trying to ensure that our unit are continually booked and have as few empty nights where no-one stays as possible. A unit is simply a location that can be booked, think like a hotel room or even a house. For the exercise today, we would like you to help us solve an issue we've been having with our example service, as well as implement a new feature to improve the code base. While this is an opportunity for you to showcase your skills, we also want to be respectful of your time and suggest spending no more than 3 hours on this (of course you may also spend longer if you feel that is necessary)

### You should help us:
Identify and fix a bug that we've been having with bookings - there seems to be something going wrong with the booking process where a guest will arrive at a unit only to find that it's already booked and someone else is there!
There are many ways to solve this bug - there is no single correct answer that we are looking for.

### Implement a new feature:
Allowing guests to extend their stays if possible. It happens that <strike>sometimes</strike> all the time people love staying at our locations so much that they want to extend their stay and remain there a while longer. We'd like a new API that will let them do that

While we provide a choice of projects to work with (either `TS`, `Python`, or `Java`), we understand if you want to implement this in something you're more comfortable with. You are free to re-implement the parts that we have provided in another language, however this may take some time and we would encourage you not spend more time than you're comfortable with!

When implementing, make sure you follow known best practices around architecture, testability, and documentation.

## How to run

### Prerequisites

Make sure to have the following installed

- npm

### Setup

To get started, clone the repository locally and run the following

```shell
[~]$ ./init.sh
```

To make sure that everything is setup properly, open http://localhost:8000 in your browser and you should see an OK message.
The logs should be looking like this

```shell
The server is running on http://localhost:8000
GET / 200 3.088 ms - 16
```

To navigate to the swagger docs, open the url http://localhost:8000/api-docs/

### Running tests

There is one failing test, which is the first task of the challenge.
This test should pass - without changing the expected return code of course ;) - once you have fixed the bug. 
If you need to change the format of the object, or the given interface, please ensure all tests still pass.

```shell
[~]$ npm run test
...
 FAIL  test/booking.test.ts
  Booking API
    ✓ Create fresh booking (52 ms)
    ✓ Same guest same unit booking (16 ms)
    ✓ Same guest different unit booking (12 ms)
    ✓ Different guest same unit booking (12 ms)
    ✕ Different guest same unit booking different date (13 ms)
...
Test Suites: 1 failed, 1 total
Tests:       1 failed, 4 passed, 5 total
Snapshots:   0 total
Time:        0.984 s, estimated 1 s
Ran all test suites.
```
