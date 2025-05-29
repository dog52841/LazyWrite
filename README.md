# AI Book Generator Web App — Project Overview & Technical Details

## Project Name: LazyWrite

### Goal:
Create a **completely free, anonymous, AI-powered website** that generates **high-quality, fully designed books** from a user prompt.  
The books will include **vibrant, human-like writing**, **formatted layouts**, and **images**, aiming to rival paid services.  
Monetization will be through **ads only** — no paywalls or subscriptions.

---

## Core Features

### 1. User Input
- The user types a prompt describing the type of book they want.
- Prompts can specify any genre, style, or theme.
- Example: “Create a 50-page fantasy adventure book with vibrant descriptions and character dialogues.”

### 2. AI-Powered Book Generation
- The system sends the user prompt to the GPT API (using GPT-4.1 or GPT-4).
- GPT generates **structured book content**:
  - Title page
  - Table of contents
  - Chapters/sections with engaging, human-like narrative
  - Vibrant, colorful, and emotional writing style
- The AI also generates prompts for **image generation APIs** to create relevant, high-quality images for the book.

### 3. Image Generation
- Integration with a free or trial-friendly image generation API (e.g., Hugging Face Spaces or similar).
- Images are generated based on chapter content or user prompt context.
- Images are embedded in the book layout.

### 4. Book Formatting and Design
- The system automatically formats the content and images into a **professional, visually appealing layout**.
- Layout includes:
  - Consistent fonts and styles
  - Margins, spacing, and page breaks
  - Cover page, chapter headings, page numbers
- Output as a **PDF** or similar downloadable format.

### 5. API Key Rotation (Important for Free Usage)
- To avoid hitting rate limits or quotas on the free API keys, the app supports **rotating multiple API keys**.
- Rotation logic:
  - The app maintains a pool of API keys.
  - For each request, the app selects the next available key in the pool.
  - If a key is rate-limited or blocked, it automatically switches to the next key.
- This approach maximizes free-tier usage without requiring the user to pay immediately.

### 6. No Logins or User Accounts
- Users remain anonymous.
- No sign-up or login required.
- Data persistence is handled via **cookies/local storage** (optional) for saving preferences or session state.

### 7. Monetization
- The site is **100% free to use** for users.
- Revenue is generated through:
  - Banner ads
  - Interstitial ads
  - Rewarded video ads (optional)
- No paywalls or premium subscriptions.

---

## Technical Overview

### Backend (Node.js recommended)
- API routes handle:
  - Receiving user prompts
  - Forwarding prompts to GPT and image generation APIs
  - Handling API key rotation logic
  - Formatting and compiling the book
- Manages API key pool and rate limit handling.

### Frontend (React, Vue, or simple HTML/CSS/JS)
- User input form with prompt textbox
- Loading/progress indicators
- Book preview and download button
- Ad placements

### API Integration
- GPT API (OpenAI GPT-4.1 or GPT-4)
- Image generation API (Hugging Face or other free options)
- API key rotation implemented server-side

---

## Free Plan Considerations

- Use **only free-tier API keys** from OpenAI and image providers.
- Rotate keys to avoid hitting individual limits.
- Cache or throttle requests if needed.
- Limit book size or generation frequency per user to reduce costs.
- Use lightweight frontend to reduce server load.

---

## How API Key Rotation Works (Simplified)

```js
const apiKeys = [
  'key1',
  'key2',
  'key3',
  // ...
];

let currentKeyIndex = 0;

function getNextApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return apiKeys[currentKeyIndex];
}

async function callApiWithRotation(requestParams) {
  let attempts = 0;
  while (attempts < apiKeys.length) {
    const key = getNextApiKey();
    try {
      const response = await callApi(requestParams, key);
      return response;
    } catch (error) {
      if (isRateLimitError(error)) {
        attempts++;
        continue; // try next key
      } else {
        throw error;
      }
    }
  }
  throw new Error('All API keys exhausted or rate limited');
}
