# Design Spec: Enrollment Approval, Notifications, Ratings & Certificate

**Date:** 2026-03-26
**Status:** Approved
**Stack:** React 18 + TypeScript + Vite + MUI v5 + TailwindCSS + React Query v4 / ASP.NET Core Clean Architecture (CQRS/MediatR) + EF Core + SQL Server

---

## Overview

Four features are added in a single sprint:

1. **Enrollment Approval** — Students apply to join a course; teacher approves or rejects with a reason before the student can access content.
2. **In-App Notifications** — Bell icon in header with polling; surfaces enrollment events and grading events.
3. **Rating & Review** — Enrolled+approved students rate 1–5 stars and leave a comment; real ratings replace static placeholders.
4. **Certificate of Completion** — When all lessons are completed, a printable certificate modal appears on MyLearning.

---

## 1. Enrollment Approval

### Data Model

Add two fields to the existing `Enrollment` entity:

```csharp
public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
public string? RejectionReason { get; set; }
```

New enum `Domain/Enums/EnrollmentStatus.cs`:
```csharp
public enum EnrollmentStatus { Pending, Approved, Rejected }
```

EF migration: `AddEnrollmentStatusAndRejectionReason`
Default for existing rows via migration SQL: `UPDATE Enrollments SET Status = 1` (1 = Approved) — no disruption to current learners.

The existing `Enrollment.CompletedAt` column (currently always null) is used for the Certificate feature. It will be written by the `MarkLessonCompleteCommandHandler` when `completedLessons == totalLessons` after marking a lesson complete. `completedAt` in `MyEnrollmentDto` reads from this persisted column, not computed on-the-fly.

### Re-enrollment Guard

`EnrollCourseCommandHandler` must check for an existing enrollment with `Status != Rejected` for the same `(StudentId, CourseId)`. If one exists, return **409 Conflict**. This allows "Đăng ký lại" after rejection but prevents duplicate Pending rows from spam-clicking.

### Backend API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/enrollments` | Student | Creates enrollment with `Status = Pending`; 409 if non-Rejected enrollment exists |
| `PATCH` | `/enrollments/{id}/approve` | Teacher (course owner) | Sets `Status = Approved`; creates notification for student |
| `PATCH` | `/enrollments/{id}/reject` | Teacher (course owner) | Sets `Status = Rejected`, saves `RejectionReason`; creates notification for student |
| `GET` | `/courses/{courseId}/enrollments/pending` | Teacher (course owner) | Paginated list of `Pending` enrollments; returns `PendingEnrollmentDto` |

`PendingEnrollmentDto`: `enrollmentId`, `studentId`, `studentName`, `studentEmail`, `enrolledAt`

Existing `GET /enrollments/my` — add `status`, `rejectionReason`, `isCompleted`, `completedAt` to `MyEnrollmentDto`.

### Access Guards

The following endpoints must verify `enrollment.Status == Approved` before proceeding:
- `POST /progress/lessons/{id}/complete` (MarkLessonComplete)
- `POST /courses/{courseId}/assignments/{id}/submit` (SubmitAssignment)
- `GET /assignments/my` (GetMyAssignments) — filter to only Approved enrollments

### GET /courses/{courseId}/students (Existing)

Currently returns all enrollments regardless of status. After this feature, this endpoint must filter to `Status = Approved` only (the "Đang học" tab). The new `/courses/{courseId}/enrollments/pending` endpoint handles Pending rows separately.
Add `enrollmentId` field to `CourseStudentDto` so the frontend can call approve/reject.

### Frontend — Teacher (`/teacher/courses/:id/students`)

- Two tabs: **"Đang học"** (Approved, existing) and **"Chờ duyệt (N)"** (Pending, new with count badge).
- Pending tab row: student name, email, enrolled date, **Duyệt** button (green), **Từ chối** button (red).
- Từ chối opens a dialog with a required text input for reason, then calls reject API.
- Both tabs use `enrollmentId` from their respective DTOs to call approve/reject.

### Frontend — Student

**`/courses/:id` (CourseDetail):**
- Before enrollment: "Đăng ký ngay" button.
- After POST (Pending): button replaced with chip **"⏳ Đang chờ duyệt"**.
- If Rejected: chip **"✗ Bị từ chối"** + expandable showing `rejectionReason`. "Đăng ký lại" button calls `POST /enrollments` (backend handles de-dup via 409 on non-Rejected).
- If Approved: existing "Tiếp tục học →" CTA.
- Enrollment status is derived from `GET /enrollments/my` (already called on this page).

**`/my-learning`:**
- Three tabs: **"Đang học"** (Approved), **"Chờ duyệt"** (Pending), **"Bị từ chối"** (Rejected).
- Rejected tab shows course name, teacher, rejection reason, "Đăng ký lại" button.
- All data sourced from existing `GET /enrollments/my` — no new API call needed.

