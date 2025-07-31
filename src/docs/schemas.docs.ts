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
