// Swagger definition for API documentation
export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Learning Platform API",
      version: "1.0.0",
      description: "API documentation for the E-Learning Platform",
      contact: {
        name: "API Support",
        email: "support@elearning.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sessionId",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            message: {
              type: "string",
              description: "Detailed error message",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            firstName: {
              type: "string",
              description: "User first name",
            },
            lastName: {
              type: "string",
              description: "User last name",
            },
            role: {
              type: "string",
              enum: ["student", "instructor", "admin"],
              description: "User role",
            },
          },
        },
        Course: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Course ID",
            },
            title: {
              type: "string",
              description: "Course title",
            },
            description: {
              type: "string",
              description: "Course description",
            },
            instructorId: {
              type: "string",
              description: "Instructor ID",
            },
            level: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              description: "Course difficulty level",
            },
            isPublished: {
              type: "boolean",
              description: "Whether the course is published",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/docs/*.ts"], // Path to the API docs
};
