
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyCv2GiYtX7eovuh3Pw2ekcdlKwbyqQ8qk8";

async function main() {
    console.log("Testing Gemini Generation...");
    console.log("Model: gemini-2.0-flash");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Say 'Hello, World!' if you can hear me.";
        console.log("Sending prompt...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("SUCCESS!");
        console.log("Response:", text);
    } catch (error) {
        console.error("FAILED:");
        console.error(error);
    }
}

main();
