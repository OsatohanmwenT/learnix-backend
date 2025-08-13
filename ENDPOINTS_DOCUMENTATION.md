# E-Learning Platform API Endpoints Documentation

## Base URL: `/api/v1`

---

## 🔐 Authentication Endpoints

### POST `/auth/sign-in`
**Access**: Public  
**Body**: `{ email, password }`  
**Response**:
```json
{
  "success": true,
  "message": "Sign in successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "instructor|admin|student",
      "profilePicture": "url",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "accessToken": "jwt-token"
  }
}
```

### POST `/auth/sign-up`
**Access**: Public  
**Body**: `{ email, password, firstName, lastName, role }`  
**Response**: Same as sign-in

### GET `/auth/sign-out`
**Access**: Authenticated  
**Response**: `{ success: true, message: "Signed out successfully" }`

### POST `/auth/refresh-token`
**Access**: Public (with refresh token)  
**Response**: `{ success: true, data: { accessToken: "new-jwt" } }`

---

## 👥 User Management Endpoints

### GET `/users/`
**Access**: Admin only  
**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "instructor",
        "profilePicture": "url",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "totalCount": 50,
    "currentPage": 1,
    "totalPages": 5
  }
}
```

### GET `/users/me`
**Access**: Authenticated  
**Response**: Current user object

### GET `/users/me/enrolled-courses`
**Access**: Authenticated  
**Query**: `?page=1&limit=10`  
**Response**:
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "enrollmentId": "enrollment-id",
        "courseId": "course-id",
        "courseTitle": "Course Title",
        "courseThumbnail": "url",
        "instructorName": "Instructor Name",
        "progressPercentage": 75,
        "enrolledAt": "2025-01-01T00:00:00Z",
        "completedAt": null,
        "lessonsCompleted": 8,
        "totalLessons": 12
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalEnrollments": 25,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### PUT `/users/me`
**Access**: Authenticated  
**Body**: `{ firstName?, lastName?, profilePicture? }`  
**Response**: Updated user object

### DELETE `/users/me`
**Access**: Authenticated  
**Response**: `{ success: true, message: "User deleted successfully" }`

---

## 📚 Course Management Endpoints

### GET `/courses/`
**Access**: Public  
**Query**: `?page=1&limit=10&query=search&sortBy=createdAt&difficulty=beginner`  
**Response**:
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "courses": [
      {
        "id": "course-id",
        "title": "Course Title",
        "description": "Course description",
        "estimatedHours": 40,
        "thumbnailUrl": "url",
        "status": "published",
        "difficulty": "intermediate",
        "createdAt": "2025-01-01T00:00:00Z",
        "instructorId": "instructor-id",
        "instructorName": "John Doe"
      }
    ],
    "totalCount": 100,
    "currentPage": 1,
    "totalPages": 10
  }
}
```

### POST `/courses/`
**Access**: Instructor, Admin  
**Body**: Course creation schema  
**Response**:
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "course-id",
    "title": "New Course",
    "description": "Description",
    "price": 99.99,
    "difficulty": "beginner",
    "status": "draft",
    "instructorId": "instructor-id",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/courses/:id`
**Access**: Public (with optional auth for enrollment status)  
**Response**:
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course-id",
      "title": "Course Title",
      "description": "Description",
      "price": 99.99,
      "estimatedHours": 40,
      "thumbnailUrl": "url",
      "difficulty": "intermediate",
      "status": "published",
      "instructorName": "John Doe",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "enrollmentStatus": {
      "isEnrolled": true,
      "enrolledAt": "2025-01-01T00:00:00Z",
      "progressPercentage": 45
    }
  }
}
```

### PUT `/courses/:id`
**Access**: Instructor (own course), Admin  
**Body**: Course update schema  
**Response**: Updated course object

### DELETE `/courses/:id`
**Access**: Instructor (own course), Admin  
**Response**: `{ success: true, message: "Course deleted successfully" }`

