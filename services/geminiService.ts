
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Role, Message, ModelType, GroundingSource } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Correct initialization using process.env.API_KEY directly
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *streamChat(
    modelName: ModelType,
    history: Message[],
    message: string,
    image?: { data: string; mimeType: string },
    useSearch: boolean = true
  ) {
    const model = modelName;
    
    // Construct contents for the API
    const contents = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: msg.parts.map(p => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: '' };
      })
    }));

    // Add current message
    const currentParts: any[] = [{ text: message }];
    if (image) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    try {
      const responseStream = await this.ai.models.generateContentStream({
        model,
        contents,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
          temperature: 0.7,
        }
      });

      let fullText = "";
      let groundingSources: GroundingSource[] = [];

      for await (const chunk of responseStream) {
        // Access chunk.text property directly (not as a method)
        const textChunk = chunk.text;
        if (textChunk) {
          fullText += textChunk;
          
          // Extract grounding sources if available in the first candidates
          const metadata = chunk.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks) {
            metadata.groundingChunks.forEach((chunk: any) => {
              if (chunk.web) {
                groundingSources.push({
                  title: chunk.web.title,
                  uri: chunk.web.uri
                });
              }
            });
          }

          yield {
            text: fullText,
            sources: groundingSources,
            done: false
          };
        }
      }

      yield {
        text: fullText,
        sources: groundingSources,
        done: true
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
