import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { AdminSettings, SubscriptionPlan, CouponCode, AdminUserSubscription } from '../types';

const SETTINGS_DOC_ID = 'system_settings';
const SETTINGS_COLLECTION = 'admin_configs';

// Firestore Error handler as defined in the Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, // Custom auth provider is handled separately or is mock
      email: null,
    },
    operationType,
    path
  };
  console.error('[Firestore Error]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Starter Plan',
    price: 0,
    billingPeriod: 'monthly',
    freeTrialDays: 0,
    features: {
      ai_diet_planner: true,
      grocery_planner: true,
      weight_tracker: true,
      water_tracker: true,
      family_onboarding: false,
      blood_report_ai: false,
    },
    aiDailyLimit: 3,
  },
  {
    id: 'premium',
    name: 'Pro Metabolic Gold',
    price: 299,
    billingPeriod: 'monthly',
    freeTrialDays: 7,
    features: {
      ai_diet_planner: true,
      grocery_planner: true,
      weight_tracker: true,
      water_tracker: true,
      family_onboarding: true,
      blood_report_ai: true,
    },
    aiDailyLimit: 50,
  },
  {
    id: 'family',
    name: 'Metabolic Family Pack',
    price: 599,
    billingPeriod: 'monthly',
    freeTrialDays: 14,
    features: {
      ai_diet_planner: true,
      grocery_planner: true,
      weight_tracker: true,
      water_tracker: true,
      family_onboarding: true,
      blood_report_ai: true,
    },
    aiDailyLimit: 200,
  }
];

export const DEFAULT_COUPONS: CouponCode[] = [
  { code: 'NUTRI50', discountPercent: 50, active: true },
  { code: 'METABOLIC30', discountPercent: 30, active: true },
  { code: 'FREERUN', discountPercent: 100, active: false }
];

export const DEFAULT_USERS: AdminUserSubscription[] = [
  { uid: 'user_01', email: 'abdulshahid3368@gmail.com', planId: 'premium', status: 'active', expiresAt: '2027-12-31', role: 'super_admin' },
  { uid: 'user_02', email: 'guest@nutrios.ai', planId: 'free', status: 'trialing', expiresAt: '2026-08-15', role: 'user' }
];

export const DEFAULT_SETTINGS: AdminSettings = {
  plans: DEFAULT_PLANS,
  adsEnabled: true,
  coupons: DEFAULT_COUPONS,
  users: DEFAULT_USERS
};

// Retrieve Admin Settings from Firestore (fallback to localStorage)
export async function fetchAdminSettings(): Promise<AdminSettings> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AdminSettings;
        // Merge missing keys to keep it backwards compatible
        return {
          plans: data.plans || DEFAULT_PLANS,
          adsEnabled: data.adsEnabled !== undefined ? data.adsEnabled : true,
          coupons: data.coupons || DEFAULT_COUPONS,
          users: data.users || DEFAULT_USERS,
        };
      } else {
        // Seed database on first run
        await setDoc(docRef, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  }

  // Fallback storage
  const cached = localStorage.getItem('nutrios_admin_settings');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      console.error('[AdminSettings] Cache parse error:', err);
    }
  }

  // Save defaults to cache
  localStorage.setItem('nutrios_admin_settings', JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
}

// Update Admin Settings
export async function saveAdminSettings(settings: AdminSettings): Promise<boolean> {
  // Save locally first
  localStorage.setItem('nutrios_admin_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('nutrios_admin_settings_updated'));

  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  }
  return true;
}

// Subscribe to Admin Settings from Firestore in real-time
export function subscribeAdminSettings(callback: (settings: AdminSettings) => void): () => void {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AdminSettings;
        callback({
          plans: data.plans || DEFAULT_PLANS,
          adsEnabled: data.adsEnabled !== undefined ? data.adsEnabled : true,
          coupons: data.coupons || DEFAULT_COUPONS,
          users: data.users || DEFAULT_USERS,
        });
      } else {
        setDoc(docRef, DEFAULT_SETTINGS).then(() => {
          callback(DEFAULT_SETTINGS);
        }).catch(err => {
          console.error('[AdminSettings] Error seeding on empty snap:', err);
        });
      }
    }, (error) => {
      console.error('[AdminSettings] Real-time subscription error:', error);
      // Fallback to local storage storage events
      const handleStorageChange = () => {
        const cached = localStorage.getItem('nutrios_admin_settings');
        if (cached) {
          try {
            callback(JSON.parse(cached));
          } catch (e) {}
        }
      };
      window.addEventListener('storage', handleStorageChange);
    });

    return () => {
      unsubscribe();
    };
  }

  // Fallback for offline/development environment
  const handleCustomUpdate = (e: Event) => {
    const cached = localStorage.getItem('nutrios_admin_settings');
    if (cached) {
      try {
        callback(JSON.parse(cached));
      } catch (err) {}
    }
  };

  window.addEventListener('nutrios_admin_settings_updated', handleCustomUpdate);
  
  // Also hook window 'storage' events for multi-tab simulation
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'nutrios_admin_settings' && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Initial load
  fetchAdminSettings().then(callback);

  return () => {
    window.removeEventListener('nutrios_admin_settings_updated', handleCustomUpdate);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
