import React from 'react';

// FDI სტანდარტული კბილების ანატომიური დასახელებები ქართულად
export const TOOTH_NAMES_KA = {
  // ზედა ყბა - მარჯვენა მხარე (Q1)
  18: "ზედა მარჯვენა მე-3 მოლარი (სიბრძნის)",
  17: "ზედა მარჯვენა მე-2 მოლარი",
  16: "ზედა მარჯვენა 1-ლი მოლარი",
  15: "ზედა მარჯვენა მე-2 პრემოლარი",
  14: "ზედა მარჯვენა 1-ლი პრემოლარი",
  13: "ზედა მარჯვენა ეშვი",
  12: "ზედა მარჯვენა გვერდითი საჭრელი",
  11: "ზედა მარჯვენა ცენტრალური საჭრელი",

  // ზედა ყბა - მარცხენა მხარე (Q2)
  21: "ზედა მარცხენა ცენტრალური საჭრელი",
  22: "ზედა მარცხენა გვერდითი საჭრელი",
  23: "ზედა მარცხენა ეშვი",
  24: "ზედა მარცხენა 1-ლი პრემოლარი",
  25: "ზედა მარცხენა მე-2 პრემოლარი",
  26: "ზედა მარცხენა 1-ლი მოლარი",
  27: "ზედა მარცხენა მე-2 მოლარი",
  28: "ზედა მარცხენა მე-3 მოლარი (სიბრძნის)",

  // ქვედა ყბა - მარცხენა მხარე (Q3)
  31: "ქვედა მარცხენა ცენტრალური საჭრელი",
  32: "ქვედა მარცხენა გვერდითი საჭრელი",
  33: "ქვედა მარცხენა ეშვი",
  34: "ქვედა მარცხენა 1-ლი პრემოლარი",
  35: "ქვედა მარცხენა მე-2 პრემოლარი",
  36: "ქვედა მარცხენა 1-ლი მოლარი",
  37: "ქვედა მარცხენა მე-2 მოლარი",
  38: "ქვედა მარცხენა მე-3 მოლარი (სიბრძნის)",

  // ქვედა ყბა - მარჯვენა მხარე (Q4)
  48: "ქვედა მარჯვენა მე-3 მოლარი (სიბრძნის)",
  47: "ქვედა მარჯვენა მე-2 მოლარი",
  46: "ქვედა მარჯვენა 1-ლი მოლარი",
  45: "ქვედა მარჯვენა მე-2 პრემოლარი",
  44: "ქვედა მარჯვენა 1-ლი პრემოლარი",
  43: "ქვედა მარჯვენა ეშვი",
  42: "ქვედა მარჯვენა გვერდითი საჭრელი",
  41: "ქვედა მარჯვენა ცენტრალური საჭრელი"
};

// სტატუსების ვიზუალური კონფიგურაცია
export const STATUS_CONFIG = {
  healthy: {
    id: 'healthy',
    label: 'ჯანმრთელი',
    fillLight: '#FFFFFF',
    fillDark: '#1E293B',
    stroke: '#10B981',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accent: 'text-emerald-500',
    bgSolid: 'bg-emerald-500',
  },
  caries: {
    id: 'caries',
    label: 'კარიესი',
    fillLight: '#FEF3C7',
    fillDark: '#451A03',
    stroke: '#F59E0B',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    badgeBorder: 'border-amber-500/20',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    accent: 'text-amber-500',
    bgSolid: 'bg-amber-500',
  },
  pulpitis: {
    id: 'pulpitis',
    label: 'პულპიტი',
    fillLight: '#FEE2E2',
    fillDark: '#450A0A',
    stroke: '#EF4444',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-600 dark:text-red-400',
    badgeBorder: 'border-red-500/20',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    accent: 'text-red-500',
    bgSolid: 'bg-red-500',
  },
  filling: {
    id: 'filling',
    label: 'ბჟენი',
    fillLight: '#DBEAFE',
    fillDark: '#172554',
    stroke: '#3B82F6',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-500/20',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    accent: 'text-blue-500',
    bgSolid: 'bg-blue-500',
  },
  implant: {
    id: 'implant',
    label: 'იმპლანტი',
    fillLight: '#EEF2FF',
    fillDark: '#1E1B4B',
    stroke: '#6366F1',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    badgeBorder: 'border-indigo-500/20',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accent: 'text-indigo-500',
    bgSolid: 'bg-indigo-500',
  },
  missing: {
    id: 'missing',
    label: 'ამოღებული',
    fillLight: '#F1F5F9',
    fillDark: '#0F172A',
    stroke: '#94A3B8',
    badgeBg: 'bg-slate-500/10',
    badgeText: 'text-slate-500 dark:text-slate-400',
    badgeBorder: 'border-slate-500/20',
    glowColor: 'rgba(148, 163, 184, 0.3)',
    accent: 'text-slate-400',
    bgSolid: 'bg-slate-400',
  },
};

