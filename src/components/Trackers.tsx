import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../data';
import {
  Baby,
  Smile,
  HeartPulse,
  Activity,
  Moon,
  Scale,
  Plus,
  Trash,
  PhoneCall,
  Check,
  Award,
  Droplets,
  Dumbbell
} from 'lucide-react';
import { motion } from 'motion/react';
import { isFirebaseConfigured, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface TrackersProps {
  language: Language;
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
}

export default function Trackers({ language, profile, updateProfile }: TrackersProps) {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<string>('weight');

  // 1. Weight Tracker states
  const [weightLogs, setWeightLogs] = useState<any[]>([
    { id: '1', date: '2026-07-01', weight: 70.2 },
    { id: '2', date: '2026-07-10', weight: 69.1 },
    { id: '3', date: '2026-07-19', weight: 68.0 }
  ]);
  const [newWeight, setNewWeight] = useState<number>(68);

  // 2. Body measurements states
  const [chest, setChest] = useState(96);
  const [waist, setWaist] = useState(82);
  const [hips, setHips] = useState(98);

  // 3. Sleep tracker states
  const [sleepLogs, setSleepLogs] = useState<any[]>([
    { id: '1', date: '2026-07-17', hours: 7.5, quality: 'good' },
    { id: '2', date: '2026-07-18', hours: 6.2, quality: 'fair' },
    { id: '3', date: '2026-07-19', hours: 8.0, quality: 'excellent' }
  ]);
  const [newSleep, setNewSleep] = useState<number>(7.5);
  const [newSleepQuality, setNewSleepQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');

  // 4. Kids Growth states
  const [kidName, setKidName] = useState('Vivaan');
  const [kidAgeMonths, setKidAgeMonths] = useState(14);
  const [kidHeight, setKidHeight] = useState(78);
  const [kidWeight, setKidWeight] = useState(10.5);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(['Crawling', 'First Word']);

  // 5. Pregnancy states
  const [pregWeek, setPregWeek] = useState(18);
  const [pregKicks, setPregKicks] = useState(6);
  const [pregSymptoms, setPregSymptoms] = useState<string[]>(['Slight fatigue', 'Lower back pain']);
  const [symptomInput, setSymptomInput] = useState('');

  // 6. Senior Citizen stats
  const [systolic, setSystolic] = useState(122);
  const [diastolic, setDiastolic] = useState(78);
  const [bloodSugar, setBloodSugar] = useState(105);
  const [emergencyAlertSent, setEmergencyAlertSent] = useState(false);

  // 7. Interactive Water Intake states
  const [waterAmount, setWaterAmount] = useState<number>(1200); // in ml
  const waterTarget = 3000; // ml

  // 8. Interactive Workout Tracker states
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([
    { id: '1', type: 'Cardio Run', duration: 30, calories: 340, date: '2026-07-18' },
    { id: '2', type: 'Surya Namaskar', duration: 20, calories: 150, date: '2026-07-19' }
  ]);
  const [newWorkoutType, setNewWorkoutType] = useState('Cardio Run');
  const [newWorkoutDuration, setNewWorkoutDuration] = useState(20);

  // Firestore Sync Helper
  const syncTrackerToFirestore = async (trackerName: string, payload: any) => {
    if (isFirebaseConfigured && db && profile.id) {
      try {
        const docRef = doc(db, 'users', profile.id, 'trackers', trackerName);
        await setDoc(docRef, { logs: payload, updatedAt: new Date().toISOString() }, { merge: true });
        console.log(`[NutriOS Firebase] Synchronized ${trackerName} logs successfully.`);
      } catch (err) {
        console.error(`[NutriOS Firebase] Firestore sync failed for ${trackerName}:`, err);
      }
    }
  };

  // Handlers
  const handleAddWeight = () => {
    if (newWeight > 0) {
      const log = {
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        weight: newWeight
      };
      const updatedLogs = [...weightLogs, log];
      setWeightLogs(updatedLogs);
      
      // Update main profile weight
      updateProfile({ ...profile, weight: newWeight });
      syncTrackerToFirestore('weight_logs', updatedLogs);
    }
  };

  const handleAddSleep = () => {
    const log = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      hours: newSleep,
      quality: newSleepQuality
    };
    const updatedLogs = [...sleepLogs, log];
    setSleepLogs(updatedLogs);
    syncTrackerToFirestore('sleep_logs', updatedLogs);
  };

  const handleAddWater = (amount: number) => {
    const newAmt = Math.min(waterTarget, waterAmount + amount);
    setWaterAmount(newAmt);
    syncTrackerToFirestore('water_logs', { date: new Date().toISOString().split('T')[0], ml: newAmt });
  };

  const handleResetWater = () => {
    setWaterAmount(0);
    syncTrackerToFirestore('water_logs', { date: new Date().toISOString().split('T')[0], ml: 0 });
  };

  const handleAddWorkout = () => {
    let burnedRate = 8; // calories per min
    if (newWorkoutType === 'Strength Power') burnedRate = 6;
    if (newWorkoutType === 'Ashtanga Yoga') burnedRate = 4.5;
    if (newWorkoutType === 'HIIT Circuit') burnedRate = 11;

    const logged = {
      id: Math.random().toString(),
      type: newWorkoutType,
      duration: newWorkoutDuration,
      calories: Math.round(newWorkoutDuration * burnedRate),
      date: new Date().toISOString().split('T')[0]
    };
    const updatedLogs = [...workoutLogs, logged];
    setWorkoutLogs(updatedLogs);
    syncTrackerToFirestore('workout_logs', updatedLogs);
  };

  const handleSendSOS = () => {
    setEmergencyAlertSent(true);
    alert(`[NutriOS SOS Router] CRITICAL: Simulated emergency SMS alert dispatched to registered physicians and nearby family coordinates (+91 98765 43210).`);
    setTimeout(() => setEmergencyAlertSent(false), 4000);
  };

  const calculateBMI = (w: number, h: number) => {
    const hm = h / 100;
    return (w / (hm * hm)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (bmi < 24.9) return { label: 'Healthy Normal', color: 'text-emerald-400' };
    if (bmi < 29.9) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese Range', color: 'text-red-400' };
  };

  const getBabySizeDescriptor = (week: number) => {
    if (week <= 4) return "Size of a Poppy Seed";
    if (week <= 8) return "Size of a Cardamom (Elaichi)";
    if (week <= 12) return "Size of an Amla (Indian Gooseberry)";
    if (week <= 16) return "Size of a Lemon (Nimbu)";
    if (week <= 20) return "Size of a Chiku (Sapodilla)";
    if (week <= 24) return "Size of a Pomegranate (Anar)";
    if (week <= 28) return "Size of a Custard Apple (Sitaphal)";
    if (week <= 32) return "Size of a Coconut (Nariyal)";
    return "Size of a Jackfruit (Kathal)";
  };

  const activeBMI = parseFloat(calculateBMI(profile.weight, profile.height));
  const bmiCat = getBMICategory(activeBMI);

  return (
    <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-4 md:p-6 shadow-xl relative">
      
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1a1a1a] pb-4">
        {[
          { id: 'weight', label: 'Weight & Body Stats', icon: Scale },
          { id: 'water', label: 'Water Hydrator', icon: Droplets },
          { id: 'workout', label: 'Workout Burner', icon: Dumbbell },
          { id: 'sleep', label: 'Sleep & Circadian', icon: Moon },
          { id: 'kids', label: 'Kids Growth Tracker', icon: Baby },
          { id: 'pregnancy', label: 'Pregnancy Timeline', icon: Smile },
          { id: 'senior', label: 'Senior Care Vitals', icon: HeartPulse }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 1. Weight Tracker */}
      {activeTab === 'weight' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BMI Calculator Widget */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">METRIC BMI CORE</h4>
                <div className="text-center py-4 bg-[#111] rounded-lg border border-[#222]">
                  <span className="text-3xl font-light text-white font-serif">{activeBMI}</span>
                  <span className={`block text-xs font-bold mt-1 ${bmiCat.color}`}>{bmiCat.label}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                BMI is calibrated dynamically using your physical coordinates: {profile.height}cm & {profile.weight}kg.
              </p>
            </div>

            {/* Logging Form */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">LOG TODAY'S WEIGHT</h4>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">WEIGHT IN KG</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-[#111] text-white border border-[#222] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddWeight}
                    className="px-4 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition"
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* Tape measurement */}
              <div className="pt-2 border-t border-[#1a1a1a] grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] font-mono text-slate-400 mb-0.5">CHEST (CM)</label>
                  <input type="number" value={chest} onChange={(e)=>setChest(parseInt(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-[11px] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-400 mb-0.5">WAIST (CM)</label>
                  <input type="number" value={waist} onChange={(e)=>setWaist(parseInt(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-[11px] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-400 mb-0.5">HIPS (CM)</label>
                  <input type="number" value={hips} onChange={(e)=>setHips(parseInt(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-[11px] focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Historical list */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">LOG ARCHIVES</h4>
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {weightLogs.slice().reverse().map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-[#111] p-2 rounded border border-[#222]">
                    <span className="text-xs font-mono text-slate-500">{item.date}</span>
                    <span className="text-xs font-bold text-slate-200">{item.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Water Hydrator */}
      {activeTab === 'water' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 rounded-xl space-y-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">HYDRATION SCORECARD</h4>
              
              <div className="relative pt-2">
                <div className="flex justify-between items-end text-xs mb-1">
                  <span className="text-slate-400 font-semibold">Today's Progress</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{waterAmount} / {waterTarget} ml</span>
                </div>
                <div className="h-3 w-full bg-[#111] border border-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (waterAmount / waterTarget) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddWater(250)}
                  className="py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-lg text-xs text-slate-200 font-mono cursor-pointer transition"
                >
                  🥛 +250ml
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-lg text-xs text-slate-200 font-mono cursor-pointer transition"
                >
                  🥤 +500ml
                </button>
                <button
                  onClick={() => handleAddWater(1000)}
                  className="py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-lg text-xs text-slate-200 font-mono cursor-pointer transition"
                >
                  🧴 +1000ml
                </button>
              </div>

              <button
                onClick={handleResetWater}
                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-950/40 rounded-lg text-xs font-bold transition"
              >
                Reset Intake Values
              </button>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 rounded-xl flex flex-col justify-center text-center space-y-3">
              <Droplets className="w-10 h-10 text-emerald-400 mx-auto" />
              <h5 className="text-xs font-bold text-slate-200">Fluid Mechanics Optimization</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Adequate water intake aids metabolic rates, cell structure, kidney waste filtration and cognitive stamina. Aim to clear the 3000ml benchmark daily.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Workout Burner */}
      {activeTab === 'workout' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4 rounded-xl space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">LOG CARDIO & KINETIC MOVEMENT</h4>
              
              <div>
                <label className="block text-[10px] font-mono text-slate-450 mb-1">ACTIVITY STYLE</label>
                <select
                  value={newWorkoutType}
                  onChange={(e) => setNewWorkoutType(e.target.value)}
                  className="w-full bg-[#111] border border-[#222] rounded-lg px-2.5 py-2 text-xs text-emerald-400 font-semibold focus:outline-none"
                >
                  <option value="Cardio Run">Running / Jogging</option>
                  <option value="HIIT Circuit">HIIT Functional Circuit</option>
                  <option value="Strength Power">Resistance Dumbbell Pulls</option>
                  <option value="Ashtanga Yoga">Ashtanga Vinyasa Yoga</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-450 mb-1">SESSION DURATION (MINUTES)</label>
                <input
                  type="number"
                  value={newWorkoutDuration}
                  onChange={(e) => setNewWorkoutDuration(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#111] border border-[#222] text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddWorkout}
                className="w-full py-2.5 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition flex justify-center items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log Burn Session
              </button>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-4 rounded-xl">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">BURN HISTORY METADATA</h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {workoutLogs.map((item) => (
                  <div key={item.id} className="bg-[#111] border border-[#222] p-2.5 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block">{item.type}</span>
                      <span className="text-[10px] font-mono text-slate-500">{item.duration} Mins • {item.date}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">🔥 {item.calories} Cal</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sleep Tracker */}
      {activeTab === 'sleep' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">LOG SLEEP SESSION</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">HOURS SLEPT</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSleep}
                    onChange={(e) => setNewSleep(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">QUALITY</label>
                  <select
                    value={newSleepQuality}
                    onChange={(e: any) => setNewSleepQuality(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] rounded-lg px-2 py-2 text-xs text-emerald-400 font-semibold focus:outline-none"
                  >
                    <option value="poor">Poor (Interrupted)</option>
                    <option value="fair">Fair (Light sleep)</option>
                    <option value="good">Good (Restful)</option>
                    <option value="excellent">Excellent (Deep REM)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddSleep}
                className="w-full py-2 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition"
              >
                Save Sleep Session
              </button>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">CIRCADIAN RYTHM ARCHIVES</h4>
              <div className="space-y-2">
                {sleepLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="flex justify-between items-center bg-[#111] p-2 rounded-lg border border-[#222]">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">{log.date}</span>
                      <span className="text-[10px] font-mono text-emerald-400 ml-3">({log.quality.toUpperCase()})</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200">{log.hours} Hrs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Kids Growth Tracker */}
      {activeTab === 'kids' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CHILD PROFILE METRICS</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">CHILD'S NAME</label>
                  <input type="text" value={kidName} onChange={(e)=>setKidName(e.target.value)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">AGE (MONTHS)</label>
                  <input type="number" value={kidAgeMonths} onChange={(e)=>setKidAgeMonths(parseInt(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-xs focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">HEIGHT (CM)</label>
                  <input type="number" value={kidHeight} onChange={(e)=>setKidHeight(parseInt(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">WEIGHT (KG)</label>
                  <input type="number" step="0.1" value={kidWeight} onChange={(e)=>setKidWeight(parseFloat(e.target.value)||0)} className="w-full bg-[#111] text-white border border-[#222] rounded p-1 text-xs focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">COGNITIVE MILESTONES</h4>
              <div className="space-y-1.5">
                {[
                  { name: 'Crawling', desc: 'Symmetric hand & leg mobility' },
                  { name: 'First Word', desc: 'Speech vocalization attempts' },
                  { name: 'Self Feeding', desc: 'Fine motor coordination' }
                ].map(item => {
                  const done = completedMilestones.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (done) setCompletedMilestones(completedMilestones.filter(x => x !== item.name));
                        else setCompletedMilestones([...completedMilestones, item.name]);
                      }}
                      className="w-full text-left p-2 bg-[#111] hover:bg-[#1a1a1a] rounded border border-[#222] flex justify-between items-center text-xs cursor-pointer transition"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${done ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-[#333]'}`}>
                        {done && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pregnancy Tracker */}
      {activeTab === 'pregnancy' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visual fruit comparisons */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 text-center space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-left">MATERNITY MILESTONE</h4>
              <div className="py-4 bg-[#111] rounded-lg border border-[#222]">
                <span className="text-2xl font-light text-white block font-serif">WEEK {pregWeek}</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">
                  🍅 {getBabySizeDescriptor(pregWeek)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={pregWeek}
                onChange={(e) => setPregWeek(parseInt(e.target.value))}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Kick counter, symptoms */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">KICK TRACKER</h4>
                <div className="flex gap-3 items-center">
                  <span className="text-lg font-bold font-mono text-slate-200">{pregKicks} Kicks Logged</span>
                  <button
                    onClick={() => setPregKicks(pregKicks + 1)}
                    className="p-1 px-3 bg-emerald-500 hover:bg-[#10b981] text-black font-mono font-bold text-xs rounded-lg cursor-pointer"
                  >
                    + Tap Kick
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">SYMPTOM REGISTER</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="Heartburn, fatigue..."
                    className="flex-1 bg-[#111] text-white border border-[#222] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => { if (symptomInput.trim()){ setPregSymptoms([...pregSymptoms, symptomInput.trim()]); setSymptomInput(''); } }}
                    className="px-3 bg-[#222] text-white rounded-lg text-xs hover:bg-[#333] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pregSymptoms.map(s => (
                    <span key={s} className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded text-[10px]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Senior Care Vitals */}
      {activeTab === 'senior' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">BP & CARDIO GLYCO-STATS</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">BLOOD PRESSURE</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={systolic} onChange={(e)=>setSystolic(parseInt(e.target.value)||0)} className="w-14 bg-[#111] text-center border border-[#222] rounded py-1 text-xs text-white focus:outline-none" />
                    <span className="text-slate-500 text-xs">/</span>
                    <input type="number" value={diastolic} onChange={(e)=>setDiastolic(parseInt(e.target.value)||0)} className="w-14 bg-[#111] text-center border border-[#222] rounded py-1 text-xs text-white focus:outline-none" />
                    <span className="text-[10px] text-slate-500 font-mono ml-1">mmHg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">BLOOD GLUCOSE</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={bloodSugar} onChange={(e)=>setBloodSugar(parseInt(e.target.value)||0)} className="w-16 bg-[#111] text-center border border-[#222] rounded py-1 text-xs text-white focus:outline-none" />
                    <span className="text-[10px] text-slate-500 font-mono">mg/dL</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a1a1a]">
                <div className="bg-[#111] p-2 rounded border border-[#222]">
                  <span className="text-[9px] font-mono text-slate-500 block">CARDIO RATING</span>
                  <span className="text-xs font-bold text-emerald-400">Normal Optimal</span>
                </div>
                <div className="bg-[#111] p-2 rounded border border-[#222]">
                  <span className="text-[9px] font-mono text-slate-500 block">GLUCOSE RATING</span>
                  <span className="text-xs font-bold text-emerald-400">Fasting (Good)</span>
                </div>
              </div>
            </div>

            {/* Emergency SOS card */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">EMERGENCY ESCALATION MATRIX</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  In case of acute respiratory distress, severe angina chest paint, or syncopal dizziness, press the rapid dispatch button.
                </p>
              </div>

              <button
                onClick={handleSendSOS}
                className={`w-full py-3 font-bold rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer transition ${
                  emergencyAlertSent ? 'bg-amber-500 text-black' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10'
                }`}
              >
                <PhoneCall className="w-4 h-4 animate-pulse" /> {emergencyAlertSent ? 'SOS Dispatched!' : 'Simulate SOS Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
