import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import MainHeader from "../components/Common/MainHeader";
import { 
  Mail, Phone, MapPin, Send, MessageSquare, 
  Clock, Globe, ArrowRight, CheckCircle2, Sparkles
} from "lucide-react";

const ContactPage = ({ user }) => {
  const [formStatus, setFormStatus] = useState(null); // 'sending', 'sent', null

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => setFormStatus('sent'), 1500);
  };

  return (
    <>
      <Helmet>
        <title>კონტაქტი — DentalHub</title>
        <meta name="description" content="დაგვიკავშირდით DentalHub-ის გუნდს ნებისმიერ დროს." />
        <link rel="canonical" href="https://dentalhub.ge/contact" />
      </Helmet>
      
      <div className="min-h-screen bg-surface font-nino selection:bg-brand-purple/10 overflow-x-hidden">
        <MainHeader user={user} />

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-[#8500ff1c] to-surface dark:from-brand-deep dark:to-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8500ff10] dark:bg-brand-purple/10 blur-[100px] rounded-full -mr-20 -mt-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/[0.03] dark:bg-blue-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 text-[10px] font-black uppercase tracking-widest mb-8 animate-bounce-slow shadow-sm">
              <MessageSquare size={12} className="mr-2" /> Support & Sales
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-text-main italic tracking-tighter leading-[0.9] mb-8 pr-4">
              დაგვიკავშირდით <br />
              <span className="bg-gradient-to-r from-brand-purple to-blue-600 bg-clip-text text-transparent italic pr-4">ნებისმიერ დროს</span>
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto font-medium italic leading-relaxed">
              ჩვენი გუნდი მზად არის გიპასუხოთ ნებისმიერ კითხვაზე DentalHub-ის დანერგვასა და გამოყენებასთან დაკავშირებით.
            </p>
          </div>
        </section>

        {/* Contact Grid */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Contact Info Cards */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
               <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-surface p-8 rounded-[40px] border border-border-main shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-purple group-hover:text-white transition-all">
                      <Mail size={24} />
                    </div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">ელ-ფოსტა</h4>
                    <p className="text-xl font-black text-text-main italic">hello@dentalhub.ge</p>
                  </div>

                  <div className="bg-surface p-8 rounded-[40px] border border-border-main shadow-sm hover:shadow-xl transition-all group">
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Phone size={24} />
                    </div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">ტელეფონი</h4>
                    <p className="text-xl font-black text-text-main italic">+995 555 10 20 30</p>
                  </div>
               </div>

               <div className="bg-brand-deep p-10 md:p-12 rounded-[56px] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/10 blur-[80px] rounded-full -mr-20 -mt-20 transition-all group-hover:bg-brand-purple/20"></div>
                  <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 border border-white/10">
                       <MapPin size={40} className="text-brand-purple" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter mb-4 uppercase">ჩვენი ოფისი</h3>
                      <p className="text-white/60 font-medium leading-relaxed italic mb-6">
                        თბილისი, ალექსანდრე ყაზბეგის გამზირი 12ა, <br />
                        სართული 4, ოფისი 402.
                      </p>
                      <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-purple">
                            <Clock size={14} /> 10:00 - 19:00
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                            <Globe size={14} /> ორშ-პარ
                         </div>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-surface-soft p-12 rounded-[56px] border border-border-main space-y-6">
                  <h4 className="text-lg font-black text-text-main italic uppercase tracking-tighter flex items-center gap-3">
                    <Sparkles size={20} className="text-brand-purple" /> რას მიიღებთ?
                  </h4>
                  <ul className="space-y-4">
                    {[
                      "პერსონალური მენეჯერის მხარდაჭერა",
                      "უფასო ტრენინგი თქვენი გუნდისთვის",
                      "სისტემის მორგება თქვენს კლინიკაზე",
                      "უსაფრთხოების გარანტირებული პირობები"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest italic">
                        <CheckCircle2 size={16} className="text-brand-purple" /> {item}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>

            {/* Contact Form */}
            <div className="bg-surface p-10 md:p-16 rounded-[60px] border border-border-main shadow-2xl relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
               {formStatus === 'sent' ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[40px] flex items-center justify-center animate-bounce">
                      <CheckCircle2 size={48} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic tracking-tighter text-text-main mb-4 uppercase">შეტყობინება გაგზავნილია!</h3>
                      <p className="text-text-muted font-bold italic leading-relaxed max-w-sm">
                        გმადლობთ დაინტერესებისთვის. DentalHub-ის მენეჯერი 1 საათის განმავლობაში დაგიკავშირდებათ.
                      </p>
                    </div>
                    <button 
                      onClick={() => setFormStatus(null)}
                      className="text-brand-purple font-black uppercase text-[10px] tracking-[0.3em] hover:opacity-70 transition-all flex items-center gap-2"
                    >
                      ახალი შეტყობინება <ArrowRight size={14} />
                    </button>
                 </div>
               ) : (
                 <>
                   <div className="mb-12">
                     <h2 className="text-3xl font-black text-text-main italic tracking-tighter uppercase mb-4 leading-none">მოგვწერეთ</h2>
                     <p className="text-text-muted font-bold italic uppercase tracking-widest text-[11px]">ჩვენი გუნდი მზად არის დაგეხმაროთ</p>
                   </div>
                   
                   <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="grid sm:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 italic">თქვენი სახელი</label>
                          <input required type="text" placeholder="მაგ: დავითი" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-3xl px-8 py-5 outline-none font-bold text-sm transition-all focus:bg-surface shadow-sm" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 italic">ტელეფონი</label>
                          <input required type="tel" placeholder="+995" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-3xl px-8 py-5 outline-none font-bold text-sm transition-all focus:bg-surface shadow-sm" />
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 italic">ელ-ფოსტა</label>
                        <input required type="email" placeholder="example@dental.ge" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-3xl px-8 py-5 outline-none font-bold text-sm transition-all focus:bg-surface shadow-sm" />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2 italic">შეტყობინება</label>
                        <textarea required rows="4" placeholder="რით შეგვიძლია დაგეხმაროთ?" className="w-full bg-surface-soft border-2 border-transparent focus:border-brand-purple rounded-[32px] px-8 py-6 outline-none font-bold text-sm transition-all focus:bg-surface shadow-sm resize-none" />
                     </div>

                     <button 
                       type="submit" 
                       disabled={formStatus === 'sending'}
                       className="w-full bg-brand-purple text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-brand-deep hover:-translate-y-1 transition-all shadow-2xl shadow-brand-purple/30 flex items-center justify-center gap-3 disabled:opacity-70 disabled:translate-y-0"
                     >
                       {formStatus === 'sending' ? (
                         <>გაიგზავნება... <Clock size={20} className="animate-spin" /></>
                       ) : (
                         <>შეტყობინების გაგზავნა <Send size={20} /></>
                       )}
                     </button>
                   </form>
                 </>
               )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-brand-deep py-20 px-6 text-white text-center border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-muted">
            © 2026 Crafted for modern dentistry
          </p>
        </footer>
      </div>
    </>
  );
};

export default ContactPage;
