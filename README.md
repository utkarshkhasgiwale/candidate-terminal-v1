# Candidate Terminal

An AI-powered interactive terminal portfolio that lets recruiters explore my skills, experience, education, projects, and resume through a terminal-style interface.

## 🚀 Live Demo

**[Open Candidate Terminal](https://candidate-terminal.vercel.app/)**

## ✨ Features

- Interactive terminal-style portfolio
- AI-powered assistant
- Ask questions about my background and projects
- Skills and experience exploration
- Project showcase
- Resume access
- Responsive React interface
- FastAPI backend
- Groq-powered AI responses

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- Lucide React

### Backend
- Python
- FastAPI
- Uvicorn

### AI
- Groq
- Prompt Engineering
- AI-powered portfolio assistant

### Deployment
- Vercel — Frontend
- Render — Backend
- GitHub — Source Control

## 📁 Project Structure

```text
candidate-terminal/
│
├── ai_core/
│   ├── data/
│   │   ├── narrative_answers.json
│   │   ├── resume_facts.json
│   │   └── source-docs/
│   │       ├── resume.docx
│   │       └── resume.pdf
│   │
│   ├── prompts/
│   │   └── system_prompt.txt
│   │
│   ├── chat_ai.py
│   └── resume_parser.py
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── main.py
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── data/
│       ├── App.jsx
│       ├── TerminalPortfolio.jsx
│       ├── api.js
│       ├── index.css
│       └── terminalEngine.js
│
├── main.py
├── pyproject.toml
└── uv.lock
