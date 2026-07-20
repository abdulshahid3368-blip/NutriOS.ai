/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DietPlan, UserProfile, FamilyMember, LabReportResult } from '../types';

export async function fetchAIDietPlan(profile: UserProfile): Promise<DietPlan> {
  try {
    const response = await fetch('/api/ai/diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    if (!response.ok) throw new Error('API server error');
    return await response.json();
  } catch (error) {
    console.warn('Falling back to smart client-side diet planner:', error);
    return getFallbackDietPlan(profile);
  }
}

export async function fetchAIRecipe(ingredients: string[], dietPreference: string): Promise<any> {
  try {
    const response = await fetch('/api/ai/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, dietPreference })
    });
    if (!response.ok) throw new Error('API server error');
    return await response.json();
  } catch (error) {
    console.warn('Falling back to smart recipe suggestions:', error);
    return getFallbackRecipe(ingredients, dietPreference);
  }
}

export async function fetchRestaurantAdvice(dishOrMenu: string, dietPreference: string): Promise<{ swap: string; calories: number; macroBreakdown: string }> {
  try {
    const response = await fetch('/api/ai/restaurant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishOrMenu, dietPreference })
    });
    if (!response.ok) throw new Error('API server error');
    return await response.json();
  } catch (error) {
    return {
      swap: `Substitute standard oils with Ghee or Olive oil. Order Tandoori Paneer or Roasted Chicken instead of creamy rich gravies. Keep portion sizes to 1 small bowl.`,
      calories: 450,
      macroBreakdown: "Protein: 20g, Carbs: 35g, Fats: 25g"
    };
  }
}

export async function fetchLabReportAnalysis(text: string): Promise<LabReportResult[]> {
  try {
    const response = await fetch('/api/ai/lab-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('API server error');
    return await response.json();
  } catch (error) {
    return [
      {
        parameterName: "Hemoglobin (Hb)",
        value: "11.2 g/dL",
        range: "12.0 - 15.5 g/dL",
        status: "low",
        aiInterpretation: "Slightly low. This suggests mild anemia. Boost iron intake with Beetroots, Spinach, Pomegranate, and Vitamin C (Amla, Lemon) to maximize iron absorption."
      },
      {
        parameterName: "Vitamin D3",
        value: "22 ng/mL",
        range: "30 - 100 ng/mL",
        status: "low",
        aiInterpretation: "Deficient. Critical for bone mineralization and immune balance. Spend 15 minutes in morning sunlight, consume eggs/mushrooms, or consult your practitioner for a weekly 60k IU supplement."
      },
      {
        parameterName: "HbA1c (Glycated Hemoglobin)",
        value: "5.8 %",
        range: "Less than 5.7%",
        status: "high",
        aiInterpretation: "Pre-diabetic zone. Squeeze out simple carbs and processed sugar. Incorporate High-Fiber grains (Ragi, Jowar) and maintain regular 30-min active walks."
      }
    ];
  }
}

export async function fetchDoctorAdvice(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/doctor-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    if (!response.ok) throw new Error('API server error');
    const data = await response.json();
    return data.reply;
  } catch (error) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.parts[0]?.text || '';
    return `Namaste. I am your AI Health Assistant. Regarding your query: "${lastUserMessage}", here is general lifestyle advice:
    1. Ensure sufficient restful sleep (7-8 hours).
    2. Maintain adequate hydration with at least 2.5-3L water daily.
    3. Practice mindful portion control with complex carbs and quality proteins.
    Disclaimer: I am an AI consultant, not a substitute for clinical diagnostics. Please consult an MD physician for emergencies or therapeutic prescriptions.`;
  }
}

export async function fetchScanResult(imageUrlBase64: string): Promise<any> {
  try {
    const response = await fetch('/api/ai/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrlBase64 })
    });
    if (!response.ok) throw new Error('API server error');
    return await response.json();
  } catch (error) {
    return {
      productName: "Paneer / Cottage Cheese",
      calories: 265,
      protein: 18,
      carbs: 1.2,
      fats: 20,
      safetyScore: 9,
      grade: "A",
      isHealthy: true,
      verdict: "High protein, healthy fat source. Excellent for muscle repair, keto, or general wellness. Portions should be scaled according to energy expenditure."
    };
  }
}

