import React from "react";
import { Helmet } from "react-helmet-async";
import MainHeader from "../components/Common/MainHeader";
import { 
  Users, Award, ShieldCheck, Zap, Heart, 
  Target, Globe, Users2, Rocket, Sparkles
} from "lucide-react";

const AboutPage = ({ user }) => {
  return (
    <>
      <Helmet>
        <title>ჩვენს შესახებ — AiDent</title>
        <meta name="description" content="გაიცანით AiDent-ის გუნდი და ჩვენი მისია სტომატოლოგიის ციფრულ ეპოქაში." />
        <link rel="canonical" href="https://AiDent.ge/about" />
      </Helmet>
      
      <div className="min-h-screen bg-surface font-nino selection:bg-brand-purple/10 overflow-x-hidden">
        <MainHeader user={user} />

        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-brand-deep/5 to-surface relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.03),transparent)] pointer-events-none"></div>
           
           <div className="max-w-7xl mx-auto text-center relative z-10">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 text-[10px] font-black uppercase tracking-widest mb-8 italic">
                <Rocket size={12} className="mr-2" /> Our Mission & Vision
              </span>
              <h1 className="text-6xl md:text-9xl font-black text-text-main italic tracking-tighter leading-[0.85] mb-10">
                ჩვენ ვქმნით <br />
                <span className="bg-gradient-to-r from-brand-purple to-pink-500 bg-clip-text text-transparent">მომავლის სტომატოლოგიას</span>
              </h1>
              <p className="text-xl text-text-muted max-w-3xl mx-auto font-medium italic leading-relaxed">
                AiDent არ არის მხოლოდ პროგრამა — ეს არის ეკოსისტემა, რომელიც აერთიანებს ექიმებს, კლინიკებს და პაციენტებს ერთიან, გამჭვირვალე და ეფექტურ ციფრულ სივრცეში.
              </p>
           </div>
        </section>

        {/* Values Grid */}
        <section className="py-24 px-6 relative border-y border-border-main">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            {[
              { icon: Heart, title: "პაციენტზე ზრუნვა", desc: "ჩვენი მთავარი ორიენტირია პაციენტის გამოცდილების გაუმჯობესება და მკურნალობის ხარისხის ზრდა." },
              { icon: ShieldCheck, title: "უსაფრთხოება", desc: "მონაცემთა დაცვის უმაღლესი სტანდარტები და ღრუბლოვანი ტექნოლოგიების საიმედოობა." },
              { icon: Zap, title: "ინოვაცია", desc: "მუდმივი განახლება და უახლესი ტექნოლოგიების ინტეგრაცია ყოველდღიურ პრაქტიკაში." }
            ].map((v, i) => (
              <div key={i} className="group p-10 rounded-[48px] bg-surface-soft border border-border-main hover:bg-surface transition-all duration-500">
                <div className="w-16 h-16 bg-brand-purple/10 text-brand-purple rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-brand-purple group-hover:text-white transition-all">
                  <v.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-text-main italic tracking-tighter mb-4 uppercase">{v.title}</h3>
                <p className="text-text-muted font-medium italic leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="py-32 px-6 relative overflow-hidden bg-brand-deep text-white">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple/10 blur-[150px] rounded-full -mr-96 -mt-96"></div>
           
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
              <div className="relative animate-in fade-in slide-in-from-left-12 duration-1000">
                 <div className="aspect-square bg-gradient-to-br from-brand-purple/20 to-white/5 rounded-[80px] p-1 border border-white/10 relative">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-purple/20 blur-3xl animate-pulse"></div>
                    <div className="w-full h-full bg-brand-deep rounded-[76px] flex items-center justify-center overflow-hidden">
                       <Users2 size={200} className="text-brand-purple/20" />
                    </div>
                    {/* Floating stats */}
                    <div className="absolute -bottom-8 -right-8 bg-surface p-8 rounded-[40px] border border-border-main shadow-2xl text-text-main">
                       <p className="text-5xl font-black italic tracking-tighter mb-1">500+</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">აქტიური კლინიკა</p>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-10">
                 <span className="text-brand-purple text-[10px] font-black uppercase tracking-[0.4em] italic">Our Story</span>
                 <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
                    როგორ დაიწყო <br /> <span className="text-brand-purple italic">AiDent?</span>
                  </h2>
                  <p className="text-lg text-white/60 font-medium italic leading-relaxed">
                    AiDent შეიქმნა იმ საჭიროებიდან გამომდინარე, რაც ქართულ სტომატოლოგიურ ბაზარზე არსებობდა. ჩვენი მიზანი იყო შეგვექმნა პროდუქტი, რომელიც იქნებოდა მარტივი, სწრაფი და სრულად მორგებული ადგილობრივ რეგულაციებზე.
                  </p>
                  <div className="grid grid-cols-2 gap-8 pt-8">
                     <div>
                        <h4 className="text-3xl font-black italic tracking-tighter mb-2">2022</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">პირველი იდეა და <br /> გუნდის შეკრება</p>
                     </div>
                     <div>
                        <h4 className="text-3xl font-black italic tracking-tighter mb-2">2026</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-relaxed">ლიდერი პლატფორმა <br /> რეგიონში</p>
                     </div>
                  </div>
              </div>
           </div>
        </section>

        {/* Team / Why Us Section */}
        <section className="py-32 px-6">
           <div className="max-w-7xl mx-auto text-center mb-24">
              <span className="text-brand-purple text-[10px] font-black uppercase tracking-[0.4em] italic mb-6 block">Why Us</span>
              <h2 className="text-5xl md:text-7xl font-black text-text-main italic tracking-tighter uppercase leading-none">რატომ გვერჩივნენ <br /> <span className="text-brand-purple">ჩვენ?</span></h2>
           </div>

           <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "გამოცდილება", icon: Award, desc: "გუნდი, რომელიც წლებია მუშაობს სამედიცინო ტექნოლოგიებზე." },
                { icon: Globe, title: "მასშტაბი", desc: "მუშაობს ნებისმიერ მოწყობილობაზე, მსოფლიოს ნებისმიერი წერტილიდან." },
                { icon: Target, title: "მიზანი", desc: "თქვენი კლინიკის ეფექტურობის მინიმუმ 30%-ით გაზრდა." },
                { icon: Sparkles, title: "დიზაინი", desc: "ინტუიციური და თანამედროვე ინტერფეისი, რომელიც გიყვართ." }
              ].map((item, i) => (
                <div key={i} className="p-10 rounded-[48px] bg-surface border border-border-main hover:shadow-2xl transition-all duration-500">
                  <div className="w-14 h-14 bg-surface-soft text-text-main rounded-2xl flex items-center justify-center mb-8 border border-border-main">
                    <item.icon size={24} />
                  </div>
                  <h4 className="text-lg font-black text-text-main italic uppercase tracking-tighter mb-3">{item.title}</h4>
                  <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest italic leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* CTA Footer Section */}
        <section className="px-6 py-24 bg-surface-soft/50 border-t border-border-main">
          <div className="max-w-7xl mx-auto bg-brand-deep rounded-[48px] p-16 md:p-24 relative overflow-hidden shadow-2xl text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            <div className="relative z-10 space-y-10">
               <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter leading-none uppercase">გინდა გახდე <br /> <span className="text-brand-purple">ნაწილი?</span></h2>
               <p className="text-white/60 text-xl font-medium italic max-w-xl mx-auto leading-relaxed">
                 შემოუერთდით 500+ წარმატებულ კლინიკას და დაიწყეთ მართვის ახალი ერა დღესვე.
               </p>
               <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <a href="/auth" className="bg-white text-brand-deep px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all">დაიწყე ახლავე</a>
                  <a href="/contact" className="bg-white/5 text-white border border-white/10 px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all italic">კონტაქტი</a>
               </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-brand-deep py-20 px-6 text-white text-center border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-text-muted">
            © 2026 AiDent Team — Innovating for you
          </p>
        </footer>
      </div>
    </>
  );
};

export default AboutPage;
