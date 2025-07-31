import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import courseRouter from "./routes/course.route";
import userRouter from "./routes/user.route";
import moduleRouter from "./routes/module.route";
import quizRouter from "./routes/quiz.route";
import contentRouter from "./routes/content.route";
import analyticsRouter from "./routes/analytics.route";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { swaggerOptions } from "./swagger";
import AIRouter from "./routes/ai.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(cookieParser());

// Swagger setup
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(
  session({
    name: "sessionId",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/quizzes", quizRouter);
app.use("/api/v1/modules", moduleRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/ai", AIRouter);

app.get("/", (_req, res) => {
  res.send("Hello from Express + TypeScript + pnpm!");
});
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