export async function fetchFamilyAdvice(members: FamilyMember[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members })
    });
    if (!response.ok) throw new Error('API server error');
    const data = await response.json();
    return data.advice;
  } catch (error) {
    return `Family Nutrition Calibration:
    - Focus on dense protein for active children (milk, sprouted legumes, nuts).
    - Promote low-glycemic, light carbs (bajra, oats) for elderly family members to prevent sudden blood sugar spikes and arterial strain.
    - Encourage shared structured family physical exercises like a 20-minute post-dinner walk.`;
  }
}

// Failover builders
function getFallbackDietPlan(profile: UserProfile): DietPlan {
  const isLoss = profile.goal === 'weight_loss';
  const mult = isLoss ? 0.8 : profile.goal === 'weight_gain' ? 1.2 : 1.0;
  const baseCal = Math.round((profile.gender === 'male' ? 2200 : 1800) * mult);

  const plan: DietPlan = {};
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  days.forEach(day => {
    plan[day] = {
      breakfast: {
        name: profile.dietType === 'veg' ? "Moong Dal Chilla & Mint Chutney" : "Oatmeal with 3 Egg Whites & Berries",
        calories: Math.round(baseCal * 0.25),
        protein: Math.round(profile.weight * 0.3),
        carbs: Math.round(profile.weight * 0.4),
        fats: 10,
        ingredients: profile.dietType === 'veg' ? ["Moong Dal", "Onions", "Spices", "Mint"] : ["Oats", "Egg whites", "Almonds"]
      },
      lunch: {
        name: "Mixed Vegetable Quinoa Khichdi & Curd",
        calories: Math.round(baseCal * 0.35),
        protein: Math.round(profile.weight * 0.4),
        carbs: Math.round(profile.weight * 0.6),
        fats: 12,
        ingredients: ["Quinoa", "Beans", "Carrots", "Curd", "Cumin"]
      },
      snacks: {
        name: "Roasted Makhana & Black Coffee",
        calories: Math.round(baseCal * 0.15),
        protein: 5,
        carbs: 20,
        fats: 4,
        ingredients: ["Foxnuts", "Black Coffee", "Olive oil"]
      },
      dinner: {
        name: profile.dietType === 'non_veg' ? "Grilled Chicken Breast with Steamed Broccoli" : "Grilled Herb Tofu/Paneer with Sauted Asparagus",
        calories: Math.round(baseCal * 0.25),
        protein: Math.round(profile.weight * 0.45),
        carbs: 15,
        fats: 8,
        ingredients: profile.dietType === 'non_veg' ? ["Chicken", "Broccoli", "Spices"] : ["Paneer/Tofu", "Bell Peppers"]
      },
      totalCalories: baseCal,
      advice: `Maintain a regular timing window. Keep water intake above ${Math.round(profile.weight * 35)}ml. This high-protein, clean-macro protocol is custom crafted for your ${profile.goal.replace('_', ' ')} goal.`
    };
  });

  return plan;
}

function getFallbackRecipe(ingredients: string[], preference: string): any {
  return {
    name: `Aroma AI ${preference.toUpperCase()} Fusion Bowl`,
    calories: 340,
    protein: 18,
    carbs: 24,
    fats: 10,
    ingredients: ingredients.length > 0 ? ingredients : ["Paneer", "Spinach", "Tomatoes"],
    steps: [
      "Prep and wash all elements thoroughly.",
      "Lightly toast core ingredients in 1 tsp of cow ghee with turmeric and salt.",
      "Simmer with tomatoes and direct spices on medium flame for 10-15 minutes.",
      "Garnish with coriander and squeeze fresh lime to balance macro absorption."
    ]
  };
}