// 32 კბილის ანატომიური კოორდინატები და რკალის გეომეტრია (viewBox 80 30 640 740, ცენტრი X=400, Y=400)
export const TEETH_COORDINATES = {
  // ზედა ყბა (Maxilla) - Q1 (18-11) - პაციენტის მარჯვენა, ეკრანის მარცხენა
  18: { x: 138, y: 366, rot: -78, jaw: 'upper', quad: 1, type: 'molar', name: '18 · მე-3 მოლარი (სიბრძნის)' },
  17: { x: 150, y: 308, rot: -72, jaw: 'upper', quad: 1, type: 'molar', name: '17 · მე-2 მოლარი' },
  16: { x: 168, y: 252, rot: -62, jaw: 'upper', quad: 1, type: 'molar', name: '16 · 1-ლი მოლარი' },
  15: { x: 192, y: 200, rot: -50, jaw: 'upper', quad: 1, type: 'premolar', name: '15 · მე-2 პრემოლარი' },
  14: { x: 226, y: 154, rot: -38, jaw: 'upper', quad: 1, type: 'premolar', name: '14 · 1-ლი პრემოლარი' },
  13: { x: 270, y: 118, rot: -24, jaw: 'upper', quad: 1, type: 'canine', name: '13 · ეშვი' },
  12: { x: 320, y: 94,  rot: -12, jaw: 'upper', quad: 1, type: 'incisor', name: '12 · გვერდითი საჭრელი' },
  11: { x: 372, y: 82,  rot: -4,  jaw: 'upper', quad: 1, type: 'incisor', name: '11 · ცენტრალური საჭრელი' },

  // ზედა ყბა (Maxilla) - Q2 (21-28) - პაციენტის მარცხენა, ეკრანის მარჯვენა
  21: { x: 428, y: 82,  rot: 4,   jaw: 'upper', quad: 2, type: 'incisor', name: '21 · ცენტრალური საჭრელი' },
  22: { x: 480, y: 94,  rot: 12,  jaw: 'upper', quad: 2, type: 'incisor', name: '22 · გვერდითი საჭრელი' },
  23: { x: 530, y: 118, rot: 24,  jaw: 'upper', quad: 2, type: 'canine', name: '23 · ეშვი' },
  24: { x: 574, y: 154, rot: 38,  jaw: 'upper', quad: 2, type: 'premolar', name: '24 · 1-ლი პრემოლარი' },
  25: { x: 608, y: 200, rot: 50,  jaw: 'upper', quad: 2, type: 'premolar', name: '25 · მე-2 პრემოლარი' },
  26: { x: 632, y: 252, rot: 62,  jaw: 'upper', quad: 2, type: 'molar', name: '26 · 1-ლი მოლარი' },
  27: { x: 650, y: 308, rot: 72,  jaw: 'upper', quad: 2, type: 'molar', name: '27 · მე-2 მოლარი' },
  28: { x: 662, y: 366, rot: 78,  jaw: 'upper', quad: 2, type: 'molar', name: '28 · მე-3 მოლარი (სიბრძნის)' },

  // ქვედა ყბა (Mandible) - Q4 (48-41) - პაციენტის მარჯვენა, ეკრანის მარცხენა
  48: { x: 150, y: 434, rot: 78,  jaw: 'lower', quad: 4, type: 'molar', name: '48 · მე-3 მოლარი (სიბრძნის)' },
  47: { x: 162, y: 492, rot: 72,  jaw: 'lower', quad: 4, type: 'molar', name: '47 · მე-2 მოლარი' },
  46: { x: 180, y: 548, rot: 62,  jaw: 'lower', quad: 4, type: 'molar', name: '46 · 1-ლი მოლარი' },
  45: { x: 204, y: 600, rot: 50,  jaw: 'lower', quad: 4, type: 'premolar', name: '45 · მე-2 პრემოლარი' },
  44: { x: 236, y: 646, rot: 38,  jaw: 'lower', quad: 4, type: 'premolar', name: '44 · 1-ლი პრემოლარი' },
  43: { x: 278, y: 682, rot: 24,  jaw: 'lower', quad: 4, type: 'canine', name: '43 · ეშვი' },
  42: { x: 326, y: 706, rot: 12,  jaw: 'lower', quad: 4, type: 'incisor', name: '42 · გვერდითი საჭრელი' },
  41: { x: 375, y: 718, rot: 4,   jaw: 'lower', quad: 4, type: 'incisor', name: '41 · ცენტრალური საჭრელი' },

  // ქვედა ყბა (Mandible) - Q3 (31-38) - პაციენტის მარცხენა, ეკრანის მარჯვენა
  31: { x: 425, y: 718, rot: -4,  jaw: 'lower', quad: 3, type: 'incisor', name: '31 · ცენტრალური საჭრელი' },
  32: { x: 474, y: 706, rot: -12, jaw: 'lower', quad: 3, type: 'incisor', name: '32 · გვერდითი საჭრელი' },
  33: { x: 522, y: 682, rot: -24, jaw: 'lower', quad: 3, type: 'canine', name: '33 · ეშვი' },
  34: { x: 564, y: 646, rot: -38, jaw: 'lower', quad: 3, type: 'premolar', name: '34 · 1-ლი პრემოლარი' },
  35: { x: 596, y: 600, rot: -50, jaw: 'lower', quad: 3, type: 'premolar', name: '35 · მე-2 პრემოლარი' },
  36: { x: 620, y: 548, rot: -62, jaw: 'lower', quad: 3, type: 'molar', name: '36 · 1-ლი მოლარი' },
  37: { x: 638, y: 492, rot: -72, jaw: 'lower', quad: 3, type: 'molar', name: '37 · მე-2 მოლარი' },
  38: { x: 650, y: 434, rot: -78, jaw: 'lower', quad: 3, type: 'molar', name: '38 · მე-3 მოლარი (სიბრძნის)' }
};

