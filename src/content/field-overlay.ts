import { logger } from '../shared/logger';

export interface FormField {
  id: string;
  element: HTMLElement;
  label: string;
  value: any;
  selector: string;
}

class FieldOverlay {
  private container: HTMLDivElement | null = null;
  private selectedFields: Set<string> = new Set();
  private fields: FormField[] = [];

  show(fields: FormField[]) {
    this.fields = fields;
    this.selectedFields = new Set(fields.map(f => f.id));
    this.createOverlay();

    fields.forEach(field => {
      const checkbox = this.createCheckbox(field);
      this.container?.appendChild(checkbox);
    });

    logger.info(`Overlay shown with ${fields.length} fields`);
  }

  private createOverlay() {
    // Remove existing
    this.hide();

    this.container = document.createElement('div');
    this.container.id = 'formhelper-overlay';

    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '999998',
      pointerEvents: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.02)'
    });

    document.body.appendChild(this.container);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '× Close Field Selector';
    Object.assign(closeBtn.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      backgroundColor: '#1e3a8a',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '999999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });
    closeBtn.onclick = () => this.hide();
    this.container.appendChild(closeBtn);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.textContent = 'Select fields to include in extraction';
    Object.assign(instructions.style, {
      position: 'fixed',
      top: '70px',
      right: '20px',
      padding: '12px 18px',
      backgroundColor: 'white',
      color: '#0f172a',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      pointerEvents: 'auto',
      fontSize: '13px',
      zIndex: '999999',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });
    this.container.appendChild(instructions);
  }

  private createCheckbox(field: FormField): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'formhelper-field-checkbox';

    const rect = field.element.getBoundingClientRect();

    Object.assign(wrapper.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY - 30}px`,
      left: `${rect.left + window.scrollX}px`,
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'auto',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: '999999',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = `fh-check-${field.id}`;
    checkbox.style.cursor = 'pointer';

    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        this.selectedFields.add(field.id);
        wrapper.style.backgroundColor = '#1e3a8a';
        wrapper.style.opacity = '1';
      } else {
        this.selectedFields.delete(field.id);
        wrapper.style.backgroundColor = '#94a3b8';
        wrapper.style.opacity = '0.7';
      }
      logger.debug(`Field ${field.id} ${target.checked ? 'selected' : 'deselected'}`);
    });

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = field.label;
    label.style.cursor = 'pointer';
    label.style.userSelect = 'none';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    return wrapper;
  }

  hide() {
    this.container?.remove();
    this.container = null;
    logger.info('Overlay hidden');
  }

  getSelectedFields(): string[] {
    return Array.from(this.selectedFields);
  }

  getSelectedFieldData(): FormField[] {
    return this.fields.filter(f => this.selectedFields.has(f.id));
  }
}

export const fieldOverlay = new FieldOverlay();
