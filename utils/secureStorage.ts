class SecureStorage {
  private static instance: SecureStorage;
  private storage: Storage;

  private constructor() {
    this.storage = typeof window !== 'undefined' ? localStorage : (null as any);
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  setItem(key: string, value: string): void {
    if (this.storage) {
      try {
        // In a real app, you'd encrypt the value
        this.storage.setItem(key, value);
      } catch (error) {
        console.error('Error storing item:', error);
      }
    }
  }

  getItem(key: string): string | null {
    if (this.storage) {
      try {
        return this.storage.getItem(key);
      } catch (error) {
        console.error('Error retrieving item:', error);
        return null;
      }
    }
    return null;
  }

  removeItem(key: string): void {
    if (this.storage) {
      try {
        this.storage.removeItem(key);
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  }

  clear(): void {
    if (this.storage) {
      try {
        this.storage.clear();
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
    }
  }
}

export const secureStorage = SecureStorage.getInstance();
