import React from 'react';
import { Plus, UserPlus, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const QuickActions = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const canAddPatient = ['admin', 'manager', 'receptionist', 'doctor'].includes(role);

  const actions = [
    { icon: UserPlus, label: 'პაციენტი', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', to: '/patients' },
    { icon: CalendarIcon, label: 'ვიზიტი', color: 'bg-brand-purple', shadow: 'shadow-brand-purple/20', to: '/calendar' },
    { icon: FileText, label: 'ინვოისი', color: 'bg-blue-500', shadow: 'shadow-blue-500/20', to: '/archive' },
  ];

  const filteredActions = actions.filter(action => {
    if (role === 'accountant') {
      return action.label === 'ინვოისი';
    }
    return true;
  });

  return (
    <div className="flex items-center gap-2">
      {filteredActions.map((action, i) => (
        <button
          key={i}
          onClick={() => navigate(action.to)}
          className={`group flex items-center gap-2 px-4 py-3 ${action.color} text-white rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-md ${action.shadow}`}
        >
          <action.icon size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">{action.label}</span>
        </button>
      ))}
      
      {(canAddPatient && role !== 'accountant') && (
        <button 
          onClick={() => navigate('/patients?add=true')}
          className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-purple hover:border-brand-purple hover:bg-white transition-all shadow-sm active:scale-90"
          title="პაციენტის სწრაფი დამატება"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};

export default QuickActions;