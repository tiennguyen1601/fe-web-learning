# Enrollment Approval, Notifications, Reviews & Certificate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enrollment approval flow, in-app notification bell, course ratings/reviews, and a printable completion certificate to the e-learning platform.

**Architecture:** Four independently deployable backend+frontend feature slices built on the existing Clean Architecture (CQRS/MediatR). Each slice follows the same pattern: domain entity → EF migration → command/query handlers → controller endpoint → frontend API client → UI component. Features are implemented in dependency order: Enrollment Approval first (foundational access guards), then Notifications (depends on approval handlers), then Reviews and Certificate (independent).

**Tech Stack:** ASP.NET Core 8, EF Core, MediatR, SQL Server / React 18, TypeScript, MUI v5, TailwindCSS, React Query v4, React Hook Form + Zod, Framer Motion

**Backend root:** `d:/FPT/Project/LearningWeb/src/`
**Frontend root:** `d:/FPT/Project/WebLearning/src/`

**Build commands:**
- Backend: `cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q`
- Full backend build (requires API not running): `cd d:/FPT/Project/LearningWeb && dotnet build --nologo -q`
- Frontend: `cd d:/FPT/Project/WebLearning && pnpm run build`
- EF migration (requires API stopped): `cd d:/FPT/Project/LearningWeb && dotnet ef migrations add <Name> --project src/LearningWeb.Infrastructure --startup-project src/LearningWeb.API`

**Key discovery:** `MarkLessonCompleteCommandHandler` already writes `enrollment.CompletedAt` when all lessons are done — Certificate feature only needs the query + endpoint + frontend.

---

## FEATURE 1: ENROLLMENT APPROVAL

---

### Task 1: Domain — EnrollmentStatus enum + Enrollment entity fields

**Files:**
- Create: `LearningWeb.Domain/Enums/EnrollmentStatus.cs`
- Modify: `LearningWeb.Domain/Entities/Enrollment.cs`

- [ ] **Step 1: Create EnrollmentStatus enum**

```csharp
// LearningWeb.Domain/Enums/EnrollmentStatus.cs
namespace LearningWeb.Domain.Enums;

public enum EnrollmentStatus { Pending, Approved, Rejected }
```

- [ ] **Step 2: Add Status and RejectionReason to Enrollment entity**

In `LearningWeb.Domain/Entities/Enrollment.cs`, add after `EnrolledAt`:
```csharp
public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
public string? RejectionReason { get; set; }
```
Add using: `using LearningWeb.Domain.Enums;` at top.

- [ ] **Step 3: Verify Application project builds**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
```
Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 4: Commit**

```bash
cd d:/FPT/Project/LearningWeb
git add src/LearningWeb.Domain/
git commit -m "feat: add EnrollmentStatus enum and fields to Enrollment entity"
```

---

### Task 2: Update EnrollCourse handler — set Pending status, fix duplicate guard

**Files:**
- Modify: `LearningWeb.Application/Enrollments/Commands/EnrollCourse/EnrollCourseCommandHandler.cs`

**Context:** Currently throws `ConflictException` on any duplicate enrollment. After this task, it should allow re-enrollment only if the existing enrollment is `Rejected`.

- [ ] **Step 1: Replace the duplicate check and set Status = Pending**

Replace the existing enrollment check block and enrollment creation:
```csharp
// Replace:
if (await _db.Enrollments.AnyAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId, ct))
    throw new ConflictException("You are already enrolled in this course.");

var enrollment = new Enrollment
{
    Id = Guid.NewGuid(),
    StudentId = request.StudentId,
    CourseId = request.CourseId,
    EnrolledAt = DateTime.UtcNow
};

// With:
var existing = await _db.Enrollments
    .FirstOrDefaultAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId, ct);

if (existing != null && existing.Status != EnrollmentStatus.Rejected)
    throw new ConflictException("Bạn đã đăng ký khóa học này.");

var enrollment = new Enrollment
{
    Id = Guid.NewGuid(),
    StudentId = request.StudentId,
    CourseId = request.CourseId,
    EnrolledAt = DateTime.UtcNow,
    Status = EnrollmentStatus.Pending,
};
```
Add using: `using LearningWeb.Domain.Enums;`

- [ ] **Step 2: Build**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
```
Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 3: Commit**

```bash
git add src/LearningWeb.Application/Enrollments/Commands/EnrollCourse/
git commit -m "feat: set enrollment status to Pending on enroll; allow re-enroll after rejection"
```

---

### Task 3: ApproveEnrollment command + handler

**Files:**
- Create: `LearningWeb.Application/Enrollments/Commands/ApproveEnrollment/ApproveEnrollmentCommand.cs`
- Create: `LearningWeb.Application/Enrollments/Commands/ApproveEnrollment/ApproveEnrollmentCommandHandler.cs`

- [ ] **Step 1: Create command**

```csharp
// ApproveEnrollmentCommand.cs
using MediatR;

namespace LearningWeb.Application.Enrollments.Commands.ApproveEnrollment;

public record ApproveEnrollmentCommand(Guid EnrollmentId, Guid TeacherId) : IRequest;
```

- [ ] **Step 2: Create handler**

```csharp
// ApproveEnrollmentCommandHandler.cs
using LearningWeb.Application.Common.Exceptions;
using LearningWeb.Application.Interfaces;
using LearningWeb.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Enrollments.Commands.ApproveEnrollment;

public class ApproveEnrollmentCommandHandler : IRequestHandler<ApproveEnrollmentCommand>
{
    private readonly IApplicationDbContext _db;
    public ApproveEnrollmentCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(ApproveEnrollmentCommand request, CancellationToken ct)
    {
        var enrollment = await _db.Enrollments
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, ct)
            ?? throw new NotFoundException("Enrollment", request.EnrollmentId);

        if (enrollment.Course.TeacherId != request.TeacherId)
            throw new ForbiddenException();

        if (enrollment.Status != EnrollmentStatus.Pending)
            throw new BadRequestException("Chỉ có thể duyệt đơn đang chờ.");

        enrollment.Status = EnrollmentStatus.Approved;
        await _db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 3: Build**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
```
Expected: `Build succeeded. 0 Error(s)`

- [ ] **Step 4: Commit**

```bash
git add src/LearningWeb.Application/Enrollments/Commands/ApproveEnrollment/
git commit -m "feat: add ApproveEnrollment command handler"
```

---

### Task 4: RejectEnrollment command + handler

**Files:**
- Create: `LearningWeb.Application/Enrollments/Commands/RejectEnrollment/RejectEnrollmentCommand.cs`
- Create: `LearningWeb.Application/Enrollments/Commands/RejectEnrollment/RejectEnrollmentCommandHandler.cs`

- [ ] **Step 1: Create command**

```csharp
// RejectEnrollmentCommand.cs
using MediatR;

namespace LearningWeb.Application.Enrollments.Commands.RejectEnrollment;

public record RejectEnrollmentCommand(Guid EnrollmentId, Guid TeacherId, string Reason) : IRequest;
```

- [ ] **Step 2: Create handler**

