# SEC Cricket Club

Welcome to the SEC Cricket Club workspace. This is a production-grade, monorepo-style structure hosting three primary applications: the frontend (mobile app), backend (API server), and admin panel (web application).

## Project Structure

```text
sec-cricket-club/
├── admin/            # Admin Panel (React + Vite + TypeScript)
├── backend/          # API Backend (Node.js + Express + Sequelize + PostgreSQL)
├── frontend/         # Mobile App (React Native + Expo + TypeScript)
└── README.md         # Workspace root documentation
```

---

## Workspace Setup

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (if running local DB, or use the provided Supabase URL)
- [Expo CLI](https://docs.expo.dev/) (for running the React Native app)

---

## Sub-project Documentation

### 1. Backend (`/backend`)
An Express-based REST API built with TypeScript and Sequelize ORM, connected to a Supabase PostgreSQL database.
- **Path**: [backend/](file:///d:/workspace/sec-cricket-club/backend)
- **Start Command**: `npm run dev`
- See [backend/README.md](file:///d:/workspace/sec-cricket-club/backend/README.md) for environment variables and schema details.

### 2. Admin Panel (`/admin`)
A Vite-powered React dashboard for club administrators, styled with Tailwind CSS.
- **Path**: [admin/](file:///d:/workspace/sec-cricket-club/admin)
- **Start Command**: `npm run dev`
- See [admin/README.md](file:///d:/workspace/sec-cricket-club/admin/README.md) for details on components and layouts.

### 3. Mobile Frontend (`/frontend`)
An Expo project utilizing React Native, Expo Router, Zustand, and TanStack Query.
- **Path**: [frontend/](file:///d:/workspace/sec-cricket-club/frontend)
- **Start Command**: `npx expo start`
- See [frontend/README.md](file:///d:/workspace/sec-cricket-club/frontend/README.md) for details on pages, theme, and navigation.

---

## Getting Started Quickly

1. Clone the repository.
2. Initialize environment variables in all three directories (see `.env.example` in each directory).
3. Install dependencies and start each module:
   ```bash
   # Backend
   cd backend
   npm install
   npm run dev

   # Admin
   cd ../admin
   npm install
   npm run dev

   # Frontend
   cd ../frontend
   npm install
   npx expo start
   ```
