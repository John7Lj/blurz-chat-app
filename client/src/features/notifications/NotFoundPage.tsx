/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Link } from 'react-router';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
      <div className="aurora-bg" />
      
      <div className="glass-card max-w-md w-full p-8 flex flex-col items-center text-center relative z-10 animate-slide-up">
        <div className="text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-400 opacity-80">
          404
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Page Not Found</h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] mb-8">
          Oops! It seems you've ventured into the void. The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/chat" 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium shadow-[0_4px_16px_rgba(109,40,217,0.3)] hover:brightness-110 transition-all active:scale-95"
        >
          <Home size={18} />
          Go back to Chats
        </Link>
      </div>
    </div>
  );
}
