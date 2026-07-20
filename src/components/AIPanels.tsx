/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DietPlan, Language, FamilyMember, AdminSettings } from '../types';
import { TRANSLATIONS, MOCK_RECIPE_SUGGESTIONS } from '../data';
import { fetchAdminSettings, subscribeAdminSettings } from '../services/adminSettings';
import {
  fetchAIDietPlan,
  fetchAIRecipe,
  fetchRestaurantAdvice,
  fetchLabReportAnalysis,
  fetchDoctorAdvice,
  fetchScanResult,
  fetchFamilyAdvice
} from '../services/ai';
import {
  Apple,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  ChefHat,
  Search,
  ScanBarcode,
  Camera,
  Activity,
  UserCheck,
  Stethoscope,
  Send,
  Sparkles,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Plus,
  Trash,
  Check,
  Info,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface AIPanelsProps {
  language: Language;
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  dietPlan: DietPlan | null;
  setDietPlan: (plan: DietPlan) => void;
}

export default function AIPanels({ language, profile, updateProfile, dietPlan, setDietPlan }: AIPanelsProps) {
  const t = TRANSLATIONS[language];
  const [activeSubTab, setActiveSubTab] = useState<string>('diet');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [aiUsedToday, setAiUsedToday] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeAdminSettings(settings => {
      setAdminSettings(settings);
    });

    // Check/Reset AI calls counter today
    const storedDate = localStorage.getItem('nutrios_ai_date');
    const todayStr = new Date().toDateString();
    if (storedDate !== todayStr) {
      localStorage.setItem('nutrios_ai_date', todayStr);
      localStorage.setItem('nutrios_ai_calls_today', '0');
      setAiUsedToday(0);
    } else {
      const calls = localStorage.getItem('nutrios_ai_calls_today');
      setAiUsedToday(calls ? parseInt(calls) || 0 : 0);
    }

    return () => unsubscribe();
  }, []);

  // Determine user's current plan from settings or fallback
  const getCurrentPlan = () => {
    const defaultFree = {
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
      aiDailyLimit: 3
    };

    if (!adminSettings) return defaultFree;

    const userPlanId = profile.subscriptionPlan || (profile.isPremium ? 'premium' : 'free');
    const matchedPlan = adminSettings.plans.find(p => p.id === userPlanId);
    return matchedPlan || adminSettings.plans.find(p => p.id === 'free') || defaultFree;
  };

  const currentPlan = getCurrentPlan();

  // Helper to check feature active status dynamically
  const isFeatureEnabled = (featureId: string) => {
    return !!currentPlan.features[featureId];
  };

  // Enforce AI limit and track metrics
  const checkAndIncrementAiLimit = (): boolean => {
    const limit = currentPlan.aiDailyLimit;
    if (aiUsedToday >= limit) {
      alert(`AI LIMIT REACHED: Your current plan (${currentPlan.name}) has a dynamic daily limit of ${limit} AI requests, which has been exhausted for today.\n\nPlease upgrade to a higher tier in the Store tab to unlock unlimited access!`);
      return false;
    }
    
    const nextCount = aiUsedToday + 1;
    setAiUsedToday(nextCount);
    localStorage.setItem('nutrios_ai_calls_today', nextCount.toString());
    return true;
  };

  // Loading indicator states
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Diet Planner states
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // 2. Grocery list states
  const [groceryList, setGroceryList] = useState<any[]>([
    { id: '1', name: 'Paneer (Cottage Cheese)', category: 'dairy', quantity: '500g', checked: false },
    { id: '2', name: 'Fresh Spinach', category: 'vegetables', quantity: '1 Bunch', checked: false },
    { id: '3', name: 'Brown Rice', category: 'pulses_grains', quantity: '1 kg', checked: false },
    { id: '4', name: 'Amla / Indian Gooseberry', category: 'others', quantity: '250g', checked: true }
  ]);
  const [newGrocery, setNewGrocery] = useState('');

  // 3. Family Planner states
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState<'spouse' | 'child' | 'parent' | 'other'>('spouse');
  const [famAge, setFamAge] = useState(30);
  const [famWeight, setFamWeight] = useState(60);
  const [famHeight, setFamHeight] = useState(165);
  const [famGoal, setFamGoal] = useState<any>('general_fitness');
  const [famDiet, setFamDiet] = useState<any>('veg');
  const [familyAdviceText, setFamilyAdviceText] = useState<string>('');

  // 4. Recipe builder states
  const [recipeIngredients, setRecipeIngredients] = useState<string[]>(['Paneer', 'Spinach', 'Garlic']);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipeOutput, setRecipeOutput] = useState<any>(null);

  // 5. Restaurant swapper states
  const [dishName, setDishName] = useState('Chicken Tikka Masala with Butter Naan');
  const [swapResult, setSwapResult] = useState<any>(null);

  // 6. Food Camera / Barcode states
  const [foodCamImage, setFoodCamImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 7. Lab report states
  const [labReportText, setLabReportText] = useState('Hemoglobin: 11.2, Vitamin D3: 22, HbA1c: 5.8');
  const [labAnalysis, setLabAnalysis] = useState<any[]>([]);

  // 8. Doctor chat states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'model', parts: [{ text: "Hello! I am Dr. NutriOS, your AI clinical consultant. What symptoms or lifestyle changes would you like to discuss today?" }] }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Handlers
  const handleGenerateDiet = async () => {
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const plan = await fetchAIDietPlan(profile);
    setDietPlan(plan);
    setLoading(false);
    
    // Auto populate groceries from diet plan breakfast/lunch/dinner
    const newItems: any[] = [];
    Object.keys(plan).forEach((day, index) => {
      if (index < 2) { // just pull a couple days to avoid overwhelming lists
        const dayPlan = plan[day];
        [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].forEach(meal => {
          meal.ingredients?.forEach(ing => {
            if (!newItems.find(x => x.name.toLowerCase() === ing.toLowerCase())) {
              newItems.push({
                id: Math.random().toString(),
                name: ing,
                category: 'others',
                quantity: 'As needed',
                checked: false
              });
            }
          });
        });
      }
    });
    if (newItems.length > 0) setGroceryList(newItems);
  };

  const handleAddGrocery = () => {
    if (newGrocery.trim()) {
      setGroceryList([...groceryList, {
        id: Math.random().toString(),
        name: newGrocery.trim(),
        category: 'others',
        quantity: '1 Unit',
        checked: false
      }]);
      setNewGrocery('');
    }
  };

  const toggleGrocery = (id: string) => {
    setGroceryList(groceryList.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  };

  const deleteGrocery = (id: string) => {
    setGroceryList(groceryList.filter(g => g.id !== id));
  };

  const handleAddFamily = () => {
    if (!famName.trim()) return;
    const newMember: FamilyMember = {
      id: 'fam_' + Math.random().toString(36).substr(2, 9),
      name: famName,
      relation: famRelation,
      age: famAge,
      weight: famWeight,
      height: famHeight,
      goal: famGoal,
      dietType: famDiet
    };
    setFamilyMembers([...familyMembers, newMember]);
    setFamName('');
  };

  const handleGenerateFamilyAdvice = async () => {
    if (familyMembers.length === 0) {
      alert('Please add at least one family member.');
      return;
    }
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const advice = await fetchFamilyAdvice(familyMembers);
    setFamilyAdviceText(advice);
    setLoading(false);
  };

  const handleAddRecipeIngredient = () => {
    if (newIngredient.trim() && !recipeIngredients.includes(newIngredient.trim())) {
      setRecipeIngredients([...recipeIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleGenerateRecipe = async () => {
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const recipe = await fetchAIRecipe(recipeIngredients, profile.dietType);
    setRecipeOutput(recipe);
    setLoading(false);
  };

  const handleSwapCheck = async () => {
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const result = await fetchRestaurantAdvice(dishName, profile.dietType);
    setSwapResult(result);
    setLoading(false);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoodCamImage(reader.result as string);
        handleAnalyzeFood(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeFood = async (imgBase64: string) => {
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const result = await fetchScanResult(imgBase64);
    setScanResult(result);
    setLoading(false);
  };

  const handleAnalyzeLabReport = async () => {
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);
    const analysis = await fetchLabReportAnalysis(labReportText);
    setLabAnalysis(analysis);
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', parts: [{ text: chatInput.trim() }] };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    if (!checkAndIncrementAiLimit()) return;
    setLoading(true);

    const docReply = await fetchDoctorAdvice(updatedMessages);
    setChatMessages([...updatedMessages, { role: 'model', parts: [{ text: docReply }] }]);
    setLoading(false);
  };

  const renderLockedScreen = (featureName: string) => (
    <div className="py-12 px-6 bg-[#0c0c0e] border border-red-500/10 rounded-2xl text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
        <Lock className="w-6 h-6 animate-pulse" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">{featureName} Locked</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your active plan <strong className="text-emerald-400 uppercase font-mono">"{currentPlan.name}"</strong> does not have permission to access this module based on real-time system administrator rules.
        </p>
      </div>
      <div className="p-3 bg-[#111] border border-[#222] rounded-lg text-left text-[11px] text-slate-400 space-y-1">
        <span className="font-bold text-slate-300 block mb-1">To access this module:</span>
        <div>• Change plan tier dynamically in the Admin panel, OR</div>
        <div>• Visit the <span className="text-emerald-400 font-bold">OS Store & Gold</span> tab to buy dynamic upgrades instantly with test simulated Razorpay!</div>
      </div>
      <div className="text-[10px] text-slate-500 font-mono">
        Configured via Live Firestore System Configuration
      </div>
    </div>
  );

  return (
    <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
      
      {/* Top Banner tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#1a1a1a] pb-4">
        {[
          { id: 'diet', label: t.dietPlanner, icon: Apple },
          { id: 'grocery', label: t.groceryPlanner, icon: ShoppingBag },
          { id: 'family', label: t.familyPlanner, icon: Users },
          { id: 'recipe', label: t.recipeGenerator, icon: ChefHat },
          { id: 'restaurant', label: t.restaurantHelper, icon: UtensilsCrossed },
          { id: 'scan', label: 'AI Scanner', icon: ScanBarcode },
          { id: 'lab', label: t.labAnalyzer, icon: Activity },
          { id: 'doctor', label: t.doctorChat, icon: Stethoscope }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
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

      {/* Loading overlay for panel updates */}
      {loading && (
        <div className="absolute inset-0 bg-[#080808]/90 flex flex-col justify-center items-center z-40 backdrop-blur-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
          <p className="text-xs font-mono text-emerald-400 animate-pulse">Querying NutriOS AI Core...</p>
        </div>
      )}

      {/* SUB-PANEL CONTENT DECK */}
      
      {/* 1. Diet Planner */}
      {activeSubTab === 'diet' && (
        !isFeatureEnabled('ai_diet_planner') ? renderLockedScreen('AI Diet Planner') : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#0d0d0d] p-4 rounded-xl border border-[#1a1a1a]">
            <div>
              <h3 className="font-bold text-sm text-slate-200">AI Diet Protocols</h3>
              <p className="text-xs text-slate-400">Tailored for {profile.goal.replace('_', ' ').toUpperCase()} ({profile.dietType.toUpperCase()})</p>
            </div>
            <button
              onClick={handleGenerateDiet}
              className="py-2 px-4 bg-emerald-500 hover:bg-[#10b981] text-[#0d0f12] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-md shadow-emerald-500/5"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t.generatePlan}
            </button>
          </div>

          {dietPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Day selector list */}
              <div className="md:col-span-1 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {Object.keys(dietPlan).map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition border flex justify-between items-center ${
                      selectedDay === day
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-[#0d0d0d] text-slate-300 border-[#1a1a1a] hover:bg-[#111] hover:border-[#222]'
                    }`}
                  >
                    {day}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>

              {/* Day Details cards */}
              <div className="md:col-span-3 space-y-4">
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-3 mb-3">
                    <span className="text-sm font-bold text-emerald-400">{selectedDay} Protocols</span>
                    <span className="text-[10px] font-mono bg-[#111] border border-[#222] px-2.5 py-1 rounded-full text-slate-300">
                      Target: {dietPlan[selectedDay]?.totalCalories || 0} Cal
                    </span>
                  </div>

                  {/* Meals grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'breakfast', title: 'Breakfast', color: 'border-[#1a1a1a]' },
                      { key: 'lunch', title: 'Lunch', color: 'border-[#1a1a1a]' },
                      { key: 'snacks', title: 'Snacks / Fuel', color: 'border-[#1a1a1a]' },
                      { key: 'dinner', title: 'Dinner', color: 'border-[#1a1a1a]' }
                    ].map(mealItem => {
                      const meal: any = (dietPlan[selectedDay] as any)?.[mealItem.key];
                      if (!meal) return null;
                      return (
                        <div key={mealItem.key} className={`bg-[#111] border ${mealItem.color} p-3 rounded-lg`}>
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">{mealItem.title}</span>
                          <h4 className="font-bold text-xs text-slate-200 mt-0.5 line-clamp-1">{meal.name}</h4>
                          <div className="flex gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                            <span>🔥 {meal.calories} Cal</span>
                            <span>💪 P: {meal.protein}g</span>
                            <span>🥖 C: {meal.carbs}g</span>
                          </div>
                          {meal.ingredients && (
                            <div className="mt-2 pt-2 border-t border-[#1a1a1a] flex flex-wrap gap-1">
                              {meal.ingredients.slice(0, 3).map((ing: string) => (
                                <span key={ing} className="bg-[#222] px-1.5 py-0.5 rounded text-[9px] text-slate-400">{ing}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {dietPlan[selectedDay]?.advice && (
                    <div className="mt-4 p-3 bg-emerald-950/10 border border-emerald-900/30 rounded-lg flex gap-2">
                      <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-300/90 leading-relaxed">{dietPlan[selectedDay].advice}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-[#0d0d0d] border border-dashed border-[#1a1a1a] rounded-xl">
              <Apple className="w-8 h-8 text-slate-650 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No active plan configured. Click "Generate AI Plan" above.</p>
            </div>
          )}
        </div>
        )
      )}

      {/* 2. Grocery List Planner */}
      {activeSubTab === 'grocery' && (
        !isFeatureEnabled('grocery_planner') ? renderLockedScreen('Grocery Planner') : (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#1a1a1a] flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add custom ingredient (e.g. Greek Yogurt, Oats)..."
                value={newGrocery}
                onChange={(e) => setNewGrocery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGrocery()}
                className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleAddGrocery}
              className="py-2 px-4 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" /> Compiled Nutritional Pantry
            </h4>
            
            {groceryList.length > 0 ? (
              <div className="divide-y divide-[#1a1a1a]">
                {groceryList.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleGrocery(item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition cursor-pointer ${
                          item.checked ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-[#222] hover:border-emerald-500'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className={`text-xs font-semibold ${item.checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono bg-[#111] border border-[#222] px-2 py-0.5 rounded text-slate-400">{item.quantity}</span>
                      <button onClick={() => deleteGrocery(item.id)} className="text-slate-500 hover:text-red-400 transition cursor-pointer">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 py-6">Your grocery basket is empty.</p>
            )}
          </div>
        </div>
        )
      )}

      {/* 3. Family Planner */}
      {activeSubTab === 'family' && (
        !isFeatureEnabled('family_onboarding') ? renderLockedScreen('Family Onboarding Hub') : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form to add family member */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">REGISTER FAMILY MEMBER</h4>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">MEMBER NAME</label>
                <input
                  type="text"
                  placeholder="Seema (Spouse)"
                  value={famName}
                  onChange={(e) => setFamName(e.target.value)}
                  className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">RELATION</label>
                  <select
                    value={famRelation}
                    onChange={(e: any) => setFamRelation(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">AGE</label>
                  <input
                    type="number"
                    value={famAge}
                    onChange={(e) => setFamAge(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-2 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">GOAL</label>
                  <select
                    value={famGoal}
                    onChange={(e: any) => setFamGoal(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="general_fitness">Fitness</option>
                    <option value="weight_loss">Fat Loss</option>
                    <option value="weight_gain">Gain Weight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">DIET</label>
                  <select
                    value={famDiet}
                    onChange={(e: any) => setFamDiet(e.target.value)}
                    className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="veg">Veg</option>
                    <option value="non_veg">Non-Veg</option>
                    <option value="egg">Egg</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddFamily}
                className="w-full py-2 bg-[#111] border border-[#222] text-white font-bold rounded-lg text-xs hover:bg-[#1a1a1a] cursor-pointer transition"
              >
                Add Family Member
              </button>
            </div>

            {/* Registered list */}
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">HOUSEHOLD DECK</h4>
                {familyMembers.length > 0 ? (
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex justify-between items-center bg-[#111] p-2 rounded-lg border border-[#222]">
                        <div>
                          <span className="text-xs font-bold text-slate-200">{member.name}</span>
                          <span className="text-[10px] font-mono text-emerald-400 ml-2">({member.relation})</span>
                        </div>
                        <span className="text-[10px] bg-[#222] px-2 py-0.5 rounded text-slate-400">{member.goal.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-550 py-6 text-center font-mono">No secondary family profiles added yet.</p>
                )}
              </div>

              <div className="pt-3">
                <button
                  onClick={handleGenerateFamilyAdvice}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold rounded-lg text-xs flex justify-center items-center gap-1 cursor-pointer hover:opacity-90 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-black" /> Get Collective Family Advice
                </button>
              </div>
            </div>
          </div>

          {familyAdviceText && (
            <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl">
              <h5 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">FAMILY AI REPORT</h5>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{familyAdviceText}</p>
            </div>
          )}
        </div>
        )
      )}

      {/* 4. Recipe Builder */}
      {activeSubTab === 'recipe' && (
        !isFeatureEnabled('ai_diet_planner') ? renderLockedScreen('AI Recipe Builder') : (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#1a1a1a]">
            <h4 className="text-sm font-bold text-slate-200 mb-2 font-serif">Ingredients in your Fridge</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Enter ingredient (e.g., Tomato, Egg, Potato)..."
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipeIngredient()}
                className="flex-1 bg-[#111] border border-[#222] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button onClick={handleAddRecipeIngredient} className="px-3 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-white text-xs font-bold rounded-lg cursor-pointer transition">
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {recipeIngredients.map(ing => (
                <span key={ing} className="bg-[#111] border border-[#222] text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                  {ing}
                  <button onClick={() => setRecipeIngredients(recipeIngredients.filter(x => x !== ing))} className="hover:text-red-400 cursor-pointer text-slate-500 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateRecipe}
            className="w-full py-3 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer transition"
          >
            <ChefHat className="w-4 h-4" /> Build Smart Custom Recipe
          </button>

          {recipeOutput && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <div className="flex justify-between items-start border-b border-[#1a1a1a] pb-3 mb-3">
                <div>
                  <h4 className="font-bold text-sm text-emerald-400">{recipeOutput.name}</h4>
                  <div className="flex gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                    <span>🔥 {recipeOutput.calories} Calories</span>
                    <span>💪 Protein: {recipeOutput.protein}g</span>
                    <span>🥖 Carbs: {recipeOutput.carbs}g</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">COOKING STEPS</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-350">
                  {recipeOutput.steps?.map((step: string, idx: number) => (
                    <li key={idx} className="leading-relaxed pl-1">{step}</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </div>
        )
      )}

      {/* 5. Restaurant Helper */}
      {activeSubTab === 'restaurant' && (
        !isFeatureEnabled('ai_diet_planner') ? renderLockedScreen('Restaurant Healthy Swaps') : (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">ENTER MENU DISH NAME</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Garlic Naan with Butter Chicken"
                className="w-full bg-[#111] text-white border border-[#222] rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleSwapCheck}
              className="w-full py-2.5 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition"
            >
              Analyze Dish & Get Healthy Swaps
            </button>
          </div>

          {swapResult && (
            <div className="p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                <span className="text-xs font-mono text-amber-400 uppercase">HEALTH ANALYSIS</span>
                <span className="text-xs font-mono text-slate-500">Estimated: {swapResult.calories} Calories</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">💡 Smart Swap: {swapResult.swap}</p>
              {swapResult.macroBreakdown && (
                <div className="text-[10px] font-mono bg-[#111] border border-[#222] p-2 rounded text-slate-400">
                  Macro Breakdown: {swapResult.macroBreakdown}
                </div>
              )}
            </div>
          )}
        </div>
        )
      )}

      {/* 6. AI Scanner & Food Camera */}
      {activeSubTab === 'scan' && (
        !isFeatureEnabled('blood_report_ai') ? renderLockedScreen('AI Scanner & Barcode Lab') : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 flex flex-col justify-center items-center py-8">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              
              {foodCamImage ? (
                <div className="relative w-full max-w-[200px] h-[150px] rounded-lg overflow-hidden border border-[#222] mb-3">
                  <img src={foodCamImage} className="w-full h-full object-cover" alt="food camera upload" referrerPolicy="no-referrer" />
                  <button onClick={() => setFoodCamImage(null)} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white text-xs hover:bg-black">×</button>
                </div>
              ) : (
                <div className="p-4 bg-[#111] rounded-full mb-3 border border-[#222]">
                  <Camera className="w-8 h-8 text-emerald-400" />
                </div>
              )}

              <p className="text-xs text-slate-400 text-center mb-4">Snap food label barcode or plate of curry/rice to check safety grade</p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleFileUploadClick}
                  className="py-2 px-4 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-white font-bold rounded-lg text-xs cursor-pointer transition"
                >
                  Upload Food Image
                </button>
                <button
                  onClick={() => handleAnalyzeFood('')}
                  className="py-2 px-4 bg-emerald-500 hover:bg-[#10b981] text-black font-bold rounded-lg text-xs cursor-pointer transition"
                >
                  Simulate Live Scan
                </button>
              </div>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">SCAN METRIC OUTPUT</h4>
              {scanResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-[#222]">
                    <div>
                      <span className="text-xs font-bold text-slate-200">{scanResult.productName}</span>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>🔥 {scanResult.calories} Cal</span>
                        <span>💪 Protein: {scanResult.protein}g</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-mono text-slate-500 block">Grade</span>
                      <span className="text-lg font-bold text-emerald-400">{scanResult.grade}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#111] p-2 rounded border border-[#222]">
                      <span className="text-[9px] font-mono text-slate-500 block">HEALTH INDEX</span>
                      <span className="text-sm font-bold text-emerald-400">{scanResult.safetyScore} / 10</span>
                    </div>
                    <div className="bg-[#111] p-2 rounded border border-[#222]">
                      <span className="text-[9px] font-mono text-slate-500 block">HEALTHY LEVEL</span>
                      <span className={`text-sm font-bold ${scanResult.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {scanResult.isHealthy ? 'Clean Source' : 'Avoid Frequently'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#111] p-3 rounded-lg border border-[#222]">{scanResult.verdict}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-550 py-10 text-center font-mono">Scan plate or submit food photo to analyze.</p>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {/* 7. Lab Report Expert */}
      {activeSubTab === 'lab' && (
        !isFeatureEnabled('blood_report_ai') ? renderLockedScreen('Blood Report Lab Biochem AI') : (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">PASTE BIOCHEMICAL TEST RESULTS</label>
              <textarea
                value={labReportText}
                onChange={(e) => setLabReportText(e.target.value)}
                rows={3}
                placeholder="Paste metrics e.g. TSH: 4.8, Hb: 11.2, Vitamin B12: 180"
                className="w-full bg-[#111] text-white border border-[#222] rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleAnalyzeLabReport}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold rounded-lg text-xs cursor-pointer transition hover:opacity-95"
            >
              Examine Biochemical Markers
            </button>
          </div>

          {labAnalysis.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">AI DIAGNOSTIC METADATA</h4>
              {labAnalysis.map((res, index) => (
                <div key={index} className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl flex gap-3">
                  <div className={`w-1.5 shrink-0 rounded ${res.status === 'low' ? 'bg-red-450' : res.status === 'high' ? 'bg-amber-450' : 'bg-emerald-450'}`}></div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{res.parameterName}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        res.status === 'low' ? 'bg-red-500/10 text-red-300' : res.status === 'high' ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {res.value} ({res.status.toUpperCase()})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block">Reference range: {res.range}</span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{res.aiInterpretation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )
      )}

      {/* 8. AI Doctor Chatbot */}
      {activeSubTab === 'doctor' && (
        !isFeatureEnabled('blood_report_ai') ? renderLockedScreen('AI Doctor Chat Consultant') : (
        <div className="space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 flex flex-col h-[350px]">
            {/* Disclaimer box */}
            <div className="bg-red-500/5 border border-red-950/20 p-2.5 rounded-lg flex gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-400/90 leading-relaxed">
                This chat is for informational purposes only. Do not use for clinical emergency diagnosis.
              </p>
            </div>

            {/* Message Thread container */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-[#111] text-slate-200 border border-[#222]'
                    }`}>
                      {msg.parts[0]?.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input send wrapper */}
            <div className="flex gap-2 border-t border-[#1a1a1a] pt-3">
              <input
                type="text"
                placeholder="Ask about fatigue, joint pain, cholesterol levels..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#111] border border-[#222] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-emerald-500 hover:bg-[#10b981] text-black rounded-lg cursor-pointer transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        )
      )}

    </div>
  );
}
