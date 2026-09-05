import React from 'react';
import { useApp } from '../../context/AppContext';
import { UnifiedAuthFlow } from './UnifiedAuthFlow';
import { X } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    currentRole,
    setCurrentRole,
    colorThemeMode,
  } = useApp();

  if (!authModalOpen) return null;

  const isLight = colorThemeMode === 'light';

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) {
          setAuthModalOpen(false);
        }
      }}
    >
      <div
        id="auth-modal-card"
        className={`relative w-full max-w-lg my-auto rounded-3xl border p-5 sm:p-7 shadow-2xl transition-all ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-950 shadow-zinc-400/50'
            : 'bg-zinc-950 border-zinc-800 text-white shadow-black'
        }`}
      >
        <button
          id="close-auth-modal"
          onClick={() => setAuthModalOpen(false)}
          aria-label="Close Authentication Modal"
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-20 cursor-pointer ${
            isLight
              ? 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <UnifiedAuthFlow
          initialRole={currentRole}
          inlineMode={true}
          onAuthSuccess={(role) => {
            setCurrentRole(role);
            setAuthModalOpen(false);
          }}
          onBackToWelcome={() => setAuthModalOpen(false)}
        />
      </div>
    </div>
  );
};
