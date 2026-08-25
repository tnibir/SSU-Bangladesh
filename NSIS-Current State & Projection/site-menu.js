
(function(){
  const THEMES = new Set(["emerald","ocean","midnight","classic"]);
  const storedTheme = localStorage.getItem("nsisSiteTheme");
  const initialTheme = THEMES.has(storedTheme) ? storedTheme : (document.body.dataset.theme || "emerald");
  function applyTheme(theme){
    const safeTheme = THEMES.has(theme) ? theme : "emerald";
    document.body.dataset.theme = safeTheme;
    localStorage.setItem("nsisSiteTheme", safeTheme);
    const select = document.getElementById("themeSelect");
    if(select) select.value = safeTheme;
  }
  applyTheme(initialTheme);
  const select = document.getElementById("themeSelect");
  select?.addEventListener("change", event => applyTheme(event.target.value));
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".site-nav-toggle");
  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelectorAll(".site-submenu a,.site-menu-link").forEach(link => {
    link.addEventListener("click", () => {
      nav?.classList.remove("menu-open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });
})();
