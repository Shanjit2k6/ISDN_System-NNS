import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "greeting": "Welcome back",
      "overview": "Overview",
      "sales": "Total Sales Today",
      "logout": "Logout",
      "dashboard": "Dashboard",
      "orders": "Orders",
      "inventory": "Inventory",
      "logistics": "Logistics"
    }
  },
  si: {
    translation: {
      "greeting": "ආයුබෝවන්",
      "overview": "සමාලෝචනය",
      "sales": "අද මුළු විකුණුම්",
      "logout": "පිටවන්න",
      "dashboard": "උපකරණ පුවරුව",
      "orders": "ඇණවුම්",
      "inventory": "ඉන්වෙන්ටරි",
      "logistics": "ප්‍රවාහන"
    }
  },
  ta: {
    translation: {
      "greeting": "வரவேற்கிறோம்",
      "overview": "மேலோட்டம்",
      "sales": "இன்று மொத்த விற்பனை",
      "logout": "வெளியேறு",
      "dashboard": "முகப்புப்பலகை",
      "orders": "கட்டளைகள்",
      "inventory": "சரக்கு",
      "logistics": "தளவாடங்கள்"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
