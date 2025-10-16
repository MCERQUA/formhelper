// Background Service Worker - handles extension lifecycle and storage

import { Message, MessageResponse, ClipboardData } from '../shared/types';
import { aiEngine } from './ai-engine';
import { logger } from '../shared/logger';

console.log('FormHelper Background Service Worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('FormHelper Extension installed');

  // Initialize storage
  chrome.storage.local.set({
    currentClipboard: null,
    userPreferences: {
      autoFillEnabled: true,
      confirmBeforePaste: true,
      saveHistory: true,
      defaultFormats: {
        dateFormat: 'MM/DD/YYYY',
        phoneFormat: '(XXX) XXX-XXXX',
        addressFormat: 'US'
      }
    }
  });
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true; // Keep message channel open
});

async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  switch (message.action) {
    case 'updateClipboard':
      return await handleUpdateClipboard(message.data);

    case 'clearClipboard':
      return await handleClearClipboard();

    case 'openSidePanel':
      return await handleOpenSidePanel(sender.tab?.id);

    case 'aiMapFields':
      return await handleAIMapFields(message.data);

    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function handleAIMapFields(data: any): Promise<MessageResponse> {
  try {
    logger.info('AI mapping requested');
    const { sourceFields, targetFields } = data;

    const mappings = await aiEngine.mapFields(sourceFields, targetFields);

    logger.info(`AI mapped ${mappings.length} fields`);
    return { success: true, data: mappings };
  } catch (error) {
    logger.error('AI mapping error:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleUpdateClipboard(clipboardData: ClipboardData): Promise<MessageResponse> {
  try {
    // Save to chrome.storage.local
    await chrome.storage.local.set({ currentClipboard: clipboardData });

    console.log('Clipboard updated:', clipboardData);

    // Update badge to indicate clipboard has data
    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Green

    return { success: true, data: clipboardData };
  } catch (error) {
    console.error('Failed to update clipboard:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function handleClearClipboard(): Promise<MessageResponse> {
  try {
    await chrome.storage.local.set({ currentClipboard: null });

    // Clear badge
    chrome.action.setBadgeText({ text: '' });

    console.log('Clipboard cleared');

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function handleOpenSidePanel(tabId?: number): Promise<MessageResponse> {
  try {
    if (tabId) {
      await chrome.sidePanel.open({ tabId });
    } else {
      await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Open side panel
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle keyboard shortcuts (if configured in manifest)
chrome.commands?.onCommand.addListener(async (command) => {
  console.log('Command received:', command);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'super-copy':
      // Trigger extraction in active tab
      chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      break;

    case 'super-paste':
      // Get clipboard data and fill form
      const { currentClipboard } = await chrome.storage.local.get('currentClipboard');
      if (currentClipboard) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          data: currentClipboard
        });
      } else {
        console.log('No clipboard data available');
      }
      break;

    case 'open-clipboard':
      // Open side panel
      await chrome.sidePanel.open({ tabId: tab.id });
      break;
  }
});

console.log('FormHelper Background ready');
