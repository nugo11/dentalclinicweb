import React from 'react';

const Tooth = ({ number, status, onClick }) => {
  const statusConfig = {
    healthy: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-100 shadow-sm', iconColor: 'text-emerald-500', label: 'ჯანსაღი' },
    caries: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-100 shadow-sm', iconColor: 'text-amber-500', label: 'კარიესი' },
    pulpitis: { color: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-100 shadow-sm', iconColor: 'text-red-500', label: 'პულპიტი' },
    filling: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-100 shadow-sm', iconColor: 'text-blue-500', label: 'ბჟენი' },
    implant: { color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 shadow-sm', iconColor: 'text-indigo-500', label: 'იმპლანტი' },
    missing: { color: 'bg-surface-soft text-text-muted border-border-main opacity-40', iconColor: 'text-text-muted', label: 'არ არის' },
    default: { color: 'bg-surface text-text-muted border-border-main hover:border-brand-purple shadow-sm', iconColor: 'text-text-muted', label: '-' }
  };

  const current = statusConfig[status] || statusConfig.default;

  const getToothShape = (num) => {
    const lastDigit = parseInt(num.toString().slice(-1));
    if (lastDigit === 1 || lastDigit === 2) return "M8.5 2C7.1 2 6 3.1 6 4.5V9C6 14 8 22 12 22C16 22 18 14 18 9V4.5C18 3.1 16.9 2 15.5 2H8.5Z";
    if (lastDigit === 3) return "M12 2C9.5 4 6.5 6 6.5 9V10C6.5 15 8.5 22 12 22C15.5 22 17.5 15 17.5 10V9C17.5 6 14.5 4 12 2Z";
    if (lastDigit === 4 || lastDigit === 5) return "M7 2.5C7 2.5 9 1 12 2C15 1 17 2.5 17 2.5C18.5 3.5 19 5.5 19 7C19 11 17 12.5 16 15C15 17.5 15 20.5 14 21.5C13 22.5 11 22.5 10 21.5C9 20.5 9 17.5 8 15C7 12.5 5 11 5 7C5 5.5 5.5 3.5 7 2.5Z";
    return "M5.5 3.5C6.5 2 9 2.5 12 3.5C15 2.5 17.5 2 18.5 3.5C19.5 5 19.5 8 19 10.5C18.5 13 17.5 14 17 16V20.5C17 21.5 15 22 14.5 21C14 20 14 17.5 13.5 16C12.5 15 11.5 15 10.5 16C10 17.5 10 20 9.5 21C9 22 7 21.5 7 20.5V16C6.5 14 5.5 13 5 10.5C4.5 8 4.5 5 5.5 3.5Z";
  };

  return (
    <div 
      onClick={() => onClick(number)}
      className={`relative w-14 h-24 border-2 rounded-[20px] flex flex-col items-center justify-between py-3 cursor-pointer transition-all duration-300 active:scale-95 hover:shadow-lg ${current.color}`}
    >
      <span className={`text-xs font-black tracking-tight ${status ? 'opacity-100' : 'opacity-40'}`}>{number}</span>
      <svg viewBox="0 0 24 24" className={`w-8 h-10 fill-current ${current.iconColor} transition-all duration-500`}>
        <path d={getToothShape(number)} />
      </svg>
      <div className="space-y-1 text-center">
        <span className={`text-[7px] font-black uppercase tracking-tighter block leading-none px-1`}>{current.label}</span>
      </div>
      {status && status !== 'healthy' && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface border-2 border-current flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default Tooth;