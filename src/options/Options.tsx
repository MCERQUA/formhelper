import { useState, useEffect } from 'react';

interface APIConfig {
  provider: 'openai' | 'anthropic';
  openaiKey: string;
  anthropicKey: string;
  openaiModel: string;
  anthropicModel: string;
}

export default function Options() {
  const [config, setConfig] = useState<APIConfig>({
    provider: 'openai',
    openaiKey: '',
    anthropicKey: '',
    openaiModel: 'gpt-5-nano',
    anthropicModel: 'claude-3-5-sonnet-20241022'
  });

  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    chrome.storage.sync.get('apiConfig', (result) => {
      if (result.apiConfig) {
        setConfig(result.apiConfig);
      }
    });
  }, []);

  const handleSave = async () => {
    await chrome.storage.sync.set({ apiConfig: config });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('');

    try {
      if (config.provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.openaiKey}`
          }
        });

        if (response.ok) {
          setTestResult('✓ Connection successful!');
        } else {
          setTestResult('✗ Invalid API key');
        }
      } else {
        // Test Anthropic
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        });

        if (response.ok || response.status === 400) {
          setTestResult('✓ Connection successful!');
        } else {
          setTestResult('✗ Invalid API key');
        }
      }
    } catch (error) {
      setTestResult('✗ Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>FormHelper Configuration</h1>
        <p style={styles.subtitle}>Configure your AI provider to enable intelligent form filling</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>AI Provider</h2>

        <div style={styles.field}>
          <label style={styles.label}>Provider</label>
          <select
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
            style={styles.select}
          >
            <option value="openai">OpenAI (GPT-4o Mini recommended)</option>
            <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
          </select>
        </div>

        {config.provider === 'openai' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>OpenAI API Key</label>
              <input
                type="password"
                value={config.openaiKey}
                onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                placeholder="sk-..."
                style={styles.input}
              />
              <p style={styles.hint}>
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model</label>
              <select
                value={config.openaiModel}
                onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                style={styles.select}
              >
                <option value="gpt-5-nano">gpt-5-nano (Cheapest - $0.05/$0.40 per 1M tokens)</option>
                <option value="gpt-5-mini">gpt-5-mini (Fast - $0.25/$2.00 per 1M tokens)</option>
                <option value="gpt-5">gpt-5 (Best quality - $1.25/$10.00 per 1M tokens)</option>
                <option value="gpt-4o-mini">gpt-4o-mini ($0.15/$0.60 per 1M tokens)</option>
                <option value="gpt-4o">gpt-4o ($2.50/$10 per 1M tokens)</option>
              </select>
            </div>
          </>
        )}

        {config.provider === 'anthropic' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Anthropic API Key</label>
              <input
                type="password"
                value={config.anthropicKey}
                onChange={(e) => setConfig({ ...config, anthropicKey: e.target.value })}
                placeholder="sk-ant-..."
                style={styles.input}
              />
              <p style={styles.hint}>
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Anthropic Console
                </a>
              </p>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model</label>
              <select
                value={config.anthropicModel}
                onChange={(e) => setConfig({ ...config, anthropicModel: e.target.value })}
                style={styles.select}
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest - $3/$15 per 1M tokens)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fastest - $0.80/$4 per 1M tokens)</option>
              </select>
            </div>
          </>
        )}

        {testResult && (
          <div style={{
            ...styles.alert,
            ...(testResult.includes('✓') ? styles.alertSuccess : styles.alertError)
          }}>
            {testResult}
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={handleTest} disabled={testing} style={styles.buttonSecondary}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button onClick={handleSave} style={styles.buttonPrimary}>
            Save Configuration
          </button>
        </div>

        {saved && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            ✓ Configuration saved successfully!
          </div>
        )}
      </div>

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>Cost Estimate</h3>
        <ul style={styles.infoList}>
          <li>Form extraction: ~$0.01-0.02 per page</li>
          <li>Form filling: ~$0.02-0.03 per page</li>
          <li>Average user: ~$3-5 per month</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#0f172a'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1e3a8a'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0'
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#0f172a'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#0f172a'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  },
  hint: {
    fontSize: '12px',
    color: '#64748b',
    margin: '6px 0 0 0'
  },
  link: {
    color: '#1e3a8a',
    textDecoration: 'none'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#1e3a8a',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '16px'
  },
  alertSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #059669'
  },
  alertError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #dc2626'
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '20px'
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1e40af'
  },
  infoList: {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0',
    paddingLeft: '20px'
  }
};
