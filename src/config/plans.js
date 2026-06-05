// src/config/plans.js

export const PLANS = {
  free: {
    id: "free",
    title: "Free (სატესტო)",
    price: 0,
    maxDoctors: 3,
    maxPatients: 50,
    maxInventoryItems: 10,
    maxServices: 10,
    hasInventory: true,
    hasFinance: true,
    hasRadiology: true,
    hasPortfolio: true,
    portfolioFeatures: {
      canShowName: true,
      canShowLogo: true,
      canShowHours: false,
      canShowPhone: false,
      canShowAbout: false,
      canShowMap: false,
      canShowDoctors: false,
      canShowServices: false,
      canShowSpecialties: false,
      canAddCustomSpecialty: false
    },
    directoryType: "none",
    features: [
      { name: "3 ექიმი", desc: "სისტემის გამოყენება და პერსონალის მართვის გატესტვა სატესტო რეჟიმში." },
      { name: "50 პაციენტი", desc: "საკმარისი მოცულობა კლინიკის სრულფასოვანი სიმულაციისთვის." },
      { name: "10 ინვენტარი", desc: "შეგიძლიათ დაამატოთ 10-მდე დასახელების მასალა საწყობში დასატესტად." },
      { name: "10 სერვისი", desc: "შეგიძლიათ შექმნათ 10-მდე სხვადასხვა სამედიცინო მომსახურება." },
      { name: "ინვოისი და ფორმა 100", desc: "სამედიცინო ცნობისა (ფორმა 100) და ფინანსური ინვოისების PDF გენერაცია." },
      { name: "კბილების რუკა", desc: "კბილების ვიზუალური ისტორია, რომელიც წლების მერეც ზუსტად გაჩვენებს ყველა კბილის არსებულ სიტუაციას და კლინიკაში ჩატარებულ პროცესებს." },
      { name: "ფინანსური მიმოხილვა", desc: "კლინიკის შემოსავლებისა და ხარჯების მონიტორინგის პანელი." }
    ]
  },
  business: {
    id: "business",
    title: "Business",
    price: 49,
    maxDoctors: 6,
    maxPatients: Infinity,
    maxInventoryItems: Infinity,
    maxServices: Infinity,
    hasInventory: true,
    hasFinance: true,
    hasRadiology: true,
    hasInvoice: true,
    hasForm100: true,
    hasWhatsApp: true,
    hasPortfolio: true,
    portfolioFeatures: {
      canShowName: true,
      canShowLogo: true,
      canShowHours: true,
      canShowPhone: true,
      canShowAbout: true,
      canShowMap: true,
      canShowDoctors: true,
      canShowServices: true,
      canShowSpecialties: true,
      canAddCustomSpecialty: true
    },
    directoryType: "vip",
    features: [
      { name: "6 ექიმი", desc: "სისტემის გამოყენება ინდივიდუალურად 6 ექიმისთვის." },
      { name: "EHR სინქრონიზაცია", desc: "ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების (EHR) სისტემაში მონაცემების გადაცემა ავტომატურად" },
      { name: "ულიმიტო პაციენტი", desc: "პაციენტების ულიმიტო ბაზა კლინიკის სრული დატვირთვისთვის." },
      { name: "ულიმიტო ინვენტარი", desc: "საწყობის სრული კონტროლი და მარაგების მართვა." },
      { name: "ულიმიტო სერვისი", desc: "სერვისების სრული მართვა და ფასების კონტროლი." },
      { name: "ინვოისი და ფორმა 100", desc: "სამედიცინო ცნობისა (ფორმა 100) და ფინანსური ინვოისების PDF გენერაცია." },
      { name: "კბილების რუკა", desc: "კბილების ვიზუალური ისტორია, რომელიც წლების მერეც ზუსტად გაჩვენებს ყველა კბილის არსებულ სიტუაციას და კლინიკაში ჩატარებულ პროცესებს." },
      { name: "ფინანსური მიმოხილვა", desc: "კლინიკის შემოსავლებისა და ხარჯების მონიტორინგის პანელი." },
      { name: "კლინიკის გვერდი (VIP)", desc: "კლინიკის პორტფოლიო ვებგვერდზე VIP სტატუსით, რუკით და სრული ინფორმაციით." },
      { name: "ტექნიკური მხარდაჭერა", desc: "სისტემის გამოყენების დროს ტექნიკური მხარდაჭერის წვდომა." },
      { name: "რენტგენის შენახვა", desc: "სამედიცინო რენტგენის კაბინეტის მართვა და მონაცემების პაციენტის ისტორიაში ჩანიშვნა." },
      { name: "SMS შეხსენებები", desc: "მომხმარებლისთვის ჯავშნის შეხსენების ავტომატური SMS გზავნილი." },
      { name: "სადაზღვეო კომპანიებთან სინქრონიზაცია", desc: "სადაზღვეოებთან მონაცემების ავტომატური გაცვლა." },
      { name: "VIP პოზიცია კატალოგში", desc: "კლინიკის პორტფოლიო იქნება მთავარ გვერდზე და კატალოგში მოწინავე პოზიციაზე." }
    ]
  },
  custom: {
    id: "custom",
    title: "Custom",
    price: "შეთანხმებით",
    maxDoctors: Infinity,
    maxPatients: Infinity,
    maxInventoryItems: Infinity,
    maxServices: Infinity,
    hasInventory: true,
    hasFinance: true,
    hasRadiology: true,
    hasInvoice: true,
    hasForm100: true,
    hasWhatsApp: true,
    hasPortfolio: true,
    portfolioFeatures: {
      canShowName: true,
      canShowLogo: true,
      canShowHours: true,
      canShowPhone: true,
      canShowAbout: true,
      canShowMap: true,
      canShowDoctors: true,
      canShowServices: true,
      canShowSpecialties: true,
      canAddCustomSpecialty: true
    },
    directoryType: "vip",
    features: [
      { name: "ულიმიტო ექიმი", desc: "სისტემის გამოყენება ინდივიდუალურად ულიმიტო რაოდენობის ექიმებისთვის. ფასი განისაზღვრება ექიმების რაოდენობით." },
      { name: "EHR სინქრონიზაცია", desc: "ჯანმრთელობის შესახებ ელექტრონული ჩანაწერების (EHR) სისტემაში მონაცემების გადაცემა ავტომატურად" },
      { name: "ულიმიტო პაციენტი", desc: "პაციენტების ულიმიტო ბაზა კლინიკის სრული დატვირთვისთვის." },
      { name: "ულიმიტო ინვენტარი", desc: "საწყობის სრული კონტროლი და მარაგების მართვა." },
      { name: "ულიმიტო სერვისი", desc: "სერვისების სრული მართვა და ფასების კონტროლი." },
      { name: "ინვოისი და ფორმა 100", desc: "სამედიცინო ცნობისა (ფორმა 100) და ფინანსური ინვოისების PDF გენერაცია." },
      { name: "კბილების რუკა", desc: "კბილების ვიზუალური ისტორია, რომელიც წლების მერეც ზუსტად გაჩვენებს ყველა კბილის არსებულ სიტუაციას და კლინიკაში ჩატარებულ პროცესებს." },
      { name: "ფინანსური მიმოხილვა", desc: "კლინიკის შემოსავლებისა და ხარჯების მონიტორინგის პანელი." },
      { name: "კლინიკის გვერდი (VIP)", desc: "კლინიკის პორტფოლიო ვებგვერდზე VIP სტატუსით, რუკით და სრული ინფორმაციით." },
      { name: "ტექნიკური მხარდაჭერა", desc: "სისტემის გამოყენების დროს ტექნიკური მხარდაჭერის წვდომა." },
      { name: "რენტგენის შენახვა", desc: "სამედიცინო რენტგენის კაბინეტის მართვა და მონაცემების პაციენტის ისტორიაში ჩანიშვნა." },
      { name: "SMS შეხსენებები", desc: "მომხმარებლისთვის ჯავშნის შეხსენების ავტომატური SMS გზავნილი." },
      { name: "სადაზღვეო კომპანიებთან სინქრონიზაცია", desc: "სადაზღვეოებთან მონაცემების ავტომატური გაცვლა." },
      { name: "VIP პოზიცია კატალოგში", desc: "კლინიკის პორტფოლიო იქნება მთავარ გვერდზე და კატალოგში მოწინავე პოზიციაზე." }
    ]
  }
};

