/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'hi' | 'gu';

export type UserGoal = 'weight_loss' | 'weight_gain' | 'muscle_building' | 'pregnancy' | 'senior_wellness' | 'kid_growth' | 'general_fitness';

export type DietType = 'veg' | 'non_veg' | 'egg' | 'jain' | 'keto' | 'vegan';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  goal: UserGoal;
  dietType: DietType;
  allergies: string[];
  medicalConditions: string[];
  streak: number;
  points: number;
  isPremium: boolean;
  subscriptionPlan?: 'basic' | 'pro' | 'elite';
  referralCode: string;
  referredBy?: string;
  language: Language;
  role?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'spouse' | 'child' | 'parent' | 'other';
  age: number;
  weight: number;
  height: number;
  goal: UserGoal;
  dietType: DietType;
}

export interface Meal {
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  ingredients: string[];
}

export interface DayDietPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
  totalCalories: number;
  advice: string;
}

export interface DietPlan {
  [day: string]: DayDietPlan;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: 'vegetables' | 'pulses_grains' | 'dairy' | 'spices_oils' | 'others';
  quantity: string;
  checked: boolean;
}

export interface WaterLog {
  id: string;
  amountMl: number;
  timestamp: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string; // "08:00", etc.
  frequency: 'daily' | 'twice_daily' | 'weekly';
  takenDates: string[]; // "YYYY-MM-DD"
}

export interface SleepLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  durationHours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface WeightLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  weight: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
}

export interface KidGrowthLog {
  id: string;
  date: string;
  ageMonths: number;
  heightCm: number;
  weightKg: number;
  milestones: string[];
}

export interface PregnancyLog {
  id: string;
  week: number;
  symptoms: string[];
  babySizeDesc: string; // e.g. "Size of a Mango"
  kickCount?: number;
}

export interface BlogItem {
  id: string;
  title: string;
  titleHi: string;
  titleGu: string;
  excerpt: string;
  excerptHi: string;
  excerptGu: string;
  category: string;
  image: string;
  readTime: string;
  content: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorGoal?: string;
  content: string;
  likes: number;
  likedByMe?: boolean;
  comments: { author: string; text: string; date: string }[];
  date: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  brand: string;
  category: 'supplements' | 'devices' | 'organic_foods' | 'lab_tests';
  price: number;
  originalPrice: number;
  rating: number;
  image: string;
  affiliateUrl: string;
  description: string;
}

export interface LabReportResult {
  parameterName: string;
  value: string;
  range: string;
  status: 'normal' | 'high' | 'low';
  aiInterpretation: string;
}

export interface CrashReport {
  id: string;
  timestamp: string;
  errorMessage: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  freeTrialDays: number;
  features: {
    [featureId: string]: boolean;
  };
  aiDailyLimit: number;
}

export interface CouponCode {
  code: string;
  discountPercent: number;
  active: boolean;
}

export interface AdminUserSubscription {
  uid: string;
  email: string;
  planId: string;
  status: 'active' | 'cancelled' | 'trialing';
  expiresAt: string;
  role?: string;
}

export interface AdminSettings {
  plans: SubscriptionPlan[];
  adsEnabled: boolean;
  coupons: CouponCode[];
  users: AdminUserSubscription[];
}

