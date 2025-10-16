import { logger } from './logger';
import { ErrorHandler } from './error-handler';

export class APIClient {
  private static async ensureContentScriptReady(tabId: number): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      logger.info('Content script not ready, injecting...');

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static async sendToContentScript<T = any>(
    tabId: number,
    message: any
  ): Promise<T> {
    return ErrorHandler.retry(async () => {
      await this.ensureContentScriptReady(tabId);

      const response = await chrome.tabs.sendMessage(tabId, message);

      if (!response || !response.success) {
        throw new Error(response?.error || 'Request failed');
      }

      return response.data;
    }, 3, 500);
  }

  static async sendToBackground<T = any>(message: any): Promise<T> {
    return ErrorHandler.retry(async () => {
      const response = await chrome.runtime.sendMessage(message);

      if (!response || !response.success) {
        throw new Error(response?.error || 'Request failed');
      }

      return response.data;
    }, 3, 500);
  }
}
