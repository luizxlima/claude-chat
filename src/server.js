const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const sessions = {};

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId are required' });
  }

  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  sessions[sessionId].push({
    role: 'user',
    content: message,
  });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8096,
      system: 'Você é um assistente útil e inteligente. Responda de forma clara e objetiva. Pode usar markdown para formatar suas respostas.',
      messages: sessions[sessionId],
    });

    const assistantMessage = response.content[0].text;

    sessions[sessionId].push({
      role: 'assistant',
      content: assistantMessage,
    });

    if (sessions[sessionId].length > 20) {
      sessions[sessionId] = sessions[sessionId].slice(-20);
    }

    res.json({ response: assistantMessage });
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({ error: 'Erro ao conectar com Claude. Verifique sua API key.' });
  }
});

app.post('/api/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions[sessionId]) {
    sessions[sessionId] = [];
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Claude Chat rodando na porta ${PORT}`);
});
