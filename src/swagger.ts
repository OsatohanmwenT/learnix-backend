// Swagger definition for API documentation
export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Learning Platform API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for the E-Learning Platform with course management, payments, AI-powered features, and analytics",
      contact: {
        name: "API Support",
        email: "support@elearning.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development server",
      },
      {
        url: "https://api.elearning.com/api/v1",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT Bearer token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sessionId",
          description: "Session ID stored in cookie",
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
            username: {
              type: "string",
              description: "Username",
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
              enum: ["learner", "instructor", "admin"],
              description: "User role",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
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
            price: {
              type: "integer",
              description: "Course price in kobo/cents",
            },
            thumbnailUrl: {
              type: "string",
              description: "Course thumbnail URL",
            },
            estimatedHours: {
              type: "integer",
              description: "Estimated completion hours",
            },
            status: {
              type: "string",
              enum: ["draft", "published", "archived"],
              description: "Course status",
            },
            difficulty: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
              description: "Course difficulty level",
            },
            instructorId: {
              type: "string",
              description: "Instructor ID",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
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
  apis: ["./src/docs/*.ts", "./src/docs/*.docs.ts"], // Path to the API docs
};
