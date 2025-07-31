import { pgEnum } from "drizzle-orm/pg-core";

// Shared enums used across multiple schemas
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced', 'expert']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'long_answer', 'fill_in_the_blank']);
export const masteryLevelEnum = pgEnum('mastery_level', ['novice', 'developing', 'proficient', 'advanced', 'expert']);
export const recommendationTypeEnum = pgEnum('recommendation_type', ['content', 'quiz', 'remediation', 'next_module']);
export const skillProficiencyEnum = pgEnum('skill_proficiency', ['novice', 'beginner', 'intermediate', 'proficient', 'expert', 'mastered']);