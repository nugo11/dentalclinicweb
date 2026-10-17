import React, { useState, useMemo } from 'react';
import Tooth, { SvgTooth, TEETH_COORDINATES, STATUS_CONFIG, TOOTH_NAMES_KA } from './Tooth';
import { 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Grid, 
  Info, 
  Edit3, 
  MessageSquare, 
  RotateCcw,
  ChevronRight
} from 'lucide-react';

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const Q1_TEETH = [18, 17, 16, 15, 14, 13, 12, 11];
const Q2_TEETH = [21, 22, 23, 24, 25, 26, 27, 28];
const Q4_TEETH = [48, 47, 46, 45, 44, 43, 42, 41];
const Q3_TEETH = [31, 32, 33, 34, 35, 36, 37, 38];

const DentalChart = ({ data = {}, onToothUpdate }) => {
  // ხედვის რეჟიმი: 'all' (სრული რკალი), 'upper' (ზედა ყბა), 'lower' (ქვედა ყბა), 'grid' (კლასიკური ცხრილი)
  const [viewMode, setViewMode] = useState('all');
  
  // აქტიური სტატუსის ფილტრი (ჰაილაითი)
  const [activeFilter, setActiveFilter] = useState(null);

  // აქტიური კბილის ინსპექტირება
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [selectedTooth, setSelectedTooth] = useState(16);

  // სტატუსების სტატისტიკური რაოდენობები
  const stats = useMemo(() => {
    const counts = { healthy: 0, caries: 0, pulpitis: 0, filling: 0, implant: 0, missing: 0 };
    const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH];
    allTeeth.forEach(num => {
      const st = data[num]?.status || 'healthy';
      if (counts[st] !== undefined) counts[st]++;
      else counts.healthy++;
    });
    return counts;
  }, [data]);

  // ინსპექტირებადი კბილის ნომერი და მონაცემი
  const inspectedNumber = hoveredTooth || selectedTooth || 16;
  const inspectedData = data[inspectedNumber] || { status: 'healthy', comment: '' };
  const inspectedCoord = TEETH_COORDINATES[inspectedNumber];
  const inspectedStatus = STATUS_CONFIG[inspectedData.status] || STATUS_CONFIG.healthy;
  const inspectedName = TOOTH_NAMES_KA[inspectedNumber] || `კბილი #${inspectedNumber}`;

  // SVG viewBox დინამიური რეგულირება ხედვის რეჟიმის მიხედვით (ცენტრი X=400, Y=400)
  const getViewBox = () => {
    switch (viewMode) {
      case 'upper':
        return '80 30 640 375';
      case 'lower':
        return '80 395 640 375';
      case 'all':
      default:
        return '80 30 640 740';
    }
  };

  const visibleTeeth = useMemo(() => {
    if (viewMode === 'upper') return UPPER_TEETH;
    if (viewMode === 'lower') return LOWER_TEETH;
    return [...UPPER_TEETH, ...LOWER_TEETH];
  }, [viewMode]);

  return (
    <div className="w-full space-y-6">
      {/* 1. ზედა პანელი: ხედვის რეჟიმები და ორიენტაციის მინიშნება */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-border-main">
        {/* ხედვის რეჟიმის გადამრთველი */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-soft rounded-2xl border border-border-main self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'all'
                ? 'bg-surface text-brand-purple shadow-sm border border-border-main'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Layers size={14} />
            <span>სრული რკალი (32)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('upper')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'upper'
                ? 'bg-surface text-brand-purple shadow-sm border border-border-main'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <ArrowUp size={14} />
            <span>ზედა ყბა (16)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('lower')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'lower'
                ? 'bg-surface text-brand-purple shadow-sm border border-border-main'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <ArrowDown size={14} />
            <span>ქვედა ყბა (16)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'grid'
                ? 'bg-surface text-brand-purple shadow-sm border border-border-main'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Grid size={14} />
            <span>ცხრილი (FDI)</span>
          </button>
        </div>

        {/* კლინიკური ორიენტაციის ინფო */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted">
          <Info size={14} className="text-brand-purple shrink-0" />
          <span>FDI სტანდარტი · <strong>R</strong> = პაციენტის მარჯვენა, <strong>L</strong> = მარცხენა</span>
        </div>
      </div>

      {/* 2. სტატუსების ფილტრის ბარათები (ინტერაქტიული ლეგენდა) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setActiveFilter(null)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
            activeFilter === null
              ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
              : 'bg-surface-soft text-text-muted border-border-main hover:border-brand-purple/40 hover:text-text-main'
          }`}
        >
          <span>ყველა</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10 dark:bg-white/10 font-mono">
            32
          </span>
        </button>

        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = stats[key] || 0;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(isActive ? null : key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black border transition-all cursor-pointer ${
                isActive
                  ? `${cfg.bgSolid} text-white border-transparent shadow-sm scale-105`
                  : `bg-surface-soft text-text-main border-border-main hover:border-current ${cfg.accent}`
              }`}
            >
              <div 
                className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white' : cfg.bgSolid}`} 
              />
              <span>{cfg.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                isActive ? 'bg-black/20 text-white' : 'bg-surface text-text-muted border border-border-main'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {activeFilter && (
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>ფილტრის გაუქმება</span>
          </button>
        )}
      </div>

      {/* 3. მთავარი ვიზუალური არეალი (ანატომიური რკალი ან ცხრილი) */}
      {viewMode === 'grid' ? (
        /* FDI კვადრანტული ცხრილის ხედი */
        <div className="bg-surface-soft/40 p-4 sm:p-8 rounded-[32px] border border-border-main space-y-8">
          {/* ზედა ყბა */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <ArrowUp size={14} className="text-brand-purple" /> ზედა ყბა (Maxilla)
              </span>
              <span className="text-[10px] font-bold text-text-muted">Q1 (18-11) | Q2 (21-28)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-2xl border border-border-main">
                <div className="text-[10px] font-black uppercase text-text-muted mb-3 flex items-center justify-between">
                  <span>Q1 · ზედა მარჯვენა</span>
                  <span className="text-brand-purple">R</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Q1_TEETH.map(num => (
                    <Tooth
                      key={num}
                      number={num}
                      status={data[num]?.status}
                      onClick={() => onToothUpdate && onToothUpdate(num)}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface rounded-2xl border border-border-main">
                <div className="text-[10px] font-black uppercase text-text-muted mb-3 flex items-center justify-between">
                  <span>Q2 · ზედა მარცხენა</span>
                  <span className="text-brand-purple">L</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Q2_TEETH.map(num => (
                    <Tooth
                      key={num}
                      number={num}
                      status={data[num]?.status}
                      onClick={() => onToothUpdate && onToothUpdate(num)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ქვედა ყბა */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                <ArrowDown size={14} className="text-brand-purple" /> ქვედა ყბა (Mandible)
              </span>
              <span className="text-[10px] font-bold text-text-muted">Q4 (48-41) | Q3 (31-38)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-2xl border border-border-main">
                <div className="text-[10px] font-black uppercase text-text-muted mb-3 flex items-center justify-between">
                  <span>Q4 · ქვედა მარჯვენა</span>
                  <span className="text-brand-purple">R</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Q4_TEETH.map(num => (
                    <Tooth
                      key={num}
                      number={num}
                      status={data[num]?.status}
                      onClick={() => onToothUpdate && onToothUpdate(num)}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface rounded-2xl border border-border-main">
                <div className="text-[10px] font-black uppercase text-text-muted mb-3 flex items-center justify-between">
                  <span>Q3 · ქვედა მარცხენა</span>
                  <span className="text-brand-purple">L</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Q3_TEETH.map(num => (
                    <Tooth
                      key={num}
                      number={num}
                      status={data[num]?.status}
                      onClick={() => onToothUpdate && onToothUpdate(num)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ანატომიური რკალის ვექტორული SVG ტილო */
        <div className="relative bg-surface-soft/40 rounded-[36px] border border-border-main p-2 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
          
          {/* რკალის ფონური დეკორაციები */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.04),transparent_70%)] pointer-events-none" />

          {/* მასშტაბირებადი SVG რკალი */}
          <div className="w-full max-w-[620px] aspect-[640/740] flex items-center justify-center">
            <svg
              viewBox={getViewBox()}
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* ზედა ალვეოლარული მორჩის გრადიენტი */}
                <linearGradient id="upperGumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.01" />
                </linearGradient>

                {/* ქვედა ალვეოლარული მორჩის გრადიენტი */}
                <linearGradient id="lowerGumGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* 1. ანატომიური ალვეოლარული ძვლის/ღრძილის რკალის კონტურები */}
              {(viewMode === 'all' || viewMode === 'upper') && (
                <g className="pointer-events-none">
                  {/* ზედა რკალის ალვეოლარული ლენტი */}
                  <path
                    d="M 105 385 C 120 220, 230 70, 400 48 C 570 70, 680 220, 695 385 C 640 350, 565 210, 480 120 C 440 98, 360 98, 320 120 C 235 210, 160 350, 105 385 Z"
                    fill="url(#upperGumGradient)"
                    stroke="rgba(124, 58, 237, 0.16)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  {/* ზედა სასის კონტური */}
                  <path
                    d="M 200 350 Q 400 180 600 350"
                    fill="none"
                    stroke="rgba(124, 58, 237, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </g>
              )}

              {(viewMode === 'all' || viewMode === 'lower') && (
                <g className="pointer-events-none">
                  {/* ქვედა რკალის ალვეოლარული ლენტი */}
                  <path
                    d="M 115 415 C 130 580, 240 730, 400 752 C 560 730, 670 580, 685 415 C 630 450, 555 590, 470 680 C 435 700, 365 700, 330 680 C 245 590, 170 450, 115 415 Z"
                    fill="url(#lowerGumGradient)"
                    stroke="rgba(124, 58, 237, 0.16)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  {/* ქვედა ენისქვეშა რკალის კონტური */}
                  <path
                    d="M 210 450 Q 400 620 590 450"
                    fill="none"
                    stroke="rgba(124, 58, 237, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </g>
              )}

              {/* 2. ცენტრალური ღერძები და კლინიკური გამყოფები */}
              {viewMode === 'all' && (
                <g className="pointer-events-none opacity-40">
                  {/* ვერტიკალური შუახაზი (Sagittal Midline) */}
                  <line 
                    x1="400" y1="50" x2="400" y2="350" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" 
                    className="text-brand-purple"
                  />
                  <line 
                    x1="400" y1="445" x2="400" y2="750" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" 
                    className="text-brand-purple"
                  />

                  {/* ჰორიზონტალური ოკლუზიური გამყოფი ხაზი */}
                  <line 
                    x1="180" y1="400" x2="620" y2="400" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" 
                    className="text-border-main"
                  />
                </g>
              )}

              {/* 3. კვადრანტებისა და ორიენტაციის ნიშნულები */}
              {viewMode === 'all' && (
                <g className="pointer-events-none select-none">
                  {/* პაციენტის მარჯვენა მხარე (Viewer's Left) */}
                  <g transform="translate(130, 400)">
                    <rect x="-16" y="-11" width="32" height="22" rx="7" fill="rgba(124, 58, 237, 0.1)" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" className="text-[11px] font-black fill-brand-purple">R</text>
                  </g>

                  {/* პაციენტის მარცხენა მხარე (Viewer's Right) */}
                  <g transform="translate(670, 400)">
                    <rect x="-16" y="-11" width="32" height="22" rx="7" fill="rgba(124, 58, 237, 0.1)" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" className="text-[11px] font-black fill-brand-purple">L</text>
                  </g>

                  {/* კვადრანტების კლინიკური სახელწოდებები */}
                  <text x="230" y="372" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q1 · ზედა მარჯვენა</text>
                  <text x="570" y="372" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q2 · ზედა მარცხენა</text>
                  <text x="230" y="432" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q4 · ქვედა მარჯვენა</text>
                  <text x="570" y="432" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q3 · ქვედა მარცხენა</text>
                </g>
              )}

              {/* 4. ანატომიური კბილები */}
              {visibleTeeth.map(num => {
                const toothData = data[num] || { status: 'healthy', comment: '' };
                const currentStatus = toothData.status || 'healthy';
                const isDimmed = activeFilter && currentStatus !== activeFilter;
                const isHighlighted = activeFilter && currentStatus === activeFilter;
                const isHovered = hoveredTooth === num || selectedTooth === num;

                return (
                  <SvgTooth
                    key={num}
                    number={num}
                    status={currentStatus}
                    comment={toothData.comment}
                    isDimmed={isDimmed}
                    isHighlighted={isHighlighted}
                    isHovered={isHovered}
                    onHover={(t) => setHoveredTooth(t)}
                    onClick={(t) => {
                      setSelectedTooth(t);
                      if (onToothUpdate) onToothUpdate(t);
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* 4. არჩეული/ინსპექტირებული კბილის დეტალური ბარათი (ფიქსირებული ზომა - არ დახტის!) */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-border-main shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-h-[104px]">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* FDI ნომრის დიდი სამკერდე ნიშანი */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-surface-soft border-2 border-border-main flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-text-muted leading-none">კბილი</span>
            <span className="text-lg sm:text-xl font-black text-brand-purple leading-tight">#{inspectedNumber}</span>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            {/* ხაზი 1: კბილის სრული სახელი (მარტო საკუთარ ხაზზე, არაფერი არ ემატება და არ იხვევა!) */}
            <h4 className="text-sm sm:text-base font-black text-text-main truncate">
              {inspectedName}
            </h4>

            {/* ხაზი 2: სტატუსის ბეიჯი და კვადრანტის ინფორმაცია (სტატუსი ყოველთვის აქ დგას, ამიტომ კბილის სახელის სიგრძე მას ვერასდროს ვერ ამოძრავებს!) */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shrink-0 ${inspectedStatus.badgeBg} ${inspectedStatus.badgeText} ${inspectedStatus.badgeBorder}`}>
                {inspectedStatus.label}
              </span>
              <span className="text-text-muted/40 shrink-0">•</span>
              <p className="text-[11px] sm:text-xs text-text-muted truncate">
                <span>კვადრანტი: Q{inspectedCoord?.quad || 1}</span>
                <span className="mx-1.5">•</span>
                <span>ტიპი: {inspectedCoord?.type === 'molar' ? 'მოლარი' : inspectedCoord?.type === 'premolar' ? 'პრემოლარი' : inspectedCoord?.type === 'canine' ? 'ეშვი' : 'საჭრელი'}</span>
                <span className="mx-1.5">•</span>
                <span>ყბა: {inspectedCoord?.jaw === 'upper' ? 'ზედა' : 'ქვედა'}</span>
              </p>
            </div>

            {/* ხაზი 3: კომენტარის რეზერვირებული ხაზი (ყოველთვის h-5, ფიქსირებული) */}
            <div className="h-5 flex items-center gap-1.5 text-xs pt-0.5">
              {inspectedData.comment ? (
                <span className="text-brand-purple font-medium truncate flex items-center gap-1.5">
                  <MessageSquare size={13} className="shrink-0" />
                  <span className="italic truncate">"{inspectedData.comment}"</span>
                </span>
              ) : (
                <span className="text-text-muted/40 text-[11px] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-border-main shrink-0" />
                  <span>შენიშვნა არ არის</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* მოქმედების ღილაკი */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onToothUpdate && onToothUpdate(inspectedNumber)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-brand-purple text-white text-xs font-black hover:bg-brand-purple/90 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Edit3 size={15} />
            <span>სტატუსის შეცვლა (#{inspectedNumber})</span>
            <ChevronRight size={14} className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DentalChart;