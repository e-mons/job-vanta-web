const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listNames() {
  const apiKey = process.env.GEMINI_API_KEY;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
  const data = await response.json();
  if (data.models) {
    console.log(data.models.map(m => m.name).join("\n"));
  } else {
    console.log("No models found:", data);
  }
}

listNames();