---

## 2. In-App Notifications

### Data Model

New `Notification` entity:

```csharp
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }  // enrollmentId or submissionId for navigation
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
}
```

New enum `Domain/Enums/NotificationType.cs`:
```csharp
public enum NotificationType
{
    EnrollmentPending,   // to Teacher
    EnrollmentApproved,  // to Student
    EnrollmentRejected,  // to Student
    AssignmentGraded     // to Student
}
```

Using an enum (not a free-text string) prevents typos across the four handlers that write notifications.

### Notification Creation

Notifications are created inside existing command handlers:
- `EnrollCourseCommandHandler` → `EnrollmentPending` for **Teacher** (course owner)
- `ApproveEnrollmentCommandHandler` → `EnrollmentApproved` for **Student**
- `RejectEnrollmentCommandHandler` → `EnrollmentRejected` for **Student**
- `GradeSubmissionCommandHandler` → `AssignmentGraded` for **Student**

### Backend API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/notifications` | Any authenticated user | Last 30 notifications for current user, `CreatedAt DESC` |
| `PATCH` | `/notifications/read-all` | Any authenticated user | Mark all as read for current user |

`NotificationDto`: `id`, `type` (string normalized from enum), `message`, `referenceId`, `isRead`, `createdAt`

### Frontend — Header Bell

- Bell icon between nav links and user avatar (desktop); in mobile drawer menu.
- React Query `useQuery` with `refetchInterval: 30_000`.
- Red badge showing unread count; hidden when 0.
- Click opens a Popover listing notifications:
  - Icon per type, message, relative time ("2 phút trước" — use `formatDistanceToNow` from `date-fns`).
  - Clicking a notification: marks it read (optimistic update) + navigates to relevant page based on `type` and `referenceId`.
  - "Đánh dấu tất cả đã đọc" button calls `PATCH /notifications/read-all` then invalidates query.
- Install `date-fns` if not already present (`pnpm add date-fns`).

---

## 3. Rating & Review

### Data Model

New `CourseReview` entity:

```csharp
public class CourseReview : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public int Rating { get; set; }          // 1–5, validated in command handler
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Course Course { get; set; } = null!;
    public User Student { get; set; } = null!;
}
```

Unique index: `(CourseId, StudentId)` — enforced at DB level.
Students cannot delete a review (no DELETE endpoint); they can only update it.

### Backend API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/courses/{courseId}/reviews` | Student (Approved enrollment required) | Upsert review; 403 if student not approved for this course |
| `GET` | `/courses/{courseId}/reviews` | Public | Paginated reviews, newest first. `ReviewDto`: `studentName`, `rating`, `comment`, `createdAt` |
| `GET` | `/courses/{courseId}/reviews/my` | Student | Returns own `ReviewDto` or **204 No Content** if no review (not 404, to avoid React Query error state) |

`GET /courses` and `GET /courses/{id}` responses add:
- `averageRating: double` (0.0 if no reviews)
- `reviewCount: int`

Computed via SQL AVG/COUNT in query handlers — not stored as columns.

### Frontend — CourseDetail

- New tab **"Đánh giá (N)"** after the Bài tập tab.
- Rating summary at top: large number + star icons + "(N đánh giá)".
- If enrolled+approved and `GET /reviews/my` returns 204: show star-click rating widget + textarea + submit.
  - Frontend treats **204** (no review yet) as `null` data — not an error — by checking response status before throwing.
- If `GET /reviews/my` returns 200: pre-fill form with existing values, button reads "Cập nhật".
- Review list below form: avatar initial, student name, star rating, comment, relative date.

### Frontend — CourseCard & CourseList

Replace hardcoded `4.8` and `1.2k` with `course.averageRating.toFixed(1)` and `course.reviewCount`.
When `reviewCount === 0`: show "Chưa có đánh giá" instead of stars.

---

## 4. Certificate of Completion

### Logic

No new database table. Uses the existing `Enrollment.CompletedAt` column (currently always null).

**When to write `CompletedAt`:** `MarkLessonCompleteCommandHandler` — after saving `LessonProgress`, query `completedLessons` for the enrollment. If `completedLessons == totalLessons`, set `enrollment.CompletedAt = DateTime.UtcNow`.

`MyEnrollmentDto` additions: `isCompleted: bool` (`CompletedAt != null`), `completedAt: DateTime?`.

### Backend API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/enrollments/{id}/certificate` | Student (enrollment owner) | Returns `CertificateDto`; **403** if `CompletedAt == null` |

```csharp
public record CertificateDto(
    string StudentName,
    string CourseTitle,
    string TeacherName,
    string CategoryName,
    DateTime CompletedAt,
    Guid EnrollmentId);
```

### Frontend — MyLearning

