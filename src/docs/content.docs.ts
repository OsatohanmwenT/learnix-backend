/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content management endpoints
 */

/**
 * @swagger
 * /api/v1/content:
 *   get:
 *     summary: Get all content
 *     tags: [Content]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *         description: Filter by module ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lesson, video, document, quiz]
 *         description: Filter by content type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of content items per page
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       title:
 *                         type: string
 *                         example: "Introduction Lesson"
 *                       type:
 *                         type: string
 *                         enum: [lesson, video, document, quiz]
 *                         example: lesson
 *                       content:
 *                         type: string
 *                         example: "This is the lesson content..."
 *                       moduleId:
 *                         type: string
 *                         example: "1"
 *                       orderIndex:
 *                         type: integer
 *                         example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Content retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1"
 *                     title:
 *                       type: string
 *                       example: "Introduction Lesson"
 *                     type:
 *                       type: string
 *                       enum: [lesson, video, document, quiz]
 *                       example: lesson
 *                     content:
 *                       type: string
 *                       example: "This is the lesson content..."
 *                     moduleId:
 *                       type: string
 *                       example: "1"
 *                     orderIndex:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting endpoints
 */

/**
 * @swagger
 * /analytics/courses/{id}/stats:
 *   get:
 *     summary: Get course statistics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEnrollments:
 *                       type: integer
 *                       example: 150
 *                     completionRate:
 *                       type: number
 *                       example: 75.5
 *                     averageScore:
 *                       type: number
 *                       example: 85.2
 *                     totalQuizzes:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
