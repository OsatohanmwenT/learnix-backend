import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}