```csharp
// RejectEnrollmentCommandHandler.cs
using LearningWeb.Application.Common.Exceptions;
using LearningWeb.Application.Interfaces;
using LearningWeb.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Enrollments.Commands.RejectEnrollment;

public class RejectEnrollmentCommandHandler : IRequestHandler<RejectEnrollmentCommand>
{
    private readonly IApplicationDbContext _db;
    public RejectEnrollmentCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(RejectEnrollmentCommand request, CancellationToken ct)
    {
        var enrollment = await _db.Enrollments
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, ct)
            ?? throw new NotFoundException("Enrollment", request.EnrollmentId);

        if (enrollment.Course.TeacherId != request.TeacherId)
            throw new ForbiddenException();

        if (enrollment.Status != EnrollmentStatus.Pending)
            throw new BadRequestException("Chỉ có thể từ chối đơn đang chờ.");

        enrollment.Status = EnrollmentStatus.Rejected;
        enrollment.RejectionReason = request.Reason;
        await _db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Enrollments/Commands/RejectEnrollment/
git commit -m "feat: add RejectEnrollment command handler"
```

---

### Task 5: GetPendingEnrollments query + handler

**Files:**
- Create: `LearningWeb.Application/Enrollments/Queries/GetPendingEnrollments/GetPendingEnrollmentsQuery.cs`
- Create: `LearningWeb.Application/Enrollments/Queries/GetPendingEnrollments/GetPendingEnrollmentsQueryHandler.cs`

- [ ] **Step 1: Create query + DTO**

```csharp
// GetPendingEnrollmentsQuery.cs
using MediatR;

namespace LearningWeb.Application.Enrollments.Queries.GetPendingEnrollments;

public record PendingEnrollmentDto(
    Guid EnrollmentId,
    Guid StudentId,
    string StudentName,
    string StudentEmail,
    DateTime EnrolledAt);

public record GetPendingEnrollmentsQuery(Guid CourseId, Guid TeacherId) : IRequest<List<PendingEnrollmentDto>>;
```

- [ ] **Step 2: Create handler**

```csharp
// GetPendingEnrollmentsQueryHandler.cs
using LearningWeb.Application.Common.Exceptions;
using LearningWeb.Application.Interfaces;
using LearningWeb.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Enrollments.Queries.GetPendingEnrollments;

public class GetPendingEnrollmentsQueryHandler : IRequestHandler<GetPendingEnrollmentsQuery, List<PendingEnrollmentDto>>
{
    private readonly IApplicationDbContext _db;
    public GetPendingEnrollmentsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<PendingEnrollmentDto>> Handle(GetPendingEnrollmentsQuery request, CancellationToken ct)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Course), request.CourseId);

        if (course.TeacherId != request.TeacherId)
            throw new ForbiddenException();

        return await _db.Enrollments
            .Include(e => e.Student)
            .Where(e => e.CourseId == request.CourseId && e.Status == EnrollmentStatus.Pending)
            .OrderBy(e => e.EnrolledAt)
            .Select(e => new PendingEnrollmentDto(
                e.Id, e.StudentId, e.Student.FullName, e.Student.Email, e.EnrolledAt))
            .ToListAsync(ct);
    }
}
```

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Enrollments/Queries/GetPendingEnrollments/
git commit -m "feat: add GetPendingEnrollments query handler"
```

---

### Task 6: Update GetMyEnrollments — add status, rejectionReason, isCompleted, completedAt

**Files:**
- Modify: `LearningWeb.Application/Enrollments/Queries/GetMyEnrollments/GetMyEnrollmentsQuery.cs`
- Modify: `LearningWeb.Application/Enrollments/Queries/GetMyEnrollments/GetMyEnrollmentsQueryHandler.cs`

- [ ] **Step 1: Add new fields to MyEnrollmentDto**

In `GetMyEnrollmentsQuery.cs`, replace the `MyEnrollmentDto` record:
```csharp
public record MyEnrollmentDto(
    Guid EnrollmentId,
    Guid CourseId,
    string CourseTitle,
    string? ThumbnailUrl,
    string TeacherName,
    DateTime EnrolledAt,
    DateTime? CompletedAt,
    int TotalLessons,
    int CompletedLessons,
    int ProgressPercent,
    string Status,           // "Pending" | "Approved" | "Rejected"
    string? RejectionReason,
    bool IsCompleted);
```

- [ ] **Step 2: Update handler Select projection**

In `GetMyEnrollmentsQueryHandler.cs`, update the projection to add the 3 new fields at the end:
```csharp
// At the end of the Select(e => { ... return new MyEnrollmentDto(...); })
// Add after ProgressPercent:
e.Status.ToString(),
e.RejectionReason,
e.CompletedAt != null
```
Add `using LearningWeb.Domain.Enums;` if not present.

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Enrollments/Queries/GetMyEnrollments/
git commit -m "feat: add status, rejectionReason, isCompleted to MyEnrollmentDto"
```

---

### Task 7: Update GetCourseStudents — filter to Approved, add enrollmentId

**Files:**
- Modify: `LearningWeb.Application/Courses/Queries/GetCourseStudents/GetCourseStudentsQuery.cs`
- Modify: `LearningWeb.Application/Courses/Queries/GetCourseStudents/GetCourseStudentsQueryHandler.cs`

- [ ] **Step 1: Add enrollmentId to CourseStudentDto**

In `GetCourseStudentsQuery.cs`, replace the record:
```csharp
public record CourseStudentDto(
    Guid EnrollmentId,   // NEW — first field
    Guid StudentId,
    string FullName,
    string Email,
    DateTime EnrolledAt,
    DateTime? CompletedAt,
    int TotalLessons,
    int CompletedLessons,
    int ProgressPercent);
```

- [ ] **Step 2: Filter to Approved and map enrollmentId in handler**

In `GetCourseStudentsQueryHandler.cs`:
1. Add `.Where(e => e.Status == EnrollmentStatus.Approved)` after `.Where(e => e.CourseId == request.CourseId)`.
2. Add `e.Id` as the first argument in `new CourseStudentDto(e.Id, e.StudentId, ...)`.
3. Add `using LearningWeb.Domain.Enums;`.

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Courses/Queries/GetCourseStudents/
git commit -m "feat: filter course students to Approved; expose enrollmentId in DTO"
```

---

### Task 8: Access guards — filter GetMyAssignments and SubmitAssignment to Approved enrollments

**Files:**
- Modify: `LearningWeb.Application/Assignments/Queries/GetMyAssignments/GetMyAssignmentsQueryHandler.cs`
- Modify: `LearningWeb.Application/Assignments/Commands/SubmitAssignment/SubmitAssignmentCommandHandler.cs`

- [ ] **Step 1: Filter GetMyAssignments to Approved enrollments only**

In `GetMyAssignmentsQueryHandler.cs`, change the enrolled course IDs query:
```csharp
// Replace:
var enrolledCourseIds = await _db.Enrollments
    .Where(e => e.StudentId == request.StudentId)
    .Select(e => e.CourseId)
    .ToListAsync(ct);

// With:
var enrolledCourseIds = await _db.Enrollments
    .Where(e => e.StudentId == request.StudentId && e.Status == EnrollmentStatus.Approved)
    .Select(e => e.CourseId)
    .ToListAsync(ct);
```
Add `using LearningWeb.Domain.Enums;`.

- [ ] **Step 2: Add Approved check to SubmitAssignment**

In `SubmitAssignmentCommandHandler.cs`, find the enrollment existence check and add status guard:
```csharp
// Find the enrollment check (currently checks AnyAsync for enrollment existence)
// Replace it with:
var enrollment = await _db.Enrollments
    .FirstOrDefaultAsync(e => e.CourseId == assignment.CourseId && e.StudentId == request.StudentId, ct);

