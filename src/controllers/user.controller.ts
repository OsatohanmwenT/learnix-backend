import { NextFunction, Response, Request } from "express";
import { users } from "../database/schemas/auth.schema";
import { db } from "../database";
import { desc, eq } from "drizzle-orm";

export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || user.length === 0) {
      const error: ErrorType = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User details retrieved successfully",
      data: user[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: allUsers,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const { firstName, lastName, email } = req.body;

  try {
    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [updatedUser] = await db
      .update(users)
      .set({ firstName, lastName, email })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      const error: ErrorType = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const deletedUser = await db.delete(users).where(eq(users.id, userId));

    if (!deletedUser) {
      const error: ErrorType = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "User profile deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
