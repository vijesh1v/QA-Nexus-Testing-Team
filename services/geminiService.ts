import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBugReport = async (
  imageBase64: string | null, 
  description: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Error: API Key not configured.";

  try {
    const modelName = imageBase64 ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
    
    const parts: any[] = [];
    
    if (imageBase64) {
      // Remove data URL prefix if present
      const base64Data = imageBase64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/png', 
          data: base64Data
        }
      });
    }
    
    parts.push({
      text: `You are a Senior QA Automation Engineer. 
      ${imageBase64 ? "Analyze this screenshot and the accompanying text." : "Analyze this bug description."}
      
      Context: ${description}
      
      Please provide a structured bug report including:
      1. Suggested Title
      2. Severity Assessment (Low/Medium/High/Critical)
      3. Potential Root Cause
      4. Recommended Reproduction Steps
      5. Suggested Fix (if obvious)`
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to analyze bug report. Please try again.";
  }
};

export const generateTestCase = async (requirement: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Error: API Key not configured.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a comprehensive test case for the following requirement: "${requirement}".
      
      Format the output as:
      - **Test Scenario ID**
      - **Description**
      - **Pre-conditions**
      - **Test Steps** (Numbered list)
      - **Expected Result**
      - **Post-conditions**`,
    });

    return response.text || "No test case generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate test case.";
  }
};

export const chatWithBot = async (history: {role: 'user' | 'model', parts: {text: string}[]}[]): Promise<string> => {
    const ai = getClient();
    if (!ai) return "System: API Key missing.";

    try {
        // The history passed from App.tsx includes the latest user message.
        // We need to separate previous history from the new message for the chat API.
        const previousHistory = history.slice(0, -1);
        const newPrompt = history[history.length - 1]?.parts[0]?.text || "";

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: previousHistory,
            config: {
                systemInstruction: "You are QA-Bot, a helpful assistant for a software testing team. You help with writing SQL queries, regex, generating test data, and explaining technical concepts concisely."
            }
        });

        const result = await chat.sendMessage({ message: newPrompt });
        return result.text || "I'm thinking...";

    } catch (e) {
        console.error(e);
        return "System: Error connecting to QA-Bot.";
    }
}