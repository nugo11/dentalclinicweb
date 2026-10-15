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
  const hasIcon = Boolean(Icon);
  const paddingClass = hasIcon ? "pl-11 md:pl-12 pr-3 md:pr-4" : "px-3.5 md:px-4";
  
  const inputStyle = `w-full ${paddingClass} py-3.5 bg-surface-soft border-2 rounded-2xl outline-none font-bold text-sm text-text-main transition-all min-w-0 max-w-full box-border ${
    error 
      ? "border-red-500 bg-red-500/10 animate-shake" 
      : "border-transparent focus:bg-surface focus:border-brand-purple"
  } ${className}`;

  const labelStyle = `text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 mb-2 block ${labelClassName}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`relative group min-w-0 ${containerClassName}`} data-error={Boolean(error)}>
      {label && (
        <label className={labelStyle}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative min-w-0">
        {Icon && (
          <Icon 
            className={`absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
              error ? "text-red-500" : `text-text-muted group-focus-within:text-brand-purple ${iconClassName}`
            }`} 
            size={18} 
          />
        )}
        {props.type === 'textarea' ? (
          <textarea 
            {...props} 
            data-error={Boolean(error)}
            aria-invalid={Boolean(error)}
            onChange={handleChange}
            className={`${inputStyle} h-24 resize-none`} 
          />
        ) : props.type === 'select' ? (
          <select 
            {...props} 
            data-error={Boolean(error)}
            aria-invalid={Boolean(error)}
            onChange={handleChange}
            className={`${inputStyle} appearance-none cursor-pointer`} 
          >
            {children}
          </select>
        ) : (
          <>
            <input 
              {...props} 
              data-error={Boolean(error)}
              aria-invalid={Boolean(error)}
              onClick={(e) => {
                if (props.type === 'date' || props.type === 'time') {
                  try {
                    if (e.target && typeof e.target.showPicker === 'function') {
                      e.target.showPicker();
                    }
                  } catch (err) {}
                }
                if (props.onClick) props.onClick(e);
              }}
              onChange={handleChange}
              className={inputStyle} 
            />
            {typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '') && props.type === 'date' && !props.value && (
              <span className={`absolute ${hasIcon ? 'left-11' : 'left-3.5 md:left-4'} top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold pointer-events-none opacity-60 select-none truncate pr-8`}>
                {props.placeholder || 'mm/dd/yyyy'}
              </span>
            )}
          </>
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
