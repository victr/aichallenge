import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'; // added model config
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.type('text/plain').send("I'm a teapot");
});

app.get('/api/hello', (req, res) => {
  res.json({status: "ok", message: 'Hello world!' });
});
app.post('/api/hello', (req, res) => {
  res.json({status: "ok", message: 'Hello world!'});
});

app.post('/api/talktome', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ status: 'error', message: 'No prompt provided' });
  if (prompt.length > 200) return res.status(400).json({ status: 'error', message: 'Prompt too long' });
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
  }

  try {
    // Use Responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
        max_output_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI Responses API error', response.status, errText);
      return res.status(502).json({ status: 'error', message: 'Upstream API error' });
    }

    const data = await response.json().catch(() => null);

    // Robust extraction to handle different possible response shapes
    let assistantMessage = null;
    if (data) {
      // Responses API: data.output can be an array of strings or objects
      if (Array.isArray(data.output) && data.output.length) {
        const parts = [];
        for (const out of data.output) {
          if (typeof out === 'string') {
            parts.push(out);
          } else if (typeof out?.text === 'string') {
            parts.push(out.text);
          } else if (Array.isArray(out?.content)) {
            for (const c of out.content) {
              if (typeof c?.text === 'string') parts.push(c.text);
            }
          }
        }
        if (parts.length) assistantMessage = parts.join('\n').trim();
      }

      // fallback to chat completions style if present
      if (!assistantMessage) {
        assistantMessage = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
      }
    }

    if (!assistantMessage) {
      console.error('Unexpected OpenAI response shape', data);
      return res.status(502).json({ status: 'error', message: 'Invalid response from AI service' });
    }

    res.json({ status: 'ok', message: assistantMessage });
  } catch (err) {
    console.error('Request failed', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
