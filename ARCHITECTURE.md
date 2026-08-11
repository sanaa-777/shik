# شيك - shik — Architecture Document

## 1. Overview

Full-stack شيك - shik platform built with React + TypeScript frontend and Firebase backend. Designed for production readiness and future Flutter mobile app integration.

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand + React Query |
| Backend | Firebase (Auth, Firestore, Functions, Storage, Hosting) |
| Language | TypeScript (frontend + Cloud Functions) |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions |

## 3. Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │  Pages   │ │Components│ │  Service Layer   ││
│  │          │ │          │ │  (API Abstraction)││
│  └────┬─────┘ └──────────┘ └────────┬─────────┘│
│       │                              │          │
│  ┌────▼──────────────────────────────▼────────┐│
│  │           Firebase SDK (Client)             ││
│  └────────────────────┬───────────────────────┘│
└───────────────────────┼────────────────────────┘
                        │
┌───────────────────────▼────────────────────────┐
│              Firebase Backend                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │   Auth   │ │Firestore │ │ Cloud Functions│ │
│  │          │ │          │ │  (Server-side) │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Storage  │ │   FCM    │ │   App Check    │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
└────────────────────────────────────────────────┘
```

## 4. Firestore Schema

### Collections

```
users/{userId}
├── profile: { displayName, phone, email, avatar, nationalId, address }
├── role: "customer" | "agent" | "admin" | "super_admin"
├── status: "active" | "suspended" | "pending"
├── kyc: { verified, level, documents[] }
├── settings: { language, notifications, biometric }
├── createdAt, updatedAt

accounts/{accountId}
├── userId: ref → users
├── type: "wallet" | "savings" | "current"
├── currency: "YER" | "USD" | "SAR"
├── balance: number
├── status: "active" | "frozen" | "closed"
├── accountNumber: string
├── createdAt, updatedAt

transactions/{transactionId}
├── from: { accountId, userId, name }
├── to: { accountId, userId, name }
├── amount: number
├── currency: string
├── type: "transfer" | "deposit" | "withdrawal" | "payment" | "bill"
├── status: "pending" | "completed" | "failed" | "reversed"
├── fee: number
├── reference: string
├── metadata: {}
├── createdAt

bills/{billId}
├── userId: ref → users
├── type: "electricity" | "water" | "internet" | "phone"
├── provider: string
├── accountNumber: string
├── amount: number
├── status: "pending" | "paid" | "failed"
├── dueDate: timestamp
├── paidAt: timestamp

notifications/{notificationId}
├── userId: ref → users
├── title: string
├── body: string
├── type: "transaction" | "account" | "promotion" | "security"
├── read: boolean
├── data: {}
├── createdAt

audit_logs/{logId}
├── userId: ref → users
├── action: string
├── resource: string
├── resourceId: string
├── details: {}
├── ip: string
├── timestamp: timestamp
```

### Indexes

```
transactions: [from.userId, createdAt DESC]
transactions: [to.userId, createdAt DESC]
transactions: [status, createdAt DESC]
accounts: [userId, type]
notifications: [userId, read, createdAt DESC]
audit_logs: [userId, timestamp DESC]
audit_logs: [action, timestamp DESC]
```

## 5. Authentication & RBAC

### Auth Flow
1. Phone + Password → Firebase Auth
2. Optional: OTP verification for sensitive ops
3. JWT token with custom claims (role)

### RBAC Roles

| Role | Permissions |
|---|---|
| customer | View own accounts, transfer, pay bills, view history |
| agent | All customer + cash-in/cash-out for others |
| admin | View all users, manage accounts, view reports |
| super_admin | All + system settings, role management |

### Custom Claims (set via Cloud Function)
```typescript
{
  role: "customer" | "agent" | "admin" | "super_admin",
  userId: string,
  accountIds: string[]
}
```

## 6. Cloud Functions

| Function | Trigger | Purpose |
|---|---|---|
| setUserRole | HTTPS Callable | Set user role (super_admin only) |
| transferMoney | HTTPS Callable | Execute transfer with validation |
| processBillPayment | HTTPS Callable | Pay bill with validation |
| reverseTransaction | HTTPS Callable | Reverse failed transaction (admin) |
| onUserCreate | Auth trigger | Create user profile + default account |
| onTransactionCreate | Firestore trigger | Update balances, send notification |
| scheduledAccountCleanup | Scheduled | Clean suspended accounts |
| generateStatement | HTTPS Callable | Generate account statement PDF |

## 7. Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || hasRole('admin'));
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Accounts: owner read, admin read/write
    match /accounts/{accountId} {
      allow read: if isOwner(resource.data.userId) || hasRole('admin');
      allow write: if hasRole('admin');
    }
    
    // Transactions: read by involved parties, write only via Cloud Functions
    match /transactions/{transactionId} {
      allow read: if isInvolved(resource.data) || hasRole('admin');
      allow create: if false; // Only via Cloud Functions
      allow update: if false;
    }
    
    // Notifications: owner read only
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if false; // Only via Cloud Functions
    }
    
    // Audit logs: admin read only
    match /audit_logs/{logId} {
      allow read: if hasRole('admin');
      allow write: if false; // Only via Cloud Functions
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /kyc/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId || hasRole('admin');
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## 8. Service Layer (API Abstraction)

All Firebase calls go through a service layer — never direct SDK calls in components.

```
src/services/
├── auth.service.ts      // login, register, logout, resetPassword
├── user.service.ts      // getProfile, updateProfile, uploadAvatar
├── account.service.ts   // getAccounts, getBalance, createAccount
├── transaction.service.ts // transfer, getHistory, getDetails
├── bill.service.ts      // getProviders, payBill, getHistory
├── notification.service.ts // getNotifications, markRead
└── admin.service.ts     // getUsers, manageUsers, getReports
```

## 9. Project Structure

```
shik/
├── public/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base components (Button, Input, Card...)
│   │   ├── layout/       # Layout components (Sidebar, Header, Footer)
│   │   └── shared/       # Shared domain components
│   ├── pages/            # Page components (routes)
│   │   ├── auth/         # Login, Register, ResetPassword
│   │   ├── dashboard/    # Main dashboard
│   │   ├── accounts/     # Account list, details
│   │   ├── transfer/     # Transfer flow
│   │   ├── bills/        # Bill payment
│   │   ├── history/      # Transaction history
│   │   ├── profile/      # User profile
│   │   └── admin/        # Admin panel
│   ├── services/         # Firebase API abstraction
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types/interfaces
│   ├── utils/            # Utility functions
│   ├── config/           # Firebase config, constants
│   ├── i18n/             # Internationalization
│   └── App.tsx
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── bills.ts
│   │   ├── admin.ts
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── README.md
└── ARCHITECTURE.md
```

## 10. Future Flutter Integration

The Firebase backend is designed to be shared:
- Same Firestore collections
- Same Auth system
- Same Cloud Functions
- Same Security Rules
- Same Storage paths

Flutter app will use `firebase_core`, `cloud_firestore`, `firebase_auth` packages with identical data models.