// დამხმარე ფუნქციები
const getPlan = (planId) => {
  const id = (planId || "free").toLowerCase();
  if (id === "solo" || id === "basic") return PLANS.business; // ძველი Solo და Basic პაკეტების მხარდაჭერა
  if (id === "pro") return PLANS.custom; // ძველი Pro პაკეტის მხარდაჭერა
  return PLANS[id] || PLANS.free;
};

export const canAddDoctor = (planId, currentDoctorsCount, customMaxDoctors) => {
  const plan = getPlan(planId);
  let max = plan.maxDoctors;
  if (plan.id === 'custom' && customMaxDoctors) {
    max = customMaxDoctors;
  }
  return currentDoctorsCount < max;
};

export const canAddPatient = (planId, currentPatientsCount) => {
  const plan = getPlan(planId);
  return currentPatientsCount < plan.maxPatients;
};

export const canAddInventoryItem = (planId, currentCount) => {
  const plan = getPlan(planId);
  if (plan.maxInventoryItems === Infinity) return true;
  return currentCount < plan.maxInventoryItems;
};

export const canAddService = (planId, currentCount) => {
  const plan = getPlan(planId);
  if (plan.maxServices === Infinity) return true;
  return currentCount < plan.maxServices;
};

export const hasFeatureAccess = (planId, featureKey) => {
  const plan = getPlan(planId);
  return plan[featureKey] === true;
};

export const getPortfolioFeatures = (planId) => {
  const plan = getPlan(planId);
  return plan.portfolioFeatures;
};
