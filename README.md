# 🧠 Multimodal Document Analyzer

A production-ready AI-powered document analysis platform built with React, Node.js, MongoDB, and open-source NLP/OCR libraries.

## ✨ Features

- **Multi-format Upload**: PDF, DOCX, TXT, PNG, JPG, JPEG
- **OCR Text Extraction**: Tesseract.js for images and scanned PDFs
- **AI NLP Analysis**: Keywords, sentiment, entities, topics, summary
- **Visual Analytics**: Interactive charts with Recharts
- **Document History**: Search, filter, sort, favorite
- **Report Generation**: Downloadable PDF and TXT reports
- **Shareable Links**: Public share tokens for analyses
- **JWT Authentication**: Secure register/login/logout
- **Dark/Light Mode**: Theme switching
- **Fully Responsive**: Mobile, tablet, desktop

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run server
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🌐 Deployment (Vercel + Render)

Deploy **backend first**, then frontend (frontend needs the Render API URL).

### 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Database Access → create a user with password
3. Network Access → **Allow access from anywhere** (`0.0.0.0/0`) so Render can connect
4. Connect → copy the connection string and replace `<password>` with your user password

### 2. Backend → Render

**Option A — Blueprint (recommended):** Dashboard → **New** → **Blueprint** → connect `multimodel-doc-analyzer` → Render reads root `render.yaml`.

**Option B — Manual Web Service:**

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

**Environment variables:**

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/docanalyzer` |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (set after Vercel deploy, then redeploy) |
| `MAX_FILE_SIZE` | `10485760` |

After deploy, copy the service URL (e.g. `https://docanalyzer-backend.onrender.com`).

### 3. Frontend → Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo
2. **Root Directory** → `frontend` (required for monorepo)
3. Framework Preset: **Vite** (build: `npm run build`, output: `dist`)
4. Environment variable:

   `VITE_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api`

5. Deploy — `frontend/vercel.json` handles SPA routing

6. Copy your Vercel URL → set `FRONTEND_URL` on Render to that URL (no trailing slash) → **Redeploy** backend

CORS already allows `*.vercel.app` origins. Uploads on Render use ephemeral disk (files may not persist across restarts on free tier).

---

## 📁 Project Structure

```
multimodal-doc-analyzer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable components
│   │   │   └── layout/       # Layout components
│   │   ├── context/          # React contexts
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   └── utils/            # Helper functions
│   ├── vercel.json
│   └── .env.example
│
└── backend/
    ├── controllers/          # Route handlers
    ├── middleware/           # Auth, upload, error handling
    ├── models/               # Mongoose schemas
    ├── routes/               # Express routes
    ├── services/             # OCR & NLP processing
    ├── uploads/              # File storage (gitignored)
    ├── reports/              # Generated reports (gitignored)
    ├── server.js
    ├── render.yaml
    └── .env.example
```

---

## 🔧 Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| OCR | Tesseract.js |
| NLP | Natural, Compromise |
| PDF | pdf-parse, PDFKit |
| DOCX | Mammoth |
| Charts | Recharts |
| Auth | JWT, bcryptjs |
| Security | Helmet, express-rate-limit |

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/documents/upload` | Upload documents |
| POST | `/api/documents/:id/process` | Process & analyze |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/analysis/:documentId` | Get analysis |
| GET | `/api/analysis/overview` | Analytics overview |
| POST | `/api/reports/pdf/:id` | Generate PDF report |
| POST | `/api/reports/txt/:id` | Generate TXT report |
| GET | `/api/users/stats` | User statistics |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/settings` | Update settings |

---

## 🔒 Security

- JWT authentication on all protected routes
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req/15min)
- File type & size validation
- CORS configuration
- Input sanitization

---

Built with ❤️ using open-source AI libraries — no paid APIs required.