// ანატომიური გვირგვინის ვექტორული კონტური კბილის ტიპის მიხედვით
export const getAnatomicalCrownPath = (type, isUpper, number) => {
  if (type === 'molar') {
    // მოლარი: 4-5 ბორცვიანი ბუნებრივი გვირგვინი მომრგვალებული კუთხეებითა და ბორცვთაშორისი ჩაღრმავებებით
    return "M -17 -16 C -9 -21, 9 -21, 17 -16 C 22 -9, 22 9, 17 16 C 9 21, -9 21, -17 16 C -22 9, -22 -9, -17 -16 Z";
  }
  if (type === 'premolar') {
    // პრემოლარი: ორბორცვიანი ელიფსურ-ოვალური გვირგვინი
    return "M -15 -14 C -6 -18, 6 -18, 15 -14 C 19 -5, 19 5, 15 14 C 6 18, -6 18, -15 14 C -19 5, -19 -5, -15 -14 Z";
  }
  if (type === 'canine') {
    // ეშვი: წამახვილებული ეშვის ფორმა, წვერო მიმართულია გარეთ (ტუჩისკენ)
    if (isUpper) {
      return "M 0 -19 C 7 -15, 14 -7, 15 2 C 15 11, 9 18, 0 18 C -9 18, -15 11, -15 2 C -14 -7, -7 -15, 0 -19 Z";
    } else {
      return "M 0 19 C 7 15, 14 7, 15 -2 C 15 -11, 9 -18, 0 -18 C -9 -18, -15 -11, -15 -2 C -14 7, -7 15, 0 19 Z";
    }
  }
  // incisor (საჭრელი): ბრტყელი საჭრელი კიდე გარეთა მხარეს
  const isCentral = number === 11 || number === 21 || number === 41 || number === 31;
  const w = isCentral ? 14 : 12;
  const h = 15;
  if (isUpper) {
    return `M -${w} -${h} L ${w} -${h} C ${w + 2} -7, ${w} 7, 8 ${h} C 3 ${h + 2}, -3 ${h + 2}, -8 ${h} C -${w} 7, -${w + 2} -7, -${w} -${h} Z`;
  } else {
    const lw = isCentral ? 11 : 12;
    return `M -${lw} ${h} L ${lw} ${h} C ${lw + 2} 7, ${lw} -7, 7 -${h} C 3 -${h + 2}, -3 -${h + 2}, -7 -${h} C -${lw} -7, -${lw + 2} 7, -${lw} ${h} Z`;
  }
};

