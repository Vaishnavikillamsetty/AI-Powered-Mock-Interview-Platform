// Code.gs

// IMPORTANT: Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API Key.
// Get your API key from Google AI Studio: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Handles GET requests. Not directly used for the quiz logic, but required for web app deployment.
 */
function doGet() {
  return HtmlService.createHtmlOutput("This is the Apps Script backend for the AI Mock Interview. Please use the HTML frontend.");
}

/**
 * Handles POST requests from the HTML form.
 * Distinguishes between 'generateQuestion' and 'evaluateAnswer' requests.
 * @param {Object} e The event object containing request parameters.
 * @returns {ContentService.TextOutput} JSON response.
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const requestType = e.parameter.type;

    if (requestType === 'generateQuestion') {
      const language = e.parameter.language || 'General Programming'; // Default language
      const difficulty = e.parameter.difficulty || 'medium'; // Default difficulty
      const excludeQuestions = e.parameter.excludeQuestions ? JSON.parse(e.parameter.excludeQuestions) : [];
      return generateQuestion(output, language, difficulty, excludeQuestions);
    } else if (requestType === 'evaluateAnswer') {
      const question = e.parameter.question;
      const options = JSON.parse(e.parameter.options);
      const correctAnswerIndex = parseInt(e.parameter.correctAnswerIndex);
      const userAnswerIndex = parseInt(e.parameter.userAnswerIndex);
      const language = e.parameter.language || 'General Programming';
      const difficulty = e.parameter.difficulty || 'medium'; 
      return evaluateAnswer(output, question, options, correctAnswerIndex, userAnswerIndex, language, difficulty);
    } else {
      return output.setContent(JSON.stringify({ error: "Invalid request type." }));
    }

  } catch (error) {
    console.error("Error in doPost:", error);
    return output.setContent(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }));
  }
}

/**
 * Generates a new multiple-choice question using the Gemini API based on difficulty and language.
 * @param {ContentService.TextOutput} output The output object to set content.
 * @param {string} language The requested programming language.
 * @param {string} difficulty The requested difficulty ('easy', 'medium', 'hard').
 * @param {string[]} excludeQuestions An array of question texts to avoid generating.
 * @returns {ContentService.TextOutput} JSON response with question, options, and correct answer index.
 */
function generateQuestion(output, language, difficulty, excludeQuestions) {
  let difficultyHint = '';
  if (difficulty === 'easy') {
    difficultyHint = 'The question should be relatively simple, covering fundamental concepts.';
  } else if (difficulty === 'medium') {
    difficultyHint = 'The question should be of moderate complexity, requiring a good understanding of the topic.';
  } else if (difficulty === 'hard') {
    difficultyHint = 'The question should be challenging, potentially covering advanced topics, edge cases, or requiring deeper analytical skills.';
  }

  // Create a string of questions to exclude from the prompt
  const excludeList = excludeQuestions.length > 0 ? 
    `IMPORTANT: Do NOT generate any of the following questions: ${JSON.stringify(excludeQuestions)}. Ensure the new question is distinct.` : '';

  const prompt = `Generate a NEW and DIFFERENT multiple-choice technical interview question about ${language}. 
  ${difficultyHint}
  ${excludeList}
  Provide 4 distinct options.
  Indicate the 0-indexed correct answer.
  Return the response as a JSON object with the following structure:
  {
    "question": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0 
  }
  Ensure the options are clearly distinct and only one is correct.`;

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.8, // Higher temperature for more varied questions
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 500,
      responseMimeType: "application/json", // Request JSON output
      responseSchema: { // Define expected JSON schema for question generation
        type: "OBJECT",
        properties: {
          question: { type: "STRING" },
          options: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          correctAnswerIndex: { type: "INTEGER" }
        },
        required: ["question", "options", "correctAnswerIndex"],
        propertyOrdering: ["question", "options", "correctAnswerIndex"]
      }
    },
  };

  return callGeminiAPI(output, payload);
}

