import React from 'react';
import { Smartphone, Monitor, Download, ArrowLeft, CheckCircle2, ChevronRight, Share, PlusSquare, Globe, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Apps = () => {
  const platforms = [
    {
      id: 'windows',
      name: 'Windows Desktop',
      icon: <Monitor className="text-blue-500" size={32} />,
      description: 'სრული სამუშაო გამოცდილება თქვენი კომპიუტერისთვის. მუშაობს Windows 10 და 11-ზე.',
      badge: 'რეკომენდირებულია კლინიკისთვის',
      features: ['ავტონომიური აპლიკაცია', 'სწრაფი წვდომა დესკტოპიდან', 'მაღალი წარმადობა'],
      action: {
        text: 'გადმოწერა Windows-ისთვის',
        link: '/DentalHub_Setup.exe',
        type: 'download'
      }
    },
    {
      id: 'android',
      name: 'Android App',
      icon: <Smartphone className="text-emerald-500" size={32} />,
      description: 'მართეთ კლინიკა ნებისმიერი ადგილიდან. დააინსტალირეთ პირდაპირ ბრაუზერიდან.',
      badge: 'PWA ტექნოლოგია',
      features: ['Push შეტყობინებები', 'Offline რეჟიმი', 'მცირე ზომა'],
      steps: [
        { icon: <Globe size={18} />, text: 'გახსენით საიტი Google Chrome-ში' },
        { icon: <div className="text-xs font-black">⋮</div>, text: 'დააჭირეთ მენიუს (სამ წერტილს)' },
        { icon: <Download size={18} />, text: 'აირჩიეთ "მთავარ ეკრანზე დამატება"' }
      ]
    },
    {
      id: 'ios',
      name: 'iOS / iPhone',
      icon: <Smartphone className="text-slate-900" size={32} />,
      description: 'ოპტიმიზირებული გამოცდილება iPhone და iPad მომხმარებლებისთვის.',
      badge: 'Apple ოპტიმიზაცია',
      features: ['Apple-ის სტანდარტები', 'სუფთა ინტერფეისი', 'სწრაფი ნავიგაცია'],
      steps: [
        { icon: <Share size={18} />, text: 'დააჭირეთ "Share" ღილაკს Safari-ში' },
        { icon: <PlusSquare size={18} />, text: 'ჩამოსქროლეთ და აირჩიეთ "Add to Home Screen"' },
        { icon: <CheckCircle2 size={18} />, text: 'დაადასტურეთ დამატება' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-nino">
      <Helmet>
        <title>გადმოწერეთ აპლიკაცია — DentalHub</title>
        <meta name="description" content="DentalHub ხელმისაწვდომია ყველა პლატფორმაზე: Windows, Android და iOS. მართეთ თქვენი კლინიკა ნებისმიერი მოწყობილობიდან." />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-brand-deep transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-wider">მთავარზე დაბრუნება</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-deep rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl italic">D</span>
            </div>
            <span className="font-black text-brand-deep text-xl tracking-tighter italic">DentalHub</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-brand-deep tracking-tighter italic mb-6">
            მართეთ კლინიკა <span className="text-brand-purple">ყველგან</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            ჩვენი პლატფორმა მორგებულია ნებისმიერ მოწყობილობაზე. გადმოწერეთ დესკტოპ ვერსია ან დააინსტალირეთ მობილური აპლიკაცია წამებში.
          </p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {platforms.map((p) => (
            <div key={p.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-8 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  {p.icon}
                </div>
                <span className="bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {p.badge}
                </span>
              </div>

              <h3 className="text-2xl font-black text-brand-deep mb-4 tracking-tight italic">{p.name}</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                {p.description}
              </p>

              <div className="space-y-4 mb-10 flex-1">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-slate-600 text-[13px] font-bold">{f}</span>
                  </div>
                ))}
              </div>

              {p.action ? (
                <a 
                  href={p.action.link} 
                  download={p.action.type === 'download'}
                  className="w-full py-4 bg-brand-deep text-white rounded-2xl flex items-center justify-center gap-3 group transition-all hover:bg-brand-purple shadow-lg shadow-brand-deep/10"
                >
                  <Download size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">{p.action.text}</span>
                </a>
              ) : (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ინსტალაციის ნაბიჯები:</p>
                  {p.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-deep shadow-sm">
                        {step.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{step.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ / Info */}
        <div className="mt-24 bg-brand-deep rounded-[40px] p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black italic tracking-tighter mb-6">გაქვთ კითხვები?</h2>
            <p className="text-white/70 font-medium mb-10 max-w-xl mx-auto">
              თუ ინსტალაციისას რაიმე დაბრკოლება შეგექმნათ, ჩვენი ტექნიკური გუნდი მზად არის დაგეხმაროთ ნებისმიერ დროს.
            </p>
            <div className="flex justify-center">
              <a 
                href="tel:+995555102030" 
                className="inline-flex items-center gap-4 px-10 py-5 bg-white text-brand-deep rounded-[24px] shadow-2xl hover:scale-105 transition-all group"
              >
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center group-hover:bg-brand-purple group-hover:text-white transition-all">
                  <Phone size={24} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ტექნიკური მხარდაჭერა</p>
                  <p className="text-xl font-black italic tracking-tighter">+995 555 10 20 30</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2024 DentalHub — ყველა უფლება დაცულია</p>
        </div>
      </footer>
    </div>
  );
};

export default Apps;
