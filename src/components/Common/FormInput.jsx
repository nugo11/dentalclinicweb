import React from 'react';

const FormInput = ({ 
  label, 
  icon: Icon, 
  error, 
  required, 
  className = "", 
  containerClassName = "",
  labelClassName = "",
  onChange,
  children,
  iconClassName = "",
  ...props 
}) => {
  const inputStyle = `w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 rounded-2xl outline-none font-bold text-sm text-brand-deep transition-all ${
    error 
      ? "border-red-500 bg-red-50 animate-shake" 
      : "border-transparent focus:bg-white focus:border-brand-purple"
  } ${className}`;

  const labelStyle = `text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block ${labelClassName}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`relative group ${containerClassName}`}>
      {label && (
        <label className={labelStyle}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon 
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              error ? "text-red-500" : `text-gray-400 group-focus-within:text-brand-purple ${iconClassName}`
            }`} 
            size={18} 
          />
        )}
        {props.type === 'textarea' ? (
          <textarea 
            {...props} 
            onChange={handleChange}
            className={`${inputStyle} h-24 resize-none`} 
          />
        ) : props.type === 'select' ? (
          <select 
            {...props} 
            onChange={handleChange}
            className={`${inputStyle} appearance-none cursor-pointer`}
          >
            {children}
          </select>
        ) : (
          <input 
            {...props} 
            onChange={handleChange}
            className={inputStyle} 
          />
        )}
      </div>
      {error && typeof error === 'string' && (
        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