/**
 * Evaluates the user's answer and provides feedback and a score using the Gemini API.
 * @param {ContentService.TextOutput} output The output object to set content.
 * @param {string} question The original question asked.
 * @param {string[]} options The options provided for the question.
 * @param {number} correctAnswerIndex The 0-indexed correct answer.
 * @param {number} userAnswerIndex The 0-indexed answer selected by the user.
 * @param {string} language The language of the question (for context).
 * @param {string} difficulty The difficulty of the question (for context).
 * @returns {ContentService.TextOutput} JSON response with feedback, score, and correctness.
 */
function evaluateAnswer(output, question, options, correctAnswerIndex, userAnswerIndex, language, difficulty) {
  const correctOptionText = options[correctAnswerIndex];
  const userAnswerText = options[userAnswerIndex];
  const isCorrect = (userAnswerIndex === correctAnswerIndex);

  const prompt = `Given the following ${language} interview question (difficulty: ${difficulty}) and answers:
  Question: "${question}"
  Options: ${JSON.stringify(options)}
  Correct Answer: "${correctOptionText}" (Option index: ${correctAnswerIndex})
  User's Answer: "${userAnswerText}" (Option index: ${userAnswerIndex})

  Evaluate the user's answer. Provide concise, constructive feedback.
  If the answer is correct, explain why it's correct.
  If the answer is incorrect, explain why it's incorrect and briefly explain the correct concept.
  Assign a score from 1 to 10 based on correctness and the quality of the concept. A correct answer should typically get 8-10, an incorrect answer 1-5 depending on how far off it was.
  Return the response as a JSON object with the following structure:
  {
    "isCorrect": true, // boolean
    "feedbackText": "Your detailed feedback here.",
    "score": 8 // integer from 1 to 10
  }`;

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7, // Balance creativity and factual accuracy for feedback
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 500,
      responseMimeType: "application/json", // Request JSON output
      responseSchema: { // Define expected JSON schema for feedback
        type: "OBJECT",
        properties: {
          isCorrect: { type: "BOOLEAN" },
          feedbackText: { type: "STRING" },
          score: { type: "INTEGER" }
        },
        required: ["isCorrect", "feedbackText", "score"],
        propertyOrdering: ["isCorrect", "feedbackText", "score"]
      }
    },
  };

  return callGeminiAPI(output, payload);
}

/**
 * Helper function to call the Gemini API and handle responses.
 * @param {ContentService.TextOutput} output The output object to set content.
 * @param {Object} payload The payload for the Gemini API request.
 * @returns {ContentService.TextOutput} JSON response from Gemini or error.
 */
function callGeminiAPI(output, payload) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Prevents Apps Script from throwing an error on non-200 responses
  };

  try {
    const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseBody);
      // Gemini's structured response is directly in candidates[0].content.parts[0].text
      // Since we requested JSON, this 'text' field will contain the JSON string.
      const geminiRawText = jsonResponse.candidates && jsonResponse.candidates[0] &&
                            jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts &&
                            jsonResponse.candidates[0].content.parts[0] && jsonResponse.candidates[0].content.parts[0].text;
      
      if (geminiRawText) {
        // Parse the JSON string received from Gemini
        const parsedGeminiContent = JSON.parse(geminiRawText);
        return output.setContent(JSON.stringify(parsedGeminiContent)); // Return the parsed object directly
      } else {
        console.error("Gemini API response missing content:", jsonResponse);
        return output.setContent(JSON.stringify({ error: "Gemini API response missing expected content.", rawResponse: jsonResponse }));
      }
    } else {
      console.error(`Gemini API error: ${responseCode} - ${responseBody}`);
      return output.setContent(JSON.stringify({ error: `Gemini API error: ${responseCode} - ${responseBody}` }));
    }
  } catch (apiError) {
    console.error("Error calling Gemini API:", apiError);
    return output.setContent(JSON.stringify({ error: `Failed to communicate with Gemini API: ${apiError.message}` }));
  }
}
