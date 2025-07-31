interface ErrorType extends Error {
    statusCode?: number
}

type UserPayload = typeof users.$inferSelect;

interface AccessTokenPayload {
  userId: string;
  role: UserPayload['role'];
  email: string;
  username: string;
}

type AccessToken = {
  accessToken: string;
  expiresIn: number;
};

type Lesson = {
  id: string;
  title: string;
  description: string;
  contentType: string;
  contentUrl?: string;
  moduleId: string;
  order: number;
}

type Module = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  lessons?: Lesson[];
}

interface AIQuestionOption {
  text: string;
  isCorrect?: boolean;
}

interface AIQuestionResponse {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface AIGenerationResponse {
  questions: AIQuestionResponse[];
}