// ანატომიური კბილის SVG ფორმა რკალში
export const SvgTooth = ({ 
  number, 
  status = 'healthy', 
  comment = '',
  onClick, 
  onHover, 
  isHovered, 
  isDimmed,
  isHighlighted 
}) => {
  const coord = TEETH_COORDINATES[number];
  if (!coord) return null;

  const currentStatus = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const isUpper = coord.jaw === 'upper';
  const isMissing = status === 'missing';

  // ანატომიური ზომები ჰალოსთვის
  let haloRx = 23;
  let haloRy = 22;

  if (coord.type === 'premolar') {
    haloRx = 21;
    haloRy = 20;
  } else if (coord.type === 'canine') {
    haloRx = 19;
    haloRy = 22;
  } else if (coord.type === 'incisor') {
    haloRx = 18;
    haloRy = 20;
  }

  // ნომრის პოზიციონირება კბილის გარეთ (რკალის გარე პერიმეტრზე)
  const labelDistance = isUpper ? -30 : 30;

  return (
    <g
      transform={`translate(${coord.x}, ${coord.y}) rotate(${coord.rot})`}
      onClick={() => onClick && onClick(number)}
      onMouseEnter={() => onHover && onHover(number)}
      onMouseLeave={() => onHover && onHover(null)}
      className="cursor-pointer select-none"
      style={{
        opacity: isDimmed ? 0.25 : 1,
      }}
    >
      {/* ჰოვერის/მონიშვნის ჰალო */}
      <ellipse
        cx="0"
        cy="0"
        rx={haloRx}
        ry={haloRy}
        fill={currentStatus.stroke}
        opacity={isHovered || isHighlighted ? 0.35 : 0}
        className="pointer-events-none transition-opacity duration-150"
      />

      {/* რეალური ანატომიური კბილის გვირგვინი */}
      <path
        d={getAnatomicalCrownPath(coord.type, isUpper, number)}
        style={{
          fill: isMissing ? 'transparent' : 'var(--tooth-fill, #FFFFFF)',
          stroke: currentStatus.stroke,
          strokeWidth: isHovered || isHighlighted ? 2.5 : 1.8,
          strokeDasharray: isMissing ? '4 3' : 'none',
          strokeLinejoin: 'round',
          filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.22))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
        }}
      />

      {/* ოკლუზიური ანატომიური ღარები და ბორცვები (Realistic Fissures & Ridges) */}
      {!isMissing && (
        <g opacity={isHovered ? 0.65 : 0.4} stroke={currentStatus.stroke} fill="none">
          {coord.type === 'molar' && (
            <>
              {/* ოკლუზიური მაგიდის კონტური */}
              <rect x="-10" y="-9" width="20" height="18" rx="5" strokeWidth="0.8" opacity="0.3" />
              {/* ჯვარედინი ანატომიური ღარები */}
              <path d="M -11 0 L 11 0 M 0 -9 L 0 9" strokeWidth="1.3" strokeLinecap="round" />
              {/* ცენტრალური ფოსო (Central Fossa Pit) */}
              <circle cx="0" cy="0" r="2" fill={currentStatus.stroke} />
              {/* გვერდითი ბორცვების წერტილები */}
              <circle cx="-6" cy="-5" r="1.2" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="6" cy="-5" r="1.2" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="-6" cy="5" r="1.2" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="6" cy="5" r="1.2" fill={currentStatus.stroke} opacity="0.6" />
            </>
          )}

          {coord.type === 'premolar' && (
            <>
              {/* პრემოლარის ცენტრალური ღარი ბორცვთაშორის */}
              <path d="M -8 0 L 8 0 M -8 0 L -11 -3 M -8 0 L -11 3 M 8 0 L 11 -3 M 8 0 L 11 3" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="-4" cy="0" r="1.4" fill={currentStatus.stroke} />
              <circle cx="4" cy="0" r="1.4" fill={currentStatus.stroke} />
            </>
          )}

          {coord.type === 'canine' && (
            <>
              {/* ეშვის წამახვილებული ქედი და წვერო */}
              <line x1="0" y1={isUpper ? -16 : 16} x2="0" y2={isUpper ? 11 : -11} strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="0" cy={isUpper ? -5 : 5} r="1.8" fill={currentStatus.stroke} />
            </>
          )}

          {coord.type === 'incisor' && (
            <>
              {/* საჭრელი კიდის ბრტყელი ფასეტი */}
              <line x1="-9" y1={isUpper ? -11 : 11} x2="9" y2={isUpper ? -11 : 11} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1={isUpper ? -11 : 11} x2="0" y2={isUpper ? 6 : -6} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
            </>
          )}
        </g>
      )}

      {/* სტატუსის სპეციფიკური ინდიკატორები */}
      {status === 'caries' && (
        <circle cx="0" cy="0" r="5" fill="#D97706" />
      )}

      {status === 'pulpitis' && (
        <g>
          <circle cx="0" cy="0" r="6.5" fill="#EF4444" opacity="0.3" />
          <circle cx="0" cy="0" r="5" fill="#DC2626" />
        </g>
      )}

      {status === 'filling' && (
        <rect x="-7" y="-6" width="14" height="12" rx="3" fill="#2563EB" opacity="0.85" />
      )}

      {status === 'implant' && (
        <g stroke="#6366F1" strokeWidth="1.5">
          <circle cx="0" cy="0" r="5.5" fill="#4F46E5" opacity="0.3" />
          <line x1="-4.5" y1="-3.5" x2="4.5" y2="-3.5" />
          <line x1="-4.5" y1="0" x2="4.5" y2="0" />
          <line x1="-4.5" y1="3.5" x2="4.5" y2="3.5" />
        </g>
      )}

      {isMissing && (
        <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      )}

      {/* კომენტარის ინდიკატორი */}
      {comment && (
        <circle 
          cx={width / 2 - 4} 
          cy={-height / 2 + 4} 
          r="3.5" 
          className="fill-brand-purple stroke-white dark:stroke-slate-900 stroke-1" 
        />
      )}

      {/* FDI ნომრის ბეიჯი (რკალის გარეთ, მუდმივად ჰორიზონტალური და იოლად წასაკითხი) */}
      <g transform={`translate(0, ${labelDistance}) rotate(${-coord.rot})`}>
        <rect
          x="-13"
          y="-10"
          width="26"
          height="20"
          rx="6"
          className={`transition-colors duration-150 ${
            isHovered || isHighlighted
              ? 'fill-brand-purple stroke-white dark:stroke-slate-900 shadow-md'
              : 'fill-surface-soft stroke-border-main'
          }`}
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          className={`text-[10px] font-black tracking-tight select-none pointer-events-none transition-colors ${
            isHovered || isHighlighted
              ? 'fill-white'
              : 'fill-text-main'
          }`}
        >
          {number}
        </text>
      </g>
    </g>
  );
};