- Courses with `isCompleted = true` in "Đang học" tab show a green **"✓ Hoàn thành"** badge + **"Xem chứng chỉ"** button.
- Clicking calls `GET /enrollments/{id}/certificate`, then opens a `Dialog` modal:
  - LearnHub logo + indigo/purple gradient header
  - "Chứng nhận hoàn thành khóa học" heading
  - Student full name (large, Poppins bold)
  - Course title, teacher name, category, completion date
  - Decorative border styling + seal icon
- **"In chứng chỉ"** button calls `window.print()`.
- Add `@media print` CSS in the modal component: hide everything except certificate content.

---

## Implementation Order

1. **Enrollment Approval** — foundational; affects access guards and MyLearning tabs
2. **Notifications** — depends on Enrollment Approval command handlers existing
3. **Rating & Review** — independent; depends only on enrollment status check
4. **Certificate of Completion** — independent; lightest lift (no new tables)

---

## Files Affected

### Backend (new)
- `Domain/Entities/Notification.cs`
- `Domain/Entities/CourseReview.cs`
- `Domain/Enums/EnrollmentStatus.cs`
- `Domain/Enums/NotificationType.cs`
- `Application/Enrollments/Commands/ApproveEnrollment/ApproveEnrollmentCommand.cs` + Handler
- `Application/Enrollments/Commands/RejectEnrollment/RejectEnrollmentCommand.cs` + Handler
- `Application/Enrollments/Queries/GetPendingEnrollments/GetPendingEnrollmentsQuery.cs` + Handler
- `Application/Notifications/Queries/GetNotifications/GetNotificationsQuery.cs` + Handler
- `Application/Notifications/Commands/MarkAllRead/MarkAllReadCommand.cs` + Handler
- `Application/Reviews/Commands/UpsertReview/UpsertReviewCommand.cs` + Handler
- `Application/Reviews/Queries/GetReviews/GetReviewsQuery.cs` + Handler
- `Application/Reviews/Queries/GetMyReview/GetMyReviewQuery.cs` + Handler
- `Application/Enrollments/Queries/GetCertificate/GetCertificateQuery.cs` + Handler
- `Infrastructure/Migrations/AddEnrollmentStatus` (EF migration)
- `Infrastructure/Migrations/AddNotification` (EF migration)
- `Infrastructure/Migrations/AddCourseReview` (EF migration)
- `API/Controllers/NotificationsController.cs`
- `API/Controllers/ReviewsController.cs`

### Backend (modified)
- `Domain/Entities/Enrollment.cs` — add `Status`, `RejectionReason`
- `Application/Enrollments/Commands/EnrollCourse/EnrollCourseCommandHandler.cs` — set `Pending`, add 409 guard, create teacher notification
- `Application/Enrollments/Queries/GetMyEnrollments/` — add `status`, `rejectionReason`, `isCompleted`, `completedAt` to `MyEnrollmentDto`
- `Application/Enrollments/Queries/GetCourseStudents/` — filter to `Approved`; add `enrollmentId` to `CourseStudentDto`
- `Application/Assignments/Commands/GradeSubmission/GradeSubmissionCommandHandler.cs` — create `AssignmentGraded` notification
- `Application/Assignments/Queries/GetMyAssignments/GetMyAssignmentsQueryHandler.cs` — filter to Approved enrollments only
- `Application/Enrollments/Commands/MarkLessonComplete/MarkLessonCompleteCommandHandler.cs` — set `Enrollment.CompletedAt` when all lessons done
- `Application/Courses/Queries/GetCourses/` — add `averageRating`, `reviewCount` to `CourseListDto`
- `Application/Courses/Queries/GetCourseById/` — add `averageRating`, `reviewCount` to `CourseDetailDto`
- `API/Controllers/EnrollmentsController.cs` — add approve/reject/pending/certificate endpoints
- `Infrastructure/ApplicationDbContext.cs` — add `DbSet<Notification>`, `DbSet<CourseReview>`

### Frontend (new)
- `src/apis/notifications.api.ts`
- `src/apis/reviews.api.ts`
- `src/components/NotificationBell.tsx`
- `src/pages/student/CertificateModal.tsx`

### Frontend (modified)
- `src/apis/enrollments.api.ts` — add `status`, `rejectionReason`, `isCompleted`, `completedAt`, `enrollmentId` to DTOs
- `src/apis/courses.api.ts` — add `averageRating`, `reviewCount` to `CourseListDto` and `CourseDetailDto`
- `src/pages/courses/CourseDetail.tsx` — enrollment status chips, "Đăng ký lại", Reviews tab
- `src/pages/student/MyLearning.tsx` — three tabs, certificate button
- `src/pages/teacher/TeacherStudents.tsx` — Pending tab with approve/reject
- `src/components/CourseCard.tsx` — real rating data
- `src/layout/header/index.tsx` — `NotificationBell` component
