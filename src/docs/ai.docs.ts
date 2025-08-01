/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features endpoints
 */

/**
 * @swagger
 * /api/v1/ai/generate-questions:
 *   post:
 *     summary: Generate quiz questions using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - difficulty
 *               - count
 *             properties:
 *               topic:
 *                 type: string
 *                 example: "JavaScript Variables"
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "beginner"
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 example: 5
 *     responses:
 *       200:
 *         description: Questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Questions generated successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                         example: "What is a variable in JavaScript?"
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["A container for data", "A function", "A loop", "A condition"]
 *                       correctAnswer:
 *                         type: string
 *                         example: "A container for data"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/ai/insights:
 *   get:
 *     summary: Get AI-powered learning insights for a user
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Learning insights generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: string
 *                       example: "Based on your recent quiz performance, you're excelling in JavaScript fundamentals..."
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Focus more on advanced concepts", "Practice more coding exercises"]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
