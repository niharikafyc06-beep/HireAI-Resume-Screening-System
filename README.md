# HireAI – AI-Powered Resume Screening & Candidate Ranking System

HireAI is a full-stack AI-powered recruitment application designed to automate resume screening and candidate ranking. It helps recruiters evaluate multiple resumes against job requirements using semantic similarity, skill matching, and experience-based scoring.

## 🚀 Features

- **Bulk Resume Upload:** Upload multiple PDF resumes at once.
- **Resume Parsing:** Extract candidate information from PDF files.
- **Candidate Information Extraction:** Identify names, email addresses, phone numbers, and experience.
- **Automated Skill Extraction:** Detect technical skills from resumes.
- **Skill Matching:** Compare candidate skills with required and preferred job skills.
- **AI-Powered Similarity:** Use Sentence Transformers and cosine similarity to compare resumes with job descriptions.
- **Candidate Ranking:** Generate weighted scores and rank candidates.
- **Interactive Dashboard:** View candidate rankings and screening results through a React interface.

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Python
- FastAPI
- REST APIs
- PyMuPDF

### AI & Machine Learning
- Sentence Transformers
- Scikit-learn
- Cosine Similarity
- Natural Language Processing

## 📂 Project Structure

```text
HireAI-Resume-Screening-System/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
└── .gitignore
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/niharikafyc06-beep/HireAI-Resume-Screening-System.git
cd HireAI-Resume-Screening-System
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
```

Activate virtual environment on Windows:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

API Documentation: `http://127.0.0.1:8000/docs`

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 🧠 How It Works

1. Recruiter enters job requirements and skills.
2. Recruiter uploads multiple candidate resumes in PDF format.
3. The backend extracts text and candidate information.
4. The AI system identifies and matches candidate skills.
5. Sentence Transformers calculate semantic similarity between resumes and job descriptions.
6. A weighted scoring mechanism evaluates candidates.
7. Candidates are ranked according to their overall scores.

## 📊 Candidate Scoring System

HireAI uses the following weighted scoring approach:

| Parameter | Weight |
|---|---:|
| Semantic Similarity | 45% |
| Required Skills Match | 35% |
| Preferred Skills Match | 10% |
| Experience Match | 10% |

The final score is used to rank candidates.

## 🎯 Project Objective

The objective of HireAI is to simplify the initial recruitment process by reducing manual resume screening and helping recruiters identify potentially suitable candidates more efficiently.

## 🔮 Future Enhancements

- Database integration for persistent job and candidate records.
- User authentication and recruiter accounts.
- Support for DOCX resumes.
- Advanced NLP-based candidate evaluation.
- Resume recommendations and detailed analytics.
- Cloud deployment for public access.

## ⚠️ Disclaimer

HireAI is an academic portfolio prototype and decision-support tool. Its scores are heuristic estimates and should not be used as the sole basis for hiring decisions. Recruiters should independently review candidate qualifications.

## 👩‍💻 Developer

**Niharika**

B.Tech – Computer Science Engineering

Gautam Buddha University

---

⭐ If you find this project interesting, feel free to explore the repository!
