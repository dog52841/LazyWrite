// openRouterKeyRotator.js

class ApiKeyRotator {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
    this.currentIndex = 0;
    this.blockedKeys = new Set();
  }

  getNextKey() {
    let attempts = 0;
    while (attempts < this.apiKeys.length) {
      this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
      const key = this.apiKeys[this.currentIndex];
      if (!this.blockedKeys.has(key)) {
        return key;
      }
      attempts++;
    }
    throw new Error('All API keys are rate limited or blocked.');
  }

  blockKey(key) {
    this.blockedKeys.add(key);
  }

  unblockKey(key) {
    this.blockedKeys.delete(key);
  }

  resetBlocked() {
    this.blockedKeys.clear();
  }
}

const openRouterKeys = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
].filter(Boolean);

const openRouterKeyRotator = new ApiKeyRotator(openRouterKeys);

module.exports = openRouterKeyRotator; 