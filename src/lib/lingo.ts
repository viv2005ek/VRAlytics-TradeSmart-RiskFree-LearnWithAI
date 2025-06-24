import axios from 'axios';

class LingoService {
  private apiBaseUrl: string;
  private initialized: boolean = false;

  constructor() {
    // Use the provided server URL for translation
    this.apiBaseUrl = 'https://lingoapi.onrender.com';
    console.log('Lingo service configured to use API at:', this.apiBaseUrl);
    this.checkHealth();
  }

  private async checkHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/health`, {
        timeout: 50000
      });
      
      if (response.data?.status === 'healthy') {
        console.log('✅ Lingo API server is healthy');
        this.initialized = true;
      } else {
        console.warn('⚠️ Lingo API server returned unhealthy status');
        this.initialized = false;
      }
    } catch (error) {
      console.error('❌ Failed to connect to Lingo API server:', error);
      this.initialized = false;
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translateText(text: string, sourceLocale: string, targetLocale: string): Promise<string> {
    // Early return for same language or empty text
    if (sourceLocale === targetLocale || !text?.trim()) {
      return text;
    }

    // Check if service is initialized
    if (!this.initialized) {
      console.warn('Lingo service not initialized, returning original text');
      return text;
    }

    try {
      console.log(`Translating text from ${sourceLocale} to ${targetLocale}`);
      
      const response = await axios.post(`${this.apiBaseUrl}/translate`, {
        text,
        sourceLocale,
        targetLocale,
        fast: true
      }, {
        timeout: 1000000
      });

      if (response.data?.translation) {
        console.log('Translation successful');
        return response.data.translation;
      } else {
        console.warn('Translation response missing translation field');
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export a singleton instance
export const lingoService = new LingoService();