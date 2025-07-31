import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { AI_CONFIG } from "../config/ai.config";
import { getOptimizedPrompt } from "../utils";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

export const genAIQuestion = async (
  questionNum: number,
  lessonTopic: string,
  lesson?: any
) => {
  try {
    const response = await ai.models.generateContent({
      model: AI_CONFIG.model,
      contents: getOptimizedPrompt(questionNum, lessonTopic, lesson),
      config: {
        temperature: AI_CONFIG.temperature,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      return response.candidates[0].content?.parts || [];
    }

    return [];
  } catch (error) {
    console.error("Error generating AI question:", error);
    throw error;
  }
};
