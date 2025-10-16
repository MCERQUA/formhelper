import React, { useState, useEffect } from 'react';
import { ClipboardData } from '../shared/types';
import { APIClient } from '../shared/api-client';
import { ErrorHandler } from '../shared/error-handler';

const Popup: React.FC = () => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadClipboard();
  }, []);

  const loadClipboard = async () => {
    const result = await chrome.storage.local.get('currentClipboard');
    setClipboardData(result.currentClipboard || null);
  };

  const handleSuperCopy = async () => {
    setIsLoading(true);
    setMessage('Extracting data...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab');
      }

      const data = await APIClient.sendToContentScript(tab.id, { action: 'extractData' });

      setClipboardData(data);
      setMessage('Clipboard filled!');

    } catch (error) {
      const appError = ErrorHandler.handle(error, 'SuperCopy');
      setMessage(appError.userMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSuperPaste = async () => {
    if (!clipboardData) {
      setMessage('No clipboard data available');
      return;
    }

    setIsLoading(true);
    setMessage('Filling form...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab');
      }

      const result = await APIClient.sendToContentScript(tab.id, {
        action: 'fillForm',
        data: clipboardData
      });

      setMessage(`Filled ${result.filledFields}/${result.totalFields} fields`);

    } catch (error) {
      const appError = ErrorHandler.handle(error, 'SuperPaste');
      setMessage(appError.userMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleOpenSidePanel = async () => {
    await chrome.runtime.sendMessage({ action: 'openSidePanel' });
  };

  const handleClearClipboard = async () => {
    await chrome.runtime.sendMessage({ action: 'clearClipboard' });
    setClipboardData(null);
    setMessage('Clipboard cleared');
    setTimeout(() => setMessage(''), 2000);
  };

  const getTotalFields = () => {
    if (!clipboardData) return 0;
    return clipboardData.entities.reduce((sum, entity) => sum + entity.fields.length, 0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>FormHelper</h1>
        <p style={styles.tagline}>Smart Form Assistant</p>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.status}>
        {clipboardData ? (
          <>
            <span style={styles.statusIcon}>✓</span>
            <span style={styles.statusText}>
              Clipboard has {getTotalFields()} fields
            </span>
            <button style={styles.clearBtn} onClick={handleClearClipboard}>
              Clear
            </button>
          </>
        ) : (
          <>
            <span style={styles.statusIconEmpty}>○</span>
            <span style={styles.statusText}>Clipboard is empty</span>
          </>
        )}
      </div>

      <div style={styles.buttons}>
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={handleSuperCopy}
          disabled={isLoading}
        >
          Copy Form Data
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleSuperPaste}
          disabled={isLoading || !clipboardData}
        >
          Paste to Form
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleOpenSidePanel}
          disabled={!clipboardData}
        >
          View Clipboard
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={async () => {
            try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab?.id) {
                await APIClient.sendToContentScript(tab.id, { action: 'showOverlay' });
                setMessage('Field selector shown');
              }
            } catch (error) {
              const appError = ErrorHandler.handle(error, 'ShowOverlay');
              setMessage(appError.userMessage);
            } finally {
              setTimeout(() => setMessage(''), 3000);
            }
          }}
        >
          Select Fields
        </button>
      </div>

      {clipboardData && (
        <div style={styles.info}>
          <p style={styles.infoText}>
            Source: {new URL(clipboardData.sourceUrl).hostname}
          </p>
          <p style={styles.infoText}>
            Extracted: {new Date(clipboardData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '320px',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#ffffff'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb'
  },
  logo: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '600' as const,
    color: '#1e3a8a'
  },
  tagline: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#6b7280'
  },
  message: {
    padding: '12px',
    marginBottom: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1e40af',
    textAlign: 'center' as const
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  statusIcon: {
    fontSize: '16px',
    color: '#059669',
    marginRight: '8px'
  },
  statusIconEmpty: {
    fontSize: '16px',
    color: '#9ca3af',
    marginRight: '8px'
  },
  statusText: {
    flex: 1,
    fontSize: '14px',
    color: '#374151'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 8px',
    color: '#64748b'
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  button: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%'
  },
  primaryButton: {
    backgroundColor: '#1e3a8a',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1'
  },
  info: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  },
  infoText: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#6b7280'
  }
};

export default Popup;
