/**
 * Shared UI: render cards, search box, modals, settings, mobile menu.
 */

function formatPrice(price) {
  if (price === 0) return "Free";
  return "$" + price.toFixed(2);
}

function formatRating(rating) {
  if (rating == null) return "— (no score from API)";
  return "⭐ " + rating;
}

function displayGames(gameList, containerSelector = ".games-grid") {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = "";

  if (!gameList.length) {
    container.innerHTML =
      '<p class="empty-message">No games match your filters. Try changing settings or search text.</p>';
    return;
  }

  gameList.forEach((game) => {
    const card = document.createElement("article");
    card.classList.add("game-card");

    const imgSrc =
      game.image ||
      "https://via.placeholder.com/300x170?text=" + encodeURIComponent(game.title);

    card.innerHTML = `
      <img src="${imgSrc}" alt="${game.title}" loading="lazy"
           onerror="this.onerror=null;this.src='https://via.placeholder.com/300x170?text=Game';">
      <h3>${game.title}</h3>
      <p>${formatRating(game.rating)}</p>
      <p>💰 ${formatPrice(game.price)}</p>
      <p>🎮 ${game.platform}</p>
      <p>${game.genre}</p>
    `;

    if (game.url) {
      const link = document.createElement("a");
      link.href = game.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "game-card-link";
      link.textContent = "View details →";
      card.appendChild(link);
    }

    container.appendChild(card);
  });
}

function showLoading(containerSelector = ".games-grid") {
  const container = document.querySelector(containerSelector);
  if (container) {
    container.innerHTML = '<p class="loading-message">Loading games from the internet…</p>';
  }
}

function showLoadError(message) {
  document.querySelectorAll(".games-grid").forEach((container) => {
    container.innerHTML =
      '<p class="error-message">Could not load games: ' + message + "</p>";
  });
}

function initSharedUI(options) {
  const { onGamesReady, getFilteredGames, containerSelector } = options;

  const searchBtn = document.getElementById("searchBtn");
  const searchBox = document.getElementById("searchBox");
  const searchInput = document.getElementById("searchInput");
  const signinBtn = document.getElementById("signinBtn");
  const signinModal = document.getElementById("signinModal");
  const closeSignin = document.getElementById("closeSignin");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const closeSettingsBtn = document.getElementById("closeSettings");

  function openSearch() {
    searchBox?.classList.remove("hidden");
    searchInput?.focus();
    closeMobileMenu();
  }

  function openSignIn() {
    signinModal?.classList.remove("hidden");
    closeMobileMenu();
  }

  function openSettings() {
    settingsOverlay?.classList.remove("hidden");
    settingsOverlay?.setAttribute("aria-hidden", "false");
    closeMobileMenu();
  }

  function closeSettings() {
    settingsOverlay?.classList.add("hidden");
    settingsOverlay?.setAttribute("aria-hidden", "true");
  }

  function toggleSettings() {
    if (settingsOverlay?.classList.contains("hidden")) {
      openSettings();
    } else {
      closeSettings();
    }
  }

  searchBtn?.addEventListener("click", openSearch);
  document.getElementById("mobileSearchBtn")?.addEventListener("click", openSearch);

  signinBtn?.addEventListener("click", openSignIn);
  document.getElementById("mobileSigninBtn")?.addEventListener("click", openSignIn);

  settingsBtn?.addEventListener("click", toggleSettings);
  document.getElementById("mobileSettingsBtn")?.addEventListener("click", openSettings);

  closeSettingsBtn?.addEventListener("click", closeSettings);
  settingsOverlay?.addEventListener("click", (e) => {
    if (e.target === settingsOverlay) closeSettings();
  });

  closeSignin?.addEventListener("click", () => {
    signinModal?.classList.add("hidden");
  });

  signinModal?.addEventListener("click", (e) => {
    if (e.target === signinModal) signinModal.classList.add("hidden");
  });

  function refreshList() {
    if (typeof getFilteredGames === "function") {
      displayGames(getFilteredGames(), containerSelector);
    }
  }

  searchInput?.addEventListener("input", () => {
    refreshList();
  });

  /* Phone hamburger */
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
  const closeMobileMenuBtn = document.getElementById("closeMobileMenu");

  function closeMobileMenu() {
    mobileMenu?.classList.add("hidden");
    mobileMenuBackdrop?.classList.add("hidden");
    menuToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-open");
  }

  function openMobileMenu() {
    mobileMenu?.classList.remove("hidden");
    mobileMenuBackdrop?.classList.remove("hidden");
    menuToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-menu-open");
  }

  mobileMenuBackdrop?.addEventListener("click", closeMobileMenu);

  menuToggle?.addEventListener("click", () => {
    if (mobileMenu?.classList.contains("hidden")) {
      openMobileMenu();
    } else {
      closeMobileMenu();
    }
  });

  closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);

  window.closeMobileMenu = closeMobileMenu;

  /* Settings persistence (same as before, plus refresh games when filters change) */
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
  }

  document.getElementById("darkModeBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "darkMode",
      document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
    );
  });

  const maxPriceInput = document.getElementById("maxPrice");
  if (maxPriceInput) {
    const saved = localStorage.getItem("maxPrice");
    if (saved) maxPriceInput.value = saved;
    maxPriceInput.addEventListener("input", () => {
      localStorage.setItem("maxPrice", maxPriceInput.value);
      refreshList();
    });
  }

  const minRatingInput = document.getElementById("minRating");
  if (minRatingInput) {
    const saved = localStorage.getItem("minRating");
    if (saved) minRatingInput.value = saved;
    minRatingInput.addEventListener("input", () => {
      localStorage.setItem("minRating", minRatingInput.value);
      refreshList();
    });
  }

  const platformSelect = document.getElementById("platform");
  if (platformSelect) {
    const saved = localStorage.getItem("platform");
    if (saved) platformSelect.value = saved;
    platformSelect.addEventListener("change", () => {
      localStorage.setItem("platform", platformSelect.value);
      refreshList();
    });
  }

  document.getElementById("resetSettings")?.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });

  const animationsToggle = document.getElementById("animationsToggle");
  if (animationsToggle) {
    const saved = localStorage.getItem("animations");
    if (saved === "off") {
      document.body.classList.add("no-animations");
      animationsToggle.checked = false;
    } else {
      animationsToggle.checked = true;
    }
    animationsToggle.addEventListener("change", () => {
      if (animationsToggle.checked) {
        localStorage.setItem("animations", "on");
        document.body.classList.remove("no-animations");
      } else {
        localStorage.setItem("animations", "off");
        document.body.classList.add("no-animations");
      }
    });
  }

  const fontSizeSelect = document.getElementById("fontSize");
  if (fontSizeSelect) {
    const savedSize = localStorage.getItem("fontSize") || "normal";
    document.body.classList.add(savedSize);
    fontSizeSelect.value = savedSize;
    fontSizeSelect.addEventListener("change", () => {
      document.body.classList.remove("small", "normal", "large");
      document.body.classList.add(fontSizeSelect.value);
      localStorage.setItem("fontSize", fontSizeSelect.value);
    });
  }

  const themeColor = document.getElementById("themeColor");
  if (themeColor) {
    const savedColor = localStorage.getItem("themeColor") || "red";
    document.body.setAttribute("data-theme", savedColor);
    themeColor.value = savedColor;
    themeColor.addEventListener("change", () => {
      document.body.setAttribute("data-theme", themeColor.value);
      localStorage.setItem("themeColor", themeColor.value);
    });
  }

  if (typeof onGamesReady === "function") {
    onGamesReady(refreshList);
  }
}