if (enrollment == null || enrollment.Status != EnrollmentStatus.Approved)
    throw new ForbiddenException("Bạn chưa được duyệt vào khóa học này.");
```
Add `using LearningWeb.Domain.Enums;`.

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Assignments/
git commit -m "feat: restrict assignment access to Approved enrollments"
```

---

### Task 9: EF Migration + EnrollmentsController new endpoints

**Files:**
- Modify: `LearningWeb.API/Controllers/EnrollmentsController.cs`
- Auto-generated: `LearningWeb.Infrastructure/Migrations/`

- [ ] **Step 1: Add new endpoints to EnrollmentsController**

Add these methods and request records to `EnrollmentsController.cs`:
```csharp
// Add usings at top:
using LearningWeb.Application.Enrollments.Commands.ApproveEnrollment;
using LearningWeb.Application.Enrollments.Commands.RejectEnrollment;
using LearningWeb.Application.Enrollments.Queries.GetPendingEnrollments;

// Add these controller action attributes and methods:

[HttpPatch("{id:guid}/approve")]
[Authorize(Roles = "Teacher")]
public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
{
    await _mediator.Send(new ApproveEnrollmentCommand(id, _currentUser.UserId), ct);
    return NoContent();
}

[HttpPatch("{id:guid}/reject")]
[Authorize(Roles = "Teacher")]
public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest request, CancellationToken ct)
{
    await _mediator.Send(new RejectEnrollmentCommand(id, _currentUser.UserId, request.Reason), ct);
    return NoContent();
}
```

Also add a new controller for pending enrollments. Add this at bottom of file (or create separate controller):
```csharp
// Add to EnrollmentsController — pending enrollments via course route
// NOTE: This endpoint lives under /courses/{courseId}/enrollments/pending
// Add it to CoursesController or create a new route attribute on EnrollmentsController:
```

**Create a new controller** `LearningWeb.API/Controllers/CourseEnrollmentsController.cs`:
```csharp
using Asp.Versioning;
using LearningWeb.Application.Enrollments.Queries.GetPendingEnrollments;
using LearningWeb.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningWeb.API.Controllers;

[ApiController]
[ApiVersion(1)]
[Route("api/v{version:apiVersion}/courses/{courseId:guid}/enrollments")]
[Authorize]
public class CourseEnrollmentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CourseEnrollmentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetPending(Guid courseId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPendingEnrollmentsQuery(courseId, _currentUser.UserId), ct);
        return Ok(result);
    }
}
```

Also add `RejectRequest` record to `EnrollmentsController.cs`:
```csharp
public record RejectRequest(string Reason);
```

- [ ] **Step 2: Stop the running API process if any**

```powershell
# In PowerShell or Task Manager, stop any running LearningWeb.API process
powershell -Command "Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force"
```
Wait 2 seconds.

- [ ] **Step 3: Run EF migration**

```bash
cd d:/FPT/Project/LearningWeb
dotnet ef migrations add AddEnrollmentStatus \
  --project src/LearningWeb.Infrastructure \
  --startup-project src/LearningWeb.API
```
Expected: new migration file created in `src/LearningWeb.Infrastructure/Migrations/`.

- [ ] **Step 4: Verify migration SQL includes default value**

Open the generated migration file. Find the `AddColumn` for `Status`. Add a manual `Sql` call in `Up()` after the column additions:
```csharp
// After migrationBuilder.AddColumn for Status:
migrationBuilder.Sql("UPDATE [Enrollments] SET [Status] = 1 WHERE [Status] = 0");
// This sets all existing rows to Approved (1) — existing learners are unaffected
```

- [ ] **Step 5: Full build and commit**

```bash
cd d:/FPT/Project/LearningWeb && dotnet build --nologo -q
git add src/
git commit -m "feat: add approve/reject/pending enrollment endpoints + EF migration"
```

---

### Task 10: Frontend — enrollments.api.ts types + API methods

**Files:**
- Modify: `d:/FPT/Project/WebLearning/src/apis/enrollments.api.ts`

- [ ] **Step 1: Add new types and update MyEnrollmentDto**

Add to `enrollments.api.ts`:
```typescript
export type EnrollmentStatus = 'Pending' | 'Approved' | 'Rejected'

export interface PendingEnrollmentDto {
  enrollmentId: string
  studentId: string
  studentName: string
  studentEmail: string
  enrolledAt: string
}
```

Update `MyEnrollmentDto` interface — add fields:
```typescript
  status: EnrollmentStatus
  rejectionReason?: string
  isCompleted: boolean
```

- [ ] **Step 2: Add approve, reject, getPending API methods**

```typescript
approve: (enrollmentId: string): Promise<void> =>
  axiosClient.patch(`/enrollments/${enrollmentId}/approve`),

reject: (enrollmentId: string, reason: string): Promise<void> =>
  axiosClient.patch(`/enrollments/${enrollmentId}/reject`, { reason }),

getPending: (courseId: string): Promise<PendingEnrollmentDto[]> =>
  axiosClient.get(`/courses/${courseId}/enrollments/pending`),
```

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/apis/enrollments.api.ts
git commit -m "feat: add enrollment status types and approve/reject/pending API methods"
```

---

### Task 11: Frontend — CourseDetail enrollment status chips

**Files:**
- Modify: `d:/FPT/Project/WebLearning/src/pages/courses/CourseDetail.tsx`

**Context:** The sticky right card currently shows either "Tiếp tục học" (enrolled) or an enroll button (not enrolled). Now it must handle three pending states.

- [ ] **Step 1: Update enrollment status derivation**

In `CourseDetail.tsx`, find the `isEnrolled` variable. Replace with:
```typescript
const myEnrollment = enrollments?.items.find((e) => e.courseId === id)
const isEnrolled = myEnrollment?.status === 'Approved'
const isPending = myEnrollment?.status === 'Pending'
const isRejected = myEnrollment?.status === 'Rejected'
```

- [ ] **Step 2: Replace CTA button logic in sticky card**

Replace the existing enroll/continue button block with:
```tsx
{isEnrolled ? (
  sorted.length > 0 ? (
    <button
      onClick={() => navigate(`/learn/${id}/lesson/${sorted[0].id}`)}
      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-md active:scale-95"
      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
    >
      Tiếp tục học →
    </button>
  ) : (
    <button disabled className="w-full py-3 rounded-xl font-bold text-sm text-gray-400 bg-gray-100 cursor-not-allowed">
      Chưa có bài học
    </button>
  )
) : isPending ? (
  <div className="w-full py-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
    <span className="text-amber-700 font-semibold text-sm">⏳ Đang chờ giáo viên duyệt</span>
  </div>
) : isRejected ? (
  <div className="space-y-2">
    <div className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-center">
      <span className="text-red-600 font-semibold text-sm">✗ Yêu cầu bị từ chối</span>
    </div>
    {myEnrollment?.rejectionReason && (
      <p className="text-xs text-gray-500 text-center px-1">Lý do: {myEnrollment.rejectionReason}</p>
    )}
    <button
      disabled={isPending}
      onClick={() => {
        if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
        else enroll()
      }}
      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
    >
      Đăng ký lại
    </button>
  </div>
) : (
  <button
    disabled={isPending}
    onClick={() => {
      if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
      else enroll()
    }}
    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-60"
    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
  >
    {isPending ? 'Đang xử lý...' : course.isFree ? 'Đăng ký miễn phí' : 'Đăng ký ngay'}
  </button>
)}
```

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/pages/courses/CourseDetail.tsx
git commit -m "feat: show enrollment status (pending/rejected) on CourseDetail"
```

