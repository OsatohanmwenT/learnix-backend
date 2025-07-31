# E-Learning Platform Backend

A comprehensive backend API for an e-learning platform built with Node.js, TypeScript, Express.js, and PostgreSQL.

## 🚀 Features

- **User Management**: Authentication, authorization, and role-based access control
- **Course Management**: Create, read, update, and delete courses and modules
- **Quiz System**: Interactive quizzes with adaptive learning capabilities
- **AI Integration**: AI-powered quiz generation and content recommendations
- **Analytics**: Comprehensive learning analytics and progress tracking
- **Content Management**: Support for multiple content types (text, video, audio, images)
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- pnpm package manager

## ⚙️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/elearning"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   SESSION_SECRET="your-session-secret"

   # AI Services (Optional)
   GOOGLE_AI_API_KEY="your-google-ai-key"
   ANTHROPIC_API_KEY="your-anthropic-key"

   # Environment
   NODE_ENV="development"
   PORT=5000
   ```

4. **Database Setup**

   ```bash
   # Run migrations
   pnpm drizzle-kit push:pg

   # Seed the database (optional)
   pnpm run seed
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

## 🚀 Usage

### Development

```bash
pnpm run dev          # Start development server with hot reload
pnpm run dev-start    # Alternative dev server with nodemon
```

### Production

```bash
pnpm run build        # Build the application
pnpm start           # Start production server
```

### Database Operations

```bash
pnpm run seed        # Seed database with sample data
pnpm run test-data   # Generate test data
```

### Code Quality

```bash
pnpm run lint        # Run ESLint
pnpm run format      # Format code with Prettier
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health

### API Endpoints Overview

| Endpoint              | Description                        |
| --------------------- | ---------------------------------- |
| `/api/v1/auth/*`      | Authentication and user management |
| `/api/v1/courses/*`   | Course management                  |
| `/api/v1/modules/*`   | Module management                  |
| `/api/v1/quizzes/*`   | Quiz operations                    |
| `/api/v1/analytics/*` | Learning analytics                 |
| `/api/v1/ai/*`        | AI-powered features                |

## 🔐 Authentication

The API uses JWT-based authentication with role-based access control:

- **Learner**: Can access courses, take quizzes, view progress
- **Instructor**: Can create and manage courses, view analytics
- **Admin**: Full system access

### Sample Authentication Flow

1. **Login**

   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "password"}'
   ```

2. **Use the token in subsequent requests**
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/v1/courses
   ```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with roles
- **Courses**: Educational courses
- **Modules**: Course modules containing lessons
- **Lessons**: Individual learning content
- **Quizzes**: Assessments and quizzes
- **Enrollments**: User course enrollments
- **Analytics**: Learning progress tracking

## 🧪 Testing

### Manual Testing

Use the provided test data:

```bash
# See test-data.md for sample API requests
curl -X GET http://localhost:5000/api/v1/courses
```

### Sample Users (after seeding)

| Role       | Email                       | Password    |
| ---------- | --------------------------- | ----------- |
| Admin      | admin@example.com           | password123 |
| Instructor | john.instructor@example.com | password123 |
| Learner    | alice.learner@example.com   | password123 |

## 🔧 Development

### Project Structure

```
src/
├── controllers/     # Route handlers
├── routes/         # Express routes
├── middlewares/    # Custom middleware
├── database/       # Database config and schemas
├── services/       # Business logic
├── validations/    # Input validation schemas
├── utils/          # Utility functions
├── docs/           # API documentation
└── types/          # TypeScript type definitions
```

### Adding New Features

1. **Create database schema** in `src/database/schemas/`
2. **Add validation** in `src/validations/`
3. **Implement controller** in `src/controllers/`
4. **Create routes** in `src/routes/`
5. **Add documentation** in `src/docs/`
6. **Update types** in `src/types/`

## 🚢 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
```

### Build and Deploy

```bash
pnpm run build
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **JWT Issues**

   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

3. **Migration Issues**
   - Run `pnpm drizzle-kit push:pg`
   - Check database permissions

### Getting Help

- Check the [API Documentation](http://localhost:5000/docs)
- Review [test-data.md](./test-data.md) for examples
- Open an issue for bugs or feature requests

---

**Happy Learning! 🎓**
