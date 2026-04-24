import React from 'react';
import { Activity } from 'lucide-react';

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-surface flex flex-col items-center justify-center">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-purple/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 -m-8 border-4 border-brand-purple/10 rounded-full animate-[ping_2s_infinite]" />
        <div className="absolute inset-0 -m-4 border-2 border-brand-purple/20 rounded-full animate-[pulse_1.5s_infinite]" />
        
        {/* Logo Container */}
        <div className="w-24 h-24 bg-brand-deep rounded-[32px] flex items-center justify-center shadow-2xl shadow-brand-purple/30 animate-in zoom-in duration-700">
          <Activity size={40} className="text-white animate-[pulse_2s_infinite]" />
        </div>

        {/* Text */}
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <h2 className="text-2xl font-black text-text-main tracking-tighter italic mb-2">
            Dental<span className="text-brand-purple">Hub</span>
          </h2>
          <div className="flex items-center gap-1.5 justify-center">
             <div className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce"></div>
          </div>
          <p className="mt-4 text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">იტვირთება...</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