// კბილის ტრადიციული ბარათი (კომპაქტური ცხრილის ხედისთვის)
const Tooth = ({ number, status, onClick }) => {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const isMissing = status === 'missing';

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
      className={`relative w-12 sm:w-14 h-20 sm:h-24 border-2 rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between py-2.5 sm:py-3 cursor-pointer transition-all duration-300 active:scale-95 hover:shadow-lg bg-surface ${
        isMissing 
          ? 'border-dashed border-border-main opacity-40 bg-surface-soft' 
          : `${current.badgeBorder} hover:border-brand-purple`
      }`}
    >
      <span className="text-[11px] sm:text-xs font-black tracking-tight text-text-main">{number}</span>
      <svg viewBox="0 0 24 24" className="w-6 h-8 sm:w-8 sm:h-10 fill-current transition-all duration-300" style={{ color: current.stroke }}>
        <path d={getToothShape(number)} />
      </svg>
      <div className="text-center">
        <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-tighter block leading-none px-1 ${current.badgeText}`}>
          {current.label}
        </span>
      </div>
      {status && status !== 'healthy' && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface border-2 flex items-center justify-center shadow-sm" style={{ borderColor: current.stroke }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: current.stroke }} />
        </div>
      )}
    </div>
  );
};

export default Tooth;