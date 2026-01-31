import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * تحويل ملف أو Blob إلى Base64 لاستخدامه مع Gemini
 */
async function fileToGenerativePart(file: File | Blob) {
    // التأكد من وجود نوع للملف
    const mimeType = file.type || "image/jpeg";
    console.log(`📂 Converting file to generative part. Type: ${mimeType}, Size: ${file.size} bytes`);

    const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            if (base64String) {
                resolve(base64String);
            } else {
                reject(new Error("Failed to extract base64 data from file"));
            }
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(file);
    });

    try {
        const data = await base64Promise;
        return {
            inlineData: {
                data,
                mimeType,
            },
        };
    } catch (error) {
        console.error("❌ Error in fileToGenerativePart:", error);
        throw error;
    }
}

/**
 * توليد وصف دقيق للصورة باستخدام Google Gemini
 */
export async function generateImageDescriptionWithGemini(imageInput: File | Blob): Promise<string | null> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        console.error("❌ Gemini API Key is missing in environment variables!");
        return null;
    }

    try {
        console.log('🤖 Starting Gemini Image Analysis...');
        const genAI = new GoogleGenerativeAI(API_KEY);
        // استخدام الموديل الأحدث والأكثر استقراراً
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an expert at identifying objects for a lost and found system.
      Analyze the provided image and describe the main object in detail.
      
      Focus on:
      1. Object type (be specific).
      2. Dominant and secondary colors.
      3. Brand name or logos if clearly visible.
      4. Material and texture.
      5. Any unique details (scratches, stickers, specific patterns).
      6. Approximate size.
      
      Output ONLY the description in clear, technical English. Max 3-4 sentences.
    `;

        const imagePart = await fileToGenerativePart(imageInput);

        console.log('📡 Sending request to Gemini API...');
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            console.warn('⚠️ Gemini returned an empty response.');
            return null;
        }

        console.log('✅ Gemini successfully analyzed the image:', text.substring(0, 50) + '...');
        return text.trim();
    } catch (error: any) {
        console.error('❌ Gemini Analysis Error:', error);
        let errorMsg = "AI description failed";
        if (error.message) {
            console.error('Error message:', error.message);
            errorMsg += `: ${error.message}`;
        }
        return errorMsg;
    }
}
