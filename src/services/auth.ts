const STORAGE_KEY = 'kairo_user_code';

export const AuthManager = {
  getUserCode(): string {
    let code = localStorage.getItem(STORAGE_KEY);
    if (!code) {
      code = 'KR' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem(STORAGE_KEY, code);
    }
    return code.toUpperCase();
  },

  setUserCode(code: string): string {
    const cleaned = code.trim().toUpperCase();
    localStorage.setItem(STORAGE_KEY, cleaned);
    window.dispatchEvent(new CustomEvent('kairo_auth_changed', { detail: cleaned }));
    return cleaned;
  },

  generateNewCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.setUserCode(result);
  }
};
