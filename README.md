# AI Meeting Summarizer (HTML + Node)

A minimal, selection-ready project that summarizes meeting transcripts with AI (Groq/OpenAI) and lets you share the edited summary via email.

## Folder Structure
```
ai-summarizer/
  frontend/
    index.html
    style.css
    script.js
  backend/
    index.js
    package.json
    .env.example
```

## 1) Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # then open .env and fill keys (optional; will still work with fallback)
npm start
```
The server runs on http://localhost:5000

> If you don't set API keys, the backend will use a **local fallback summarizer** so you can demo the app.

### Using GROQ (recommended if you have it)
- Put your `GROQ_API_KEY` in `.env`. The code uses Groq's OpenAI-compatible chat endpoint.

### Using OpenAI
- Put your `OPENAI_API_KEY` in `.env` (and adjust `OPENAI_MODEL` if needed).

### Email (SMTP) Setup
- Fill the SMTP fields in `.env`. For Gmail:
  - Turn on 2FA
  - Create an **App Password**
  - Use it as `SMTP_PASS`
- Change `FROM_EMAIL` if you want a nicer display name.

## 2) Frontend
Open `frontend/index.html` in your browser (double-click it).
- Upload a `.txt` file **or** paste transcript text.
- (Optional) enter a custom instruction.
- Click **Generate Summary**.
- Edit the summary.
- Enter recipient email + subject.
- Click **Send Email**.

If your backend is not on `http://localhost:5000`, change the **Backend URL** field at the bottom.

## 3) Deploy (Optional)
- Frontend → Netlify/Vercel (static)
- Backend → Render/Railway/Heroku
- Update the Backend URL field in the frontend to your deployed backend.

## Notes
- This project purposely keeps the UI simple and clean (as per the spec).
- The backend is production-friendly enough for a coding round:
  - Uses environment variables
  - Graceful error handling
  - CORS enabled
  - Email + AI integration
