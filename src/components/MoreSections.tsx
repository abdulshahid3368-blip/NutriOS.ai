import React, { useState, useEffect } from 'react';
import { UserProfile, Language, MarketplaceProduct, BlogItem, CommunityPost, AdminSettings, SubscriptionPlan, CouponCode, AdminUserSubscription } from '../types';
import { TRANSLATIONS, DEFAULT_PRODUCTS, DEFAULT_BLOGS, DEFAULT_COMMUNITY } from '../data';
import { fetchAdminSettings, saveAdminSettings, subscribeAdminSettings } from '../services/adminSettings';
import {
  ShoppingBag,
  CreditCard,
  BookOpen,
  MessageSquare,
  Settings as SettingsIcon,
  Sliders,
  CheckCircle,
  ThumbsUp,
  MessageCircle,
  Send,
  Sparkles,
  Info,
  ShieldCheck,
  Languages,
  Bell,
  Cpu,
  Trash,
  X,
  CreditCard as CardIcon,
  Smartphone,
  Check,
  Lock,
  Moon,
  Sun,
  Plus,
  Edit2,
  Save,
  Users,
  Ticket,
  Tv,
  Eye,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isFirebaseConfigured, db } from '../services/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

interface MoreSectionsProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  initialTab?: string;
}

export default function MoreSections({ language, setLanguage, profile, updateProfile, initialTab }: MoreSectionsProps) {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'market');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Theme preference
  const [themeMode, setThemeMode] = useState<'oled' | 'navy'>('oled');

  // 1. Marketplace states
  const [products] = useState<MarketplaceProduct[]>(DEFAULT_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 2. Subscription/Gold states
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);

  // Load admin settings dynamically in real-time
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAdminSettings(settings => {
      setAdminSettings(settings);
      setLoadingSettings(false);
    });
    return () => unsubscribe();
  }, []);

  // Interactive Payment Overlay States
  const [activeCheckout, setActiveCheckout] = useState<{ plan: string; price: number; gateway: 'razorpay' | 'googleplay' } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'gateway_selection' | 'details_input' | 'processing' | 'success'>('gateway_selection');
  const [paymentForm, setPaymentForm] = useState({ cardNo: '', expiry: '', cvv: '', upiId: '', payMethod: 'upi' });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 3. Blog states
  const [blogs] = useState<BlogItem[]>(DEFAULT_BLOGS);

  // 4. Community forum states
  const [posts, setPosts] = useState<CommunityPost[]>(DEFAULT_COMMUNITY);
  const [newPostText, setNewPostText] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // 5. Admin diagnostics states
  const [serverHealth] = useState({ active: true, latency: '24ms', uptime: '99.9%' });
  const [crashReports] = useState<any[]>([
    { id: '1', timestamp: '2026-07-19T10:05:00', error: 'Vite HMR: Websocket connection skipped (Benign Dev Node)', severity: 'low' },
    { id: '2', timestamp: '2026-07-19T12:30:22', error: 'Gemini API: Token limits handled successfully (Active cognitive routing)', severity: 'medium' }
  ]);

  // 5. Interactive Admin Tab states
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'plans' | 'ads_coupons' | 'users' | 'metrics'>('plans');

  // Plan editing
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanForm, setEditPlanForm] = useState<SubscriptionPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState<SubscriptionPlan>({
    id: '',
    name: '',
    price: 0,
    billingPeriod: 'monthly',
    freeTrialDays: 0,
    features: {
      ai_diet_planner: true,
      grocery_planner: true,
      weight_tracker: true,
      water_tracker: true,
      family_onboarding: false,
      blood_report_ai: false
    },
    aiDailyLimit: 10
  });

  // Coupons
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);

  // Users
  const [editingUserUid, setEditingUserUid] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<AdminUserSubscription | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState<AdminUserSubscription>({
    uid: '',
    email: '',
    planId: 'free',
    status: 'active',
    expiresAt: '2027-12-31',
    role: 'user'
  });

  // Action Handlers
  const handleSavePlan = async (plan: SubscriptionPlan) => {
    if (!adminSettings) return;
    const updatedPlans = adminSettings.plans.map(p => p.id === plan.id ? plan : p);
    const updatedSettings = { ...adminSettings, plans: updatedPlans };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    setEditingPlanId(null);
    setEditPlanForm(null);
    alert('Subscription plan updated successfully!');
  };

  const handleCreatePlan = async () => {
    if (!adminSettings) return;
    if (!newPlanForm.id || !newPlanForm.name) {
      alert('Plan ID and Name are required.');
      return;
    }
    if (adminSettings.plans.some(p => p.id === newPlanForm.id)) {
      alert('A plan with this ID already exists.');
      return;
    }
    const updatedSettings = { ...adminSettings, plans: [...adminSettings.plans, newPlanForm] };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    setIsCreatingPlan(false);
    setNewPlanForm({
      id: '',
      name: '',
      price: 0,
      billingPeriod: 'monthly',
      freeTrialDays: 0,
      features: {
        ai_diet_planner: true,
        grocery_planner: true,
        weight_tracker: true,
        water_tracker: true,
        family_onboarding: false,
        blood_report_ai: false
      },
      aiDailyLimit: 10
    });
    alert('New subscription plan created successfully!');
  };

  const handleDeletePlan = async (planId: string) => {
    if (!adminSettings) return;
    if (planId === 'free') {
      alert('Cannot delete the default Free Starter Plan.');
      return;
    }
    if (!confirm('Are you sure you want to delete this subscription plan? Users on this plan might be affected.')) return;
    const updatedPlans = adminSettings.plans.filter(p => p.id !== planId);
    const updatedSettings = { ...adminSettings, plans: updatedPlans };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    alert('Plan deleted successfully!');
  };

  const handleToggleFeatureInEdit = (featureId: string) => {
    if (!editPlanForm) return;
    setEditPlanForm({
      ...editPlanForm,
      features: {
        ...editPlanForm.features,
        [featureId]: !editPlanForm.features[featureId]
      }
    });
  };

  const handleToggleFeatureInNew = (featureId: string) => {
    setNewPlanForm({
      ...newPlanForm,
      features: {
        ...newPlanForm.features,
        [featureId]: !newPlanForm.features[featureId]
      }
    });
  };

  const handleToggleAds = async () => {
    if (!adminSettings) return;
    const updatedSettings = { ...adminSettings, adsEnabled: !adminSettings.adsEnabled };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    alert(`Global advertisements have been ${updatedSettings.adsEnabled ? 'ENABLED' : 'DISABLED'}.`);
  };

  const handleCreateCoupon = async () => {
    if (!adminSettings) return;
    if (!newCouponCode.trim()) {
      alert('Coupon code cannot be empty.');
      return;
    }
    const code = newCouponCode.trim().toUpperCase();
    if (adminSettings.coupons.some(c => c.code === code)) {
      alert('Coupon code already exists.');
      return;
    }
    const newCoupon: CouponCode = {
      code,
      discountPercent: Number(newCouponDiscount),
      active: true
    };
    const updatedSettings = { ...adminSettings, coupons: [...adminSettings.coupons, newCoupon] };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    setNewCouponCode('');
    alert('New coupon code created successfully!');
  };

  const handleToggleCoupon = async (code: string) => {
    if (!adminSettings) return;
    const updatedCoupons = adminSettings.coupons.map(c => c.code === code ? { ...c, active: !c.active } : c);
    const updatedSettings = { ...adminSettings, coupons: updatedCoupons };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!adminSettings) return;
    const updatedCoupons = adminSettings.coupons.filter(c => c.code !== code);
    const updatedSettings = { ...adminSettings, coupons: updatedCoupons };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    alert('Coupon deleted successfully!');
  };

  const handleSaveUser = async (user: AdminUserSubscription) => {
    if (!adminSettings) return;
    
    // Security check: Only a super_admin can promote to admin or super_admin
    const targetRole = user.role || 'user';
    const existingUser = adminSettings.users.find(u => u.uid === user.uid);
    const existingRole = existingUser?.role || 'user';
    
    if ((targetRole === 'admin' || targetRole === 'super_admin' || existingRole === 'admin' || existingRole === 'super_admin') && profile.role !== 'super_admin') {
      alert('Security violation: Only a super_admin can create, promote, or demote administrative roles.');
      return;
    }

    const updatedUsers = adminSettings.users.map(u => u.uid === user.uid ? user : u);
    const updatedSettings = { ...adminSettings, users: updatedUsers };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);

    // Sync to user profile in Firestore if available
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { role: targetRole }, { merge: true });
        console.log(`[Admin] Synced user role '${targetRole}' to /users/${user.uid}`);
      } catch (err) {
        console.error('[Admin] Error syncing user role to Firestore:', err);
      }
    }

    setEditingUserUid(null);
    setEditUserForm(null);
    alert('User settings and role saved successfully!');
  };

  const handleCreateUser = async () => {
    if (!adminSettings) return;
    if (!newUserForm.uid || !newUserForm.email) {
      alert('User UID and Email are required.');
      return;
    }
    if (adminSettings.users.some(u => u.uid === newUserForm.uid)) {
      alert('User with this UID already exists.');
      return;
    }

    const targetRole = newUserForm.role || 'user';
    if ((targetRole === 'admin' || targetRole === 'super_admin') && profile.role !== 'super_admin') {
      alert('Security violation: Only a super_admin can create users with administrative privileges.');
      return;
    }

    const updatedSettings = { ...adminSettings, users: [...adminSettings.users, newUserForm] };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);

    // Sync user profile creation to Firestore if available
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', newUserForm.uid);
        await setDoc(userDocRef, {
          id: newUserForm.uid,
          email: newUserForm.email,
          name: newUserForm.email.split('@')[0],
          role: targetRole,
          streak: 1,
          points: 500,
          isPremium: newUserForm.planId !== 'free',
          subscriptionPlan: newUserForm.planId,
          language: 'en',
          age: 30,
          gender: 'male',
          height: 175,
          weight: 70,
          goal: 'general_fitness',
          dietType: 'veg'
        }, { merge: true });
        console.log(`[Admin] Created user profile and role '${targetRole}' for /users/${newUserForm.uid}`);
      } catch (err) {
        console.error('[Admin] Error creating user profile in Firestore:', err);
      }
    }

    setIsCreatingUser(false);
    setNewUserForm({
      uid: '',
      email: '',
      planId: 'free',
      status: 'active',
      expiresAt: '2027-12-31',
      role: 'user'
    });
    alert('New user subscription and role created successfully!');
  };

  const handleDeleteUser = async (uid: string) => {
    if (!adminSettings) return;
    if (!confirm('Are you sure you want to remove this user from the subscription management list?')) return;
    const updatedUsers = adminSettings.users.filter(u => u.uid !== uid);
    const updatedSettings = { ...adminSettings, users: updatedUsers };
    setAdminSettings(updatedSettings);
    await saveAdminSettings(updatedSettings);
    alert('User removed from subscriber registry.');
  };

  // Filters
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Handlers
  const handleApplyCoupon = () => {
    if (!adminSettings) {
      if (couponCode.toUpperCase() === 'NUTRI50') {
        setDiscount(50);
        alert('Coupon Applied Successfully! 50% discount registered.');
      } else {
        alert('Invalid Coupon Code. Try "NUTRI50".');
      }
      return;
    }
    const found = adminSettings.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (found) {
      setDiscount(found.discountPercent);
      alert(`Coupon "${found.code}" Applied Successfully! ${found.discountPercent}% discount registered.`);
    } else {
      alert('Invalid or inactive Coupon Code.');
    }
  };

  const handleOpenCheckout = (planId: string, basePrice: number) => {
    const finalPrice = Math.round(basePrice * (1 - discount / 100));
    setActiveCheckout({ plan: planId, price: finalPrice, gateway: 'razorpay' });
    setCheckoutStep('gateway_selection');
    setPaymentError(null);
  };

  const handleProcessPayment = () => {
    if (checkoutStep === 'details_input') {
      if (paymentForm.payMethod === 'card') {
        if (paymentForm.cardNo.length < 12) {
          setPaymentError('Invalid Card Number. Please enter a valid test card.');
          return;
        }
      } else {
        if (!paymentForm.upiId.includes('@')) {
          setPaymentError('Please enter a valid UPI ID (e.g. user@okhdfcbank)');
          return;
        }
      }
    }

    setCheckoutStep('processing');
    setPaymentError(null);

    setTimeout(async () => {
      // Setup premium status
      const updatedProfile = {
        ...profile,
        isPremium: true,
        subscriptionPlan: activeCheckout?.plan as any
      };
      
      // Update locally
      updateProfile(updatedProfile);

      // Try syncing to Firestore if available
      if (isFirebaseConfigured && db) {
        try {
          const docRef = doc(db, 'users', profile.id);
          await setDoc(docRef, updatedProfile, { merge: true });
          console.log('[NutriOS Firebase] Synchronized Gold subscription premium status.');
        } catch (err) {
          console.error('[NutriOS Firebase] Firestore sub sync failed:', err);
        }
      }

      setCheckoutStep('success');
      setShowInvoice(true);
    }, 2000);
  };

  const handleAddPost = () => {
    if (!newPostText.trim()) return;
    const post: CommunityPost = {
      id: Math.random().toString(),
      author: profile.name,
      authorGoal: profile.goal.replace('_', ' ').toUpperCase(),
      content: newPostText.trim(),
      likes: 0,
      likedByMe: false,
      comments: [],
      date: new Date().toISOString()
    };
    setPosts([post, ...posts]);
    setNewPostText('');
  };

  const handleLikePost = (id: string) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
          likedByMe: !p.likedByMe
        };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: profile.name, text: text.trim(), date: 'Today' }]
        };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  return (
    <div className={`border border-[#1a1a1a] rounded-2xl p-4 md:p-6 shadow-xl relative transition-all duration-300 ${
      themeMode === 'navy' ? 'bg-[#0a1120]' : 'bg-[#080808]'
    }`}>
      
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1a1a1a] pb-4">
        {[
          { id: 'market', label: 'NutriOS Store', icon: ShoppingBag },
          { id: 'sub', label: 'Gold Premium plans', icon: CreditCard },
          { id: 'blog', label: 'Health Pulse Blog', icon: BookOpen },
          { id: 'community', label: 'Community Feed', icon: MessageSquare },
          { id: 'admin', label: 'Admin Diagnostic Console', icon: Sliders },
          { id: 'settings', label: 'OS Settings', icon: SettingsIcon }
        ].filter(item => item.id !== 'admin' || profile.role === 'super_admin').map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Content panels */}

      {/* 1. Marketplace */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-[#1a1a1a] pb-3">
            {['all', 'supplements', 'devices', 'lab_tests'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-md text-[10px] font-mono tracking-wider uppercase transition cursor-pointer border ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-black font-bold border-emerald-500' 
                    : 'bg-[#111] text-slate-400 border-[#222] hover:bg-[#1a1a1a]'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <img src={p.image} className="w-full h-32 object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300" alt={p.name} referrerPolicy="referrer" />
                  <div className="p-4 space-y-1">
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">{p.brand}</span>
                    <h4 className="font-bold text-xs text-slate-200 line-clamp-2">{p.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 pt-1">{p.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#1a1a1a] mt-3 flex justify-between items-center bg-[#111]/50">
                  <div>
                    <span className="text-xs font-bold text-slate-100 font-serif">₹{p.price}</span>
                    <span className="text-[10px] text-slate-500 line-through ml-1.5">₹{p.originalPrice}</span>
                  </div>
                  <a
                    href={p.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-3 bg-emerald-500 hover:bg-[#10b981] text-black font-semibold rounded text-[10px] uppercase cursor-pointer transition"
                  >
                    Buy Product
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Subscription plans */}
      {activeTab === 'sub' && (
        <div className="space-y-6">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Got a Coupon Code?</h4>
              <p className="text-xs text-slate-400">Apply discount coupons (Try: <span className="font-mono text-emerald-400 font-bold">NUTRI50</span>)</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="PROMO50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="bg-[#111] text-white border border-[#222] px-3 py-1.5 text-xs rounded-lg uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
              />
              <button onClick={handleApplyCoupon} className="py-1.5 px-3 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-[#10b981] cursor-pointer transition">Apply</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(adminSettings?.plans || [
              { id: 'free', name: 'Free Starter Plan', price: 0, billingPeriod: 'monthly', freeTrialDays: 0, features: { ai_diet_planner: true, grocery_planner: true, weight_tracker: true, water_tracker: true, family_onboarding: false, blood_report_ai: false }, aiDailyLimit: 3 },
              { id: 'premium', name: 'Pro Metabolic Gold', price: 299, billingPeriod: 'monthly', freeTrialDays: 7, features: { ai_diet_planner: true, grocery_planner: true, weight_tracker: true, water_tracker: true, family_onboarding: true, blood_report_ai: true }, aiDailyLimit: 50 },
              { id: 'family', name: 'Metabolic Family Pack', price: 599, billingPeriod: 'monthly', freeTrialDays: 14, features: { ai_diet_planner: true, grocery_planner: true, weight_tracker: true, water_tracker: true, family_onboarding: true, blood_report_ai: true }, aiDailyLimit: 200 }
            ]).map(plan => {
              const finalPrice = Math.round(plan.price * (1 - discount / 100));
              const featureLabels: { [key: string]: string } = {
                ai_diet_planner: 'AI Diet Planner',
                grocery_planner: 'Smart Grocery Planner',
                weight_tracker: 'Precision Weight Tracker',
                water_tracker: 'Continuous Water Logger',
                family_onboarding: 'Pediatric & Maternity Family Hub',
                blood_report_ai: 'Blood Biochem AI Interpretation'
              };

              return (
                <div key={plan.id} className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 rounded-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                  {plan.freeTrialDays > 0 && (
                    <div className="absolute top-2 right-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {plan.freeTrialDays} Days Free Trial
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">{plan.name}</h5>
                    <div className="my-2 flex items-baseline">
                      <span className="text-2xl font-light text-slate-100 font-serif">₹{finalPrice}</span>
                      <span className="text-[10px] text-slate-500 ml-1">/ {plan.billingPeriod === 'monthly' ? 'month' : plan.billingPeriod === 'quarterly' ? 'quarter' : 'year'}</span>
                    </div>

                    <ul className="space-y-2 mt-4 border-t border-[#1a1a1a] pt-3">
                      <li className="text-[11px] text-emerald-400 font-bold font-mono">
                        AI LIMIT: {plan.aiDailyLimit} requests / day
                      </li>
                      {Object.entries(plan.features).map(([fid, enabled]) => {
                        if (!enabled) return null;
                        return (
                          <li key={fid} className="text-[11px] text-slate-400 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            {featureLabels[fid] || fid.replace('_', ' ')}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {plan.id !== 'free' ? (
                    <button
                      onClick={() => handleOpenCheckout(plan.id, plan.price)}
                      className="w-full py-2 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition"
                    >
                      Upgrade Now
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-[#111] text-center border border-[#222] text-slate-500 rounded-lg text-xs font-semibold">
                      Current Default
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showInvoice && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl space-y-2 text-center relative overflow-hidden">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-300">GOLD PREMIUM ACTIVE</h4>
              <p className="text-xs text-emerald-400/90 leading-relaxed">
                Thank you for upgrading! Razorpay receipt and billing invoice has been delivered to your profile email.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Blogs */}
      {activeTab === 'blog' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogs.map(b => (
              <div key={b.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <img src={b.image} className="w-full h-36 object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300" alt={b.title} referrerPolicy="no-referrer" />
                <div className="p-4 space-y-2">
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">{b.category} • {b.readTime}</span>
                  <h4 className="font-bold text-sm text-slate-200">
                    {language === 'hi' ? b.titleHi : language === 'gu' ? b.titleGu : b.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'hi' ? b.excerptHi : language === 'gu' ? b.excerptGu : b.excerpt}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-[#1a1a1a]">{b.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Community Feed */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#1a1a1a] space-y-2">
            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">SHARE POST TO METABOLIC FELLOWS</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log recipes, share streaks, or request tips..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPost()}
                className="flex-1 bg-[#111] text-white border border-[#222] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
              />
              <button onClick={handleAddPost} className="px-4 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition">
                Post
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-[#0d0d0d] border border-[#1a1a1a] p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-200">{post.author}</span>
                    {post.authorGoal && <span className="text-[9px] font-mono text-emerald-400 ml-2">({post.authorGoal})</span>}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">Today</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{post.content}</p>
                
                <div className="flex gap-4 items-center pt-2 border-t border-[#1a1a1a] text-xs text-slate-400">
                  <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1.5 hover:text-emerald-400 transition cursor-pointer ${post.likedByMe ? 'text-emerald-400 font-bold' : ''}`}>
                    <ThumbsUp className="w-3.5 h-3.5" /> {post.likes} Likes
                  </button>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> {post.comments.length} Comments</span>
                </div>

                {/* Comment thread */}
                {post.comments.length > 0 && (
                  <div className="bg-[#111] p-2.5 rounded-lg border border-[#222] text-[11px] space-y-1.5 mt-2">
                    {post.comments.map((c, i) => (
                      <div key={i} className="leading-relaxed"><span className="font-bold text-emerald-400">{c.author}:</span> <span className="text-slate-300">{c.text}</span></div>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    className="flex-1 bg-[#111] text-white border border-[#222] px-2.5 py-1 text-[11px] rounded focus:outline-none focus:border-emerald-500"
                  />
                  <button onClick={() => handleAddComment(post.id)} className="p-1 bg-[#222] text-white rounded hover:bg-[#333] cursor-pointer">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Admin Panel */}
      {activeTab === 'admin' && (
        <div className="space-y-4">
          {/* Main DB & Service status banners */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">OS CLOUD CONFIG</span>
              <span className="text-xs font-bold text-emerald-400">
                {isFirebaseConfigured ? 'Firestore Active' : 'Simulated Firestore'}
              </span>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">CLIENT PORT</span>
              <span className="text-xs font-bold text-emerald-400">Port 3000 Ingress</span>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">SYS STABILITY</span>
              <span className="text-xs font-bold text-emerald-400">{serverHealth.uptime} uptime</span>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-lg text-center">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">AI INTERPRETATION</span>
              <span className="text-xs font-bold text-emerald-400">Gemini 3.5 Core</span>
            </div>
          </div>

          {/* Sub-tabs header */}
          <div className="flex border-b border-[#1a1a1a] pb-1 gap-1">
            {[
              { id: 'plans', label: 'Subscription Plans', icon: Sliders },
              { id: 'ads_coupons', label: 'Ads & Coupons', icon: Ticket },
              { id: 'users', label: 'User Database', icon: Users },
              { id: 'metrics', label: 'System Metrics', icon: Cpu }
            ].map(tab => {
              const Icon = tab.icon;
              const isSubActive = adminActiveSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 border-b-2 text-[11px] font-bold uppercase tracking-wider transition ${
                    isSubActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sub-tab 1: Plans Management */}
          {adminActiveSubTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-3 rounded-xl border border-[#1a1a1a]">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Manage Platforms Subscription Tiers</h4>
                  <p className="text-[10px] text-slate-400">Update pricing models, trials, AI limits and features in real-time.</p>
                </div>
                {!isCreatingPlan && (
                  <button
                    onClick={() => {
                      setIsCreatingPlan(true);
                      setEditingPlanId(null);
                    }}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-[10px] uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Plan
                  </button>
                )}
              </div>

              {/* Create Plan block */}
              {isCreatingPlan && (
                <div className="bg-[#0e0e12] border border-emerald-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-[#222] pb-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Create Subscription Plan
                    </h5>
                    <button onClick={() => setIsCreatingPlan(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">PLAN ID (slug, lowercase)</label>
                      <input
                        type="text"
                        value={newPlanForm.id}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        placeholder="e.g. platinum_elite"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">PLAN NAME</label>
                      <input
                        type="text"
                        value={newPlanForm.name}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                        placeholder="e.g. Metabolic Platinum Elite"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">PRICE IN INR (₹)</label>
                      <input
                        type="number"
                        value={newPlanForm.price}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, price: Number(e.target.value) })}
                        placeholder="799"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">BILLING PERIOD</label>
                      <select
                        value={newPlanForm.billingPeriod}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, billingPeriod: e.target.value as any })}
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">FREE TRIAL DAYS</label>
                      <input
                        type="number"
                        value={newPlanForm.freeTrialDays}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, freeTrialDays: Number(e.target.value) })}
                        placeholder="14"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">AI DAILY USAGE LIMIT</label>
                      <input
                        type="number"
                        value={newPlanForm.aiDailyLimit}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, aiDailyLimit: Number(e.target.value) })}
                        placeholder="100"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#1a1a1a] pt-2">
                    <span className="block text-[9px] font-mono text-slate-500 mb-1.5">ENABLED FEATURE TOGGLES</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      {[
                        { id: 'ai_diet_planner', label: 'AI Diet Planner Module' },
                        { id: 'grocery_planner', label: 'Smart Grocery Planner' },
                        { id: 'weight_tracker', label: 'Precision Weight Tracker' },
                        { id: 'water_tracker', label: 'Continuous Water Logger' },
                        { id: 'family_onboarding', label: 'Pediatric & Maternity Family Hub' },
                        { id: 'blood_report_ai', label: 'Blood Biochem AI Engine' }
                      ].map(feat => (
                        <label key={feat.id} className="flex items-center gap-2 cursor-pointer bg-[#111] p-2 rounded border border-[#222] hover:bg-[#16161c] transition">
                          <input
                            type="checkbox"
                            checked={!!newPlanForm.features[feat.id]}
                            onChange={() => handleToggleFeatureInNew(feat.id)}
                            className="accent-emerald-500 rounded"
                          />
                          <span>{feat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreatePlan}
                      className="flex-1 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 transition"
                    >
                      Save Configuration
                    </button>
                    <button
                      onClick={() => setIsCreatingPlan(false)}
                      className="flex-1 py-2 bg-[#222] text-slate-300 rounded-lg text-xs font-bold hover:bg-[#333] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Plans loop list */}
              <div className="space-y-3">
                {(adminSettings?.plans || []).map(plan => {
                  const isEditing = editingPlanId === plan.id;
                  return (
                    <div key={plan.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
                      {!isEditing ? (
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{plan.name}</span>
                              <span className="font-mono text-[8px] bg-[#1c1c24] text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{plan.id}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span>Price: <strong className="text-emerald-400 font-serif">₹{plan.price}</strong> / {plan.billingPeriod}</span>
                              <span>•</span>
                              <span>Free Trial: <strong>{plan.freeTrialDays} days</strong></span>
                              <span>•</span>
                              <span>AI Limit: <strong>{plan.aiDailyLimit} requests</strong></span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {Object.entries(plan.features).map(([fid, val]) => (
                                <span
                                  key={fid}
                                  className={`text-[8px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                    val ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}
                                >
                                  {fid.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingPlanId(plan.id);
                                setEditPlanForm({ ...plan });
                                setIsCreatingPlan(false);
                              }}
                              className="p-1.5 bg-[#111] hover:bg-[#1a1a1a] text-slate-300 border border-[#222] rounded cursor-pointer transition"
                              title="Edit Plan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-1.5 bg-[#111] hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-[#222] rounded cursor-pointer transition"
                              title="Delete Plan"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Edit plan form block
                        <div className="space-y-3 pt-1">
                          <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Editing: {plan.name}</span>
                            <button onClick={() => { setEditingPlanId(null); setEditPlanForm(null); }} className="text-slate-400 hover:text-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {editPlanForm && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="block text-[9px] font-mono text-slate-500 mb-1">PLAN DISPLAY NAME</label>
                                  <input
                                    type="text"
                                    value={editPlanForm.name}
                                    onChange={(e) => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
                                    className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-slate-500 mb-1">PRICE IN INR (₹)</label>
                                  <input
                                    type="number"
                                    value={editPlanForm.price}
                                    onChange={(e) => setEditPlanForm({ ...editPlanForm, price: Number(e.target.value) })}
                                    className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none font-serif"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-slate-500 mb-1">BILLING CYCLE</label>
                                  <select
                                    value={editPlanForm.billingPeriod}
                                    onChange={(e) => setEditPlanForm({ ...editPlanForm, billingPeriod: e.target.value as any })}
                                    className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                                  >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-slate-500 mb-1">FREE TRIAL DAYS</label>
                                  <input
                                    type="number"
                                    value={editPlanForm.freeTrialDays}
                                    onChange={(e) => setEditPlanForm({ ...editPlanForm, freeTrialDays: Number(e.target.value) })}
                                    className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-mono text-slate-500 mb-1">AI DAILY LIMIT</label>
                                  <input
                                    type="number"
                                    value={editPlanForm.aiDailyLimit}
                                    onChange={(e) => setEditPlanForm({ ...editPlanForm, aiDailyLimit: Number(e.target.value) })}
                                    className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-[#1a1a1a] pt-2">
                                <span className="block text-[9px] font-mono text-slate-500 mb-1.5">PLAN FEATURES</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                                  {[
                                    { id: 'ai_diet_planner', label: 'AI Diet Planner Module' },
                                    { id: 'grocery_planner', label: 'Smart Grocery Planner' },
                                    { id: 'weight_tracker', label: 'Precision Weight Tracker' },
                                    { id: 'water_tracker', label: 'Continuous Water Logger' },
                                    { id: 'family_onboarding', label: 'Pediatric & Maternity Family Hub' },
                                    { id: 'blood_report_ai', label: 'Blood Biochem AI Engine' }
                                  ].map(feat => (
                                    <label key={feat.id} className="flex items-center gap-2 cursor-pointer bg-[#111] p-2 rounded border border-[#222] hover:bg-[#16161c] transition">
                                      <input
                                        type="checkbox"
                                        checked={!!editPlanForm.features[feat.id]}
                                        onChange={() => handleToggleFeatureInEdit(feat.id)}
                                        className="accent-emerald-500 rounded"
                                      />
                                      <span>{feat.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1.5">
                                <button
                                  onClick={() => handleSavePlan(editPlanForm)}
                                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded text-xs transition"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => { setEditingPlanId(null); setEditPlanForm(null); }}
                                  className="flex-1 py-1.5 bg-[#222] hover:bg-[#333] text-slate-300 rounded text-xs transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Ads & Coupons */}
          {adminActiveSubTab === 'ads_coupons' && (
            <div className="space-y-4">
              {/* Advertisements Toggle */}
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Global Affiliate & AdMob Ad Units</h5>
                    <p className="text-[10px] text-slate-400">Toggle display units of simulated native banner/interstitials for free subscribers.</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAds}
                  className={`py-1.5 px-4 font-bold rounded-lg text-xs uppercase tracking-wider transition ${
                    adminSettings?.adsEnabled
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-[#111] hover:bg-[#1a1a1a] text-slate-400 border border-[#222]'
                  }`}
                >
                  {adminSettings?.adsEnabled ? 'Ads: Enabled' : 'Ads: Disabled'}
                </button>
              </div>

              {/* Coupons Generator */}
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
                <h5 className="text-xs font-bold text-slate-200 border-b border-[#1a1a1a] pb-2 uppercase tracking-wider">Coupon Code Registry</h5>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="COUPON_CODE"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#111] text-white border border-[#222] px-3 py-1.5 text-xs rounded-lg uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <select
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                      className="w-full bg-[#111] text-white border border-[#222] px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      {[10, 15, 20, 25, 30, 40, 50, 75, 100].map(val => (
                        <option key={val} value={val}>{val}% Discount</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleCreateCoupon}
                    className="py-1.5 px-4 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs uppercase transition cursor-pointer"
                  >
                    Add Coupon
                  </button>
                </div>

                <div className="space-y-2">
                  {(adminSettings?.coupons || []).map(coupon => (
                    <div key={coupon.code} className="p-2.5 bg-[#111] border border-[#222] rounded-lg flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-200 tracking-wider text-xs">{coupon.code}</span>
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-[9px]">{coupon.discountPercent}% OFF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCoupon(coupon.code)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                            coupon.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {coupon.active ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => handleDeleteCoupon(coupon.code)} className="text-slate-500 hover:text-red-400 transition p-1">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: User Database */}
          {adminActiveSubTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0d0d0d] p-3 rounded-xl border border-[#1a1a1a]">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Registered Platform Subscribers</h4>
                  <p className="text-[10px] text-slate-400">View active users, upgrade plans, and inspect billing cycles.</p>
                </div>
                {!isCreatingUser && (
                  <button
                    onClick={() => {
                      setIsCreatingUser(true);
                      setEditingUserUid(null);
                    }}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-[#10b981] text-black font-bold text-[10px] rounded-lg uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add User
                  </button>
                )}
              </div>

              {/* Add user sub-view */}
              {isCreatingUser && (
                <div className="bg-[#0e0e12] border border-emerald-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-[#222] pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Register New User Slot</span>
                    <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">USER SECURE UID</label>
                      <input
                        type="text"
                        value={newUserForm.uid}
                        onChange={(e) => setNewUserForm({ ...newUserForm, uid: e.target.value })}
                        placeholder="e.g. user_99347"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">EMAIL ADDRESS</label>
                      <input
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        placeholder="e.g. sub@domain.com"
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">ASSIGNED METABOLIC PLAN</label>
                      <select
                        value={newUserForm.planId}
                        onChange={(e) => setNewUserForm({ ...newUserForm, planId: e.target.value })}
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      >
                        {(adminSettings?.plans || []).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">ACCOUNT STATUS</label>
                      <select
                        value={newUserForm.status}
                        onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="active">Active Subscriber</option>
                        <option value="trialing">Active Trialing</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">PLAN EXPIRATION DATE</label>
                      <input
                        type="date"
                        value={newUserForm.expiresAt}
                        onChange={(e) => setNewUserForm({ ...newUserForm, expiresAt: e.target.value })}
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 mb-1">PLATFORM ROLE</label>
                      <select
                        value={newUserForm.role || 'user'}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        className="w-full bg-[#111] text-white border border-[#222] px-2.5 py-1.5 rounded focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="user">Standard User</option>
                        <option value="admin">Administrator</option>
                        <option value="super_admin">Super Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleCreateUser} className="flex-1 py-1.5 bg-emerald-500 text-black font-bold rounded text-xs hover:bg-emerald-400 transition">Create Member</button>
                    <button onClick={() => setIsCreatingUser(false)} className="flex-1 py-1.5 bg-[#222] text-slate-300 rounded text-xs hover:bg-[#333] transition">Cancel</button>
                  </div>
                </div>
              )}

              {/* Users looping list */}
              <div className="space-y-2">
                {(adminSettings?.users || []).map(user => {
                  const isEditingUser = editingUserUid === user.uid;
                  return (
                    <div key={user.uid} className="bg-[#0d0d0d] border border-[#1a1a1a] p-3 rounded-xl">
                      {!isEditingUser ? (
                        <div className="flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{user.email}</span>
                              <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded border ${
                                user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>{user.status}</span>
                              <span className="text-[8px] uppercase px-1.5 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono font-bold">
                                {user.role || 'user'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              UID: {user.uid} | Plan: <span className="text-emerald-400 font-bold uppercase">{user.planId}</span> | Expires: {user.expiresAt}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUserUid(user.uid);
                                setEditUserForm({ ...user });
                                setIsCreatingUser(false);
                              }}
                              className="p-1 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-slate-300 rounded cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteUser(user.uid)} className="p-1 bg-[#111] border border-[#222] hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded cursor-pointer">
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Edit user parameters
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-1.5">
                            <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">Edit Member: {user.email}</span>
                            <button onClick={() => { setEditingUserUid(null); setEditUserForm(null); }} className="text-slate-400 hover:text-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {editUserForm && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                              <div>
                                <label className="block text-[8px] font-mono text-slate-500 mb-1">PLAN ASSIGNED</label>
                                <select
                                  value={editUserForm.planId}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, planId: e.target.value })}
                                  className="w-full bg-[#111] text-white border border-[#222] px-2 py-1 rounded focus:outline-none"
                                >
                                  {(adminSettings?.plans || []).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-slate-500 mb-1">ACCOUNT STATUS</label>
                                <select
                                  value={editUserForm.status}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                                  className="w-full bg-[#111] text-white border border-[#222] px-2 py-1 rounded focus:outline-none"
                                >
                                  <option value="active">Active</option>
                                  <option value="trialing">Trialing</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-slate-500 mb-1">EXPIRATION DATE</label>
                                <input
                                  type="date"
                                  value={editUserForm.expiresAt}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, expiresAt: e.target.value })}
                                  className="w-full bg-[#111] text-white border border-[#222] px-2 py-1 rounded focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-slate-500 mb-1">PLATFORM ROLE</label>
                                <select
                                  value={editUserForm.role || 'user'}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                                  className="w-full bg-[#111] text-white border border-[#222] px-2 py-1 rounded focus:outline-none"
                                >
                                  <option value="user">Standard User</option>
                                  <option value="admin">Administrator</option>
                                  <option value="super_admin">Super Administrator</option>
                                </select>
                              </div>
                              <div className="sm:col-span-4 flex gap-2 pt-1.5 border-t border-[#1a1a1a]">
                                <button onClick={() => handleSaveUser(editUserForm)} className="flex-1 py-1 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 transition">Save User</button>
                                <button onClick={() => { setEditingUserUid(null); setEditUserForm(null); }} className="flex-1 py-1 bg-[#222] text-slate-300 rounded hover:bg-[#333] transition">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 4: Diagnostic Metrics */}
          {adminActiveSubTab === 'metrics' && (
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">TELEMETRY CRASH RECORDS</h4>
                <div className="space-y-2">
                  {crashReports.map(rep => (
                    <div key={rep.id} className="p-2.5 bg-[#111] border border-[#222] rounded text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-mono">{rep.timestamp}</span>
                        <span className="bg-amber-500/10 text-amber-300 font-bold px-1.5 rounded uppercase tracking-wider text-[8px]">{rep.severity}</span>
                      </div>
                      <p className="font-mono text-slate-300 leading-relaxed">{rep.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4 rounded-xl space-y-4">
            
            {/* Dark mode switcher / Custom Themes */}
            <div className="flex justify-between items-center pb-3 border-b border-[#1a1a1a]">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Moon className="w-4 h-4 text-emerald-400" /> Dark Mode Profile
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setThemeMode('oled')}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition ${
                    themeMode === 'oled' ? 'bg-emerald-500 text-black' : 'bg-[#111] text-slate-400 hover:text-white'
                  }`}
                >
                  Pure OLED Black
                </button>
                <button
                  onClick={() => setThemeMode('navy')}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition ${
                    themeMode === 'navy' ? 'bg-emerald-500 text-black' : 'bg-[#111] text-slate-400 hover:text-white'
                  }`}
                >
                  Tech Deep Navy
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-[#1a1a1a]">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2"><Languages className="w-4 h-4 text-emerald-400" /> {t.language}</span>
              <select
                value={language}
                onChange={(e: any) => setLanguage(e.target.value)}
                className="bg-[#111] border border-[#222] rounded px-2.5 py-1.5 text-xs text-emerald-400 font-semibold focus:outline-none"
              >
                <option value="en">English (Clinical)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
              </select>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-[#1a1a1a]">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-400" /> {t.notifications}</span>
              <button onClick={() => alert('[NutriOS Notification Manager] Simulated alerts initialized.')} className="py-1 px-3 bg-[#111] hover:bg-[#1a1a1a] text-white border border-[#222] rounded text-xs cursor-pointer transition">Test Alert</button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-400" /> Cache Recovery</span>
              <button onClick={() => { localStorage.clear(); alert('Local cache cleared. App will reload.'); window.location.reload(); }} className="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-950/40 rounded text-xs cursor-pointer transition">Purge Cache</button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC INTERACTIVE CHECKOUT OVERLAY DIALOG */}
      <AnimatePresence>
        {activeCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e0e12] border border-[#222] rounded-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center">
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  {checkoutStep === 'success' ? 'TRANSACTION COMPLETE' : 'UPGRADE SECURE PAY'}
                </span>
                <button
                  onClick={() => setActiveCheckout(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {checkoutStep === 'gateway_selection' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-white">Choose Your Platform Gateway</h4>
                      <p className="text-xs text-slate-400 mt-1">Select a simulated network standard to complete payment</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => {
                          setActiveCheckout({ ...activeCheckout, gateway: 'razorpay' });
                          setCheckoutStep('details_input');
                          setPaymentForm({ ...paymentForm, payMethod: 'upi' });
                        }}
                        className="p-4 bg-[#111] hover:bg-[#15151c] border border-[#222] rounded-xl flex items-center gap-3 transition text-left cursor-pointer"
                      >
                        <CardIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Razorpay Smart Gateway</span>
                          <span className="text-[10px] text-slate-500">Supports Cards, Netbanking & UPI VPAs</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCheckout({ ...activeCheckout, gateway: 'googleplay' });
                          setCheckoutStep('details_input');
                          setPaymentForm({ ...paymentForm, payMethod: 'android' });
                        }}
                        className="p-4 bg-[#111] hover:bg-[#15151c] border border-[#222] rounded-xl flex items-center gap-3 transition text-left cursor-pointer"
                      >
                        <Smartphone className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Google Play Billing API</span>
                          <span className="text-[10px] text-slate-500">Simulate native Android subscriber dialogs</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'details_input' && (
                  <div className="space-y-4">
                    <div className="bg-[#15151c] p-3 rounded-lg border border-[#222] flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Gold Plan Membership</span>
                      <span className="font-bold text-emerald-400 font-serif">₹{activeCheckout.price} INR</span>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-400 flex items-center gap-2">
                        <span>⚠️ {paymentError}</span>
                      </div>
                    )}

                    {activeCheckout.gateway === 'razorpay' ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentForm({ ...paymentForm, payMethod: 'upi' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded border transition ${
                              paymentForm.payMethod === 'upi' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#111] border-[#222] text-slate-400'
                            }`}
                          >
                            BHIM / UPI
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentForm({ ...paymentForm, payMethod: 'card' })}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded border transition ${
                              paymentForm.payMethod === 'card' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#111] border-[#222] text-slate-400'
                            }`}
                          >
                            Card Payment
                          </button>
                        </div>

                        {paymentForm.payMethod === 'upi' ? (
                          <div>
                            <label className="block text-[10px] font-mono text-slate-500 mb-1">UPI VIRTUAL ADDRESS (VPA)</label>
                            <input
                              type="text"
                              value={paymentForm.upiId}
                              onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                              placeholder="abdul@oksbi"
                              className="w-full bg-[#111] text-white border border-[#222] px-3 py-2 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-mono text-slate-500 mb-1">CARD NUMBER</label>
                              <input
                                type="text"
                                maxLength={16}
                                value={paymentForm.cardNo}
                                onChange={(e) => setPaymentForm({ ...paymentForm, cardNo: e.target.value })}
                                placeholder="4321 8876 1123 0098"
                                className="w-full bg-[#111] text-white border border-[#222] px-3 py-2 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 mb-1">EXPIRY</label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={paymentForm.expiry}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                                  placeholder="12/29"
                                  className="w-full bg-[#111] text-white border border-[#222] px-3 py-2 rounded-lg text-xs text-center focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-500 mb-1">CVV</label>
                                <input
                                  type="password"
                                  maxLength={3}
                                  value={paymentForm.cvv}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                                  placeholder="•••"
                                  className="w-full bg-[#111] text-white border border-[#222] px-3 py-2 rounded-lg text-xs text-center focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Google Play simulated dialogue
                      <div className="p-4 bg-[#111] border border-[#222] rounded-xl text-center space-y-3">
                        <Smartphone className="w-10 h-10 text-emerald-400 mx-auto" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Google Play Store Subscriber Account</span>
                          <span className="text-[10px] text-slate-500">{profile.email}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Confirm subscribing to {activeCheckout.plan.toUpperCase()} for ₹{activeCheckout.price} / Month using your stored Google Play credit.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCheckoutStep('gateway_selection')}
                        className="flex-1 py-2.5 bg-[#1c1c24] text-slate-300 rounded-xl text-xs font-bold hover:bg-[#252530]"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleProcessPayment}
                        className="flex-1 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-bold hover:bg-emerald-400 flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" /> Confirm & Pay
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="py-8 text-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Authorizing Secure Checkout</span>
                      <span className="text-[10px] text-slate-500 font-mono">Routing through secure platform channels...</span>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-400">TRANSACTION SUCCESSFUL</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Ref ID: <span className="font-mono text-slate-300">pay_rzp_{Math.random().toString(36).substr(2, 9)}</span>
                      </p>
                      <p className="text-xs text-slate-300 mt-2 px-4 leading-relaxed">
                        Excellent! Your platform subscription details have been successfully configured. Premium modules are active!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveCheckout(null)}
                      className="w-full py-2 bg-[#1c1c24] text-slate-200 rounded-xl text-xs font-bold hover:bg-[#252530]"
                    >
                      Return to App
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
