import React from 'react';
import { Smartphone, Monitor, Download, ArrowLeft, CheckCircle2, ChevronRight, Share, PlusSquare, Globe, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import MainHeader from '../components/Common/MainHeader';

const Apps = () => {
  const { currentUser } = useAuth();
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
      id: 'web',
      name: 'Web ინტერფეისი',
      icon: <Globe className="text-brand-purple" size={32} />,
      description: 'იმუშავეთ პირდაპირ ბრაუზერიდან გადმოწერის გარეშე. ხელმისაწვდომია ნებისმიერი მოწყობილობიდან.',
      badge: 'ყველაზე მარტივი',
      features: ['არ საჭიროებს ინსტალაციას', 'მუდმივად განახლებული', 'ავტომატური სინქრონიზაცია'],
      action: {
        text: 'გახსენით ბრაუზერში',
        link: '/',
        type: 'link'
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
      icon: <Smartphone className="text-text-main" size={32} />,
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
    <div className="min-h-screen bg-surface-soft font-nino">
      <Helmet>
        <title>გადმოწერეთ აპლიკაცია — AiDent</title>
        <meta name="description" content="AiDent ხელმისაწვდომია ყველა პლატფორმაზე: Windows, Android და iOS. მართეთ თქვენი კლინიკა ნებისმიერი მოწყობილობიდან." />
        <link rel="canonical" href="https://AiDent.ge/apps" />
      </Helmet>

      <MainHeader user={currentUser} />

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black text-text-main tracking-tighter italic mb-6">
            მართეთ კლინიკა <span className="text-brand-purple">ყველგან</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto font-medium">
            ჩვენი პლატფორმა მორგებულია ნებისმიერ მოწყობილობაზე. გადმოწერეთ დესკტოპ ვერსია ან დააინსტალირეთ მობილური აპლიკაცია წამებში.
          </p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {platforms.map((p) => (
            <div key={p.id} className="bg-surface rounded-[32px] border border-border-dark shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-8 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-surface-soft rounded-2xl">
                  {p.icon}
                </div>
                <span className="bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {p.badge}
                </span>
              </div>

              <h3 className="text-2xl font-black text-text-main mb-4 tracking-tight italic">{p.name}</h3>
              <p className="text-text-muted text-sm font-medium mb-8 leading-relaxed">
                {p.description}
              </p>

              <div className="space-y-4 mb-10 flex-1">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-text-muted text-[13px] font-bold">{f}</span>
                  </div>
                ))}
              </div>

              {p.action ? (
                <a 
                  href={p.action.link} 
                  download={p.action.type === 'download' ? true : undefined}
                  className="w-full py-4 bg-brand-deep text-white rounded-2xl flex items-center justify-center gap-3 group transition-all hover:bg-brand-purple shadow-lg shadow-brand-deep/10"
                >
                  {p.action.type === 'download' ? <Download size={20} /> : <Globe size={20} />}
                  <span className="text-xs font-black uppercase tracking-widest">{p.action.text}</span>
                </a>
              ) : (
                <div className="space-y-3 pt-4 border-t border-border-main">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">ინსტალაციის ნაბიჯები:</p>
                  {p.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 bg-surface-soft p-3 rounded-xl">
                      <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center text-text-main shadow-sm">
                        {step.icon}
                      </div>
                      <span className="text-[11px] font-bold text-text-muted">{step.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ / Info */}
        <div className="mt-24 bg-brand-deep rounded-[40px] p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-surface/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black italic tracking-tighter mb-6">გაქვთ კითხვები?</h2>
            <p className="text-white/70 font-medium mb-10 max-w-xl mx-auto">
              თუ ინსტალაციისას რაიმე დაბრკოლება შეგექმნათ, ჩვენი ტექნიკური გუნდი მზად არის დაგეხმაროთ ნებისმიერ დროს.
            </p>
            <div className="flex justify-center">
              <a 
                href="tel:+995555102030" 
                className="inline-flex items-center gap-4 px-10 py-5 bg-surface text-text-main rounded-[24px] shadow-2xl hover:scale-105 transition-all group"
              >
                <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center group-hover:bg-brand-purple group-hover:text-white transition-all">
                  <Phone size={24} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">ტექნიკური მხარდაჭერა</p>
                  <p className="text-xl font-black italic tracking-tighter">+995 555 10 20 30</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-border-dark bg-surface">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest">© 2024 AiDent — ყველა უფლება დაცულია</p>
        </div>
      </footer>
    </div>
  );
};

export default Apps;
