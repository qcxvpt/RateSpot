document.addEventListener("DOMContentLoaded", () => {
  const languageSelector = document.getElementById("languageSelector");
  const modal = document.getElementById("introModal");
  const closeBtn = document.getElementById("closeModal");
  const navButton = document.querySelector('.nav-item[data-key="navigation"]');

  // Переводы
  const translations = {
    en: {
      navigation: "Navigation",
      partners: "Partners",
      company: "Company",
      compliance: "Compliance",
      knowledge: "Knowledge Base",
      events: "Events",
      contact: "CONTACT US",
    },
    ru: {
      navigation: "Навигация",
      partners: "Партнёры",
      company: "Компания",
      compliance: "Соответствие",
      knowledge: "База знаний",
      events: "События",
      contact: "СВЯЗАТЬСЯ С НАМИ",
    },
    pl: {
      navigation: "Nawigacja",
      partners: "Partnerzy",
      company: "Firma",
      compliance: "Zgodność",
      knowledge: "Baza wiedzy",
      events: "Wydarzenia",
      contact: "SKONTAKTUJ SIĘ",
    },
  };

  function applyLanguage(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll(".nav-item[data-key]").forEach((item) => {
      const key = item.getAttribute("data-key");
      if (t[key]) item.textContent = t[key];
    });

    const contactBtn = document.querySelector(".contact-button");
    if (contactBtn && t.contact) contactBtn.textContent = t.contact;

    languageSelector.value = lang;
  }

  languageSelector.addEventListener("change", (e) => {
    const selectedLang = e.target.value;
    localStorage.setItem("language", selectedLang);
    applyLanguage(selectedLang);
  });

  const savedLang = localStorage.getItem("language") || "ru";
  applyLanguage(savedLang);

  // Показываем модалку при первом заходе
  if (!sessionStorage.getItem('visited')) {
    modal.style.display = 'flex';
    sessionStorage.setItem('visited', 'true');
  }

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Навигация — повторный показ модалки
  if (navButton) {
    navButton.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
});
