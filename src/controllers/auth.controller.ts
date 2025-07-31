import { NextFunction, Response, Request } from "express";
import { db } from "../database";
import { sessions, users } from "../database/schemas/auth.schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createAccessToken, createRefreshToken, verifyToken } from "../utils";
import { ref } from "process";

dotenv.config();

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      const error: ErrorType = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword) {
      const error: ErrorType = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const accessToken = createAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });

    const refreshToken = createRefreshToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });

    await db.delete(sessions).where(eq(sessions.userId, user.id));

    await db.insert(sessions).values({
      userId: user.id,
      expiresAt: expiresAt,
      refreshToken: refreshToken,
    });

    req.session!.refreshToken = refreshToken;

    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        session: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, username, role, firstName, lastName } = req.body;
  console.log("SignUp Request Body:", req.body);

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      const error: ErrorType = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        username,
        role,
        firstName,
        lastName,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {refreshToken} = req.session;

    const decoded = verifyToken(refreshToken)

    if (decoded && req.session?.refreshToken) {
      await db.delete(sessions).where(eq(sessions.userId, decoded?.userId));
    }

    req.session?.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
    });

    res.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refreshToken } = req.session;
  try {
    if (!refreshToken) {
      const error: ErrorType = new Error("No session found");
      error.statusCode = 401;
      throw error;
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshToken, refreshToken));

    if (!session) {
      const error: ErrorType = new Error("Invalid session");
      error.statusCode = 401;
      throw error;
    }

    const decoded = verifyToken(refreshToken);

    const accessToken = createAccessToken({
      userId: decoded?.userId,
      role: decoded?.role,
      username: decoded?.username,
      email: decoded?.email,
    });

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
