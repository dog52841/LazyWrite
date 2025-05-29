const express = require('express');
const axios = require('axios');
const openRouterKeyRotator = require('../utils/openRouterKeyRotator');

const router = express.Router();

// Placeholder OpenRouter GPT-4.1 API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  let attempts = 0;
  let lastError = null;
  while (attempts < 3) { // 3 keys
    const apiKey = openRouterKeyRotator.getNextKey();
    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: 'You are a creative book-writing assistant.' },
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      if (response.data && response.data.choices && response.data.choices[0].message.content) {
        return res.json({ text: response.data.choices[0].message.content });
      } else {
        return res.status(500).json({ error: 'Unexpected response from OpenRouter.' });
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        openRouterKeyRotator.blockKey(apiKey);
        attempts++;
        lastError = error;
        continue;
      }
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(429).json({ error: 'All OpenRouter API keys are rate limited or blocked.' });
});

module.exports = router; 