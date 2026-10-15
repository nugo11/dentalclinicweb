import React, { useState, useEffect } from "react";
import { Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatPhone, cleanPhone, validatePhone } from "../../utils/phoneFormatter";

/**
 * Reusable Georgian Phone Input Component
 * Automatically detects Mobile (starts with 5, max 9 digits) vs City/Landline (starts with 0, max 10 digits).
 * Provides live formatting, character restriction, and modern inline error states.
 */
const PhoneInput = ({
  label = "ტელეფონი",
  value = "",
  onChange,
  onBlur,
  error: externalError,
  required = false,
  placeholder = "5XX XX XX XX ან 032 2 11 00 11",
  className = "",
  containerClassName = "",
  labelClassName = "",
  disabled = false,
  name = "phone",
  id,
}) => {
  const [touched, setTouched] = useState(false);

  const cleanDigits = cleanPhone(value);
  const formattedValue = formatPhone(value);
  const internalError = validatePhone(value, required);
  const displayError = externalError || (touched ? internalError : null);

  const isMobile = cleanDigits.startsWith("5");
  const isLandline = cleanDigits.startsWith("0");
  const isValid = !internalError && cleanDigits.length > 0;

  const handleChange = (e) => {
    const rawInput = e.target.value;
    const formatted = formatPhone(rawInput);
    const cleaned = cleanPhone(rawInput);
    if (onChange) {
      onChange(formatted, cleaned);
    }
  };

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  const inputStyle = `w-full pl-11 md:pl-12 pr-24 py-3.5 bg-surface-soft border-2 rounded-2xl outline-none font-bold text-sm text-text-main transition-all min-w-0 max-w-full box-border ${
    displayError
      ? "border-red-500 bg-red-500/10 animate-shake"
      : isValid
      ? "border-emerald-500/50 focus:border-emerald-500 focus:bg-surface"
      : "border-transparent focus:bg-surface focus:border-brand-purple"
  } ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`;

  const labelStyle = `text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 mb-2 flex items-center justify-between ${labelClassName}`;

  return (
    <div className={`relative group min-w-0 ${containerClassName}`} data-error={Boolean(displayError)}>
      {label && (
        <label className={labelStyle} htmlFor={id}>
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {cleanDigits.length > 0 && (
            <span className="text-[9px] font-bold text-text-muted/80 lowercase italic mr-1">
              {isMobile
                ? `მობილური (${cleanDigits.length}/9)`
                : isLandline
                ? `ქალაქის (${cleanDigits.length}/${cleanDigits.startsWith("032") ? "10" : "10"})`
                : "არასწორი"}
            </span>
          )}
        </label>
      )}

      <div className="relative min-w-0">
        <Phone
          className={`absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
            displayError
              ? "text-red-500"
              : isValid
              ? "text-emerald-500"
              : "text-text-muted group-focus-within:text-brand-purple"
          }`}
          size={18}
        />

        <input
          id={id}
          name={name}
          type="tel"
          disabled={disabled}
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          data-error={Boolean(displayError)}
          aria-invalid={Boolean(displayError)}
          maxLength={15} // formatted phone with spaces: "032 2 11 00 11" is 14 chars
          className={inputStyle}
          autoComplete="tel"
        />

        {/* Right side status indicator */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {displayError ? (
            <AlertCircle size={16} className="text-red-500" />
          ) : isValid ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : null}
        </div>
      </div>

      {displayError && (
        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-4 mt-1.5 flex items-center gap-1">
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
