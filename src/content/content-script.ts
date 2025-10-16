// Content Script - injected into web pages

import { formExtractor } from './dom-extractor';
import { formFiller } from './dom-filler';
import { fieldOverlay } from './field-overlay';
import { Message, MessageResponse, ClipboardData } from '../shared/types';
import { logger } from '../shared/logger';

logger.info('FormHelper Content Script loaded');

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  // Handle ping immediately
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }

  handleMessage(message)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true; // Keep the message channel open for async response
});

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.action) {
    case 'extractData':
      return await handleExtractData();

    case 'fillForm':
      return await handleFillForm(message.data);

    case 'showOverlay':
      return await handleShowOverlay();

    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function handleShowOverlay(): Promise<MessageResponse> {
  try {
    logger.info('Showing field overlay...');

    const extractedData = await formExtractor.extractPageData();

    if (extractedData.entities.length === 0) {
      return {
        success: false,
        error: 'No form fields found on this page'
      };
    }

    // Flatten all fields from entities
    const allFields = extractedData.entities.flatMap(entity =>
      entity.fields.map(field => ({
        id: field.id,
        element: document.evaluate(field.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement,
        label: field.label,
        value: field.value,
        selector: field.xpath
      }))
    ).filter(f => f.element);

    fieldOverlay.show(allFields);

    return { success: true, data: { fieldsCount: allFields.length } };
  } catch (error) {
    logger.error('Error showing overlay:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

async function handleExtractData(): Promise<MessageResponse> {
  try {
    console.log('Extracting form data...');

    const extractedData = await formExtractor.extractPageData();

    if (extractedData.entities.length === 0) {
      return {
        success: false,
        error: 'No form data found on this page'
      };
    }

    // Create clipboard data
    const clipboardData: ClipboardData = {
      id: `clipboard_${Date.now()}`,
      timestamp: extractedData.timestamp,
      sourceUrl: window.location.href,
      entities: extractedData.entities,
      metadata: {
        extractionMethod: 'form',
        version: '1.0.0',
        fieldsExtracted: extractedData.entities.reduce((sum, entity) => sum + entity.fields.length, 0)
      }
    };

    console.log('Extracted data:', clipboardData);

    // Send to background script to save
    await chrome.runtime.sendMessage({
      action: 'updateClipboard',
      data: clipboardData
    });

    // Show notification
    showNotification('Clipboard filled!', 'success');

    return {
      success: true,
      data: clipboardData
    };

  } catch (error) {
    console.error('Extraction error:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

async function handleFillForm(clipboardData: ClipboardData): Promise<MessageResponse> {
  try {
    console.log('Filling form with clipboard data...');

    showNotification('Super Pasting...', 'loading');

    const result = await formFiller.fillForm(clipboardData);

    if (result.success) {
      showNotification(`Form filled! (${result.filledFields}/${result.totalFields} fields)`, 'success');
    } else {
      showNotification(`Partially filled (${result.filledFields}/${result.totalFields} fields)`, 'warning');
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Fill error:', error);
    showNotification('Failed to fill form', 'error');
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'loading') {
  // Remove existing notification
  const existing = document.getElementById('formhelper-notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'formhelper-notification';
  notification.textContent = message;

  // Styling
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#10b981' :
                      type === 'error' ? '#ef4444' :
                      type === 'warning' ? '#f59e0b' : '#6366f1',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    zIndex: '999999',
    animation: 'slideIn 0.3s ease-out',
    transition: 'opacity 0.3s ease'
  });

  // Add animation keyframes
  if (!document.getElementById('formhelper-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'formhelper-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds (unless loading)
  if (type !== 'loading') {
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize
logger.info('FormHelper ready on:', window.location.href);
