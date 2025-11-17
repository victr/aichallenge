import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AIClient from './aiClient.js';

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // added model config
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

// instantiate AI client
let aiClient;
try {
  aiClient = new AIClient(OPENAI_API_KEY, OPENAI_MODEL);
} catch (err) {
  console.error('Failed to initialize AI client', err);
}

async function handle(req, res, payload) {
  const { prompt, input } = req.body;
  if (!aiClient) {
    console.error('AI client is not initialized');
    return res.status(500).json({ status: 'error', message: 'Server misconfiguration' });
  }
  if (!req.body) return res.status(400).json({ status: 'error', message: 'No body provided' });
  if (!prompt && !input) return res.status(400).json({ status: 'error', message: 'No prompt provided' });
  if (prompt && prompt.length > 200) return res.status(400).json({ status: 'error', message: 'Prompt too long' });
  try {
    const message = await aiClient.ask(payload);
    res.json({ status: 'ok', message: message });
  } catch (err) {
    console.error('AI request failed', err);
    if (err && err.status) {
      res.status(err.status).json({ status: 'error', message: err.message });
    } else {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
}

app.post('/api/talktome', async (req, res) => {
  let payload = {
      model: OPENAI_MODEL,
      max_output_tokens: 1000,
      temperature: 0.7
  };
  payload.input = req.body.prompt ? req.body.prompt : req.body.input;
  if (req.body.format) payload.text = {format: req.body.format};
  handle(req, res, payload);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


export default app;
