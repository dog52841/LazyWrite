const express = require('express');
const axios = require('axios');
const huggingFaceKeyRotator = require('../utils/apiKeyRotator');

const router = express.Router();

// Example Hugging Face image generation endpoint (replace with actual model if needed)
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2';

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  let attempts = 0;
  let lastError = null;
  while (attempts < 6) { // 6 keys
    const apiKey = huggingFaceKeyRotator.getNextKey();
    try {
      const response = await axios.post(
        HUGGING_FACE_API_URL,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      // Assume the API returns an image URL or base64
      if (response.data && response.data[0] && response.data[0].url) {
        return res.json({ imageUrl: response.data[0].url });
      } else if (response.data && response.data[0] && response.data[0].image) {
        // If base64 image
        return res.json({ imageBase64: response.data[0].image });
      } else {
        return res.status(500).json({ error: 'Unexpected response from Hugging Face.' });
      }
    } catch (error) {
      // If rate limited, block key and try next
      if (error.response && error.response.status === 429) {
        huggingFaceKeyRotator.blockKey(apiKey);
        attempts++;
        lastError = error;
        continue;
      }
      // Other errors
      return res.status(500).json({ error: error.message });
    }
  }
  // Fallback to Craiyon if all Hugging Face keys are blocked
  try {
    const craiyonResponse = await axios.post(
      'https://backend.craiyon.com/generate',
      { prompt },
      { timeout: 60000 }
    );
    if (craiyonResponse.data && craiyonResponse.data.images && craiyonResponse.data.images[0]) {
      // Craiyon returns base64 images in an array
      return res.json({ imageBase64: craiyonResponse.data.images[0] });
    } else {
      return res.status(500).json({ error: 'Unexpected response from Craiyon.' });
    }
  } catch (craiyonError) {
    return res.status(429).json({ error: 'All Hugging Face API keys are rate limited or blocked, and Craiyon fallback failed.' });
  }
});

module.exports = router; 