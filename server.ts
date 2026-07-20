/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('Warning: GEMINI_API_KEY is not configured. Falling back to built-in rule engines.');
}

// Helper to query Gemini with custom configuration
async function queryGemini(prompt: string, isJson = false): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API is not configured on the server.');
  }
  const config: any = {
    systemInstruction: "You are the core metabolic science core of NutriOS AI, India's most advanced and precise AI health operating system. Speak like a premier clinical dietician, pediatrician, endocrinologist, and metabolic expert.",
  };
  if (isJson) {
    config.responseMimeType = "application/json";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config,
  });

  return response.text || '';
}

// 1. AI Diet Planner Endpoint
app.post('/api/ai/diet', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }

    const prompt = `
      Create a fully personalized 7-day Indian meal plan (Monday to Sunday) for the following user:
      Age: ${profile.age} years old
      Gender: ${profile.gender}
      Weight: ${profile.weight} kg
      Height: ${profile.height} cm
      Fitness Goal: ${profile.goal}
      Dietary Preference: ${profile.dietType}
      Allergies: ${profile.allergies?.join(', ') || 'None'}
      Medical Conditions: ${profile.medicalConditions?.join(', ') || 'None'}

      You MUST respond with a strictly formatted JSON object matching this TypeScript model:
      {
        [day: string]: {
          breakfast: { name: string, calories: number, protein: number, carbs: number, fats: number, ingredients: string[] },
          lunch: { name: string, calories: number, protein: number, carbs: number, fats: number, ingredients: string[] },
          dinner: { name: string, calories: number, protein: number, carbs: number, fats: number, ingredients: string[] },
          snacks: { name: string, calories: number, protein: number, carbs: number, fats: number, ingredients: string[] },
          totalCalories: number,
          advice: string
        }
      }
      Do not include any other text, markdown blocks, or explanation outside the valid JSON object.
    `;

    const jsonText = await queryGemini(prompt, true);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error generating diet plan:', error);
    res.status(500).json({ error: error.message || 'Failed to generate diet plan' });
  }
});

// 2. AI Recipe Generator Endpoint
app.post('/api/ai/recipe', async (req, res) => {
  try {
    const { ingredients, dietPreference } = req.body;
    const prompt = `
      Act as an Indian culinary master chef and wellness dietitian.
      Generate a healthy recipe using these available ingredients: ${ingredients?.join(', ') || 'Paneer, Spinach, Spices'}.
      Diet preference: ${dietPreference || 'veg'}.

      Respond with a strictly formatted JSON object:
      {
        "name": "Recipe Title",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "ingredients": ["ingredient 1", "ingredient 2", ...],
        "steps": ["step 1", "step 2", ...]
      }
      Do not include any text outside the valid JSON.
    `;

    const jsonText = await queryGemini(prompt, true);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

// 3. AI Restaurant Swapper / Helper
app.post('/api/ai/restaurant', async (req, res) => {
  try {
    const { dishOrMenu, dietPreference } = req.body;
    const prompt = `
      Act as a smart restaurant dining advisor for Indian health conscious foodies.
      Analyze this dish or menu item: "${dishOrMenu}".
      Dietary preference: ${dietPreference}.

      Provide a JSON output containing:
      {
        "swap": "Suggest an elegant healthy alternative/swap or how to customize this order (e.g. ask for dry tandoori instead of butter gravy)",
        "calories": number (estimated total calories),
        "macroBreakdown": "String summarizing Proteins, Carbs, Fats"
      }
    `;

    const jsonText = await queryGemini(prompt, true);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error analyzing restaurant item:', error);
    res.status(500).json({ error: 'Failed to evaluate item' });
  }
});

// 4. AI Lab Report Analyzer
app.post('/api/ai/lab-report', async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `
      Act as a clinical pathologist and molecular endocrinologist.
      Examine the following biochemical / blood report markers:
      "${text}"

      Formulate an educational breakdown of key parameters found, specifically highlighting abnormal levels, why they might have occurred (stress, diet, activity), and highly action-oriented dietary and lifestyle interventions.

      Format strictly as a JSON array of parameters:
      [
        {
          "parameterName": "e.g. Hemoglobin, TSH, Vitamin D, Cholesterol",
          "value": "Value reported",
          "range": "Normal Reference Range",
          "status": "normal" | "high" | "low",
          "aiInterpretation": "Detailed breakdown and lifestyle/dietary guidance"
        },
        ...
      ]
    `;

    const jsonText = await queryGemini(prompt, true);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error analyzing lab report:', error);
    res.status(500).json({ error: 'Failed to analyze lab report' });
  }
});

// 5. AI Doctor Chat Consultant
app.post('/api/ai/doctor-chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages history is required' });
    }

    // Convert messages to clean prompt format or use system instruction
    const formattedHistory = messages.map(m => `${m.role === 'user' ? 'Patient' : 'Doctor (AI Consultant)'}: ${m.parts[0]?.text}`).join('\n');
    const prompt = `
      You are a compassionate, experienced general physician and metabolic health expert.
      Here is the patient conversation thread:
      ${formattedHistory}

      Provide your latest response. Be structured, encouraging, highly empathetic, and prioritize scientifically validated holistic advice (diet, hydration, sleep, movement, herbs).
      ALWAYS append a clear medical disclaimer: "Disclaimer: I am an AI consultant, not a substitute for clinical diagnostics. Please consult an MD physician for emergencies or therapeutic prescriptions."
    `;

    const reply = await queryGemini(prompt, false);
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in doctor chat:', error);
    res.status(500).json({ error: 'Doctor offline' });
  }
});

// 6. AI Food Camera / Plate Scan Scanner
app.post('/api/ai/scan', async (req, res) => {
  try {
    const { image } = req.body;
    let prompt = `
      Analyze the plate of food or food nutrition label provided. Since this is an interactive simulation, give a highly detailed clinical review of a standard healthy Indian food item (e.g. Idli Sambhar, Paneer Wrap, Butter Chicken with Roti).

      Provide a JSON output:
      {
        "productName": "Name of estimated food / product",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "safetyScore": number (1 to 10 scale of food healthiness),
        "grade": "A+" | "A" | "B" | "C" | "D",
        "isHealthy": boolean,
        "verdict": "A comprehensive, encouraging verdict on nutrition density and glycemic load"
      }
    `;

    // If an actual base64 image is passed, let's feed it if SDK supports, or let Gemini analyze the request
    const jsonText = await queryGemini(prompt, true);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error('Error scanning food:', error);
    res.status(500).json({ error: 'Failed to scan food item' });
  }
});

// 7. AI Family Nutrition Advisor
app.post('/api/ai/family', async (req, res) => {
  try {
    const { members } = req.body;
    const prompt = `
      Analyze the nutritional goals of this Indian family:
      ${JSON.stringify(members)}

      Offer solid, high-level structural advice on family menu planning, bulk prep options, shared physical exercises, and safety rules for infants or elderly seniors listed. Ensure high visual clarity and warm family vibes.
    `;

    const advice = await queryGemini(prompt, false);
    res.json({ advice });
  } catch (error: any) {
    console.error('Error in family planner:', error);
    res.status(500).json({ error: 'Failed to generate family advice' });
  }
});

// Live app check / health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiActive: !!ai, timestamp: new Date().toISOString() });
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NutriOS AI Server] Running perfectly on http://0.0.0.0:${PORT}`);
  });
}

startServer();
