import React, { useState } from 'react';
import { Key, ArrowRight, Infinity, AlertCircle, Sparkles, Smartphone } from 'lucide-react';
import { AuthManager, UserSession } from '../services/auth';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accessCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Please enter your 6-character access code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const session = await AuthManager.validateAccessCode(trimmed);
      AuthManager.saveSession(session.code, session.name);
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid access code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await AuthManager.registerNewAccessCode('Web User');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage('Failed to generate a new access code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#12131a] flex items-center justify-center p-4 selection:bg-[#5a45ff] selection:text-white">
      <div className="w-full max-w-md bg-[#1a1b22] border border-[#292931] rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-entrance">
        {/* Branding */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5a45ff] to-[#00f5a0] flex items-center justify-center shadow-lg shadow-[#5a45ff]/20">
            <Infinity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Welcome to KAIRO
            </h1>
            <p className="text-xs text-[#918ea2] mt-1">
              Connect to your live workspace to access your tasks
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 bg-[#93000a]/20 border border-[#ffb4ab]/30 rounded-xl text-xs text-[#ffdad6] flex items-start gap-2.5 animate-entrance">
            <AlertCircle className="w-4 h-4 text-[#ffb4ab] flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#c8c4d9] mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#5a45ff]" />
              Enter Your Access Code
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={8}
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                placeholder="e.g. A3K9X2"
                className="w-full bg-[#12131a] border border-[#292931] focus:border-[#5a45ff] rounded-xl px-4 py-3 text-base text-white tracking-widest font-mono text-center outline-none transition-all placeholder:text-[#474556]"
              />
            </div>
            <p className="text-[11px] text-[#918ea2] mt-2 flex items-center gap-1.5">
              <Smartphone className="w-3 h-3 text-[#00f5a0]" />
              In the Kairo Android app, go to Settings to find your code.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !accessCode.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[#5a45ff] hover:bg-[#6e5aff] disabled:opacity-40 disabled:hover:bg-[#5a45ff] text-white text-sm font-semibold shadow-lg shadow-[#5a45ff]/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider & Option to create new account */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#292931]">
          <div className="flex items-center justify-between text-xs text-[#918ea2]">
            <span>Don't have a code yet?</span>
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="text-[#00f5a0] hover:underline font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate New Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
