
import { GoogleGenAI, Type } from "@google/genai";
import { PromptData } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Generates a structured prompt for the character interaction using Gemini Flash 3.
   */
  async generateCharacterPrompt(characterName: string, imageBase64: string): Promise<PromptData> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(",")[1],
          },
        },
        {
          text: `The user wants to generate a hyper-realistic photo of themselves posing with the character "${characterName}". 
          Analyze the person's appearance in the image and the character's typical style.
          Return a JSON object following this schema:
          {
            "clothing": "Description of modern fashion clothing for the person inspired by the character theme",
            "pose": "How the person is interacting with the character (e.g., arm around, standing beside)",
            "expression": "Facial expression matching the mood",
            "characterDetails": {
               "name": "${characterName}",
               "type": "3D photorealistic render",
               "interaction": "What the character is doing in the pose"
            },
            "environment": "A clean studio or cinematic backdrop description"
          }
          Keep descriptions concise but visually rich.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clothing: { type: Type.STRING },
            pose: { type: Type.STRING },
            expression: { type: Type.STRING },
            characterDetails: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                interaction: { type: Type.STRING }
              },
              required: ["name", "type", "interaction"]
            },
            environment: { type: Type.STRING }
          },
          required: ["clothing", "pose", "expression", "characterDetails", "environment"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  /**
   * Generates the final image using the image-to-image model.
   */
  async generateCompositeImage(imageBase64: string, promptData: PromptData): Promise<string> {
    const prompt = `Hyper-realistic, professional fashion photoshoot. Use the face from the provided image without any changes. 
    Subject is wearing ${promptData.clothing}. 
    Subject pose: ${promptData.pose}. 
    Subject expression: ${promptData.expression}.
    Character: ${promptData.characterDetails.name}, ${promptData.characterDetails.type}, ${promptData.characterDetails.interaction}.
    Environment: ${promptData.environment}. 
    Maintain facial features from the input photo exactly. 3D cinematic lighting.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1],
            },
          },
          { text: prompt }
        ],
      }
    });

    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("Failed to generate image parts.");
    return imageUrl;
  }
}

export const geminiService = new GeminiService();
