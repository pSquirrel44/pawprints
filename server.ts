// ═══════════════════════════════════════════════════════════════════════════
// PAWPRINT NETWORK — server.ts
// ───────────────────────────────────────────────────────────────────────────
// ⚠️  BUILD FORMAT: This file is compiled by esbuild to CommonJS (dist/server.cjs)
//     DO NOT add `import.meta.url`, `fileURLToPath`, or `__dirname/__filename`
//     from the 'url' module — those are ESM-only and will crash the server.
//     This bug has already been introduced and fixed multiple times. Leave this
//     comment here as a reminder. If you see those lines, delete them.
// ═══════════════════════════════════════════════════════════════════════════
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';

dotenv.config();


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
      const { mood, breed, topic, location, isDog } = req.body;
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
        caption: isDog ? 'WOOF! Something interrupted my zoomies so I could not write a caption. 🦴 #GoodBoyBlocked' : 'Meow! The human delayed my treats so I refused to write a caption. 😼 #SassyCat',
        humanTranslation: 'Translation: "Please check your Gemini API key in Settings > Secrets."',
        tags: isDog ? ['#thedogpark', '#pawprintnetwork', '#geminiai'] : ['#thecatwalk', '#pawprintnetwork', '#geminiai'],
      });
    }
  });

  // AI Meow Translator
  app.post('/api/gemini/meow-translator', async (req, res) => {
    const { mode, text, isDog } = req.body || {};
    try {
      const ai = getGeminiClient();

      let prompt = '';
      if (isDog) {
        prompt = mode === 'human-to-cat'
          ? `You are a joyful, enthusiastic dog. Translate this human message into Dog Speak (woofs, borks, tail wags, zoomie energy). Human text: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`
          : `You are translating dog barks into what the dog is REALLY thinking — joyful, loyal, squirrel-obsessed human thoughts. Dog sounds: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`;
      } else {
        prompt = mode === 'human-to-cat'
          ? `Translate this human message into Cat Speak (meows, purrs, claw taps, cat arrogance). Human text: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`
          : `Translate these cat sounds into what the cat is REALLY thinking — sophisticated, sassy, regal human thoughts. Cat sounds: "${text}". Reply ONLY with valid JSON: {"translatedText":"...","catMood":"...","actionNote":"..."}`;
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
        translatedText: isDog
          ? (mode === 'human-to-cat'
              ? 'WOOF WOOF *zooms around yard* (one word registered and it was WALK).'
              : 'Translation: "Did someone say TREAT?? I am SO ready. What are we doing."')
          : (mode === 'human-to-cat'
              ? 'Meow prrrrr *slow blink* (Human, I acknowledged your attempt at communication).'
              : 'Translation: "Fill my bowl immediately or face 3 AM corridor zoomies."'),
        catMood: isDog ? 'Maximum Enthusiasm' : 'Mildly Intrigued',
        actionNote: isDog ? '*vibrates with excitement*' : '*Tail flicks once*',
      });
    }
  });

  // AI Cat Vision & Judgement Analyzer
  app.post('/api/gemini/cat-analyzer', async (req, res) => {
    try {
      const { imageBase64, mimeType, description, isDog } = req.body;
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
            text: isDog
              ? 'Analyze this dog photo for The Dog Park. Rate its Goodness Level (0-100, higher = better good boy), Zoomie Rating, Inner Monologue, Breed Estimate, Mood Tag, Eyebrow Expressiveness Score, and a funny Dog Fun Fact.'
              : 'Analyze this cat photo for The Catwalk. Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact.',
          },
        ];
      } else {
        contents = isDog
          ? `Analyze this dog description for The Dog Park: "${description || 'A happy golden retriever doing maximum zoomies'}". Rate its Goodness Level (0-100), Zoomie Rating, Inner Monologue, Breed Estimate, Mood Tag, Eyebrow Expressiveness Score, and a funny Dog Fun Fact.`
          : `Analyze this cat description for The Catwalk: "${description || 'An orange tabby cat sitting majestically in a cardboard box'}". Rate its Judgement Level (0-100), Loaf Form Rating, Inner Monologue, Breed Estimate, Mood Tag, Whiskers Score, and a funny Cat Fun Fact.`;
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
