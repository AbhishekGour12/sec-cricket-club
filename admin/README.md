# SEC Cricket Club - Admin Panel

A Vite-powered React administration panel styled with Tailwind CSS, built with TypeScript, React Router, and TanStack Query.

## Folder Structure

```text
admin/
├── src/
│   ├── assets/          # Static assets (images, icons)
│   ├── components/      # Reusable dashboard UI components
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layouts (AdminLayout.tsx)
│   ├── pages/           # Page-level route views (Dashboard, Members, etc.)
│   ├── routes/          # Navigation paths configuration
│   ├── services/        # HTTP API connection layer (Axios instances)
│   ├── store/           # Global state management
│   ├── theme/           # Design system configuration (colors, spacing)
│   ├── types/           # TypeScript types and interfaces
│   ├── App.tsx          # Main Application core view
│   ├── index.css        # Tailwind & custom stylesheet
│   └── main.tsx         # React DOM entry point
├── index.html           # Document HTML layout template
├── postcss.config.js    # PostCSS configs (Tailwind support)
├── tailwind.config.js   # Tailwind style rules
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configurations & path alias resolution
└── package.json         # Dependency configurations
```

## Key Technologies
- **Bundler**: Vite
- **UI & Logic**: React, TypeScript, Lucide Icons
- **Styling**: Tailwind CSS
- **API Connection**: Axios, TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod

---

## Installation & Running

### 1. Prerequisites
Ensure Node.js (v18+) is installed.

### 2. Install Dependencies
Run the following command from the `admin/` directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `admin/` root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

### 4. Running the App
- **Development Mode** (Vite Dev Server):
  ```bash
  npm run dev
  ```
  The admin panel will be accessible at `http://localhost:3000`.
- **Production Build**:
  ```bash
  npm run build
  ```
- **Linting & Code Formatting**:
  ```bash
  npm run lint
  npm run format
  ```
