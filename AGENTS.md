# NutriOS AI Development & Architecture Guide

Welcome to the **NutriOS AI** system architecture and future development manual. This document serves as a persistent guide for AI agents, developers, and system administrators working on the codebase.

---

## 1. Project Architecture

NutriOS is a high-performance full-stack health intelligence application built using:
- **Frontend**: React 18+ paired with Vite, utilizing TypeScript and styled with Tailwind CSS utility classes.
- **Backend / Integration**: Express.js server hosted in a container environment routing exclusively on **Port 3000** for container ingress.
- **State Management**: Real-time reactive data pipelines synced with **Firebase Firestore** and fallback local state persistence.
- **AI Core**: Gemini SDK proxy layer evaluating real-time health, dietary, and biochemical lab reports.

### Directory Structure
```text
├── .env.example              # Template for required environment variables
├── capacitor.config.json     # Mobile compilation and platform sync variables
├── firebase-blueprint.json   # Structural Firestore schema schema specification
├── firestore.rules           # Declarative Firestore security verification rules
├── security_spec.md          # Comprehensive threat matrix analysis
├── server.ts                 # Full-stack CJS express server handling API routes & Vite proxying
└── src/
    ├── App.tsx               # Primary interface coordinator
    ├── data.ts               # Local language translations and structural data
    ├── types.ts              # Declarative TypeScript models (enforcing strong typing)
    ├── components/
    │   ├── AIPanels.tsx      # Core AI health, meal, and medical analysis dashboards
    │   └── MoreSections.tsx  # Dynamic store, diagnostic portals, and admin dashboards
    └── services/
        ├── adminSettings.ts  # Real-time Firestore dynamic config and fallback sync service
        ├── ai.ts             # Gemini SDK wrapper calls
        └── firebase.ts       # Firestore database initialization guards
```

---

## 2. Firestore Schema Specification

The database utilizes two primary collections configured within `firebase-blueprint.json`:

### A. `/users/{userId}` (Schema: `UserProfile`)
Maintains individual biometric tracking data and subscription status identifiers.
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  dietType: string;
  streak: number;
  points: number;
  isPremium: boolean;
  subscriptionPlan?: string; // Links dynamically to plan configurations
  referralCode?: string;
  language: Language;
}
```

### B. `/admin_configs/system_settings` (Schema: `AdminSettings`)
Global system settings document evaluating dynamic operational parameters and dynamic feature gates.
```typescript
interface AdminSettings {
  plans: SubscriptionPlan[];
  adsEnabled: boolean;
  coupons: CouponCode[];
  users: AdminUserSubscription[];
}
```

---

## 3. Dynamic Subscription Logic & Feature Flags

Dynamic feature flag controls allow the platform administrator to enable/disable modules or configure daily AI usage caps in real-time without releasing a new build.

### subscriptionPlan Configuration Structure
```typescript
interface SubscriptionPlan {
  id: string;               // e.g., 'free', 'premium', 'family'
  name: string;             // Display label
  price: number;            // Cost in INR (₹)
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  freeTrialDays: number;
  features: {
    ai_diet_planner: boolean;
    grocery_planner: boolean;
    weight_tracker: boolean;
    water_tracker: boolean;
    family_onboarding: boolean;
    blood_report_ai: boolean;
  };
  aiDailyLimit: number;     // Hard stop limit count per calendar day
}
```

### Real-Time In-App Updates
- Components load rules using `subscribeAdminSettings()` in `adminSettings.ts`.
- It registers a Firestore `onSnapshot` listener.
- If offline or on standard localhost environments, it falls back to custom cross-tab React events (`nutrios_admin_settings_updated` and `storage` browser keys) to guarantee that any edit in the administrator screen is synchronized inside the active interface tabs **instantly**.

### Client-Side Limit Checks & Locks
- **Interactive Check**: Every AI action is gated by the client-side check `checkAndIncrementAiLimit()`.
- **Exhaustion Prompts**: When the active daily count matches the plan's limit, a warning alert triggers, prompting the user to upgrade.
- **Module Lock Screen**: If a feature-toggle for the active plan is false, the module tab renders a locked illustration (`renderLockedScreen`), directing the user to upgrade in the Store or modifying the values in the Admin panel.

---

## 4. Admin Permissions & Security Rules

Only verified emails can perform writes on system configurations.
- **Administrator Email Identifier**: `abdulshahid3368@gmail.com`
- **Firestore Verification Rules (`firestore.rules`)**:
  ```javascript
  function isAdmin() {
    return isSignedIn() && (
      request.auth.token.email == "abdulshahid3368@gmail.com" ||
      request.auth.token.email == "Abdulshahid3368@gmail.com"
    );
  }
  ```
- **Read Permissions**: Global configs `/admin_configs/{docId}` allow unrestricted reads so that guests can fetch active coupons and subscription plan information to load the Store interfaces.
- **Write Permissions**: Restricted exclusively to `isAdmin()`.

---

## 5. Coding & Development Standards

To maintain clean, robust systems, always adhere to the following standards:
1. **No Mock Data for Dynamic Work**: Avoid replacing working endpoints with fake placeholders when Firestore or a local fallback synchronization pipeline exists.
2. **Read-Modify-Write**: Always read files with `view_file` to see exact lines before making surgical modifications.
3. **Dedicated File Tools**: Prefer using `view_file` and `list_dir` over shell alternatives.
4. **Environment Variables**: Add all new secret configs to `.env.example`. Never commit absolute credentials or raw client secrets.
5. **Vite Port Rules**: Keep Vite listening on host `0.0.0.0` at port `3000`.

---

## 6. Build & Deployment Processes

### Automated Quality Checks
Always run standard verifications during active iterations:
```bash
# Check code and types for compilation errors
npm run lint

# Compile the final application code and bundle Node.js services
npm run build
```

### Production Build Flow
When the application compiles:
1. Vite bundles static assets to the `/dist` directory.
2. Esbuild compiles the typescript server wrapper `server.ts` into a unified CJS binary located at `/dist/server.cjs` via:
   `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
3. The production engine boots the application via `node dist/server.cjs`.

### Mobile Application Pipeline (Capacitor)
- Compile web files (`npm run build`).
- Sync with mobile platforms: `npm run cap:sync`.
- To add platforms (e.g. Android): `npm run cap:add-android`.
- Configuration parameters can be updated directly within `capacitor.config.json` or `capacitor.config.ts`.