---

### Task 12: Frontend — MyLearning three tabs

**Files:**
- Modify: `d:/FPT/Project/WebLearning/src/pages/student/MyLearning.tsx`

- [ ] **Step 1: Read the current MyLearning.tsx** to understand existing structure before editing.

- [ ] **Step 2: Split enrollments into three groups and add tabs**

At the top of the component, after fetching enrollments:
```typescript
const approved = enrollments?.items.filter(e => e.status === 'Approved') ?? []
const pending  = enrollments?.items.filter(e => e.status === 'Pending')  ?? []
const rejected = enrollments?.items.filter(e => e.status === 'Rejected') ?? []
```

Add a tab bar (3 tabs: Đang học / Chờ duyệt / Bị từ chối) and a `tab` state variable. Render the appropriate list based on active tab.

For **Pending tab**, show a card per course: course title, teacher name, date applied, "⏳ Chờ duyệt" badge.

For **Rejected tab**, show: course title, rejection reason in a red box, "Đăng ký lại" button that navigates to `/courses/:courseId`.

For **Approved tab**, keep the existing course card layout unchanged.

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/pages/student/MyLearning.tsx
git commit -m "feat: split MyLearning into Approved/Pending/Rejected tabs"
```

---

### Task 13: Frontend — TeacherStudents pending tab + approve/reject

**Files:**
- Modify: `d:/FPT/Project/WebLearning/src/pages/teacher/TeacherStudents.tsx`

- [ ] **Step 1: Read current TeacherStudents.tsx** to understand existing structure.

- [ ] **Step 2: Add pending enrollments query**

```typescript
const { data: pendingEnrollments } = useQuery({
  queryKey: ['enrollments', 'pending', courseId],
  queryFn: () => enrollmentsApi.getPending(courseId!),
  enabled: !!courseId,
})
```

- [ ] **Step 3: Add approve/reject mutations**

```typescript
const { mutate: approve } = useMutation({
  mutationFn: (enrollmentId: string) => enrollmentsApi.approve(enrollmentId),
  onSuccess: () => {
    toast.success('Đã duyệt học viên!')
    qc.invalidateQueries({ queryKey: ['enrollments', 'pending', courseId] })
    qc.invalidateQueries({ queryKey: ['course-students', courseId] })
  },
})

const { mutate: reject } = useMutation({
  mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) =>
    enrollmentsApi.reject(enrollmentId, reason),
  onSuccess: () => {
    toast.success('Đã từ chối!')
    qc.invalidateQueries({ queryKey: ['enrollments', 'pending', courseId] })
    setRejectDialogId(null)
  },
})
```

- [ ] **Step 4: Add tabs UI and pending list**

Add a `tab` state (`'approved' | 'pending'`). Add tab bar at the top. Render pending enrollments in the pending tab with Duyệt/Từ chối buttons. Add a reject dialog with a reason text input (required, min 5 chars).

- [ ] **Step 5: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/pages/teacher/TeacherStudents.tsx
git commit -m "feat: add pending enrollments tab with approve/reject to TeacherStudents"
```

---

## FEATURE 2: IN-APP NOTIFICATIONS

---

### Task 14: Domain — NotificationType enum + Notification entity

**Files:**
- Create: `LearningWeb.Domain/Enums/NotificationType.cs`
- Create: `LearningWeb.Domain/Entities/Notification.cs`

- [ ] **Step 1: Create NotificationType enum**

```csharp
// LearningWeb.Domain/Enums/NotificationType.cs
namespace LearningWeb.Domain.Enums;

public enum NotificationType
{
    EnrollmentPending,   // to Teacher
    EnrollmentApproved,  // to Student
    EnrollmentRejected,  // to Student
    AssignmentGraded     // to Student
}
```

- [ ] **Step 2: Create Notification entity**

```csharp
// LearningWeb.Domain/Entities/Notification.cs
using LearningWeb.Domain.Common;
using LearningWeb.Domain.Enums;

namespace LearningWeb.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
```

- [ ] **Step 3: Add DbSet to IApplicationDbContext and ApplicationDbContext**

In `LearningWeb.Application/Interfaces/IApplicationDbContext.cs`:
```csharp
DbSet<Notification> Notifications { get; }
```

In `LearningWeb.Infrastructure/Persistence/ApplicationDbContext.cs`:
```csharp
public DbSet<Notification> Notifications => Set<Notification>();
```

- [ ] **Step 4: Build Application project**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
```

- [ ] **Step 5: Run EF migration (API must be stopped)**

```bash
cd d:/FPT/Project/LearningWeb
dotnet ef migrations add AddNotification \
  --project src/LearningWeb.Infrastructure \
  --startup-project src/LearningWeb.API
```

- [ ] **Step 6: Commit**

```bash
git add src/LearningWeb.Domain/ src/LearningWeb.Application/Interfaces/ src/LearningWeb.Infrastructure/
git commit -m "feat: add Notification entity, NotificationType enum, DbSet, migration"
```

---

### Task 15: Notification creation in 4 command handlers

**Files:**
- Modify: `LearningWeb.Application/Enrollments/Commands/EnrollCourse/EnrollCourseCommandHandler.cs`
- Modify: `LearningWeb.Application/Enrollments/Commands/ApproveEnrollment/ApproveEnrollmentCommandHandler.cs`
- Modify: `LearningWeb.Application/Enrollments/Commands/RejectEnrollment/RejectEnrollmentCommandHandler.cs`
- Modify: `LearningWeb.Application/Assignments/Commands/GradeSubmission/GradeSubmissionCommandHandler.cs`

- [ ] **Step 1: Add notification helper — create a private static helper method or inline in each handler**

The pattern for all four handlers is the same — add a `Notification` to `_db.Notifications` before `SaveChangesAsync`. Add `using LearningWeb.Domain.Entities;` and `using LearningWeb.Domain.Enums;` to each handler.

**EnrollCourseCommandHandler** — after creating enrollment, before `SaveChangesAsync`, add notification to teacher:
```csharp
// Get teacher id from course
_db.Notifications.Add(new Notification
{
    Id = Guid.NewGuid(),
    UserId = course.TeacherId,
    Type = NotificationType.EnrollmentPending,
    Message = $"Học viên mới đăng ký khóa học \"{course.Title}\".",
    ReferenceId = enrollment.Id,
    CreatedAt = DateTime.UtcNow,
});
```

**ApproveEnrollmentCommandHandler** — add notification to student:
```csharp
_db.Notifications.Add(new Notification
{
    Id = Guid.NewGuid(),
    UserId = enrollment.StudentId,
    Type = NotificationType.EnrollmentApproved,
    Message = $"Yêu cầu đăng ký khóa học \"{enrollment.Course.Title}\" đã được duyệt!",
    ReferenceId = enrollment.CourseId,
    CreatedAt = DateTime.UtcNow,
});
```

**RejectEnrollmentCommandHandler** — add notification to student:
```csharp
_db.Notifications.Add(new Notification
{
    Id = Guid.NewGuid(),
    UserId = enrollment.StudentId,
    Type = NotificationType.EnrollmentRejected,
    Message = $"Yêu cầu đăng ký khóa học \"{enrollment.Course.Title}\" đã bị từ chối.",
    ReferenceId = enrollment.CourseId,
    CreatedAt = DateTime.UtcNow,
});
```

**GradeSubmissionCommandHandler** — after grading, add notification to student (need to include student from submission):
```csharp
// submission.StudentId is already available
_db.Notifications.Add(new Notification
{
    Id = Guid.NewGuid(),
    UserId = submission.StudentId,
    Type = NotificationType.AssignmentGraded,
    Message = $"Bài nộp của bạn đã được chấm: {request.Score} điểm.",
    ReferenceId = submission.Id,
    CreatedAt = DateTime.UtcNow,
});
```

- [ ] **Step 2: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/
git commit -m "feat: create notifications in enroll/approve/reject/grade handlers"
```

