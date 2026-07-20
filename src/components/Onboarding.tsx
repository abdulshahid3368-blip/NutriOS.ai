import React, { useState } from 'react';
import { UserProfile, Language, UserGoal, DietType } from '../types';
import { TRANSLATIONS } from '../data';
import { ArrowRight, Check, Sparkles, Mail, Lock, Phone, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { isFirebaseConfigured, auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface OnboardingProps {
  language: Language;
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ language, onComplete }: OnboardingProps) {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<number>(1); // 1: Auth choice (Login vs Register), 2: Credentials Input, 3: Bio info, 4: Lifestyle Preferences
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'phone'>('email');

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bio-profile states
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [height, setHeight] = useState(172);
  const [weight, setWeight] = useState(68);
  const [goal, setGoal] = useState<UserGoal>('general_fitness');
  const [dietType, setDietType] = useState<DietType>('veg');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medInput, setMedInput] = useState('');
  const [medicals, setMedicals] = useState<string[]>([]);

  const handleSendOtp = () => {
    if (!phone) return;
    setIsOtpSent(true);
    alert(`[NutriOS SMS Gateway] Simulated OTP code "9942" sent to +91 ${phone}`);
  };

  const handleVerifyOtp = () => {
    if (otp === '9942') {
      setStep(3);
    } else {
      setAuthError('Invalid OTP. Please enter "9942" for testing.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseConfigured && auth) {
        if (authMode === 'register') {
          // Firebase Sign Up
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          // Go to personal details
          setStep(3);
        } else {
          // Firebase Sign In
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          // Check if profile exists in Firestore
          if (db) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const parsedProfile = docSnap.data() as UserProfile;
              onComplete(parsedProfile);
              setLoading(false);
              return;
            }
          }
          // Fallback if no profile is in DB yet
          setStep(3);
        }
      } else {
        // Simulated authentication for immediate testing / development environment
        if (authMode === 'register') {
          localStorage.setItem('mock_auth_email', email);
          localStorage.setItem('mock_auth_pass', password);
          setStep(3);
        } else {
          const storedEmail = localStorage.getItem('mock_auth_email') || 'user@example.com';
          const storedPass = localStorage.getItem('mock_auth_pass') || 'password';
          if (email === storedEmail && password === storedPass) {
            const cachedProfile = localStorage.getItem('nutrios_profile');
            if (cachedProfile) {
              onComplete(JSON.parse(cachedProfile));
              setLoading(false);
              return;
            }
            setStep(3);
          } else {
            setAuthError('Invalid credentials. If new, please choose "Create Account".');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleAddMedical = () => {
    if (medInput.trim() && !medicals.includes(medInput.trim())) {
      setMedicals([...medicals, medInput.trim()]);
      setMedInput('');
    }
  };

  const handleSubmitProfile = async () => {
    if (!name.trim()) {
      alert('Please enter your name to complete setup');
      return;
    }

    setLoading(true);
    let uid = 'usr_' + Math.random().toString(36).substr(2, 9);
    
    // Check if we have active Firebase user
    if (isFirebaseConfigured && auth && auth.currentUser) {
      uid = auth.currentUser.uid;
    }

    const finalProfile: UserProfile = {
      id: uid,
      name: name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@nutrios.ai`,
      phone: phone || undefined,
      age,
      gender,
      height,
      weight,
      goal,
      dietType,
      allergies,
      medicalConditions: medicals,
      streak: 1,
      points: 500, // starting bonus
      isPremium: false,
      referralCode: 'NUTRI' + Math.floor(1000 + Math.random() * 9000),
      language,
      role: 'user'
    };

    // Save to Firestore if available
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), finalProfile, { merge: true });
        console.log('[NutriOS Firestore] User Profile synchronized successfully.');
      } catch (err) {
        console.error('[NutriOS Firestore] Error writing user profile:', err);
      }
    }

    onComplete(finalProfile);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Subtly animated decorative glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl mb-3 flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-emerald-500/10">
            N
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-white">
            NutriOS<span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-1">
            {t.tagline}
          </p>
        </div>

        {/* 1. Show database target status banner */}
        <div className="mb-4 text-center">
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
            isFirebaseConfigured 
              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/5 text-amber-400 border-amber-500/20'
          }`}>
            ● {isFirebaseConfigured ? 'CONNECTED TO GOOGLE CLOUD FIRESTORE' : 'OFFLINE EMBEDDED MODE ACTIVE'}
          </span>
        </div>

        {/* AUTH ERROR BAR */}
        {authError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Step 1 & 2: Sign-up / Sign-in form */}
        {(step === 1 || step === 2) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex border-b border-[#1a1a1a] mb-2">
              <button
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 pb-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                  authMode === 'register' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 pb-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                  authMode === 'login' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mb-4">
              {authMode === 'register' 
                ? 'Join India’s premier metabolic framework with AI security' 
                : 'Sign in to sync your continuous health bio-reports'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="clinical.expert@nutrios.in"
                    className="w-full bg-[#111] text-white pl-10 pr-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-mono text-slate-500">PASSWORD</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          setAuthError('Please enter your email first to receive a password reset link.');
                          return;
                        }
                        setLoading(true);
                        try {
                          if (isFirebaseConfigured && auth) {
                            const { sendPasswordResetEmail } = await import('firebase/auth');
                            await sendPasswordResetEmail(auth, email);
                            setAuthError(null);
                            alert(`Success! A password reset email has been sent to ${email}.`);
                          } else {
                            alert(`[Mock Password Reset] A recovery link has been sent to ${email}. Please check your inbox.`);
                          }
                        } catch (err: any) {
                          setAuthError(err.message || 'Error sending reset email.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-[10px] text-emerald-500/80 hover:text-emerald-400 font-mono tracking-wider transition-colors cursor-pointer"
                    >
                      FORGOT PASSWORD?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111] text-white pl-10 pr-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-[#10b981] disabled:bg-[#1a1a1a] disabled:text-slate-500 text-black font-bold rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/5 transition-all"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'register' ? 'Register & Continue' : 'Sign In Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  // Direct bypass as standard user to check implementation immediately
                  setEmail('test@nutrios.in');
                  setPassword('test1234');
                  setAuthMode('login');
                  setName('Abdul Shahid');
                  setStep(3);
                }}
                className="text-[10px] text-emerald-500/80 hover:text-emerald-400 font-mono uppercase tracking-wider underline cursor-pointer"
              >
                ⚡ Quick Bypass for Preview Demo
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Bio Metrics */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-medium font-serif italic text-white text-center">{t.enterDetails}</h2>
            
            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">FULL NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abdul Shahid"
                className="w-full bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">AGE</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">GENDER</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">HEIGHT (CM)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">WEIGHT (KG)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111] text-white px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!name}
              className="w-full py-3 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer transition-all"
            >
              <span>Next: Targets & Preferences</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 4: Medicals, Goals, Preferences */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-medium font-serif italic text-white text-center">Lifestyle & Targets</h2>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">{t.goals}</label>
              <select
                value={goal}
                onChange={(e: any) => setGoal(e.target.value)}
                className="w-full bg-[#111] text-emerald-400 px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500 focus:outline-none text-sm font-semibold"
              >
                <option value="general_fitness">General Health / Wellness</option>
                <option value="weight_loss">Weight Loss (Fat Oxidation)</option>
                <option value="weight_gain">Weight Gain / Bulk</option>
                <option value="muscle_building">Muscle Hypertrophy</option>
                <option value="pregnancy">Pregnancy Support</option>
                <option value="senior_wellness">Senior Citizen Vital Care</option>
                <option value="kid_growth">Pediatric Growth Track</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">{t.dietPreference}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['veg', 'non_veg', 'egg', 'jain', 'keto', 'vegan'] as DietType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDietType(type)}
                    className={`py-2 px-1 text-xs rounded-lg font-semibold border transition-all ${
                      dietType === type
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                        : 'bg-[#111] text-slate-400 border-[#222] hover:border-[#333]'
                    }`}
                  >
                    {type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">{t.allergies}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="Peanuts, Gluten..."
                  className="flex-1 bg-[#111] text-white px-3 py-2 rounded-lg border border-[#222] focus:border-emerald-500 focus:outline-none text-xs"
                />
                <button onClick={handleAddAllergy} className="px-3 bg-[#1c1c1c] border border-[#2d2d2d] text-white rounded-lg text-xs hover:bg-[#2a2a2a] cursor-pointer transition">Add</button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {allergies.map(a => (
                    <span key={a} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">{a}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">{t.medicalHistory}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={medInput}
                  onChange={(e) => setMedInput(e.target.value)}
                  placeholder="Diabetes, Thyroid, BP..."
                  className="flex-1 bg-[#111] text-white px-3 py-2 rounded-lg border border-[#222] focus:border-emerald-500 focus:outline-none text-xs"
                />
                <button onClick={handleAddMedical} className="px-3 bg-[#1c1c1c] border border-[#2d2d2d] text-white rounded-lg text-xs hover:bg-[#2a2a2a] cursor-pointer transition">Add</button>
              </div>
              {medicals.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {medicals.map(m => (
                    <span key={m} className="bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">{m}</span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitProfile}
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black animate-pulse" />
                  <span>Complete Setup & Initialize AI Core</span>
                </>
              )}
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
