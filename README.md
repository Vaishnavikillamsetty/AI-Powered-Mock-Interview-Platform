# AI-Powered-Mock-Interview-Platform
The AI-Powered Mock Interview Platform is a web-based application designed to help students and freshers practice technical interview questions.   
It dynamically generates multiple-choice interview questions and evaluates user answers using Google's Gemini AI, providing instant feedback and scoring.

---

## 🚀 Features
- AI-generated technical interview questions
- Difficulty-based question generation (Easy / Medium / Hard)
- Real-time answer evaluation with feedback
- Score assignment based on correctness and concept clarity
- Prevents repeated questions in the same session
- Lightweight and browser-based frontend

---

## 🛠️ Tech Stack
### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Google Apps Script

### AI Integration
- Gemini API (`gemini-2.0-flash`)

---

## ⚙️ Architecture
```
Frontend (HTML + JavaScript)
        ↓
Google Apps Script (doPost handler)
        ↓
Gemini API
        ↓
JSON Response
        ↓
Displayed on UI
```

---

## 🖥️ How to Run the Project

### 1️⃣ Frontend Setup
- Open the `frontend/index.html` file in any modern web browser
- No server or installation required

---

### 2️⃣ Backend Setup (Google Apps Script)
1. Go to Google Apps Script
2. Create a new project
3. Paste the code from `backend/Code.gs`
4. Add your Gemini API key in **Script Properties**
   - Key: `GEMINI_API_KEY`
   - Value: your API key
5. Deploy the project as a **Web App**
   - Execute as: Me
   - Access: Anyone
6. Copy the deployed Web App URL

---

### 3️⃣ Connect Frontend to Backend
- Paste the deployed Apps Script Web App URL into the `fetch()` call inside your frontend JavaScript

---

## 🔐 Security Notes
- Gemini API key is stored securely using Apps Script Properties
- API key is not exposed in frontend code or committed to GitHub

---

## 🎯 Use Cases
- Technical interview practice for students and freshers
- Campus placement preparation
- Programming concept evaluation
- Mock interview simulations

---

## 🔮 Future Enhancements
- User authentication
- Interview history and analytics
- Resume-based personalized questions
- Voice-based mock interviews
- Timed interview sessions

---

## 👩‍💻 Author
Vaishnavi Killamsetty  
B.Tech IT | Aspiring Full Stack Developer
