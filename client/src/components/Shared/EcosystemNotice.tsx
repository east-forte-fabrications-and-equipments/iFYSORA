import React, { useState, useEffect } from 'react';
import { Sparkles, X, Info, ExternalLink } from 'lucide-react';

export default function EcosystemNotice() {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the notice before
    const hasDismissed = localStorage.getItem('ecosystem_notice_dismissed');
    if (hasDismissed === 'true') {
      setDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('ecosystem_notice_dismissed', 'true');
  };

  if (!isVisible || dismissed) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-indigo-50 via-emerald-50 to-amber-50 border border-indigo-100 rounded-2xl p-4 mb-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-lg transition z-10"
      >
        <X className="h-4 w-4 text-slate-400" />
      </button>

      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="flex-1 pr-8">
          <h4 className="text-sm font-bold text-slate-900">
            Welcome to the FYSORA Ecosystem
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
            iFYSORA is part of the FYSORA ecosystem. Your measurements and profile are 
            synchronized across FYSORA services. Learn more about how your data is managed 
            in our <a href="/privacy" className="text-indigo-600 hover:underline font-medium">Privacy Policy</a> 
            and <a href="/terms" className="text-indigo-600 hover:underline font-medium">Terms of Service</a>.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <a
              href="https://fysora-fashn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
            >
              <span>FYSORA FASHN</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-xs text-slate-300">|</span>
            <a
              href="https://companion.fysora.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition"
            >
              <span>FYSORA Companion</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
