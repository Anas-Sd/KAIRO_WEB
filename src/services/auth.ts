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
    return { code: cleanCode, name: cleanName };
  },

  clearSession(): void {
    localStorage.removeItem(KEY_CODE);
    localStorage.removeItem(KEY_NAME);
    localStorage.removeItem('kairo_user_code');
  },

  async validateAccessCode(code: string): Promise<UserSession> {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      throw new Error('Please enter your 6-character access code.');
    }

    // 1. Strict Check: access_codes table in Supabase
    try {
      const { data: codeData, error: codeErr } = await supabase
        .from('access_codes')
        .select('code, name')
        .eq('code', trimmed);

      if (!codeErr && codeData && codeData.length > 0) {
        return {
          code: codeData[0].code,
          name: codeData[0].name || 'User',
        };
      }
    } catch (e) {
      console.error('Error querying access_codes in Supabase:', e);
    }

    // 2. Fallback Check: tasks table in Supabase
    try {
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_code', trimmed)
        .limit(1);

      if (!taskErr && taskData && taskData.length > 0) {
        return {
          code: trimmed,
          name: 'User',
        };
      }
    } catch (e) {
      console.error('Error querying tasks in Supabase:', e);
    }

    // STRICT: If not found in Supabase access_codes or tasks, REJECT IT!
    throw new Error(
      `Access code "${trimmed}" was not found in Kairo Supabase database. Please check your code in Kairo Android app Settings.`
    );
  },
};
