const express = require('express');
const cors = require('cors');
const generateImageRoute = require('./routes/generateImage');
const generateTextRoute = require('./routes/generateText');
const generateBookRoute = require('./routes/generateBook');

const app = express();

app.use(cors({
  origin: [
    'https://lazywrite.vercel.app',      // Vercel frontend URL
    'https://lazywrite.netlify.app',     // Netlify frontend URL (if you use it)
    'http://localhost:5173'              // Local dev (Vite default)
  ],
  credentials: true
}));
app.use(express.json());

app.use('/generate-image', generateImageRoute);
app.use('/generate-text', generateTextRoute);
app.use('/generate-book', generateBookRoute);

app.get('/', (req, res) => {
  res.send('💜 LazyWrite AI Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LazyWrite backend running on http://localhost:${PORT}`);
}); 