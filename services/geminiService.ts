import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Transaction } from "../types";

export interface FileInput {
  data: string; // Base64 string for PDF, or raw text for CSV
  mimeType: string;
}

export const parseTransactions = async (inputs: FileInput[]): Promise<Transaction[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct parts based on input type
  const parts: any[] = [];
  
  parts.push({ text: "Analyze the following transaction data from the provided files. Extract, clean, and categorize all transactions into a single combined list." });

  inputs.forEach((input, index) => {
    if (input.mimeType === 'application/pdf') {
      parts.push({ text: `File ${index + 1} (PDF):` });
      parts.push({ 
        inlineData: { 
          mimeType: input.mimeType, 
          data: input.data 
        } 
      });
    } else {
      // Treat as text (CSV, etc)
      parts.push({ text: `File ${index + 1} (Text/CSV):\n${input.data}\n` });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // OPTIMIZATION: Disable thinking tokens to speed up response time
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        // Enforce determinism: Temperature 0 removes randomness, Seed ensures reproducibility
        temperature: 0, 
        seed: 42,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["Expense", "Income", "Transfer", "Refund"] },
              status: { type: Type.STRING, enum: ["Include", "Exclude"] },
              confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["date", "description", "category", "amount", "type", "status", "confidence"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    const rawTransactions = JSON.parse(jsonText);
    
    // Inject unique IDs
    const transactions: Transaction[] = rawTransactions.map((t: any) => ({
      ...t,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    }));
    
    return transactions;

  } catch (error) {
    console.error("Error parsing transactions with Gemini:", error);
    throw error;
  }
};