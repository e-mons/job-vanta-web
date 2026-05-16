const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API Key found in .env.local");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // There isn't a direct listModels in the standard SDK easily accessible this way, 
    // but we can try to fetch from the raw endpoint or use the experimental client.
    // For now, let's just try to call a very basic model.
    console.log("Testing gemini-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hi");
    console.log("gemini-pro works!");
  } catch (err) {
    console.log("gemini-pro failed:", err.message);
  }

  try {
    console.log("Testing gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("gemini-1.5-flash works!");
  } catch (err) {
    console.log("gemini-1.5-flash failed:", err.message);
  }
}

listModels();
