import React from 'react';
import Tooth from './Tooth';

const DentalChart = ({ data, onToothUpdate }) => {
  // FDI სტანდარტული ნუმერაცია
  const upperLeft = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperRight = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerLeft = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerRight = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="bg-white rounded-[40px] p-4 sm:p-10 border border-gray-100 shadow-sm overflow-hidden w-full">
      {/* ლეგენდა */}
      <div className="flex flex-wrap gap-6 mb-12 pb-8 border-b border-gray-50 justify-center">
        <LegendItem color="bg-emerald-500" label="ჯანმრთელი" />
        <LegendItem color="bg-amber-500" label="კარიესი" />
        <LegendItem color="bg-red-500" label="პულპიტი" />
        <LegendItem color="bg-blue-500" label="ბჟენი" />
        <LegendItem color="bg-indigo-500" label="იმპლანტი" />
        <LegendItem color="bg-slate-300" label="ამოღებული" />
      </div>

      <div className="space-y-16">
        {/* ზედა ყბა */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2 bg-slate-50 rounded-full mb-8 border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">ზედა ყბა</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-full">
            {/* ზედა მარცხენა */}
            <div className="flex gap-2 flex-wrap justify-center">
              {upperLeft.map(num => <Tooth key={num} number={num} status={data[num]?.status} onClick={onToothUpdate} />)}
            </div>
            {/* გამყოფი ხაზი */}
            <div className="hidden lg:block w-px h-24 bg-gray-100 mx-2" /> 
            {/* ზედა მარჯვენა */}
            <div className="flex gap-2 flex-wrap justify-center">
              {upperRight.map(num => <Tooth key={num} number={num} status={data[num]?.status} onClick={onToothUpdate} />)}
            </div>
          </div>
        </div>

        {/* ქვედა ყბა */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2 bg-slate-50 rounded-full mb-8 border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">ქვედა ყბა</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-full">
            {/* ქვედა მარცხენა */}
            <div className="flex gap-2 flex-wrap justify-center">
              {lowerLeft.map(num => <Tooth key={num} number={num} status={data[num]?.status} onClick={onToothUpdate} />)}
            </div>
            <div className="hidden lg:block w-px h-24 bg-gray-100 mx-2" />
            {/* ქვედა მარჯვენა */}
            <div className="flex gap-2 flex-wrap justify-center">
              {lowerRight.map(num => <Tooth key={num} number={num} status={data[num]?.status} onClick={onToothUpdate} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
    <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
    <span className="text-[10px] font-black uppercase text-brand-deep tracking-widest">{label}</span>
  </div>
);

export default DentalChart;