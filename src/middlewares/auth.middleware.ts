import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      const error: ErrorType = new Error("No token provided");
      error.statusCode = 401;
      throw error;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      const error: ErrorType = new Error("Invalid token");
      error.statusCode = 403;
      throw error;
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize =
  (roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        const error: ErrorType = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
      }

      if (!user.role || !roles.includes(user.role)) {
        const error: ErrorType = new Error(
          "Forbidden: You do not have the required permissions."
        );
        error.statusCode = 403;
        throw error;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
