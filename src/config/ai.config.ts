export const AI_CONFIG = {
  model: "gemini-1.5-flash", // Latest and fastest model
  temperature: 0.5, // Balance creativity and consistency, lower for faster response
  maxOutputTokens: 2048,
  timeout: 30000, // 30 second timeout
} as const;
