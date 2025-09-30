# TSF Police LMS - API Reference

## Authentication APIs

### POST /api/auth/login
Login with email and password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kbn.local","password":"Passw0rd!"}'
```

### GET /api/auth/session
Get current session
```bash
curl http://localhost:3000/api/auth/session --cookie "auth-token=..."
```

### POST /api/auth/logout
Logout current user
```bash
curl -X POST http://localhost:3000/api/auth/logout --cookie "auth-token=..."
```

## Course Management

### GET /api/courses
List all courses
```bash
curl http://localhost:3000/api/courses --cookie "auth-token=..."
```

### POST /api/courses
Create a new course
```bash
curl -X POST http://localhost:3000/api/courses \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST-001",
    "titleAr": "دورة تجريبية",
    "titleEn": "Test Course",
    "summaryAr": "وصف الدورة",
    "summaryEn": "Course description",
    "modality": "ELearning",
    "durationMins": 120
  }'
```

### GET /api/courses/[id]
Get course details
```bash
curl http://localhost:3000/api/courses/{courseId} --cookie "auth-token=..."
```

### PATCH /api/courses/[id]
Update course
```bash
curl -X PATCH http://localhost:3000/api/courses/{courseId} \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{"status": "PUBLISHED"}'
```

### DELETE /api/courses/[id]
Delete course
```bash
curl -X DELETE http://localhost:3000/api/courses/{courseId} --cookie "auth-token=..."
```

### POST /api/courses/[id]/enroll
Enroll a user in a course
```bash
curl -X POST http://localhost:3000/api/courses/{courseId}/enroll \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'
```

## User Management

### GET /api/users
List all users
```bash
curl http://localhost:3000/api/users --cookie "auth-token=..."
```

### POST /api/users
Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "qid": "30000000001",
    "badgeNo": "TEST001",
    "rank": "Officer",
    "unit": "Testing",
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@kbn.local",
    "password": "Passw0rd!",
    "role": "trainee",
    "locale": "en",
    "status": "ACTIVE"
  }'
```

### GET /api/users/[id]
Get user details
```bash
curl http://localhost:3000/api/users/{userId} --cookie "auth-token=..."
```

### PATCH /api/users/[id]
Update user
```bash
curl -X PATCH http://localhost:3000/api/users/{userId} \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'
```

### DELETE /api/users/[id]
Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/{userId} --cookie "auth-token=..."
```

## Exam Management

### GET /api/exams
List all exams
```bash
curl http://localhost:3000/api/exams --cookie "auth-token=..."
```

### POST /api/exams
Create a new exam
```bash
curl -X POST http://localhost:3000/api/exams \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "titleAr": "اختبار تجريبي",
    "titleEn": "Test Exam",
    "courseId": "course-id-here",
    "timeLimitMins": 30,
    "totalMarks": 100,
    "randomize": true,
    "negativeMarking": false,
    "lockdown": false
  }'
```

### GET /api/exams/[examId]
Get exam details
```bash
curl http://localhost:3000/api/exams/{examId} --cookie "auth-token=..."
```

### POST /api/exams/[examId]/submit
Submit exam attempt
```bash
curl -X POST http://localhost:3000/api/exams/{examId}/submit \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{"answers": {...}}'
```

## Session Management

### GET /api/sessions
List all sessions
```bash
curl http://localhost:3000/api/sessions --cookie "auth-token=..."
```

### POST /api/sessions
Create a new session
```bash
curl -X POST http://localhost:3000/api/sessions \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-id-here",
    "titleAr": "جلسة تدريبية",
    "titleEn": "Training Session",
    "room": "Room 101",
    "startsAt": "2025-10-01T10:00:00Z",
    "endsAt": "2025-10-01T12:00:00Z",
    "instructorId": "instructor-id-here",
    "capacity": 30
  }'
```

## Certificate Management

### GET /api/certificates
List certificates
```bash
curl http://localhost:3000/api/certificates --cookie "auth-token=..."
# Or for specific user:
curl "http://localhost:3000/api/certificates?userId={userId}" --cookie "auth-token=..."
```

### POST /api/certificates
Issue a certificate
```bash
curl -X POST http://localhost:3000/api/certificates \
  --cookie "auth-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "courseId": "course-id-here",
    "expiresAt": "2027-09-29T00:00:00Z"
  }'
```

## Dashboard & Reports

### GET /api/dashboard/stats
Get dashboard statistics
```bash
curl http://localhost:3000/api/dashboard/stats --cookie "auth-token=..."
```

### GET /api/reports/summary
Get summary reports
```bash
curl http://localhost:3000/api/reports/summary --cookie "auth-token=..."
```

## Demo Credentials

All users have password: `Passw0rd!`

- `super@kbn.local` - Super Admin
- `admin@kbn.local` - Admin
- `instructor@kbn.local` - Instructor
- `commander@kbn.local` - Commander
- `trainee@kbn.local` - Trainee

## Database

- **Type**: PostgreSQL 15
- **Host**: localhost:5432
- **Database**: tsf_lms
- **User**: postgres
- **Password**: postgres

## Testing

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kbn.local","password":"Passw0rd!"}' \
  -c cookies.txt

# Use the session
curl http://localhost:3000/api/courses -b cookies.txt
```
