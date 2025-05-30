const express = require('express');
const axios = require('axios');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const router = express.Router();

// Add GET route for clarity
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'This endpoint only supports POST requests for AI book generation. Please use POST with a prompt.'
  });
});

// Helper to call internal endpoints with better error handling
async function callInternal(endpoint, data) {
  console.log(`Attempting to call ${endpoint} with data:`, JSON.stringify(data, null, 2));
  try {
    const response = await axios.post(`http://localhost:5000${endpoint}`, data, { 
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`Successfully called ${endpoint}, response status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    if (error.response) {
      console.error(`Response error details:`, error.response.data);
      if (error.response.status === 429) {
        console.log('Rate limit exceeded, key rotation should handle this.');
        throw new Error('rate_limit_exceeded');
      } else if (error.response.data?.error?.includes('content')) {
        console.log('Content filter triggered.');
        throw new Error('content_filter');
      }
      throw new Error(error.response.data.error || 'Service temporarily unavailable');
    }
    console.error('Network or other error:', error.code || 'Unknown error code');
    throw new Error('Failed to generate content. Please try again.');
  }
}

// Professional PDF styling constants
const STYLES = {
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  colors: {
    primary: rgb(0.27, 0.27, 0.33),
    secondary: rgb(0.4, 0.4, 0.45),
    accent: rgb(0.2, 0.4, 0.8),
    subtle: rgb(0.6, 0.6, 0.65),
    highlight: rgb(0.95, 0.95, 0.98),
    didYouKnow: rgb(0.95, 0.9, 0.8),
    letsThink: rgb(0.9, 0.95, 0.9),
    tryThis: rgb(0.9, 0.9, 0.95)
  },
  fonts: {
    title: StandardFonts.TimesRomanBold,
    heading: StandardFonts.TimesRomanBold,
    body: StandardFonts.TimesRoman,
    caption: StandardFonts.TimesRomanItalic
  }
};

router.post('/', async (req, res) => {
  console.log('Received book generation request:', {
    timestamp: new Date().toISOString(),
    prompt: req.body.prompt || 'No prompt provided',
    ip: req.ip,
    headers: req.headers
  });
  const { prompt } = req.body;
  if (!prompt) {
    console.log('Error: No prompt provided');
    return res.status(400).json({ error: 'Please provide a description for your book.' });
  }

  try {
    console.log('Starting book generation process for prompt:', prompt);
    // 1. Generate book structure with educational content
    console.log('Generating text content...');
    const textRes = await callInternal('/generate-text', { 
      prompt: `Create an educational children's book about ${prompt} with:
      - A clear table of contents
      - 4-5 chapters with engaging titles
      - Vocabulary words defined in margins (marked as "Word to Know:")
      - "Let's Think!" discussion questions in colored boxes
      - "Try This!" hands-on activities
      - "Did You Know?" fun facts in the margins
      - Beautiful scene descriptions for illustrations
      - Child-friendly language (grades 4-6 level)
      - Educational value and moral lessons
      Write in a warm, encouraging tone like a favorite teacher.`
    });
    console.log('Text generation completed, processing result...');
    
    if (!textRes.data || !textRes.data.text) {
      throw new Error('Failed to generate book content: No text data returned from API');
    }

    const bookText = textRes.data.text;
    const chapters = bookText.split(/Chapter [0-9]+:/i).filter(Boolean);
    const chapterTitles = chapters.map(ch => {
      const firstLine = ch.split('\n')[0].trim();
      return firstLine.length > 40 ? firstLine.slice(0, 37) + '...' : firstLine;
    });

    // 2. Generate professional illustrations
    const images = [];
    for (let i = 0; i < chapters.length; i++) {
      const imgPrompt = `High-quality educational textbook illustration, traditional watercolor style, soft natural colors, detailed nature scene with educational elements, in the style of classic children's textbooks. Scene: ${chapters[i].slice(0, 100)}. Clean, professional, no text overlay.`;
      try {
        const imgRes = await callInternal('/generate-image', { prompt: imgPrompt });
        if (imgRes.data && (imgRes.data.imageUrl || imgRes.data.imageBase64)) {
          images.push(imgRes.data.imageUrl || imgRes.data.imageBase64);
        } else {
          images.push(null);
        }
      } catch (e) {
        console.error('Image generation failed:', e.message);
        images.push(null);
      }
    }

    // 3. Create professional PDF
    const pdfDoc = await PDFDocument.create();
    const fonts = {
      title: await pdfDoc.embedFont(STYLES.fonts.title),
      heading: await pdfDoc.embedFont(STYLES.fonts.heading),
      body: await pdfDoc.embedFont(STYLES.fonts.body),
      caption: await pdfDoc.embedFont(STYLES.fonts.caption)
    };

    let pageNumber = 0;

    // Title page (no page number)
    const titlePage = pdfDoc.addPage([612, 792]); // US Letter
    const title = prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt;
    
    // Add decorative elements
    titlePage.drawRectangle({
      x: 0,
      y: 0,
      width: 612,
      height: 792,
      color: STYLES.colors.highlight
    });
    
    titlePage.drawText(title, {
      x: STYLES.margins.left,
      y: 700,
      size: 32,
      font: fonts.title,
      color: STYLES.colors.primary,
      maxWidth: 400
    });

    titlePage.drawText('An Educational Journey', {
      x: STYLES.margins.left,
      y: 660,
      size: 18,
      font: fonts.caption,
      color: STYLES.colors.secondary
    });

    // Table of Contents
    pageNumber++;
    const tocPage = pdfDoc.addPage([612, 792]);
    tocPage.drawText('Contents', {
      x: STYLES.margins.left,
      y: 720,
      size: 24,
      font: fonts.heading,
      color: STYLES.colors.primary
    });

    let tocY = 680;
    chapters.forEach((_, idx) => {
      tocPage.drawText(`Chapter ${idx + 1}: ${chapterTitles[idx]}`, {
        x: STYLES.margins.left,
        y: tocY,
        size: 12,
        font: fonts.body,
        color: STYLES.colors.primary
      });
      tocY -= 20;
    });

    // Add page number
    tocPage.drawText(`${pageNumber}`, {
      x: 306,
      y: STYLES.margins.bottom - 20,
      size: 10,
      font: fonts.caption,
      color: STYLES.colors.secondary
    });

    // Chapters
    for (let idx = 0; idx < chapters.length; idx++) {
      const ch = chapters[idx];
      pageNumber++;
      const page = pdfDoc.addPage([612, 792]);
      
      // Chapter heading with decorative line
      page.drawLine({
        start: { x: STYLES.margins.left, y: 740 },
        end: { x: 612 - STYLES.margins.right, y: 740 },
        thickness: 1,
        color: STYLES.colors.accent,
      });

      // Running header
      page.drawText(chapterTitles[idx], {
        x: STYLES.margins.left,
        y: 792 - STYLES.margins.top + 30,
        size: 10,
        font: fonts.caption,
        color: STYLES.colors.secondary
      });

      page.drawText(`Chapter ${idx + 1}`, {
        x: STYLES.margins.left,
        y: 720,
        size: 24,
        font: fonts.heading,
        color: STYLES.colors.accent
      });

      // Image placement with better error handling
      if (images[idx]) {
        try {
          const imgBytes = Buffer.from(images[idx], 'base64');
          const img = await pdfDoc.embedPng(imgBytes);
          const imgDims = img.scale(0.5);
          page.drawImage(img, {
            x: STYLES.margins.left,
            y: 500,
            width: 300,
            height: 200,
          });
          
          // Image caption
          page.drawText(`Figure ${idx + 1}`, {
            x: STYLES.margins.left,
            y: 480,
            size: 10,
            font: fonts.caption,
            color: STYLES.colors.secondary
          });
        } catch (e) {
          console.error('Failed to embed image:', e.message);
        }
      }

      // Chapter content with proper text wrapping and formatting
      const contentY = images[idx] ? 450 : 680;
      const contentLines = ch.split('\n');
      let currentY = contentY;
      let inVocabBox = false;
      let inActivityBox = false;
      let inDidYouKnow = false;
      let inLetsThink = false;
      
      for (const line of contentLines) {
        if (currentY < STYLES.margins.bottom + 30) { // Leave room for page number
          pageNumber++;
          const newPage = pdfDoc.addPage([612, 792]);
          currentY = 720;
          page = newPage;

          // Running header on new page
          page.drawText(chapterTitles[idx], {
            x: STYLES.margins.left,
            y: 792 - STYLES.margins.top + 30,
            size: 10,
            font: fonts.caption,
            color: STYLES.colors.secondary
          });
        }

        // Special formatting for educational elements
        if (line.includes('Word to Know:')) {
          inVocabBox = true;
          page.drawRectangle({
            x: 612 - STYLES.margins.right - 150,
            y: currentY - 4,
            width: 130,
            height: 100,
            borderColor: STYLES.colors.accent,
            borderWidth: 1,
            color: STYLES.colors.highlight,
            opacity: 0.9
          });
        } else if (line.includes('Try This!')) {
          inActivityBox = true;
          page.drawRectangle({
            x: STYLES.margins.left - 4,
            y: currentY - 4,
            width: 400,
            height: 80,
            borderColor: STYLES.colors.accent,
            borderWidth: 1,
            color: STYLES.colors.tryThis,
            opacity: 0.9
          });
        } else if (line.includes('Did You Know?')) {
          inDidYouKnow = true;
          page.drawRectangle({
            x: 612 - STYLES.margins.right - 150,
            y: currentY - 4,
            width: 130,
            height: 80,
            borderColor: STYLES.colors.accent,
            borderWidth: 1,
            color: STYLES.colors.didYouKnow,
            opacity: 0.9
          });
        } else if (line.includes('Let\'s Think!')) {
          inLetsThink = true;
          page.drawRectangle({
            x: STYLES.margins.left - 4,
            y: currentY - 4,
            width: 400,
            height: 80,
            borderColor: STYLES.colors.accent,
            borderWidth: 1,
            color: STYLES.colors.letsThink,
            opacity: 0.9
          });
        }
        
        // Draw text with appropriate positioning
        const textX = inVocabBox || inDidYouKnow ? 
          612 - STYLES.margins.right - 140 : 
          STYLES.margins.left;
        
        const textWidth = inVocabBox || inDidYouKnow ? 120 : 380;
        
        page.drawText(line.slice(0, Math.floor(textWidth / 7)), { // Approximate characters per line
          x: textX,
          y: currentY,
          size: 12,
          font: inVocabBox || inActivityBox || inDidYouKnow || inLetsThink ? fonts.caption : fonts.body,
          color: STYLES.colors.primary,
          lineHeight: 16
        });
        
        currentY -= 20;
        
        // Reset box states
        if (inVocabBox && currentY <= contentY - 100) inVocabBox = false;
        if (inActivityBox && currentY <= contentY - 80) inActivityBox = false;
        if (inDidYouKnow && currentY <= contentY - 80) inDidYouKnow = false;
        if (inLetsThink && currentY <= contentY - 80) inLetsThink = false;

        // Add page number
        page.drawText(`${pageNumber}`, {
          x: 306,
          y: STYLES.margins.bottom - 20,
          size: 10,
          font: fonts.caption,
          color: STYLES.colors.secondary
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="LazyWrite-Educational-Book.pdf"');
    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Book generation error:', error);
    
    // Enhanced error handling
    if (error.message === 'rate_limit_exceeded') {
      console.log('Rate limit error detected, returning 429 to client');
      return res.status(429).json({
        error: "We're experiencing high demand. All API keys are currently rate-limited. Please try again in a few minutes.",
        retryAfter: 60
      });
    } else if (error.message === 'content_filter') {
      console.log('Content filter error detected, returning 400 to client');
      return res.status(400).json({
        error: "Please ensure your book topic is appropriate for children. Content filter triggered."
      });
    }
    
    console.log('Returning generic 500 error to client');
    return res.status(500).json({ 
      error: error.message || 'Failed to generate book. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 