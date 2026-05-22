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

## 🌐 Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import repo in Vercel
3. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy — `vercel.json` handles SPA routing

### Backend → Render

1. Push `backend/` to GitHub
2. Create new Web Service on Render
3. Set environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Random secret key
   - `FRONTEND_URL` — Your Vercel frontend URL
   - `NODE_ENV=production`
4. Build: `npm install` | Start: `npm start`

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
