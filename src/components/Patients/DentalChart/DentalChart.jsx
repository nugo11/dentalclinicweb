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

  // SVG viewBox დინამიური რეგულირება ხედვის რეჟიმის მიხედვით
  const getViewBox = () => {
    switch (viewMode) {
      case 'upper':
        return '130 15 700 375';
      case 'lower':
        return '130 425 700 380';
      case 'all':
      default:
        return '120 15 720 805';
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
        <div className="relative bg-surface-soft/40 rounded-[36px] border border-border-main p-2 sm:p-6 flex flex-col items-center justify-center overflow-hidden transition-all duration-300">
          
          {/* რკალის ფონური დეკორაციები */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.04),transparent_70%)] pointer-events-none" />

          {/* მასშტაბირებადი SVG რკალი */}
          <div className="w-full max-w-[680px] aspect-[720/805] max-h-[640px] flex items-center justify-center">
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
                <g className="transition-opacity duration-300 pointer-events-none">
                  {/* ზედა რკალის ალვეოლარული ლენტი */}
                  <path
                    d="M 145 365 C 160 220, 260 85, 480 30 C 700 85, 800 220, 815 365 C 755 330, 690 230, 580 135 C 530 95, 430 95, 380 135 C 270 230, 205 330, 145 365 Z"
                    fill="url(#upperGumGradient)"
                    stroke="rgba(124, 58, 237, 0.18)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* ზედა სასის კონტური */}
                  <path
                    d="M 240 330 Q 480 160 720 330"
                    fill="none"
                    stroke="rgba(124, 58, 237, 0.12)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </g>
              )}

              {(viewMode === 'all' || viewMode === 'lower') && (
                <g className="transition-opacity duration-300 pointer-events-none">
                  {/* ქვედა რკალის ალვეოლარული ლენტი */}
                  <path
                    d="M 160 455 C 175 595, 275 735, 480 790 C 685 735, 785 595, 800 455 C 740 490, 675 590, 575 685 C 525 725, 435 725, 385 685 C 285 590, 220 490, 160 455 Z"
                    fill="url(#lowerGumGradient)"
                    stroke="rgba(124, 58, 237, 0.18)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* ქვედა ენისქვეშა რკალის კონტური */}
                  <path
                    d="M 255 490 Q 480 660 705 490"
                    fill="none"
                    stroke="rgba(124, 58, 237, 0.12)"
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
                    x1="480" y1="35" x2="480" y2="350" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" 
                    className="text-brand-purple"
                  />
                  <line 
                    x1="480" y1="470" x2="480" y2="785" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" 
                    className="text-brand-purple"
                  />

                  {/* ჰორიზონტალური ოკლუზიური გამყოფი ხაზი */}
                  <line 
                    x1="220" y1="410" x2="740" y2="410" 
                    stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" 
                    className="text-border-main"
                  />
                </g>
              )}

              {/* 3. კვადრანტებისა და ორიენტაციის ნიშნულები */}
              {viewMode === 'all' && (
                <g className="pointer-events-none select-none">
                  {/* პაციენტის მარჯვენა მხარე (Viewer's Left) */}
                  <g transform="translate(160, 410)">
                    <rect x="-18" y="-12" width="36" height="24" rx="8" fill="rgba(124, 58, 237, 0.1)" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1" />
                    <text x="0" y="4.5" textAnchor="middle" className="text-[12px] font-black fill-brand-purple">R</text>
                  </g>

                  {/* პაციენტის მარცხენა მხარე (Viewer's Right) */}
                  <g transform="translate(800, 410)">
                    <rect x="-18" y="-12" width="36" height="24" rx="8" fill="rgba(124, 58, 237, 0.1)" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1" />
                    <text x="0" y="4.5" textAnchor="middle" className="text-[12px] font-black fill-brand-purple">L</text>
                  </g>

                  {/* კვადრანტების კლინიკური სახელწოდებები */}
                  <text x="250" y="375" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q1 · ზედა მარჯვენა</text>
                  <text x="710" y="375" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q2 · ზედა მარცხენა</text>
                  <text x="250" y="450" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q4 · ქვედა მარჯვენა</text>
                  <text x="710" y="450" textAnchor="middle" className="text-[10px] font-bold fill-text-muted opacity-60">Q3 · ქვედა მარცხენა</text>
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

      {/* 4. არჩეული/ინსპექტირებული კბილის დეტალური ბარათი (Live Inspector) */}
      <div className="bg-surface rounded-3xl p-5 border border-border-main shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          {/* FDI ნომრის დიდი სამკერდე ნიშანი */}
          <div className="w-14 h-14 rounded-2xl bg-surface-soft border-2 border-border-main flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted leading-none">კბილი</span>
            <span className="text-xl font-black text-brand-purple leading-tight">#{inspectedNumber}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-base font-black text-text-main">
                {inspectedName}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${inspectedStatus.badgeBg} ${inspectedStatus.badgeText} ${inspectedStatus.badgeBorder}`}>
                {inspectedStatus.label}
              </span>
            </div>

            {/* კვადრანტისა და ტიპის ინფორმაცია */}
            <p className="text-xs text-text-muted flex items-center gap-2">
              <span>კვადრანტი: Q{inspectedCoord?.quad || 1}</span>
              <span>•</span>
              <span>ტიპი: {inspectedCoord?.type === 'molar' ? 'მოლარი' : inspectedCoord?.type === 'premolar' ? 'პრემოლარი' : inspectedCoord?.type === 'canine' ? 'ეშვი' : 'საჭრელი'}</span>
              <span>•</span>
              <span>ყბა: {inspectedCoord?.jaw === 'upper' ? 'ზედა' : 'ქვედა'}</span>
            </p>

            {/* კომენტარი თუ არსებობს */}
            {inspectedData.comment && (
              <div className="flex items-center gap-2 pt-1 text-xs text-brand-purple font-medium">
                <MessageSquare size={13} className="shrink-0" />
                <span className="italic">"{inspectedData.comment}"</span>
              </div>
            )}
          </div>
        </div>

        {/* მოქმედების ღილაკი */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onToothUpdate && onToothUpdate(inspectedNumber)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-purple text-white text-xs font-black hover:bg-brand-purple/90 transition-all shadow-md active:scale-95 cursor-pointer"
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