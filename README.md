# بنك رقمي — Digital Bank

Full-stack digital banking platform built with **React + TypeScript** frontend and **Firebase** backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + Lucide Icons |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Backend | Firebase (Auth, Firestore, Functions, Storage) |
| Hosting | Firebase Hosting |

## Features

- 🔐 Phone + Password authentication
- 👤 User profiles with KYC support
- 💰 Multi-currency wallet accounts (YER, USD, SAR)
- 💸 Money transfers with atomic balance updates
- 📄 Bill payments (electricity, water, internet, phone)
- 📊 Transaction history with filters
- 🔔 Real-time notifications
- 👥 Admin panel with user management
- 🔒 RBAC (customer, agent, admin, super_admin)
- 📱 Responsive RTL design (Arabic-first)
- 🌙 Dark mode support

## Architecture

```
src/
├── components/     # Reusable UI + Layout
├── pages/          # Route pages (auth, dashboard, transfer, bills, admin)
├── services/       # Firebase API abstraction layer
├── hooks/          # Custom React hooks
├── store/          # Zustand state stores
├── types/          # TypeScript interfaces
├── utils/          # Helpers (format, validation)
├── i18n/           # Translations (Arabic)
└── config/         # Firebase configuration

functions/          # Firebase Cloud Functions (TypeScript)
├── src/
│   ├── auth.ts     # User creation trigger
│   ├── transactions.ts  # Transfer + bill payment
│   ├── admin.ts    # Role management
│   └── utils/      # Validators + logger
```

## Security

- ✅ Firestore Security Rules with RBAC custom claims
- ✅ Storage Security Rules (avatars, KYC docs)
- ✅ Client-side writes to `transactions` blocked (Cloud Functions only)
- ✅ Atomic balance updates via Firestore transactions
- ✅ Structured audit logging
- ✅ Input validation on client + server
- ✅ Firebase App Check ready

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project

### Setup

```bash
# Install dependencies
npm install

# Install function dependencies
cd functions && npm install && cd ..

# Copy environment variables
cp .env.example .env

# Edit .env with your Firebase config
# Get config from: Firebase Console → Project Settings → General → Your apps

# Run development server
npm run dev

# Run Firebase emulators (optional)
firebase emulators:start
```

### Deploy

```bash
# Build and deploy everything
npm run deploy

# Deploy only hosting
npm run deploy:hosting

# Deploy only functions
npm run deploy:functions

# Deploy only rules
npm run deploy:rules
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics Measurement ID |
| `VITE_APP_NAME` | Application name |
| `VITE_APP_DEFAULT_LANG` | Default language (ar) |

## Firebase Setup

### 1. Create Firebase Project
Go to [Firebase Console](https://console.firebase.google.com) and create a new project.

### 2. Enable Authentication
- Go to Authentication → Sign-in method
- Enable Email/Password provider

### 3. Create Firestore Database
- Go to Firestore Database
- Create database in production mode
- Deploy security rules: `firebase deploy --only firestore:rules`

### 4. Enable Storage
- Go to Storage
- Get started with default bucket
- Deploy storage rules: `firebase deploy --only storage`

### 5. Deploy Functions
```bash
cd functions
npm install
npm run deploy
```

### 6. Set Custom Claims
After deploying functions, set the first super admin:
```bash
# Via Firebase CLI or Admin SDK
firebase functions:shell
> setUserRole({userId: 'YOUR_UID', role: 'super_admin'})
```

## Flutter Integration

The Firebase backend is designed to be shared with a future Flutter app:
- Same Firestore collections
- Same Auth system
- Same Cloud Functions
- Same Security Rules

Flutter app will use identical data models with `cloud_firestore` package.

## Project Structure

```
digital-bank/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Input, Card
│   │   └── layout/       # Sidebar, Header, AppLayout, AuthLayout
│   ├── pages/
│   │   ├── auth/         # Login, Register, ForgotPassword
│   │   ├── dashboard/    # Main dashboard
│   │   ├── transfer/     # Money transfer
│   │   ├── bills/        # Bill payment
│   │   ├── history/      # Transaction history
│   │   ├── profile/      # User profile
│   │   ├── settings/     # App settings
│   │   └── admin/        # Admin panel
│   ├── services/         # Firebase API layer
│   ├── hooks/            # useAuth, useNotifications
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── utils/            # format, cn
│   ├── i18n/             # Arabic translations
│   └── config/           # Firebase config
├── functions/
│   └── src/              # Cloud Functions
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── .env.example
├── .gitignore
├── README.md
└── ARCHITECTURE.md
```

## License

Private — All rights reserved.
