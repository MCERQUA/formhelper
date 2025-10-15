import React, { useState, useEffect } from 'react';
import { ClipboardData } from '../shared/types';

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
        setMessage('Error: No active tab');
        setIsLoading(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

      if (response.success) {
        setClipboardData(response.data);
        setMessage('Clipboard filled!');
      } else {
        setMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
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
        setMessage('Error: No active tab');
        setIsLoading(false);
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        data: clipboardData
      });

      if (response.success) {
        const result = response.data;
        setMessage(`Filled ${result.filledFields}/${result.totalFields} fields`);
      } else {
        setMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
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
              🗑️
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
          📋 Form Copy
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleSuperPaste}
          disabled={isLoading || !clipboardData}
        >
          📥 Form Paste
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleOpenSidePanel}
          disabled={!clipboardData}
        >
          👁 See Clipboard
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
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#7c3aed',
    letterSpacing: '2px'
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
    color: '#10b981',
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
    fontSize: '16px',
    padding: '4px'
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
    backgroundColor: '#7c3aed',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
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
