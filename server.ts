import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Clerk auth middleware — reads session token from every request
  app.use(clerkMiddleware());

  // Protect all /api routes — returns 401 if not signed in
  app.use('/api', requireAuth());

  // Initialize Gemini AI SDK lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'The Catwalk' });
  });

  // AI Cat Caption Generator
  app.post('/api/gemini/cat-caption', async (req, res) => {
    try {
      const { mood, breed, topic, location } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are a majestic, hilarious cat on The Catwalk (by Pawprint Network) writing a social media post caption.
Context:
- Mood: ${mood || 'Sassy Overlord'}
- Breed: ${breed || 'Domestic Cat'}
- Topic/Context: ${topic || 'Living my best feline life'}
- Location: ${location || 'The Sunbeam'}

Write a cat perspective caption. Keep it under 200 characters, witty, filled with cat emojis (🐾, 😼, 🐟, 📦, ☀️).
Also provide a 1-sentence "Human Translation".

Format response as strict JSON with fields:
- "caption": string
- "humanTranslation": string
- "tags": string[] (3-5 cat hashtags like #catloaf #3amzoomies #thecatwalk)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              humanTranslation: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['caption', 'humanTranslation', 'tags'],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error('Gemini Caption Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate cat caption',
        caption: 'Meow! The human delayed my treats so I refused to write a caption. 😼 #SassyCat',
        humanTranslation: 'Translation: "Please check your Gemini API key in Settings > Secrets."',
        tags: ['#thecatwalk', '#pawprintnetwork', '#geminiau'],
      });
    }
  });

  // AI Meow Translator
  app.post('/api/gemini/meow-translator', async (req, res) => {
    const { mode, text } = req.body || {};
    try {
      const ai = getGeminiClient();

      let prompt = '';
      if (mode === 'human-to-cat') {
        prompt = `Translate the following human message into "Cat Speak / Meow Language".
Human text: "${text}"
Make it cute, funny, full of meows, purrs, claw taps, and subtle cat arrogance.`;
      } else {
        prompt = `Translate the following cat sounds/meows into what the cat is REALLY thinking in sophisticated, sassy human thoughts.
Cat sound: "${text}"`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: { type: Type.STRING },
              catMood: { type: Type.STRING },
              actionNote: { type: Type.STRING },
            },
            required: ['translatedText', 'catMood', 'actionNote'],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error('Gemini Translator Error:', error);
      res.status(500).json({
        error: error.message || 'Translation failed',
        translatedText: mode === 'human-to-cat' 
          ? 'Meow prrrrr *slow blink* (Human, I acknowledged your attempt at communication).'
          : 'Translation: "Fill my bowl immediately or face 3 AM corridor zoomies."',
        catMood: 'Mildly Intrigued',
        actionNote: '*Tail flicks once*',
      });
    }
  });

  // AI Cat Vision & Judgement Analyzer
  app.post('/api/gemini/cat-analyzer', async (req, res) => {
    try {
      const { imageBase64, mimeType, description } = req.body;
      const ai = getGeminiClient();

      let contents: any = [];

      if (imageBase64) {
        // Strip data url prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        contents = [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: 'Analyze this cat photo for The Catwalk. Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact.',
          },
        ];
      } else {
        contents = `Analyze this cat description for The Catwalk: "${description || 'An orange tabby cat sitting majestically in a cardboard box'}". Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              judgementLevel: { type: Type.INTEGER },
              loafFormRating: { type: Type.STRING },
              innerMonologue: { type: Type.STRING },
              breedEstimate: { type: Type.STRING },
              moodTag: { type: Type.STRING },
              whiskersScore: { type: Type.STRING },
              funFact: { type: Type.STRING },
            },
            required: [
              'judgementLevel',
              'loafFormRating',
              'innerMonologue',
              'breedEstimate',
              'moodTag',
              'whiskersScore',
              'funFact',
            ],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error('Gemini Analyzer Error:', error);
      res.status(500).json({
        judgementLevel: 94,
        loafFormRating: '9.9 / 10 Flawless Tuck',
        innerMonologue: 'I am judging your life choices from this sunbeam.',
        breedEstimate: 'Majestic Domestic Short Hair',
        moodTag: 'Supreme Monarch',
        whiskersScore: '10/10 Perfect Symmetry',
        funFact: 'Cats spend 70% of their lives sleeping and 30% judging humans.',
      });
    }
  });

  // --- VITE / STATIC SERVING ---
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
    console.log(`🐾 🐾 The Catwalk (Pawprint Network) server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