---

### Task 16: GetNotifications query + MarkAllRead command + NotificationsController

**Files:**
- Create: `LearningWeb.Application/Notifications/Queries/GetNotifications/GetNotificationsQuery.cs`
- Create: `LearningWeb.Application/Notifications/Queries/GetNotifications/GetNotificationsQueryHandler.cs`
- Create: `LearningWeb.Application/Notifications/Commands/MarkAllRead/MarkAllReadCommand.cs`
- Create: `LearningWeb.Application/Notifications/Commands/MarkAllRead/MarkAllReadCommandHandler.cs`
- Create: `LearningWeb.API/Controllers/NotificationsController.cs`

- [ ] **Step 1: GetNotifications query**

```csharp
// GetNotificationsQuery.cs
using MediatR;

namespace LearningWeb.Application.Notifications.Queries.GetNotifications;

public record NotificationDto(
    Guid Id,
    string Type,
    string Message,
    Guid? ReferenceId,
    bool IsRead,
    DateTime CreatedAt);

public record GetNotificationsQuery(Guid UserId) : IRequest<List<NotificationDto>>;
```

```csharp
// GetNotificationsQueryHandler.cs
using LearningWeb.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IApplicationDbContext _db;
    public GetNotificationsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken ct)
        => await _db.Notifications
            .Where(n => n.UserId == request.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n => new NotificationDto(
                n.Id, n.Type.ToString(), n.Message, n.ReferenceId, n.IsRead, n.CreatedAt))
            .ToListAsync(ct);
}
```

- [ ] **Step 2: MarkAllRead command**

```csharp
// MarkAllReadCommand.cs
using MediatR;

namespace LearningWeb.Application.Notifications.Commands.MarkAllRead;

public record MarkAllReadCommand(Guid UserId) : IRequest;
```

```csharp
// MarkAllReadCommandHandler.cs
using LearningWeb.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Notifications.Commands.MarkAllRead;

public class MarkAllReadCommandHandler : IRequestHandler<MarkAllReadCommand>
{
    private readonly IApplicationDbContext _db;
    public MarkAllReadCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(MarkAllReadCommand request, CancellationToken ct)
    {
        await _db.Notifications
            .Where(n => n.UserId == request.UserId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }
}
```

- [ ] **Step 3: NotificationsController**

```csharp
// LearningWeb.API/Controllers/NotificationsController.cs
using Asp.Versioning;
using LearningWeb.Application.Interfaces;
using LearningWeb.Application.Notifications.Commands.MarkAllRead;
using LearningWeb.Application.Notifications.Queries.GetNotifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningWeb.API.Controllers;

[ApiController]
[ApiVersion(1)]
[Route("api/v{version:apiVersion}/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetNotificationsQuery(_currentUser.UserId), ct);
        return Ok(result);
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _mediator.Send(new MarkAllReadCommand(_currentUser.UserId), ct);
        return NoContent();
    }
}
```

- [ ] **Step 4: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Notifications/ src/LearningWeb.API/Controllers/NotificationsController.cs
git commit -m "feat: add GetNotifications query, MarkAllRead command, NotificationsController"
```

---

### Task 17: Frontend — NotificationBell component + header integration

**Files:**
- Create: `d:/FPT/Project/WebLearning/src/apis/notifications.api.ts`
- Create: `d:/FPT/Project/WebLearning/src/components/NotificationBell.tsx`
- Modify: `d:/FPT/Project/WebLearning/src/layout/header/index.tsx`

- [ ] **Step 1: Install date-fns if not present**

```bash
cd d:/FPT/Project/WebLearning && pnpm add date-fns
```

- [ ] **Step 2: Create notifications.api.ts**

```typescript
// src/apis/notifications.api.ts
import axiosClient from './axios-client'

export type NotificationType =
  | 'EnrollmentPending'
  | 'EnrollmentApproved'
  | 'EnrollmentRejected'
  | 'AssignmentGraded'

