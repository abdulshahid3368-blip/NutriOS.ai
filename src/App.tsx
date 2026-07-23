/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, DietPlan, Language } from './types';
import { TRANSLATIONS } from './data';
import Onboarding from './components/Onboarding';
import AIPanels from './components/AIPanels';
import Trackers from './components/Trackers';
import MoreSections from './components/MoreSections';
import {
  Flame,
  Droplet,
  Pill,
  Dumbbell,
  Sparkles,
  LayoutDashboard,
  Bot,
  Activity,
  Award,
  Globe,
  Settings,
  Bell,
  CheckCircle2,
  Volume2,
  Lock,
  Compass,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Daily water states
  const [waterDrank, setWaterDrank] = useState<number>(0); // in ml
  const [waterLog, setWaterLog] = useState<number[]>([]);

  // Daily medicines checklists
  const [medicines, setMedicines] = useState<any[]>([
    { id: '1', name: 'Ashwagandha Extract (Stress / Cortisol Balance)', dose: '1 Capsule', time: '08:00', taken: false },
    { id: '2', name: 'Multivitamin Complex (Vitals & Trace Minerals)', dose: '1 Tablet', time: '13:00', taken: true },
    { id: '3', name: 'Omega-3 Fish Oil (Cardiovascular Health)', dose: '1 Softgel', time: '21:00', taken: false }
  ]);

  // Workout metrics
  const [workoutMinutes, setWorkoutMinutes] = useState(0);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);

  // PWA & Connection states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default');

  // Listeners for online/offline & beforeinstallprompt
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission as any);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[NutriOS PWA] Install choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      alert('This device does not support push notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('NutriOS AI Activated', {
            body: 'Namaste! Your personalized metabolic notification system is now active.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [200, 100, 200]
          } as any);
        });
      }
    }
  };

  // Load from Firestore if authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch profile from Firestore
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              
              // Bootstrap: Grant super_admin to the primary admin
              if (user.email === 'abdulshahid3368@gmail.com' && profileData.role !== 'super_admin') {
                console.log('[Auth] Bootstrapping super_admin role for admin user');
                await updateDoc(userDocRef, { role: 'super_admin' });
                profileData.role = 'super_admin';
              }

              console.log('[Auth] User profile loaded:', profileData);
              setProfile(profileData);
              localStorage.setItem('nutrios_profile', JSON.stringify(profileData));
              setLanguage(profileData.language || 'en');
              console.log('[Auth] Checking role for tab access:', profileData.role);
              if (profileData.role === 'super_admin') {
                setActiveTab('admin');
              }
            } else {
              console.warn('[Auth] User document does not exist in Firestore:', user.uid);
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        }
      } else {
        // Fallback to local storage if not authenticated (or handled otherwise)
        const cachedProfile = localStorage.getItem('nutrios_profile');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          setLanguage(parsed.language || 'en');
          if (parsed.role === 'super_admin') {
            setActiveTab('admin');
          }
        }
      }
    });

    const cachedDiet = localStorage.getItem('nutrios_diet');
    if (cachedDiet) {
      setDietPlan(JSON.parse(cachedDiet));
    }
    const cachedWater = localStorage.getItem('nutrios_water');
    if (cachedWater) {
      setWaterDrank(parseInt(cachedWater) || 0);
    }

    return () => unsubscribe();
  }, []);


  // Save to local storage on profile changes
  const updateProfile = (updated: UserProfile) => {
    setProfile(updated);
    setLanguage(updated.language);
    localStorage.setItem('nutrios_profile', JSON.stringify(updated));
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('nutrios_profile', JSON.stringify(newProfile));
    if (newProfile.role === 'super_admin') {
      setActiveTab('admin');
    }
  };

  const handleLogWater = (amount: number) => {
    const total = waterDrank + amount;
    setWaterDrank(total);
    localStorage.setItem('nutrios_water', total.toString());
    
    // Add points & sound alerts
    if (profile) {
      const bonus = Math.floor(amount / 5);
      updateProfile({
        ...profile,
        points: profile.points + bonus,
        streak: profile.streak + (waterDrank === 0 ? 1 : 0)
      });
    }
  };

  const handleTakeMedicine = (id: string) => {
    setMedicines(medicines.map(m => {
      if (m.id === id) {
        if (!m.taken && profile) {
          // reward points
          updateProfile({ ...profile, points: profile.points + 50 });
        }
        return { ...m, taken: !m.taken };
      }
      return m;
    }));
  };

  // Simulated push notifications when reaching metrics
  const triggerNotification = (title: string, body: string) => {
    alert(`[NutriOS Push Alert] ${title}: ${body}`);
  };

  // Sound cues simulated via popup alerting
  const handleSimulateBell = () => {
    triggerNotification("Water Hydration Target", "Excellent! You are staying perfectly fueled today.");
  };

  const t = TRANSLATIONS[language];

  // If user is not logged in / profile is null, show onboarding/auth
  if (!profile) {
    return (
      <Onboarding
        language={language}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] font-sans antialiased flex flex-col md:flex-row relative">
      
      {/* 1. Responsive Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-[#080808] border-r border-[#1a1a1a] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#1a1a1a] flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black text-sm shrink-0">
              N
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                NutriOS<span className="text-emerald-500">AI</span>
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest block">{t.tagline}</span>
            </div>
          </div>

          {/* Nav buttons list */}
          <div className="p-4">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Main Hub</div>
            <nav className="space-y-1">
              {[
                ...(profile?.role === 'super_admin' ? [{ id: 'admin', label: 'Admin Dashboard', icon: Sliders }] : []),
                { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
                { id: 'ai', label: 'AI Super-Protocols', icon: Bot },
                { id: 'trackers', label: 'Biometric Trackers', icon: Activity },
                { id: 'more', label: 'OS Store & Gold', icon: Compass }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {isActive && <div className="w-1 h-4 bg-emerald-500 rounded-full shrink-0"></div>}
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User context card */}
        <div className="p-4 border-t border-[#1a1a1a] bg-[#080808]">
          {isInstallable && (
            <button
              onClick={handleInstallApp}
              className="w-full mb-2.5 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-xl text-[11px] uppercase flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" /> Install NutriOS App
            </button>
          )}
          
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestNotification}
              className="w-full mb-2.5 py-2 px-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-slate-300 font-bold rounded-xl text-[10px] uppercase flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400" /> Enable Push Alerts
            </button>
          )}

          <div className="bg-[#111] p-3 rounded-xl border border-[#222] mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                {profile.name[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white line-clamp-1">{profile.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{profile.email}</p>
              </div>
            </div>
            {profile.isPremium ? (
              <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-wider flex items-center gap-1">
                ★ PRO MEMBER ACTIVE
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-mono">
                Standard Membership
              </div>
            )}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="w-full py-2 bg-[#1a1a1a] hover:bg-red-500/10 hover:text-red-400 border border-[#333] rounded-lg text-[10px] font-bold text-slate-300 transition uppercase tracking-wider cursor-pointer"
          >
            {t.logout}
          </button>
        </div>
      </aside>

      {/* 2. Main content view area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Banner notification & score dashboard */}
        <header className="h-16 border border-[#1a1a1a] flex items-center justify-between px-6 bg-[#080808]/50 backdrop-blur-md rounded-2xl">
          <div className="flex gap-4 items-center">
            <h1 className="text-base font-medium text-white font-serif italic">
              {t.welcome}, {profile.name}
            </h1>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <span className="text-xs text-slate-500">Today</span>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* Streak meter */}
            <div className="bg-[#111] border border-[#222] px-3 py-1 rounded-full text-center flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-semibold">{t.streak}:</span>
              <span className="text-[10px] font-bold text-amber-400">🔥 {profile.streak}</span>
            </div>

            {/* NutriCoins meter */}
            <div className="bg-[#111] border border-[#222] px-3 py-1 rounded-full text-center flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-semibold">{t.coins}:</span>
              <span className="text-[10px] font-bold text-emerald-400">⭐ {profile.points}</span>
            </div>

            {/* Premium Gold badge */}
            <div className={`px-3 py-1 rounded-full text-center border text-[10px] font-bold ${
              profile.isPremium
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-[#111] border-[#222] text-slate-500'
            }`}>
              {profile.isPremium ? 'PRO' : 'STANDARD'}
            </div>
          </div>
        </header>

        {/* ACTIVE SUBTAB DECK */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Home Dashboard Widgets */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* A. Live Water Hydration Tracker */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">HYDRATION SCORE</span>
                    <h3 className="text-sm font-medium text-slate-400 font-serif italic">{t.waterTarget}</h3>
                    
                    <div className="flex items-baseline gap-1.5 my-3">
                      <span className="text-3xl font-light text-white">{waterDrank / 1000}</span>
                      <span className="text-xs text-slate-400 uppercase">/ 3.0 Liters</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.min(100, (waterDrank/3000)*100)}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '+250ml', value: 250 },
                      { label: '+500ml', value: 500 },
                      { label: '+750ml', value: 750 }
                    ].map(btn => (
                      <button
                        key={btn.value}
                        onClick={() => handleLogWater(btn.value)}
                        className="py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-xs font-semibold rounded-lg cursor-pointer transition text-slate-300"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* B. Active Medication Schedule */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">CHRONO PHARMACOLOGY</span>
                    <h3 className="text-sm font-medium text-slate-400 font-serif italic">{t.medScheduled}</h3>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {medicines.map(med => (
                      <button
                        key={med.id}
                        onClick={() => handleTakeMedicine(med.id)}
                        className="w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer bg-[#111] border-[#222] hover:border-emerald-500/40"
                      >
                        <div className="flex gap-2.5 items-center">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${med.taken ? 'text-emerald-500' : 'text-slate-600'}`} />
                          <div className="overflow-hidden">
                            <span className={`text-xs font-medium block line-clamp-1 ${med.taken ? 'line-through text-slate-500' : 'text-slate-200'}`}>{med.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{med.dose} • {med.time}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* C. Metabolic Trainer Workout routine */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">METABOLIC ACCELERATOR</span>
                    <h3 className="text-sm font-medium text-slate-400 font-serif italic">{t.workoutPlan}</h3>
                    
                    <div className="py-3 bg-[#111] border border-[#222] rounded-xl text-center my-3">
                      <span className="text-sm font-medium text-slate-200 block">Surya Namaskar x 5</span>
                      <span className="text-[10px] text-slate-500 font-mono">Systemic flexibility, core warming</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert('[NutriOS Trainer] Launching metabolic timer. Keep your breathing balanced and slow.');
                      setWorkoutMinutes(15);
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition"
                  >
                    <Dumbbell className="w-4 h-4" /> Begin Active Workout Session
                  </button>
                </div>

              </div>

              {/* Simulated AdMob native ad slot */}
              {!profile.isPremium && (
                <div className="bg-[#0e1111] border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-3 relative overflow-hidden">
                  <div className="absolute top-1.5 right-2 flex items-center gap-1.5">
                    <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">AdMob Native API</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[8px] font-mono font-bold uppercase tracking-wider shrink-0 border border-emerald-500/30">
                      Ad Slot
                    </div>
                    <div>
                      <p className="text-xs text-slate-200 font-bold">
                        Aashirvaad Organic Whole Wheat Atta — Pure Clean Fiber
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Simulated affiliate placement. Upgrade to <span className="text-emerald-400 font-bold">NutriOS Gold Pro</span> to disable standard sponsor units.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href="https://www.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-[#1c1c24] border border-[#222] text-slate-300 font-semibold rounded-lg text-[10px] uppercase cursor-pointer hover:bg-[#252530] transition"
                    >
                      Shop Now
                    </a>
                    <button
                      onClick={() => setActiveTab('more')}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-[10px] uppercase cursor-pointer transition"
                    >
                      Remove Ads
                    </button>
                  </div>
                </div>
              )}

              {/* Mini shortcuts panel */}
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick AI Shortcuts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'ai', label: 'Launch AI Planner', color: 'hover:border-emerald-500/40 text-emerald-400' },
                    { id: 'ai', label: 'AI Doctor Chat', color: 'hover:border-amber-500/40 text-amber-400' },
                    { id: 'trackers', label: 'Pregnancy Timeline', color: 'hover:border-teal-500/40 text-teal-400' },
                    { id: 'trackers', label: 'Senior citizen SOS', color: 'hover:border-indigo-500/40 text-indigo-400' }
                  ].map((sh, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(sh.id)}
                      className={`p-3 bg-[#111] border border-[#222] rounded-xl text-center text-xs font-semibold cursor-pointer transition hover:border-[#333] ${sh.color}`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: AI Protocols & Planner */}
          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AIPanels
                language={language}
                profile={profile}
                updateProfile={updateProfile}
                dietPlan={dietPlan}
                setDietPlan={(plan) => { setDietPlan(plan); localStorage.setItem('nutrios_diet', JSON.stringify(plan)); }}
              />
            </motion.div>
          )}

          {/* TAB 3: Biometric Trackers */}
          {activeTab === 'trackers' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Trackers
                language={language}
                profile={profile}
                updateProfile={updateProfile}
              />
            </motion.div>
          )}

          {/* TAB 4: OS Store, Gold subscriptions & Settings */}
          {activeTab === 'more' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MoreSections
                language={language}
                setLanguage={(lang) => { setLanguage(lang); if (profile) updateProfile({ ...profile, language: lang }); }}
                profile={profile}
                updateProfile={updateProfile}
              />
            </motion.div>
          )}

          {/* TAB 5: Admin Diagnostic Console for super_admins */}
          {activeTab === 'admin' && profile.role === 'super_admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MoreSections
                language={language}
                setLanguage={(lang) => { setLanguage(lang); if (profile) updateProfile({ ...profile, language: lang }); }}
                profile={profile}
                updateProfile={updateProfile}
                initialTab="admin"
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