### POST `/courses/:id/enroll`
**Access**: Student, Instructor, Admin  
**Body**: `{ callback_url? }`  
**Response**:
```json
{
  "success": true,
  "message": "Enrolled in course successfully",
  "data": {
    "enrollmentId": "enrollment-id",
    "paymentData": {
      "authorization_url": "payment-url",
      "reference": "payment-ref"
    }
  }
}
```

### GET `/courses/:id/enrollment-status`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "isEnrolled": true,
    "enrolledAt": "2025-01-01T00:00:00Z",
    "progressPercentage": 75,
    "completedAt": null
  }
}
```

### GET `/courses/:id/students`
**Access**: Instructor (own course), Admin  
**Query**: `?page=1&limit=10`  
**Response**:
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "userId": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "progressPercentage": 75,
        "enrolledAt": "2025-01-01T00:00:00Z",
        "completedAt": null,
        "lessonsCompleted": 8,
        "totalLessons": 12
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalStudents": 45
    }
  }
}
```

### GET `/courses/:id/modules`
**Access**: Public  
**Response**:
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "module-id",
        "title": "Module Title",
        "description": "Description",
        "orderIndex": 1,
        "courseId": "course-id",
        "lessonsCount": 5,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### POST `/courses/:id/modules`
**Access**: Instructor (own course), Admin  
**Body**: Module creation schema  
**Response**: Created module object

---

## 📖 Module Management Endpoints

### GET `/modules/:id`
**Access**: Public  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "module-id",
    "title": "Module Title",
    "description": "Description",
    "orderIndex": 1,
    "courseId": "course-id",
    "courseName": "Course Name",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### PUT `/modules/:id`
**Access**: Instructor, Admin  
**Body**: Module update schema  
**Response**: Updated module object

### DELETE `/modules/:id`
**Access**: Instructor, Admin  
**Response**: `{ success: true, message: "Module deleted successfully" }`

### GET `/modules/:id/content`
**Access**: Public  
**Response**:
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "lesson-id",
        "title": "Lesson Title",
        "content": "Lesson content",
        "contentType": "video",
        "videoUrl": "url",
        "duration": 1800,
        "orderIndex": 1,
        "isCompleted": false
      }
    ]
  }
}
```

### POST `/modules/:id/content`
**Access**: Instructor, Admin  
**Body**: Content creation schema  
**Response**: Created lesson object

---

## 📄 Content/Lesson Endpoints

### GET `/content/:id`
**Access**: Public  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "lesson-id",
    "title": "Lesson Title",
    "content": "Lesson content",
    "contentType": "video",
    "videoUrl": "url",
    "duration": 1800,
    "orderIndex": 1,
    "moduleId": "module-id",
    "moduleName": "Module Name"
  }
}
```

### PUT `/content/:id`
**Access**: Instructor, Admin  
**Body**: Lesson update schema  
**Response**: Updated lesson object

### DELETE `/content/:id`
**Access**: Instructor, Admin  
**Response**: `{ success: true, message: "Lesson deleted successfully" }`

### POST `/content/:id/complete`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": {
    "progressUpdate": {
      "lessonCompleted": true,
      "courseProgressPercentage": 75
    }
  }
}
```

### GET `/content/progress/me`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "overallProgress": [
      {
        "courseId": "course-id",
        "courseTitle": "Course Title",
        "progressPercentage": 75,
        "lessonsCompleted": 8,
        "totalLessons": 12
      }
    ]
  }
}
```

### GET `/content/progress/:courseId`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "courseProgress": {
      "courseId": "course-id",
      "progressPercentage": 75,
      "modulesProgress": [
        {
          "moduleId": "module-id",
          "moduleTitle": "Module Title",
          "lessonsCompleted": 3,
          "totalLessons": 5,
          "progressPercentage": 60
        }
      ]
    }
  }
}
```

---

## 🧠 Quiz Management Endpoints

### POST `/quizzes/`
**Access**: Instructor, Admin  
**Body**: Quiz creation schema  
**Response**:
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": "quiz-id",
    "title": "Quiz Title",
    "description": "Description",
    "difficulty": "medium",
    "maxAttempts": 3,
    "timeLimit": 30,
    "passingScore": 70,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/quizzes/:id`
