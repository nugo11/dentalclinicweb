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
    if (isUpper) {
      return "M -17 0 C -17 -8 -14 -18 -8 -18 C -3 -18 -1 -15 0 -15 C 1 -15 3 -18 8 -18 C 14 -18 18 -12 18 -3 C 18 4 15 16 8 17 C 3 17 2 15 0 15 C -2 15 -4 18 -9 18 C -15 18 -18 10 -17 0 Z";
    } else {
      return "M -18 0 C -18 -8 -14 -17 -8 -17 C -3 -17 -1 -15 0 -15 C 1 -15 3 -17 8 -17 C 14 -17 18 -10 18 0 C 18 8 14 18 8 18 C 3 18 1 15 0 15 C -1 15 -3 18 -8 18 C -15 18 -18 9 -18 0 Z";
    }
  }

  if (type === 'premolar') {
    if (isUpper) {
      return "M -13 0 C -14 -8 -8 -17 0 -17 C 8 -17 14 -8 13 0 C 14 7 8 16 0 16 C -8 16 -14 7 -13 0 Z";
    } else {
      return "M -13 0 C -14 8 -8 17 0 17 C 8 17 14 8 13 0 C 14 -7 8 -16 0 -16 C -8 -16 -14 -7 -13 0 Z";
    }
  }

  if (type === 'canine') {
    if (isUpper) {
      return "M 0 -21 C 6 -17 15 -10 15 1 C 15 9 9 17 0 17 C -9 17 -15 9 -15 1 C -15 -10 -6 -17 0 -21 Z";
    } else {
      return "M 0 21 C 6 17 15 10 15 -1 C 15 -9 9 -17 0 -17 C -9 -17 -15 -9 -15 -1 C -15 10 -6 17 0 21 Z";
    }
  }

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
