export class DataFormatter {
  static normalizePhone(value: string, format: string = 'US'): string {
    const digits = value.replace(/\D/g, '');

    if (format === 'US' && digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }

    return value;
  }

  static convertDate(value: string, targetFormat: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (targetFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return value;
    }
  }

  static splitName(fullName: string): { first: string, middle?: string, last: string } {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 2) {
      return { first: parts[0], last: parts[1] };
    } else if (parts.length >= 3) {
      return {
        first: parts[0],
        middle: parts.slice(1, -1).join(' '),
        last: parts[parts.length - 1]
      };
    }

    return { first: fullName, last: '' };
  }

  static combineName(first: string, middle?: string, last?: string): string {
    return [first, middle, last].filter(Boolean).join(' ');
  }

  static parseAddress(fullAddress: string): {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } {
    // Simple regex-based parsing
    const zipMatch = fullAddress.match(/\b\d{5}(-\d{4})?\b/);
    const stateMatch = fullAddress.match(/\b[A-Z]{2}\b/);

    return {
      street: fullAddress.split(',')[0]?.trim(),
      city: fullAddress.split(',')[1]?.trim(),
      state: stateMatch?.[0],
      zip: zipMatch?.[0]
    };
  }

  static normalizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;

    const str = String(value).toLowerCase();
    return ['yes', 'y', 'true', '1', 'on'].includes(str);
  }

  static formatSSN(value: string): string {
    const digits = value.replace(/\D/g, '');

    if (digits.length === 9) {
      return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`;
    }

    return value;
  }
}