**Access**: Instructor, Admin  
**Response**: Full quiz object with questions

### PUT `/quizzes/:id`
**Access**: Instructor, Admin  
**Body**: Quiz update schema  
**Response**: Updated quiz object

### DELETE `/quizzes/:id`
**Access**: Instructor, Admin  
**Response**: `{ success: true, message: "Quiz deleted successfully" }`

### POST `/quizzes/:id/questions`
**Access**: Instructor, Admin  
**Body**: Questions array  
**Response**: Created questions array

### GET `/quizzes/:id/info`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "quiz-id",
      "title": "Quiz Title",
      "description": "Description",
      "difficulty": "medium",
      "timeLimit": 30,
      "passingScore": 70,
      "questionCount": 10
    },
    "userStats": {
      "canAttempt": true,
      "remainingAttempts": 2,
      "totalAttempts": 1,
      "maxAttempts": 3,
      "hasPassed": false,
      "lastAttemptDate": "2025-01-01T00:00:00Z"
    }
  }
}
```

### POST `/quizzes/:id/start`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "message": "Quiz session created successfully",
  "data": {
    "sessionId": "session-id",
    "attemptNumber": 1,
    "startedAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-01T00:30:00Z"
  }
}
```

### GET `/quizzes/session/:sessionId/questions`
**Access**: Authenticated  
**Query**: `?page=1&limit=10`  
**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "questions": [
      {
        "id": "question-id",
        "text": "Question text",
        "questionType": "multiple_choice",
        "orderIndex": 1,
        "answerOptions": [
          {
            "id": "option-id",
            "text": "Option text",
            "orderIndex": 1
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalQuestions": 10,
      "questionsPerPage": 5
    },
    "session": {
      "expiresAt": "2025-01-01T00:30:00Z",
      "timeRemaining": 1200
    }
  }
}
```

### POST `/quizzes/:id/submit`
**Access**: Authenticated  
**Body**: `{ sessionId, answers: [], timeSpent? }`  
**Response**:
```json
{
  "success": true,
  "message": "Quiz passed successfully!",
  "data": {
    "submissionId": "submission-id",
    "stats": {
      "totalScore": 8,
      "totalPossiblePoints": 10,
      "percentageScore": 80,
      "isPassed": true,
      "timeTaken": 1200,
      "correctAnswers": 8,
      "totalQuestions": 10
    },
    "submittedAt": "2025-01-01T00:00:00Z"
  }
}
```

### GET `/quizzes/:id/results`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "submission-id",
        "attemptNumber": 1,
        "startedAt": "2025-01-01T00:00:00Z",
        "submittedAt": "2025-01-01T00:20:00Z",
        "score": 8,
        "percentageScore": 80,
        "isPassed": true,
        "isCompleted": true
      }
    ],
    "stats": {
      "totalAttempts": 1,
      "bestScore": 80,
      "hasPassed": true,
      "lastAttempt": "2025-01-01T00:20:00Z"
    },
    "quiz": {
      "title": "Quiz Title",
      "maxAttempts": 3,
      "passingScore": 70
    }
  }
}
```

### GET `/quizzes/recent-attempts`
**Access**: Authenticated  
**Query**: `?limit=10`  
**Response**:
```json
{
  "success": true,
  "data": {
    "attempts": [
      {
        "submissionId": "submission-id",
        "quiz": {
          "id": "quiz-id",
          "title": "Quiz Title",
          "difficulty": "medium",
          "passingScore": 70,
          "timeLimit": 30
        },
        "attempt": {
          "number": 1,
          "score": 8,
          "percentageScore": 80,
          "isPassed": true,
          "submittedAt": "2025-01-01T00:00:00Z"
        }
      }
    ],
    "summary": {
      "totalAttempts": 5,
      "passedAttempts": 4,
      "passRate": 80,
      "averageScore": 75
    }
  }
}
```

---

## 📊 Analytics Endpoints

### GET `/analytics/user`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "overview": {
      "enrolledCourses": 5,
      "completedCourses": 2,
      "completionRate": 40,
      "quizzesTaken": 15,
      "averageQuizScore": 78.5,
      "highestQuizScore": 95,
      "quizzesPassed": 12,
      "quizPassRate": 80
    },
    "recentActivity": {
      "recentQuizzes": [
        {
          "quizTitle": "Quiz Title",
          "score": 85,
          "isPassed": true,
          "submittedAt": "2025-01-01T00:00:00Z",
          "attemptNumber": 1
        }
      ],
      "courseProgress": [
        {
          "courseId": "course-id",
          "courseTitle": "Course Title",
          "thumbnailUrl": "url",
          "progressPercentage": 75,
          "enrolledAt": "2025-01-01T00:00:00Z",
          "completedAt": null,
          "instructorName": "John Doe",
          "numberOfLessons": 12,
          "numberOfCompletedLessons": 9
        }
      ]
    }
  }
}
```

### GET `/analytics/instructor`
**Access**: Instructor, Admin  
**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCourses": 3,
      "totalEnrollments": 150,
      "totalCompletions": 45,
      "averageProgress": 68.5,
      "completionRate": 30
    },
    "courses": [
      {
        "courseId": "course-id",
        "courseTitle": "Course Title",
        "courseDescription": "Description",
        "totalEnrollments": 50,
        "averageProgress": 72.5,
        "completedStudents": 15,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET `/analytics/courses/:courseId`
**Access**: Instructor (own course), Admin  
**Response**:
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course-id",
      "title": "Course Title",
      "description": "Description"
    },
    "statistics": {
      "totalEnrollments": 50,
      "completedCourses": 15,
      "averageProgress": 72.5,
      "totalLessons": 12,
      "completionRate": 30
    },
    "topStudents": [
      {
        "userId": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "progressPercentage": 95,
        "enrolledAt": "2025-01-01T00:00:00Z",
        "completedAt": "2025-01-15T00:00:00Z"
      }
    ],
    "recentCompletions": [
      {
        "studentName": "John Doe",
        "lessonTitle": "Lesson Title",
        "moduleTitle": "Module Title",
        "completedAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET `/analytics/platform`
**Access**: Admin only  
**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1000,
      "totalCourses": 50,
      "totalEnrollments": 2500,
      "completedCourses": 750,
      "averageProgress": 65.5,
      "completionRate": 30
    },
    "topCourses": [
      {
        "courseId": "course-id",
        "courseTitle": "Course Title",
        "instructorName": "John Doe",
        "totalEnrollments": 150,
        "averageProgress": 78.5,
        "completedStudents": 45
      }
    ]
  }
}
```

---

## 🤖 AI Endpoints

### POST `/ai/generate`
**Access**: Public  
**Body**: Question generation parameters  
**Response**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "text": "Generated question",
        "type": "multiple_choice",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": 0
      }
    ]
  }
}
```

### GET `/ai/insights`
**Access**: Authenticated  
**Response**:
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "performance",
        "message": "Your quiz performance has improved by 15% this month",
        "priority": "high"
      }
    ]
  }
}
```

---

## 🔑 Key Notes for Dashboard Design

### For Instructor Dashboard:
- Use `/analytics/instructor` for overview cards
- Use `/analytics/courses/:courseId` for detailed course analytics
- Use `/courses/:id/students` for student management
- Use `/courses/` with instructor filter for course list

### For Admin Dashboard:
- Use `/analytics/platform` for platform-wide overview
- Use `/users/` for user management
- Use `/courses/` for all courses management
- Use `/analytics/courses/:courseId` for any course details

### Authentication:
- All authenticated endpoints require JWT token in cookies
- Role-based access control is enforced
- Optional authentication available for some public endpoints to provide personalized data

### Pagination:
- Most list endpoints support `page` and `limit` query parameters
- Default pagination is usually 10 items per page
- Total counts and page information provided in responses

### Error Responses:
All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```
