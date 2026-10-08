import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "dummy-key";
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = `You are a legal document data extractor. Extract the following structured fields from the provided document image or PDF.
Return the output strictly in JSON format without any markdown formatting. Ensure keys are exactly as specified.
If a field is not present, set its value to null.
Fields: gstin, panNumber, legalName, tradeName, issueDate, expiryDate, jurisdiction, contractParties, noticePeriod, documentCategory`;

function fileToGenerativePart(file, base64Data) {
  return {
    inlineData: {
      data: base64Data.split(",")[1],
      mimeType: file.type,
    },
  };
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const extractDocumentData = async (file) => {
  let extractedText = "";
  const isPdf = file.type === "application/pdf";
  
  if (isPdf) {
    try {
      // Try to use pdf.js text layer parsing
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(s => s.str).join(" ") + "\n";
      }
      extractedText = text;
    } catch (error) {
      console.warn("PDF.js parsing failed or module missing, falling back to Gemini Vision API.", error);
      // Fallback to empty extractedText, which triggers Gemini Vision
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction });
    
    let result;
    if (extractedText.trim().length > 0) {
      // If we got text from PDF.js, we can just send the text to Gemini
      result = await model.generateContent([
        { text: `Extract the requested fields from this document text:\n\n${extractedText}` }
      ]);
    } else {
      // Use Gemini Vision for Images or PDF fallback
      const base64Data = await fileToBase64(file);
      const imagePart = fileToGenerativePart(file, base64Data);
      result = await model.generateContent([
        imagePart,
        { text: "Extract the requested fields from this document." }
      ]);
    }

    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction failed:", error);
    return {
      ocrStatus: "Failed",
      error: error.message
    };
  }
};
