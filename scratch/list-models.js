const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // The SDK doesn't have a direct listModels, we have to use the fetch API for that
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("Failed to fetch models:", err.message);
  }
}

listAllModels();
