const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("No API Key found");
  process.exit(1);
}

const models = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-lite"
];

const apiVersions = ["v1", "v1beta"];

async function runTests() {
  for (const modelName of models) {
    for (const apiVersion of apiVersions) {
      const start = Date.now();
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel(
          { model: modelName },
          { apiVersion }
        );
        const result = await model.generateContent("Say 'OK'");
        const response = await result.response;
        const text = response.text();
        const duration = Date.now() - start;
        console.log(`✅ SUCCESS: Model="${modelName}" Version="${apiVersion}" Time=${duration}ms Response="${text.trim()}"`);
      } catch (err) {
        const duration = Date.now() - start;
        console.log(`❌ FAILED:  Model="${modelName}" Version="${apiVersion}" Time=${duration}ms Error="${err.message.substring(0, 120)}"`);
      }
    }
  }
}

runTests();
