# SEC Cricket Club - Mobile Frontend

A React Native + Expo mobile application structured using TypeScript, styled with NativeWind (Tailwind CSS), and featuring Expo Router for file-system-based routing.

## Folder Structure

```text
frontend/
├── assets/              # App images, splash screens, and custom fonts
│   └── fonts/           # TrueType / OpenType font files
├── src/
│   ├── app/             # Expo Router screen tree (Splash, Login, Tabs)
│   │   ├── (tabs)/      # Tab navigator routes (Home, Events, Directory, News, Profile, Settings)
│   │   ├── _layout.tsx  # Root stack & query client provider layout
│   │   ├── index.tsx    # Splash / loading screen routing entry
│   │   ├── login.tsx    # Phone authentication request screen
│   │   └── otp.tsx      # Passcode validation verification screen
│   ├── components/      # Common UI elements
│   ├── constants/       # App themes, spacing, and configurations
│   ├── features/        # Feature-specific state, components, hooks
│   ├── hooks/           # General custom React hooks
│   ├── navigation/      # Navigation config types or helpers
│   ├── providers/       # Context/Provider components
│   ├── services/        # HTTP client & remote services layer
│   ├── store/           # Zustand global state stores
│   ├── theme/           # Custom theme style parameters
│   ├── types/           # Global type definitions
│   ├── utils/           # Helper scripts & formatters
│   └── global.css       # Tailwind directives & CSS properties
├── .env                 # Environment variables
├── babel.config.js      # Babel transformations (NativeWind plugin)
├── metro.config.js      # Metro Bundler configs (NativeWind style resolving)
├── tailwind.config.js   # Tailwind custom screens and assets config
├── nativewind-env.d.ts  # NativeWind class name type extensions
├── tsconfig.json        # TypeScript configuration
└── package.json         # Expo project package specs
```

## Key Technologies
- **App Platform**: Expo (React Native)
- **Routing**: Expo Router (v57+)
- **Styling**: NativeWind (Tailwind CSS v3 support)
- **State Management**: Zustand
- **Server Sync**: TanStack Query & Axios
- **Form Schema Validation**: React Hook Form, Zod

---

## Installation & Running

### 1. Prerequisites
Ensure you have the Expo Go app installed on your Android/iOS device.

### 2. Install Dependencies
Run the following command from the `frontend/` directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend/` root:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_ENV=development
```

### 4. Running the App
- **Start Metro Bundler**:
  ```bash
  npm start
  ```
- **Run on Android Device / Emulator**:
  ```bash
  npm run android
  ```
- **Run on iOS Simulator** (macOS only):
  ```bash
  npm run ios
  ```
- **Run on Web Browser**:
  ```bash
  npm run web
  ```
- **Linting & Compilation Check**:
  ```bash
  npm run lint
  npx tsc --noEmit
  ```
