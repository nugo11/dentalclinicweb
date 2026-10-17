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

// ანატომიური გვირგვინის ვექტორული კონტური კბილის ტიპის მიხედვით (ბუნებრივი ბიოლოგიური ფორმები)
export const getAnatomicalCrownPath = (type, isUpper, number) => {
  if (type === 'molar') {
    // მოლარი: 4 გამოკვეთილი მომრგვალებული ბორცვი ბუნებრივი ბორცვთაშორისი ჩანაჭდევებით (Mesio-buccal, Disto-buccal, Disto-palatal/lingual, Mesio-palatal/lingual)
    if (isUpper) {
      return "M -17 0 C -17 -8 -14 -18 -8 -18 C -3 -18 -1 -15 0 -15 C 1 -15 3 -18 8 -18 C 14 -18 18 -12 18 -3 C 18 4 15 16 8 17 C 3 17 2 15 0 15 C -2 15 -4 18 -9 18 C -15 18 -18 10 -17 0 Z";
    } else {
      return "M -18 0 C -18 -8 -14 -17 -8 -17 C -3 -17 -1 -15 0 -15 C 1 -15 3 -17 8 -17 C 14 -17 18 -10 18 0 C 18 8 14 18 8 18 C 3 18 1 15 0 15 C -1 15 -3 18 -8 18 C -15 18 -18 9 -18 0 Z";
    }
  }

  if (type === 'premolar') {
    // პრემოლარი: ორბორცვიანი ბუნებრივი ოვალური გვირგვინი გამოხატული ბუკალური და ლინგვალური ბორცვებით
    if (isUpper) {
      return "M -13 0 C -14 -8 -8 -17 0 -17 C 8 -17 14 -8 13 0 C 14 7 8 16 0 16 C -8 16 -14 7 -13 0 Z";
    } else {
      return "M -13 0 C -14 8 -8 17 0 17 C 8 17 14 8 13 0 C 14 -7 8 -16 0 -16 C -8 -16 -14 -7 -13 0 Z";
    }
  }

  if (type === 'canine') {
    // ეშვი: გამოკვეთილი წამახვილებული ეშვის ფორმა, წვერო მიმართულია გარეთ (ტუჩისკენ), მძლავრი ფუძით
    if (isUpper) {
      return "M 0 -21 C 6 -17 15 -10 15 1 C 15 9 9 17 0 17 C -9 17 -15 9 -15 1 C -15 -10 -6 -17 0 -21 Z";
    } else {
      return "M 0 21 C 6 17 15 10 15 -1 C 15 -9 9 -17 0 -17 C -9 -17 -15 -9 -15 -1 C -15 10 -6 17 0 21 Z";
    }
  }

  // incisor (საჭრელი): ბრტყელი საჭრელი კიდე მამელონებით და ანატომიური შევიწროება
  const isCentral = number === 11 || number === 21 || number === 41 || number === 31;
  if (isUpper) {
    return isCentral
      ? "M -14 -12 C -9 -14 -3 -13.5 0 -14 C 3 -13.5 9 -14 14 -12 C 16 -6 13 6 8 14 C 4 17 -4 17 -8 14 C -13 6 -16 -6 -14 -12 Z"
      : "M -12 -11 C -7 -13 0 -13 12 -11 C 14 -5 12 5 7 13 C 3 16 -3 16 -7 13 C -12 5 -14 -5 -12 -11 Z";
  } else {
    return isCentral
      ? "M -10 11 C -5 12.5 0 12.5 10 11 C 11 5 9 -4 6 -12 C 3 -15 -3 -15 -6 -12 C -9 -4 -11 5 -10 11 Z"
      : "M -11 11 C -6 13 0 13 11 11 C 12 5 10 -4 6.5 -12 C 3 -15 -3 -15 -6.5 -12 C -10 -4 -12 5 -11 11 Z";
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
    haloRx = 20;
    haloRy = 21;
  } else if (coord.type === 'canine') {
    haloRx = 20;
    haloRy = 24;
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

      {/* რეალური ანატომიური კბილის გვირგვინი (ბუნებრივი კონტურით) */}
      <path
        d={getAnatomicalCrownPath(coord.type, isUpper, number)}
        style={{
          fill: isMissing ? 'transparent' : 'var(--tooth-fill, #FFFFFF)',
          stroke: currentStatus.stroke,
          strokeWidth: isHovered || isHighlighted ? 2.5 : 1.8,
          strokeDasharray: isMissing ? '4 3' : 'none',
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
          filter: isHovered 
            ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))' 
            : 'drop-shadow(0 1.5px 3.5px rgba(0,0,0,0.08))',
        }}
      />

      {/* ოკლუზიური მაგიდის შიდა მინანქრის საზღვარი (Enamel Marginal Shelf) */}
      {!isMissing && (
        <path
          d={
            coord.type === 'molar'
              ? (isUpper
                  ? "M -12 0 C -12 -5 -9 -12 -5 -12 C -2 -12 -1 -10 0 -10 C 1 -10 2 -12 5 -12 C 9 -12 12 -7 12 -2 C 12 3 10 11 5 12 C 2 12 1 10 0 10 C -1 10 -2 12 -6 12 C -10 12 -12 6 -12 0 Z"
                  : "M -12 0 C -12 -5 -9 -11 -5 -11 C -2 -11 -1 -10 0 -10 C 1 -10 2 -11 5 -11 C 9 -11 12 -6 12 0 C 12 5 9 12 5 12 C 2 12 1 10 0 10 C -1 10 -2 12 -5 12 C -10 12 -12 6 -12 0 Z")
              : coord.type === 'premolar'
              ? (isUpper
                  ? "M -9 0 C -10 -5 -5 -11 0 -11 C 5 -11 10 -5 9 0 C 10 5 5 11 0 11 C -5 11 -10 5 -9 0 Z"
                  : "M -9 0 C -10 5 -5 11 0 11 C 5 11 10 5 9 0 C 10 -5 5 -11 0 -11 C -5 -11 -10 -5 -9 0 Z")
              : coord.type === 'canine'
              ? (isUpper
                  ? "M 0 -14 C 4 -11 10 -6 10 1 C 10 6 6 11 0 12 C -6 11 -10 6 -10 1 C -10 -6 -4 -11 0 -14 Z"
                  : "M 0 14 C 4 11 10 6 10 -1 C 10 -6 6 -11 0 -12 C -6 -11 -10 -6 -10 -1 C -10 6 -4 11 0 14 Z")
              : (isUpper
                  ? "M -9 -8 C -4 -9.5 4 -9.5 9 -8 C 10 -3 8 4 5 9 C 2 11 -2 11 -5 9 C -8 4 -10 -3 -9 -8 Z"
                  : "M -7 7 C -3 8.5 3 8.5 7 7 C 8 3 6 -3 4 -8 C 2 -10 -2 -10 -4 -8 C -6 -3 -8 3 -7 7 Z")
          }
          fill="none"
          stroke={currentStatus.stroke}
          strokeWidth="0.8"
          opacity={isHovered ? 0.35 : 0.22}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* ოკლუზიური ანატომიური ღარები, ბორცვები და რელიეფი (Authentic Fissures, Ridges & Cusps) */}
      {!isMissing && (
        <g opacity={isHovered ? 0.75 : 0.5} stroke={currentStatus.stroke} fill="none">
          {coord.type === 'molar' && (
            <>
              {/* მთავარი ანატომიური ჯვარედინი ღარი ბუნებრივი სიმრუდით */}
              <path
                d="M -11 0 C -5 -0.5 5 0.5 11 0 M 0 -10 C -0.5 -4 0.5 4 0 10"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              {/* სამკუთხა ფოსოების განშტოებები (Triangular fossae fissures) */}
              <path
                d="M -11 0 L -13 -4 M -11 0 L -13 4 M 11 0 L 13 -4 M 11 0 L 13 4"
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* ირიბი ქედი (Oblique ridge) ზედა მოლარებისთვის */}
              {isUpper && (
                <path
                  d="M -6 7 C -2 3 3 -2 7 -6"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  opacity="0.4"
                />
              )}
              {/* ცენტრალური ფოსო (Central Fossa Pit) */}
              <circle cx="0" cy="0" r="2.2" fill={currentStatus.stroke} />
              {/* 4 ბორცვის ანატომიური წვერო (Cusp apices) */}
              <circle cx="-7" cy="-7" r="1.1" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="7" cy="-7" r="1.1" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="-7" cy="7" r="1.1" fill={currentStatus.stroke} opacity="0.6" />
              <circle cx="7" cy="7" r="1.1" fill={currentStatus.stroke} opacity="0.6" />
            </>
          )}

          {coord.type === 'premolar' && (
            <>
              {/* ბორცვთაშორისი ცენტრალური ღარი და სამკუთხა განშტოებები */}
              <path
                d="M -8 0 C -4 -0.5 4 0.5 8 0 M -8 0 L -10 -3 M -8 0 L -10 3 M 8 0 L 10 -3 M 8 0 L 10 3"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              {/* ბორცვების ქედები და მცირე ფოსოები */}
              <circle cx="-4" cy="0" r="1.4" fill={currentStatus.stroke} />
              <circle cx="4" cy="0" r="1.4" fill={currentStatus.stroke} />
              <path
                d={isUpper ? "M 0 -11 L 0 -5 M 0 11 L 0 5" : "M 0 11 L 0 5 M 0 -11 L 0 -5"}
                strokeWidth="0.9"
                opacity="0.4"
                strokeLinecap="round"
              />
            </>
          )}

          {coord.type === 'canine' && (
            <>
              {/* ეშვის გამოკვეთილი გრძივი ქედი წვეროდან ძირამდე */}
              <path
                d={`M 0 ${isUpper ? -17 : 17} C 0 ${isUpper ? -8 : 8} 0 ${isUpper ? 2 : -2} 0 ${isUpper ? 11 : -11}`}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* ეშვის წვეროს ბუნებრივი რელიეფი */}
              <circle cx="0" cy={isUpper ? -6 : 6} r="2" fill={currentStatus.stroke} />
              <path
                d={isUpper ? "M -9 -2 C -4 4 4 4 9 -2" : "M -9 2 C -4 -4 4 -4 9 2"}
                strokeWidth="0.8"
                opacity="0.35"
              />
            </>
          )}

          {coord.type === 'incisor' && (
            <>
              {/* საჭრელი კიდის ბრტყელი ფასეტი */}
              <path
                d={isUpper ? "M -10 -9 C -4 -10 4 -10 10 -9" : "M -8 8 C -3 9.5 3 9.5 8 8"}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* მამელონების განმყოფელი გრძივი ღარები */}
              <path
                d={isUpper 
                  ? "M -4 -8 L -4 1 M 4 -8 L 4 1" 
                  : "M -3 7 L -3 -1 M 3 7 L 3 -1"}
                strokeWidth="0.9"
                opacity="0.35"
                strokeDasharray="1.5 2"
              />
              {/* ცინგულუმის რელიეფი */}
              <circle cx="0" cy={isUpper ? 7 : -7} r="1.5" fill={currentStatus.stroke} opacity="0.4" />
            </>
          )}
        </g>
      )}

      {/* სტატუსის სპეციფიკური ინდიკატორები (ბუნებრივი ანატომიური რესტავრაციები და პათოლოგიები) */}
      {status === 'caries' && (
        /* კარიესი: ორგანული ანატომიური ლაქა ცენტრალურ ფოსოში/ღარში */
        <g>
          <path
            d="M -3 -2 C 0 -4 4 -3 5 0 C 6 3 2 5 -1 4 C -4 3 -5 -1 -3 -2 Z"
            fill="#D97706"
            opacity="0.95"
          />
          <circle cx="0.5" cy="0.5" r="2" fill="#92400E" />
        </g>
      )}

      {status === 'pulpitis' && (
        /* პულპიტი: ანთებითი პულპური ჰიპერემიის სიღრმისეული ნათება */
        <g>
          <circle cx="0" cy="0" r="7.5" fill="#EF4444" opacity="0.25" />
          <circle cx="0" cy="0" r="5" fill="#DC2626" opacity="0.85" />
          <circle cx="0" cy="0" r="2.5" fill="#991B1B" />
        </g>
      )}

      {status === 'filling' && (
        /* ბჟენი: ანატომიური ოკლუზიური რესტავრაცია (Class I composite restoration), რომელიც იმეორებს ღარებს და არა ოთხკუთხედს! */
        <path
          d="M -7 -1 C -4 -2 -2 -5 0 -5 C 2 -5 4 -2 7 -1 C 8 1 6 4 3 3 C 2 5 -2 5 -3 3 C -6 4 -8 2 -7 -1 Z"
          fill="#2563EB"
          opacity="0.9"
        />
      )}

      {status === 'implant' && (
        /* იმპლანტი: თანამედროვე ტიტანის ჰექსაგონალური აბატმენტი და ხრახნის პროფილი */
        <g stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="0" cy="0" r="6" fill="#4F46E5" opacity="0.25" />
          <polygon points="0,-4.5 3.9,-2.25 3.9,2.25 0,4.5 -3.9,2.25 -3.9,-2.25" fill="#4F46E5" opacity="0.75" />
          <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
        </g>
      )}

      {isMissing && (
        /* ამოღებული კბილი: კლინიკური დიაგონალური გადახაზვა */
        <path d="M -9 -9 L 9 9 M -9 9 L 9 -9" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      )}

      {/* კომენტარის ინდიკატორი */}
      {comment && (
        <circle 
          cx={haloRx - 6} 
          cy={-haloRy + 6} 
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

// კბილის ტრადიციული ბარათი (კომპაქტური ცხრილის ხედისთვის - რეალური ფესვიანი ანატომიური პროფილით)
const Tooth = ({ number, status, onClick }) => {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const isMissing = status === 'missing';

  // ანატომიური პროფილის ვექტორები (გვირგვინი + ფესვები)
  const getToothShape = (num) => {
    const lastDigit = parseInt(num.toString().slice(-1));
    // 1, 2: საჭრელი - ბრტყელი გვირგვინი, ერთი კონუსური ფესვი
    if (lastDigit === 1 || lastDigit === 2) {
      return "M7 3 C9 2.5 15 2.5 17 3 C18 6 17.5 10 16 12 C15 14 13.5 18 12 22 C10.5 18 9 14 8 12 C6.5 10 6 6 7 3 Z";
    }
    // 3: ეშვი - წამახვილებული გვირგვინი, მძლავრი გრძელი ფესვი
    if (lastDigit === 3) {
      return "M12 2 C14.5 4 17.5 7 17 11 C16.5 14 14.5 17 12 22 C9.5 17 7.5 14 7 11 C6.5 7 9.5 4 12 2 Z";
    }
    // 4, 5: პრემოლარი - ორბორცვიანი გვირგვინი, წაგრძელებული ფესვი
    if (lastDigit === 4 || lastDigit === 5) {
      return "M6.5 3 C9 2 15 2 17.5 3 C19 6 18 11 16.5 13 C15 15 14 18 13.5 21.5 C13 22 11 22 10.5 21.5 C10 18 9 15 7.5 13 C6 11 5 6 6.5 3 Z";
    }
    // 6, 7, 8: მოლარი - მრავალბორცვიანი განიერი გვირგვინი და ორმაგი/სამმაგი დივერგენტული ფესვები
    return "M5.5 3.5 C8 2 16 2 18.5 3.5 C19.5 6 19 11 17.5 13 C16.5 14 16 16.5 16.5 21 C16.5 22 14.5 22 14 20 C13.5 18 13 16 12 16 C11 16 10.5 18 10 20 C9.5 22 7.5 22 7.5 21 C8 16.5 7.5 14 6.5 13 C5 11 4.5 6 5.5 3.5 Z";
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