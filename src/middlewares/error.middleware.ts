import { TransactionRollbackError } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(err)
    // Handle Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.flatten().fieldErrors
      });
    }

    // Handle database errors
    const dbError = err as any;

    if (dbError instanceof TransactionRollbackError) {
      return res.status(500).json({
        success: false,
        message: "Database transaction failed",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      });
    }

    // PostgreSQL unique constraint violation
    if (dbError.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry",
      });
    }

    // PostgreSQL undefined function (UUID generation issue)
    if (dbError.code === "42883") {
      // Check if it's an enum casting issue
      if (dbError.message && dbError.message.includes("operator does not exist") && dbError.message.includes("~~*")) {
        return res.status(500).json({
          success: false,
          message: "Database query error: Invalid operator for enum field",
          details: process.env.NODE_ENV === "development" ? 
            "Enum fields require type casting when using text operators. Consider casting to text with ::text" : 
            undefined,
        });
      }
      
      return res.status(500).json({
        success: false,
        message:
          "Database configuration error: UUID extension may not be enabled",
      });
    }

    // Handle Drizzle/Neon query errors
    if (err.message && err.message.includes("Failed query")) {
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    // Handle custom application errors
    const statusCode = dbError.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
      success: false,
      message: message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
};
