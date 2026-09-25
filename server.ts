/**
 * SmartAgriculture X - Express Application Server & Vite Middleware
 * Handles server-side API proxy routes (e.g. Groq AI, hardware relays)
 * and mounts Vite dev server in development on port 3000.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Health & Integration Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SmartAgriculture X Console',
    supabase: {
      projectId: process.env.VITE_SUPABASE_PROJECT_ID || 'nawevbzqjzsobzvuzwuq',
      configured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    },
    groq: {
      configured: Boolean(process.env.GROQ_API_KEY),
      model: 'openai/gpt-oss-20b',
    },
    timestamp: new Date().toISOString(),
  });
});

// Groq AI Agronomic Advisory & Crop Diagnostics Endpoint
app.post('/api/ai/agronomic-advisory', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured on the server environment.',
    });
  }

  const {
    cropName,
    variety,
    growthStage,
    healthScore,
    temperature,
    humidity,
    soilMoisture,
    userQuery,
  } = req.body;

  try {
    const prompt = `Crop: ${cropName || 'Farm Crop'} (${variety || 'Standard Variety'})
Phenology Stage: ${growthStage || 'Vegetative'}
Engineering Health Score: ${healthScore ?? 92}%
Real-time Sensor Readings:
- Canopy Temperature: ${temperature ?? 24}°C
- Air Humidity: ${humidity ?? 68}%
- Soil Moisture: ${soilMoisture ?? 62}%

Operator Query / Context:
${userQuery || 'Please provide precision agronomic recommendations, irrigation adjustment, and preventative disease checks based on these telemetry readings.'}`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content:
              'You are the SmartAgriculture X Agronomic Intelligence Engine. You analyze IoT sensor telemetry and crop phenology data to provide concise, expert, practical recommendations for precision irrigation, fertilizer adjustments, and microclimate optimization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 650,
      }),
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json(data);
    }

    const advice =
      data.choices?.[0]?.message?.content || 'No advisory content generated.';

    res.json({
      success: true,
      model: 'openai/gpt-oss-20b',
      advice,
      usage: data.usage,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to communicate with Groq AI endpoint.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartAgriculture X] Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SmartAgriculture X] Server startup error:', err);
});
