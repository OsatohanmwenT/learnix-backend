/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [learner, instructor, admin]
 *           example: learner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         title:
 *           type: string
 *           example: "Introduction to Programming"
 *         description:
 *           type: string
 *           example: "Learn the basics of programming"
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           example: published
 *         instructorId:
 *           type: string
 *           example: "1"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     Module:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         title:
 *           type: string
 *           example: "Variables and Data Types"
 *         description:
 *           type: string
 *           example: "Understanding variables and data types"
 *         courseId:
 *           type: string
 *           example: "1"
 *         orderIndex:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     Quiz:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         title:
 *           type: string
 *           example: "Variables Quiz"
 *         description:
 *           type: string
 *           example: "Test your knowledge of variables"
 *         lessonId:
 *           type: string
 *           example: "1"
 *         timeLimit:
 *           type: integer
 *           example: 600
 *         totalQuestions:
 *           type: integer
 *           example: 10
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "An error occurred"
 *         error:
 *           type: string
 *           example: "Detailed error message"
 *
 *     Lesson:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         title:
 *           type: string
 *           example: "Introduction to Variables"
 *         description:
 *           type: string
 *           example: "Learn about variables in programming"
 *         moduleId:
 *           type: string
 *           example: "1"
 *         contentType:
 *           type: string
 *           enum: [text, video, audio, image, quiz, assignment, file]
 *           example: "text"
 *         contentData:
 *           type: string
 *           example: "Variables are containers for storing data..."
 *         order:
 *           type: integer
 *           example: 1
 *         durationMinutes:
 *           type: integer
 *           example: 30
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     QuizSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         quizId:
 *           type: string
 *           example: "1"
 *         userId:
 *           type: string
 *           example: "1"
 *         startedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:30:00.000Z"
 *         score:
 *           type: number
 *           format: float
 *           example: 85.5
 *         totalQuestions:
 *           type: integer
 *           example: 10
 *         correctAnswers:
 *           type: integer
 *           example: 8
 *         status:
 *           type: string
 *           enum: [active, completed, expired]
 *           example: "completed"
 *
 *     BankDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         instructorId:
 *           type: string
 *           example: "1"
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         bankCode:
 *           type: string
 *           example: "011"
 *         bankName:
 *           type: string
 *           example: "First Bank"
 *         accountName:
 *           type: string
 *           example: "John Doe"
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isDefault:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     PayoutRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         instructorId:
 *           type: string
 *           example: "1"
 *         amount:
 *           type: string
 *           example: "5000.00"
 *         bankDetailsId:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *           example: "pending"
 *         transferCode:
 *           type: string
 *           example: "TRF_123456789"
 *         failureReason:
 *           type: string
 *           example: "Insufficient balance"
 *         requestedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         processedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T01:00:00.000Z"
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T02:00:00.000Z"
 *         bankDetails:
 *           $ref: '#/components/schemas/BankDetails'
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 *
 *     Enrollment:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "1"
 *         courseId:
 *           type: string
 *           example: "1"
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         paymentReference:
 *           type: string
 *           example: "paystack_ref_123"
 *         completedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         progressPercentage:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 75
 *
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: sessionId
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
