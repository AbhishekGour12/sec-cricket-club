# SEC Cricket Club - Backend API

An Express-based REST API built with TypeScript, Sequelize, and PostgreSQL (Supabase), designed as a scalable foundation for the SEC Cricket Club ecosystem.

## Folder Structure

```text
backend/
├── src/
│   ├── config/          # Configuration files (database.ts, etc.)
│   ├── controllers/     # Express controllers (request handling)
│   ├── middlewares/     # Express middlewares (errorHandler.ts, auth, etc.)
│   ├── models/          # Sequelize models (database structure)
│   ├── routes/          # Express route declarations (index.ts)
│   ├── services/        # Business logic layer
│   ├── repositories/    # Database query/interaction layer
│   ├── utils/           # Utilities & helpers (logger.ts)
│   ├── validators/      # Input validation logic (Zod schemas)
│   ├── uploads/         # Local file upload directory
│   ├── types/           # Custom TypeScript declarations
│   ├── app.ts           # Express Application configuration
│   └── server.ts        # Server entry point
├── .env                 # Local environment variables
├── .eslintrc.json       # ESLint rules
├── .prettierrc          # Prettier config
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependency configuration
```

## Nginx (admin + API on the same DuckDNS host)

Admin SPA is served at `/` and the API at `/api`. Image files live on the Node process, so Nginx **must not** send `/uploads` to `try_files … /index.html`.

See [deploy/nginx-sec-api.duckdns.org.conf.example](../deploy/nginx-sec-api.duckdns.org.conf.example). Required pieces:

- `client_max_body_size 15m;` (default 1m rejects phone photos)
- `location /uploads/` and `location /api/` proxy to `http://127.0.0.1:5001`
- SPA `location /` **after** those locations

Clients resolve stored paths through `/api/uploads/...` (also mounted in Express). After deploy, `curl -sI https://sec-api.duckdns.org/api/uploads/<folder>/<file>` must return an image `Content-Type`, not `text/html`.

---

## Key Technologies
- **Runtime**: Node.js
- **Framework**: Express (with TypeScript)
- **Database ORM**: Sequelize
- **Database**: PostgreSQL (hosted on Supabase)
- **Security & Utilities**: helmet, cors, morgan, dotenv, winston-like custom logger

---

## Installation & Running

### 1. Prerequisites
Ensure Node.js (v18+) is installed.

### 2. Install Dependencies
Run the following command from the `backend/` directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend/` root directory (see placeholders below):
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.eckpbimrtlcjdhatboax:SecSportsClub@123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your_jwt_secret_key_change_me_in_production
FIREBASE_PROJECT_ID=sec-cricket-club-placeholder
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-placeholder@sec-cricket-club.iam.gserviceaccount.com
GOOGLE_WEB_CLIENT_ID=837780082237-n5fr5566aibc80v5ula2ssljqivuf98t.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=837780082237-gmj2oqqtv9ek1a4h1pnrnpfjvr59ktnj.apps.googleusercontent.com
```

### 4. Running the App
- **Development Mode** (with nodemon auto-reload):
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm start
  ```
- **Linting & Code Formatting**:
  ```bash
  npm run lint
  npm run format
  ```