export interface NotificationDto {
  id: string
  type: NotificationType
  message: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

const notificationsApi = {
  getAll: (): Promise<NotificationDto[]> =>
    axiosClient.get('/notifications'),

  markAllRead: (): Promise<void> =>
    axiosClient.patch('/notifications/read-all'),
}

export default notificationsApi
```

- [ ] **Step 3: Create NotificationBell component**

```tsx
// src/components/NotificationBell.tsx
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import notificationsApi, { type NotificationDto, type NotificationType } from '@/apis/notifications.api'

const typeIcon: Record<NotificationType, string> = {
  EnrollmentPending: '📋',
  EnrollmentApproved: '✅',
  EnrollmentRejected: '❌',
  AssignmentGraded: '📝',
}

const getNavTarget = (n: NotificationDto): string => {
  if (n.type === 'EnrollmentPending') return `/teacher/courses`
  if (n.type === 'EnrollmentApproved' || n.type === 'EnrollmentRejected')
    return n.referenceId ? `/courses/${n.referenceId}` : '/my-learning'
  if (n.type === 'AssignmentGraded') return '/my-assignments'
  return '/'
}

const NotificationBell = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    refetchInterval: 30_000,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const { mutate: markAll } = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const handleClick = (n: NotificationDto) => {
    setOpen(false)
    navigate(getNavTarget(n))
    if (!n.isRead) markAll()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Thông báo"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Thông báo</span>
              {unreadCount > 0 && (
                <button onClick={() => markAll()} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Không có thông báo nào</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
```

- [ ] **Step 4: Add NotificationBell to header**

In `src/layout/header/index.tsx`, import `NotificationBell` and place it inside the desktop auth area (before the user avatar button) and in the mobile drawer:
```tsx
import NotificationBell from '@/components/NotificationBell'

// In desktop auth area, before the user avatar button (only when user is logged in):
{user && <NotificationBell />}
```

Also export `NotificationBell` from `src/components/index.ts` if that file exists.

- [ ] **Step 5: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/apis/notifications.api.ts src/components/NotificationBell.tsx src/layout/header/
git commit -m "feat: add NotificationBell with 30s polling to header"
```

---

## FEATURE 3: RATING & REVIEW

---

### Task 18: Domain — CourseReview entity + DbSets + EF migration

**Files:**
- Create: `LearningWeb.Domain/Entities/CourseReview.cs`
- Modify: `LearningWeb.Application/Interfaces/IApplicationDbContext.cs`
- Modify: `LearningWeb.Infrastructure/Persistence/ApplicationDbContext.cs`

- [ ] **Step 1: Create CourseReview entity**

```csharp
// LearningWeb.Domain/Entities/CourseReview.cs
using LearningWeb.Domain.Common;

namespace LearningWeb.Domain.Entities;

public class CourseReview : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid StudentId { get; set; }
    public int Rating { get; set; }          // 1–5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Course Course { get; set; } = null!;
    public User Student { get; set; } = null!;
}
```

- [ ] **Step 2: Add DbSet to interface and context**

In `IApplicationDbContext.cs`:
```csharp
DbSet<CourseReview> CourseReviews { get; }
```

In `ApplicationDbContext.cs`:
```csharp
public DbSet<CourseReview> CourseReviews => Set<CourseReview>();
```

Add unique index configuration in `OnModelCreating` (or create a config file):
```csharp
modelBuilder.Entity<CourseReview>()
    .HasIndex(r => new { r.CourseId, r.StudentId })
    .IsUnique();
```

- [ ] **Step 3: EF migration (API must be stopped)**

```bash
cd d:/FPT/Project/LearningWeb
dotnet ef migrations add AddCourseReview \
  --project src/LearningWeb.Infrastructure \
  --startup-project src/LearningWeb.API
```

- [ ] **Step 4: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Domain/ src/LearningWeb.Application/Interfaces/ src/LearningWeb.Infrastructure/
git commit -m "feat: add CourseReview entity, DbSet, unique index, EF migration"
```

---

### Task 19: UpsertReview command + GetReviews + GetMyReview queries

**Files:**
- Create: `LearningWeb.Application/Reviews/Commands/UpsertReview/UpsertReviewCommand.cs` + Handler
- Create: `LearningWeb.Application/Reviews/Queries/GetReviews/GetReviewsQuery.cs` + Handler
- Create: `LearningWeb.Application/Reviews/Queries/GetMyReview/GetMyReviewQuery.cs` + Handler

- [ ] **Step 1: UpsertReview command**

```csharp
// UpsertReviewCommand.cs
using MediatR;

namespace LearningWeb.Application.Reviews.Commands.UpsertReview;

public record UpsertReviewCommand(Guid CourseId, Guid StudentId, int Rating, string? Comment) : IRequest;
```

```csharp
// UpsertReviewCommandHandler.cs
using LearningWeb.Application.Common.Exceptions;
using LearningWeb.Application.Interfaces;
using LearningWeb.Domain.Entities;
using LearningWeb.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Reviews.Commands.UpsertReview;

public class UpsertReviewCommandHandler : IRequestHandler<UpsertReviewCommand>
{
    private readonly IApplicationDbContext _db;
    public UpsertReviewCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(UpsertReviewCommand request, CancellationToken ct)
    {
        if (request.Rating < 1 || request.Rating > 5)
            throw new BadRequestException("Rating phải từ 1 đến 5.");

        var isApproved = await _db.Enrollments
            .AnyAsync(e => e.CourseId == request.CourseId
                        && e.StudentId == request.StudentId
                        && e.Status == EnrollmentStatus.Approved, ct);

        if (!isApproved)
            throw new ForbiddenException("Bạn chưa được duyệt vào khóa học này.");

        var existing = await _db.CourseReviews
            .FirstOrDefaultAsync(r => r.CourseId == request.CourseId && r.StudentId == request.StudentId, ct);

        if (existing == null)
        {
            _db.CourseReviews.Add(new CourseReview
            {
                Id = Guid.NewGuid(),
                CourseId = request.CourseId,
                StudentId = request.StudentId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            existing.Rating = request.Rating;
            existing.Comment = request.Comment;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 2: GetReviews query**

```csharp
// GetReviewsQuery.cs
using MediatR;

namespace LearningWeb.Application.Reviews.Queries.GetReviews;

public record ReviewDto(
    string StudentName,
    int Rating,
    string? Comment,
    DateTime CreatedAt);

public record GetReviewsQuery(Guid CourseId, int Page = 1, int PageSize = 10)
    : IRequest<PagedResult<ReviewDto>>;
```

> `PagedResult<T>` is already defined in `GetCoursesQuery.cs`. Import from that namespace or move to shared location.

```csharp
// GetReviewsQueryHandler.cs
using LearningWeb.Application.Interfaces;
using LearningWeb.Application.Courses.Queries.GetCourses; // for PagedResult<T>
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Reviews.Queries.GetReviews;

public class GetReviewsQueryHandler : IRequestHandler<GetReviewsQuery, PagedResult<ReviewDto>>
{
    private readonly IApplicationDbContext _db;
    public GetReviewsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<ReviewDto>> Handle(GetReviewsQuery request, CancellationToken ct)
    {
        var query = _db.CourseReviews
            .Include(r => r.Student)
            .Where(r => r.CourseId == request.CourseId)
            .OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new ReviewDto(r.Student.FullName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync(ct);

        var pages = (int)Math.Ceiling(total / (double)request.PageSize);
        return new PagedResult<ReviewDto>(items, request.Page, request.PageSize, total, pages);
    }
}
```

- [ ] **Step 3: GetMyReview query**

```csharp
// GetMyReviewQuery.cs
using MediatR;

namespace LearningWeb.Application.Reviews.Queries.GetMyReview;

public record GetMyReviewQuery(Guid CourseId, Guid StudentId) : IRequest<ReviewDto?>;
```

```csharp
// GetMyReviewQueryHandler.cs
using LearningWeb.Application.Interfaces;
using LearningWeb.Application.Reviews.Queries.GetReviews;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Reviews.Queries.GetMyReview;

public class GetMyReviewQueryHandler : IRequestHandler<GetMyReviewQuery, ReviewDto?>
{
    private readonly IApplicationDbContext _db;
    public GetMyReviewQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ReviewDto?> Handle(GetMyReviewQuery request, CancellationToken ct)
        => await _db.CourseReviews
            .Where(r => r.CourseId == request.CourseId && r.StudentId == request.StudentId)
            .Select(r => new ReviewDto(r.Student.FullName, r.Rating, r.Comment, r.CreatedAt))
            .FirstOrDefaultAsync(ct);
}
```

- [ ] **Step 4: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Reviews/
git commit -m "feat: add UpsertReview, GetReviews, GetMyReview query handlers"
```

---

### Task 20: ReviewsController + add averageRating/reviewCount to Course queries

**Files:**
- Create: `LearningWeb.API/Controllers/ReviewsController.cs`
- Modify: `LearningWeb.Application/Courses/Queries/GetCourses/GetCoursesQuery.cs`
- Modify: `LearningWeb.Application/Courses/Queries/GetCourses/GetCoursesQueryHandler.cs`
- Modify: `LearningWeb.Application/Courses/Queries/GetCourseById/GetCourseByIdQuery.cs`
- Modify: `LearningWeb.Application/Courses/Queries/GetCourseById/GetCourseByIdQueryHandler.cs`

- [ ] **Step 1: Create ReviewsController**

```csharp
// LearningWeb.API/Controllers/ReviewsController.cs
using Asp.Versioning;
using LearningWeb.Application.Interfaces;
using LearningWeb.Application.Reviews.Commands.UpsertReview;
using LearningWeb.Application.Reviews.Queries.GetMyReview;
using LearningWeb.Application.Reviews.Queries.GetReviews;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningWeb.API.Controllers;

[ApiController]
[ApiVersion(1)]
[Route("api/v{version:apiVersion}/courses/{courseId:guid}/reviews")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReviewsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(Guid courseId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetReviewsQuery(courseId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMy(Guid courseId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMyReviewQuery(courseId, _currentUser.UserId), ct);
        if (result == null) return NoContent(); // 204 — no review yet, not an error
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Upsert(Guid courseId, [FromBody] UpsertReviewRequest request, CancellationToken ct)
    {
        await _mediator.Send(new UpsertReviewCommand(courseId, _currentUser.UserId, request.Rating, request.Comment), ct);
        return NoContent();
    }
}

public record UpsertReviewRequest(int Rating, string? Comment);
```

- [ ] **Step 2: Add averageRating + reviewCount to CourseListDto**

In `GetCoursesQuery.cs`, add two fields at the end of `CourseListDto`:
```csharp
public record CourseListDto(
    Guid Id,
    string Title,
    string Description,
    string? ThumbnailUrl,
    string CategoryName,
    decimal Price,
    bool IsFree,
    CourseLevel Level,
    CourseStatus Status,
    string TeacherName,
    DateTime CreatedAt,
    double AverageRating,   // NEW
    int ReviewCount);       // NEW
```

- [ ] **Step 3: Update GetCoursesQueryHandler to compute AverageRating and ReviewCount**

In the Select projection in `GetCoursesQueryHandler.cs`, add (requires `_db.CourseReviews` in scope — add `.Include` or subquery):
```csharp
// Add these two computed properties to the Select projection:
AverageRating = _db.CourseReviews
    .Where(r => r.CourseId == c.Id)
    .Average(r => (double?)r.Rating) ?? 0.0,
ReviewCount = _db.CourseReviews
    .Count(r => r.CourseId == c.Id),
```

- [ ] **Step 4: Add same fields to CourseDetailDto and its handler**

In `GetCourseByIdQuery.cs`, add `double AverageRating` and `int ReviewCount` to `CourseDetailDto`.
In the handler, compute them the same way.

- [ ] **Step 5: Full build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Courses/ src/LearningWeb.API/Controllers/ReviewsController.cs
git commit -m "feat: add ReviewsController; add averageRating+reviewCount to course DTOs"
```

---

### Task 21: Frontend — reviews.api.ts + CourseDetail Reviews tab + CourseCard real ratings

**Files:**
- Create: `d:/FPT/Project/WebLearning/src/apis/reviews.api.ts`
- Modify: `d:/FPT/Project/WebLearning/src/pages/courses/CourseDetail.tsx`
- Modify: `d:/FPT/Project/WebLearning/src/components/CourseCard.tsx`
- Modify: `d:/FPT/Project/WebLearning/src/apis/courses.api.ts`

- [ ] **Step 1: Create reviews.api.ts**

```typescript
// src/apis/reviews.api.ts
import axiosClient from './axios-client'

export interface ReviewDto {
  studentName: string
  rating: number
  comment?: string
  createdAt: string
}

export interface ReviewsPage {
  items: ReviewDto[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const reviewsApi = {
  getAll: (courseId: string, page = 1, pageSize = 10): Promise<ReviewsPage> =>
    axiosClient.get(`/courses/${courseId}/reviews`, { params: { page, pageSize } }),

  getMy: (courseId: string): Promise<ReviewDto | null> =>
    axiosClient.get(`/courses/${courseId}/reviews/my`).then((res: any) => res ?? null).catch(() => null),

  upsert: (courseId: string, rating: number, comment?: string): Promise<void> =>
    axiosClient.post(`/courses/${courseId}/reviews`, { rating, comment }),
}

export default reviewsApi
```

**Note on `getMy`:** The API returns 204 (no body) when no review exists. Axios resolves 204 with `undefined`/empty — the `.then((res) => res ?? null)` handles this. If Axios throws on 204, catch and return null.

- [ ] **Step 2: Add averageRating + reviewCount to course API types**

In `src/apis/courses.api.ts`, add `averageRating: number` and `reviewCount: number` to `CourseListDto` and `CourseDetailDto` interfaces (or wherever these types are defined).

- [ ] **Step 3: Add Reviews tab to CourseDetail**

In `CourseDetail.tsx`:
1. Add `'Đánh giá'` to the `TABS` array.
2. Add state: `const [starRating, setStarRating] = useState(0)` and `const [comment, setComment] = useState('')`.
3. Add query for reviews: `useQuery({ queryKey: ['reviews', id], queryFn: () => reviewsApi.getAll(id!) })`.
4. Add query for my review (only if enrolled+approved): `useQuery({ queryKey: ['my-review', id], queryFn: () => reviewsApi.getMy(id!), enabled: isEnrolled })`.
5. Add mutation for upsert review.
6. Render the tab panel for index 3 with:
   - Rating summary (averageRating from course data, reviewCount)
   - If enrolled+approved: star-click widget (5 clickable SVG stars) + comment textarea + submit button
   - Review list from `reviews.data.items`

Star widget example:
```tsx
<div className="flex gap-1">
  {[1,2,3,4,5].map((s) => (
    <button key={s} onClick={() => setStarRating(s)} type="button">
      <svg className={`w-7 h-7 ${s <= starRating ? 'text-amber-400' : 'text-gray-200'} hover:text-amber-300 transition-colors`}
        viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  ))}
</div>
```

- [ ] **Step 4: Update CourseCard to use real ratings**

In `CourseCard.tsx`:
1. Remove `const RATING = 4.8` and `const STARS = [1,2,3,4,5]` constants.
2. Use `course.averageRating` and `course.reviewCount` from props.
3. When `reviewCount === 0`, show "Chưa có đánh giá" instead of stars.

- [ ] **Step 5: Build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/apis/reviews.api.ts src/apis/courses.api.ts src/pages/courses/CourseDetail.tsx src/components/CourseCard.tsx
git commit -m "feat: add Reviews tab to CourseDetail; real ratings in CourseCard"
```

---

## FEATURE 4: CERTIFICATE OF COMPLETION

---

### Task 22: Backend — GetCertificate query + controller endpoint

**Files:**
- Create: `LearningWeb.Application/Enrollments/Queries/GetCertificate/GetCertificateQuery.cs`
- Create: `LearningWeb.Application/Enrollments/Queries/GetCertificate/GetCertificateQueryHandler.cs`
- Modify: `LearningWeb.API/Controllers/EnrollmentsController.cs`

**Note:** `MarkLessonCompleteCommandHandler` already writes `enrollment.CompletedAt` — no handler changes needed.

- [ ] **Step 1: Create GetCertificate query**

```csharp
// GetCertificateQuery.cs
using MediatR;

namespace LearningWeb.Application.Enrollments.Queries.GetCertificate;

public record CertificateDto(
    string StudentName,
    string CourseTitle,
    string TeacherName,
    string CategoryName,
    DateTime CompletedAt,
    Guid EnrollmentId);

public record GetCertificateQuery(Guid EnrollmentId, Guid StudentId) : IRequest<CertificateDto>;
```

```csharp
// GetCertificateQueryHandler.cs
using LearningWeb.Application.Common.Exceptions;
using LearningWeb.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LearningWeb.Application.Enrollments.Queries.GetCertificate;

public class GetCertificateQueryHandler : IRequestHandler<GetCertificateQuery, CertificateDto>
{
    private readonly IApplicationDbContext _db;
    public GetCertificateQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<CertificateDto> Handle(GetCertificateQuery request, CancellationToken ct)
    {
        var enrollment = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course).ThenInclude(c => c.Teacher)
            .Include(e => e.Course).ThenInclude(c => c.Category)
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, ct)
            ?? throw new NotFoundException("Enrollment", request.EnrollmentId);

        if (enrollment.StudentId != request.StudentId)
            throw new ForbiddenException();

        if (enrollment.CompletedAt == null)
            throw new ForbiddenException("Khóa học chưa hoàn thành.");

        return new CertificateDto(
            enrollment.Student.FullName,
            enrollment.Course.Title,
            enrollment.Course.Teacher.FullName,
            enrollment.Course.Category.Name,
            enrollment.CompletedAt.Value,
            enrollment.Id);
    }
}
```

- [ ] **Step 2: Add certificate endpoint to EnrollmentsController**

```csharp
// Add using:
using LearningWeb.Application.Enrollments.Queries.GetCertificate;

// Add action:
[HttpGet("{id:guid}/certificate")]
[Authorize(Roles = "Student")]
public async Task<IActionResult> GetCertificate(Guid id, CancellationToken ct)
{
    var result = await _mediator.Send(new GetCertificateQuery(id, _currentUser.UserId), ct);
    return Ok(result);
}
```

- [ ] **Step 3: Build and commit**

```
cd d:/FPT/Project/LearningWeb && dotnet build src/LearningWeb.Application/LearningWeb.Application.csproj --nologo -q
git add src/LearningWeb.Application/Enrollments/Queries/GetCertificate/ src/LearningWeb.API/Controllers/EnrollmentsController.cs
git commit -m "feat: add GetCertificate query and enrollment certificate endpoint"
```

---

### Task 23: Update GetMyEnrollments — isCompleted + completedAt + update enrollments.api.ts

**Files:**
- Modify: `LearningWeb.Application/Enrollments/Queries/GetMyEnrollments/GetMyEnrollmentsQuery.cs`
- Modify: `LearningWeb.Application/Enrollments/Queries/GetMyEnrollments/GetMyEnrollmentsQueryHandler.cs`
- Modify: `d:/FPT/Project/WebLearning/src/apis/enrollments.api.ts`

**Note:** `isCompleted` and `completedAt` were added to the DTO in Task 6. Verify they are already present. If so, this task only needs to add `completedAt` to `enrollments.api.ts`.

- [ ] **Step 1: Verify MyEnrollmentDto has isCompleted and completedAt**

Check `GetMyEnrollmentsQuery.cs` — these should already be there from Task 6. If not, add them.

- [ ] **Step 2: Add completedAt to frontend MyEnrollmentDto type**

In `src/apis/enrollments.api.ts`, ensure `MyEnrollmentDto` includes:
```typescript
  completedAt?: string
  isCompleted: boolean
```

- [ ] **Step 3: Add getCertificate API method**

```typescript
getCertificate: (enrollmentId: string): Promise<CertificateDto> =>
  axiosClient.get(`/enrollments/${enrollmentId}/certificate`),
```

Add `CertificateDto` interface:
```typescript
export interface CertificateDto {
  studentName: string
  courseTitle: string
  teacherName: string
  categoryName: string
  completedAt: string
  enrollmentId: string
}
```

- [ ] **Step 4: Build frontend**

```
cd d:/FPT/Project/WebLearning && pnpm run build
```

---

### Task 24: Frontend — CertificateModal + MyLearning certificate button

**Files:**
- Create: `d:/FPT/Project/WebLearning/src/pages/student/CertificateModal.tsx`
- Modify: `d:/FPT/Project/WebLearning/src/pages/student/MyLearning.tsx`

- [ ] **Step 1: Create CertificateModal component**

```tsx
// src/pages/student/CertificateModal.tsx
import Dialog from '@mui/material/Dialog'
import type { CertificateDto } from '@/apis/enrollments.api'

interface Props {
  cert: CertificateDto
  onClose: () => void
}

const CertificateModal = ({ cert, onClose }: Props) => (
  <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <div id="certificate-content" className="p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <span className="text-white font-black text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            LearnHub
          </span>
        </div>
        <p className="text-white/80 text-xs">Nền tảng học trực tuyến</p>
      </div>

      {/* Body */}
      <div className="px-8 py-8 text-center border-4 border-indigo-100 mx-4 my-4 rounded-xl">
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Chứng nhận hoàn thành</p>
        <p className="text-gray-600 text-sm mb-4">Chứng nhận rằng</p>

        <p
          className="text-3xl font-black text-indigo-700 mb-4"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {cert.studentName}
        </p>

        <p className="text-gray-600 text-sm mb-2">đã hoàn thành khóa học</p>
        <p className="text-xl font-bold text-gray-900 mb-1">{cert.courseTitle}</p>
        <p className="text-sm text-gray-500 mb-1">Danh mục: {cert.categoryName}</p>
        <p className="text-sm text-gray-500 mb-6">Giảng viên: {cert.teacherName}</p>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <span>🏆</span>
          <span>Ngày hoàn thành: {new Date(cert.completedAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 px-8 pb-6">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          🖨️ In chứng chỉ
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>
    </div>

    {/* Print styles — only show certificate content when printing */}
    <style>{`
      @media print {
        body > * { display: none !important; }
        #certificate-content { display: block !important; }
        .MuiDialog-root { position: static !important; }
      }
    `}</style>
  </Dialog>
)

export default CertificateModal
```

- [ ] **Step 2: Add certificate button to MyLearning Approved tab**

In `MyLearning.tsx`, for each course card where `enrollment.isCompleted === true`:
1. Add `const [certEnrollmentId, setCertEnrollmentId] = useState<string | null>(null)`.
2. Add a query: `useQuery({ queryKey: ['certificate', certEnrollmentId], queryFn: () => enrollmentsApi.getCertificate(certEnrollmentId!), enabled: !!certEnrollmentId })`.
3. Show green **"✓ Hoàn thành"** badge on the course card.
4. Show **"Xem chứng chỉ"** button; on click set `certEnrollmentId`.
5. When cert data is loaded, render `<CertificateModal cert={certData} onClose={() => setCertEnrollmentId(null)} />`.

- [ ] **Step 3: Final build and commit**

```
cd d:/FPT/Project/WebLearning && pnpm run build
git add src/pages/student/CertificateModal.tsx src/pages/student/MyLearning.tsx src/apis/enrollments.api.ts
git commit -m "feat: add CertificateModal and completion badge to MyLearning"
```

---

## Final Verification

- [ ] **Restart the API** (it auto-applies all pending EF migrations on startup).
- [ ] **Smoke test** the full flow:
  1. Student enrolls → status shows "Đang chờ duyệt" on CourseDetail
  2. Teacher sees count badge on "Chờ duyệt" tab in TeacherStudents
  3. Teacher approves → notification bell shows ✅ for student
  4. Student can now access lessons and assignments
  5. Student completes all lessons → "✓ Hoàn thành" appears + certificate modal works
  6. Student leaves a review → real rating shows on CourseCard
- [ ] **Final commit**

```bash
cd d:/FPT/Project/WebLearning
git add .
git commit -m "feat: enrollment approval, notifications, reviews, certificate — complete"
```
