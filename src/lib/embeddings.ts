import { GoogleGenAI } from "@google/genai";

/**
 * Generates a 768-dimensional vector embedding for the given text.
 */
export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation.");
  }

  if (!apiKey) {
    throw new Error("Google Gemini API Key is missing.");
  }

  try {
    const cleanText = text.replace(/\n/g, " ").trim();
    // Support comma-separated keys and get the first one for embedding
    const singleKey = apiKey.split(',')[0].trim();
    const ai = new GoogleGenAI({ apiKey: singleKey });

    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: cleanText,
      config: {
        outputDimensionality: 768,
      },
    });

    if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
      return response.embeddings[0].values;
    } else {
      throw new Error("Failed to retrieve embedding values from Gemini API response.");
    }
  } catch (error: any) {
    console.error("Error generating vector embedding:", error);
    throw error;
  }
}
