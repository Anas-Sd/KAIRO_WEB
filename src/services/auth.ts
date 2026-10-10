import { supabase } from './supabase';

const KEY_CODE = 'kairo_user_access_code';
const KEY_NAME = 'kairo_user_display_name';

export interface UserSession {
  code: string;
  name: string;
}

export const AuthManager = {
  getSession(): UserSession | null {
    const code = localStorage.getItem(KEY_CODE);
    const name = localStorage.getItem(KEY_NAME) || 'User';
    if (!code || !code.trim()) {
      return null;
    }
    return {
      code: code.trim().toUpperCase(),
      name: name.trim(),
    };
  },

  getUserCode(): string | null {
    const session = this.getSession();
    return session ? session.code : null;
  },

  getUserName(): string {
    const session = this.getSession();
    return session ? session.name : 'User';
  },

  saveSession(code: string, name: string): UserSession {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim() || 'User';
    localStorage.setItem(KEY_CODE, cleanCode);
    localStorage.setItem(KEY_NAME, cleanName);
    window.dispatchEvent(new CustomEvent('kairo_auth_changed', { detail: { code: cleanCode, name: cleanName } }));
    return { code: cleanCode, name: cleanName };
  },

  clearSession(): void {
    localStorage.removeItem(KEY_CODE);
    localStorage.removeItem(KEY_NAME);
    // Also clean up any legacy key
    localStorage.removeItem('kairo_user_code');
    window.dispatchEvent(new CustomEvent('kairo_auth_changed', { detail: null }));
  },

  async validateAccessCode(code: string): Promise<UserSession> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      throw new Error('Please enter an access code.');
    }

    // 1. Check access_codes table in Supabase
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('code, name')
        .eq('code', trimmed);

      if (!error && data && data.length > 0) {
        return {
          code: data[0].code,
          name: data[0].name || 'User',
        };
      }
    } catch (e) {
      console.warn('Error querying access_codes table:', e);
    }

    // 2. Fallback: check if tasks exist with this user_code
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_code', trimmed)
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          code: trimmed,
          name: 'Kairo User',
        };
      }
    } catch (e) {
      console.warn('Error checking tasks user_code:', e);
    }

    // 3. If valid 4-8 char code, allow session initialization so user can connect their tasks
    if (trimmed.length >= 4 && trimmed.length <= 10) {
      return {
        code: trimmed,
        name: 'Kairo User',
      };
    }

    throw new Error('Invalid access code. Please check your Kairo Android app.');
  },

  async registerNewAccessCode(name: string): Promise<UserSession> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      await supabase.from('access_codes').insert({
        code,
        name: name || 'User',
      });
    } catch (e) {
      console.warn('Failed to insert new code into access_codes table:', e);
    }

    return this.saveSession(code, name || 'User');
  },
};
