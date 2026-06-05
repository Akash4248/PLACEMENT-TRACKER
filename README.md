# CampusTrack

CampusTrack is a MERN-stack Campus Interview Tracking and Result Management System for placement teams. It manages students, companies, interview rounds, applications, recruitment funnels, analytics, bulk uploads, resume storage, reports, and operational monitoring from one dashboard.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, React Query, Recharts, Framer Motion, React Hook Form, React Icons
- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- Files and reports: Multer, Cloudinary, CSV/XLSX parsing, PDFKit, ExcelJS
- Ops: Morgan request logging, audit logs, health checks, system dashboard

## Key Features

- JWT authentication and protected routes
- Student, company, application, and interview round management
- Server-side pagination, search, and advanced filters
- CSV/XLSX student import and bulk result upload
- Cloudinary resume upload, replace, preview, download, and delete
- Eligibility and placement rules engines
- Dashboard KPIs, department analytics, recruitment funnel, upcoming drives
- PDF/XLSX Reports Center for management reporting
- Admin system dashboard and activity audit feed
- React Query caching with background refreshes
- Vercel/Render friendly environment configuration

## Local Setup

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

## Backend Environment

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-long-secret
FRONTEND_URL=https://your-campus-track.vercel.app
BACKEND_PUBLIC_URL=https://your-render-service.onrender.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Cloudinary is recommended on Render because local uploaded files are not persistent across deployments/restarts.

## Frontend Environment

```env
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
VITE_APP_ENV=production
```

For Vercel, make sure the project includes SPA rewrites through `frontend/vercel.json`. This prevents refreshes on routes like `/dashboard` or `/students` from showing a Vercel 404.

## Deployment Notes

- Frontend on Vercel:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Add `VITE_API_URL` and `VITE_APP_ENV` in Vercel environment variables.

- Backend on Render:
  - Root directory: `backend`
  - Start command: `npm start`
  - Add MongoDB, JWT, frontend URL, backend public URL, and Cloudinary variables.

## Seed Data

To seed students, companies, rounds, and applications:

```bash
cd backend
npm run seed
```

To remove duplicate company names generated with numeric suffixes:

```bash
cd backend
npm run cleanup:companies
```

## API Highlights

- `GET /health`
- `GET /api/system`
- `GET /api/audit-logs`
- `GET /api/students?page=1&limit=20&search=cse`
- `POST /api/students/import`
- `POST /api/students/:id/resume`
- `DELETE /api/students/:id/resume`
- `GET /api/companies?page=1&limit=20&status=Upcoming`
- `GET /api/companies/:id/eligible-students`
- `GET /api/applications?page=1&limit=50&status=Applied`
- `POST /api/applications/bulk-results`
- `GET /api/reports/placement-analytics/pdf`
- `GET /api/reports/placement-analytics/xlsx`

## Troubleshooting

- Vercel refresh shows page not found: add or verify SPA rewrites in `frontend/vercel.json`.
- Resume links disappear on Render: configure Cloudinary; Render local filesystem uploads are temporary.
- CORS errors: set `FRONTEND_URL` on Render to your exact Vercel domain.
- Slow lists: use `page`, `limit`, `search`, and filters instead of loading every record into the browser.
