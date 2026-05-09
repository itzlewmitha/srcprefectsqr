# Security Specification: PrefectTrack Pro

## Data Invariants
1. An attendance log must have a valid `prefectId` matching an existing prefect.
2. Only authorized teachers can create attendance logs or reports.
3. Only head admins can manage the `users` (teachers) and suspend/activate prefects.
4. Total head admins must not exceed 3.

## The Dirty Dozen Payloads
1. Attempt to create a prefect record from a teacher account.
2. Attempt to create an attendance log with a manually spoofed timestamp.
3. Attempt to delete an attendance log from a teacher account.
4. Attempt to modify a report after it has been filed.
5. Attempt to promote oneself to admin.
6. Attempt to scan for the same prefect in the same time window twice (handled by logic + rules check).
7. Attempt to create a prefect with a 1MB name string.
8. Attempt to read reports of other prefects as a teacher (Teachers can only see what they report). Actually, admins see all reports.
9. Attempt to register a prefect without an email.
10. Attempt to suspend a prefect as a teacher.
11. Attempt to add a 4th head admin.
12. Attempt to read the entire `users` collection as a student/anonymous user.

## Initial Rules Draft
- `match /prefects/{id}`:
  - `read`: if isSignedIn() && (isTeacher() || isAdmin())
  - `write`: if isAdmin()
- `match /attendance/{id}`:
  - `create`: if isTeacher() && isValidAttendance(incoming())
  - `read`: if isSignedIn() && (isTeacher() || isAdmin())
- `match /reports/{id}`:
  - `create`: if isTeacher() && isValidReport(incoming())
  - `read`: if isAdmin()
- `match /users/{id}`:
  - `read`: if isSignedIn() && (isTeacher() || isAdmin())
  - `write`: if isAdmin() && checkAdminLimit()
