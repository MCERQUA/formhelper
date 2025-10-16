import React, { useState, useEffect } from 'react';
import { ClipboardData, Entity, Field } from '../shared/types';

const SidePanel: React.FC = () => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    loadClipboard();

    // Listen for clipboard updates
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.currentClipboard) {
        setClipboardData(changes.currentClipboard.newValue);
      }
    });
  }, []);

  const loadClipboard = async () => {
    const result = await chrome.storage.local.get('currentClipboard');
    setClipboardData(result.currentClipboard || null);
  };

  const toggleEntity = (entityId: string) => {
    const newExpanded = new Set(expandedEntities);
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId);
    } else {
      newExpanded.add(entityId);
    }
    setExpandedEntities(newExpanded);
  };

  const handleFieldEdit = (entityId: string, fieldId: string, newValue: any) => {
    if (!clipboardData) return;

    const updatedData = { ...clipboardData };
    updatedData.entities = updatedData.entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          fields: entity.fields.map(field =>
            field.id === fieldId ? { ...field, value: newValue } : field
          )
        };
      }
      return entity;
    });

    setClipboardData(updatedData);
    chrome.storage.local.set({ currentClipboard: updatedData });
    setEditingField(null);
  };

  const handleFieldToggle = (entityId: string, fieldId: string) => {
    if (!clipboardData) return;

    const updatedData = { ...clipboardData };
    updatedData.entities = updatedData.entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          fields: entity.fields.map(field =>
            field.id === fieldId
              ? { ...field, toggleState: !field.toggleState }
              : field
          )
        };
      }
      return entity;
    });

    setClipboardData(updatedData);
    chrome.storage.local.set({ currentClipboard: updatedData });
  };

  const handleClearClipboard = async () => {
    await chrome.runtime.sendMessage({ action: 'clearClipboard' });
    setClipboardData(null);
  };

  const handleSuperPaste = async () => {
    if (!clipboardData) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        data: clipboardData
      });
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'customer': return '👤';
      case 'household': return '👥';
      case 'vehicle': return '🚗';
      case 'property': return '🏠';
      default: return '📄';
    }
  };

  const filteredEntities = clipboardData?.entities.filter(entity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return entity.name.toLowerCase().includes(query) ||
           entity.fields.some(f =>
             f.label.toLowerCase().includes(query) ||
             String(f.value).toLowerCase().includes(query)
           );
  }) || [];

  if (!clipboardData) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.logo}>FormHelper</h1>
        </div>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>📋</p>
          <p style={styles.emptyText}>Your clipboard is empty</p>
          <p style={styles.emptySubtext}>Use Form Copy to extract form data</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>FormHelper</h1>
        <div style={styles.statusBadge}>
          ✓ Your clipboard has data
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={handleSuperPaste}>
          Paste to Form
        </button>
        <button style={{ ...styles.actionBtn, ...styles.secondaryBtn }} onClick={handleClearClipboard}>
          Clear Clipboard
        </button>
      </div>

      <div style={styles.entitiesContainer}>
        {filteredEntities.map(entity => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isExpanded={expandedEntities.has(entity.id)}
            onToggle={() => toggleEntity(entity.id)}
            onFieldEdit={handleFieldEdit}
            onFieldToggle={handleFieldToggle}
            editingField={editingField}
            setEditingField={setEditingField}
            getEntityIcon={getEntityIcon}
          />
        ))}
      </div>
    </div>
  );
};

interface EntityCardProps {
  entity: Entity;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldEdit: (entityId: string, fieldId: string, value: any) => void;
  onFieldToggle: (entityId: string, fieldId: string) => void;
  editingField: string | null;
  setEditingField: (id: string | null) => void;
  getEntityIcon: (type: string) => string;
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  isExpanded,
  onToggle,
  onFieldEdit,
  onFieldToggle,
  editingField,
  setEditingField,
  getEntityIcon
}) => {
  return (
    <div style={styles.entityCard}>
      <div style={styles.entityHeader} onClick={onToggle}>
        <span style={styles.entityIcon}>{getEntityIcon(entity.type)}</span>
        <span style={styles.entityName}>{entity.name}</span>
        <span style={styles.entityCount}>{entity.fields.length} fields</span>
        <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div style={styles.fieldsContainer}>
          {entity.fields.map(field => (
            <FieldRow
              key={field.id}
              field={field}
              entityId={entity.id}
              isEditing={editingField === field.id}
              onEdit={(value) => onFieldEdit(entity.id, field.id, value)}
              onToggle={() => onFieldToggle(entity.id, field.id)}
              onStartEdit={() => setEditingField(field.id)}
              onCancelEdit={() => setEditingField(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FieldRowProps {
  field: Field;
  entityId: string;
  isEditing: boolean;
  onEdit: (value: any) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  isEditing,
  onEdit,
  onToggle,
  onStartEdit,
  onCancelEdit
}) => {
  const [editValue, setEditValue] = useState(field.value);

  const handleSave = () => {
    onEdit(editValue);
  };

  return (
    <div style={styles.fieldRow}>
      <div style={styles.fieldLabel}>{field.label}</div>
      <div style={styles.fieldValueContainer}>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={styles.fieldInput}
              autoFocus
            />
            <button style={styles.saveBtn} onClick={handleSave}>✓</button>
            <button style={styles.cancelBtn} onClick={onCancelEdit}>✗</button>
          </>
        ) : (
          <>
            <span style={styles.fieldValue} onClick={onStartEdit}>
              {String(field.value)}
            </span>
            <button
              style={{
                ...styles.toggleBtn,
                ...(field.toggleState === false ? styles.toggleBtnOff : {})
              }}
              onClick={onToggle}
            >
              {field.toggleState !== false ? '●' : '○'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f9fafb',
    overflowY: 'auto' as const
  },
  header: {
    marginBottom: '16px'
  },
  logo: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600' as const,
    color: '#1e3a8a'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: '12px',
    borderRadius: '6px',
    fontWeight: '500' as const
  },
  searchContainer: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  actionBtn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer'
  },
  secondaryBtn: {
    backgroundColor: '#ef4444'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#9ca3af'
  },
  emptyText: {
    fontSize: '48px',
    margin: '0 0 16px 0'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6b7280'
  },
  entitiesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  entityCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  entityHeader: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#f3f4f6',
    transition: 'background-color 0.2s'
  },
  entityIcon: {
    fontSize: '20px',
    marginRight: '10px'
  },
  entityName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#1f2937'
  },
  entityCount: {
    fontSize: '12px',
    color: '#6b7280',
    marginRight: '10px'
  },
  expandIcon: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  fieldsContainer: {
    padding: '8px'
  },
  fieldRow: {
    padding: '8px',
    borderBottom: '1px solid #f3f4f6'
  },
  fieldLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  fieldValueContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  fieldValue: {
    flex: 1,
    fontSize: '14px',
    color: '#1f2937',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px'
  },
  fieldInput: {
    flex: 1,
    padding: '4px 8px',
    border: '1px solid #1e3a8a',
    borderRadius: '4px',
    fontSize: '14px'
  },
  saveBtn: {
    padding: '4px 8px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelBtn: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  toggleBtn: {
    padding: '4px 8px',
    backgroundColor: '#1e3a8a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  toggleBtnOff: {
    backgroundColor: '#d1d5db',
    color: '#6b7280'
  }
};

export default SidePanel;
