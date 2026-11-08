/**
 * Loads games from the internet (RAWG if you add a key, otherwise FreeToGame).
 * All pages share one cached list in memory after the first load.
 */

const GameAPI = (function () {
  const CACHE_KEY = "gamingGalaxy_games_v1";
  const CACHE_MAX_AGE_MS = 1000 * 60 * 60; // 1 hour

  /** @type {Array<object>|null} */
  let allGames = null;

  function normalizePlatform(raw) {
    const p = String(raw || "").toLowerCase();
    if (p.includes("windows") || p.includes("pc") || p.includes("browser")) return "PC";
    if (p.includes("playstation")) return "PS5";
    if (p.includes("xbox")) return "Xbox";
    return raw || "Other";
  }

  function normalizeGenre(raw) {
    if (!raw) return "Other";
    if (Array.isArray(raw)) return raw.map((g) => g.name || g).join(", ");
    return String(raw);
  }

  function fromFreeToGame(item) {
    return {
      id: "ftg-" + item.id,
      title: item.title,
      price: 0,
      rating: null,
      platform: normalizePlatform(item.platform),
      genre: normalizeGenre(item.genre),
      image: item.thumbnail,
      url: item.freetogame_profile_url,
      source: "freetogame",
    };
  }

  function fromRawg(item) {
    const platforms =
      item.platforms?.map((p) => p.platform?.name).filter(Boolean) || [];
    const primaryPlatform = platforms[0] || "PC";

    return {
      id: "rawg-" + item.id,
      title: item.name,
      price: item.metacritic ? Math.min(69.99, 19.99 + item.metacritic / 5) : 29.99,
      rating: item.rating ? Math.round(item.rating * 10) / 10 : null,
      platform: normalizePlatform(primaryPlatform),
      genre: normalizeGenre(item.genres),
      image: item.background_image || "",
      url: "https://rawg.io/games/" + (item.slug || ""),
      source: "rawg",
    };
  }

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { time, games } = JSON.parse(raw);
      if (Date.now() - time > CACHE_MAX_AGE_MS) return null;
      return games;
    } catch {
      return null;
    }
  }

  function writeCache(games) {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), games })
      );
    } catch {
      /* storage full — ignore */
    }
  }

  async function fetchFreeToGame() {
    const res = await fetch("https://www.freetogame.com/api/games");
    if (!res.ok) throw new Error("FreeToGame API failed");
    const data = await res.json();
    return data.map(fromFreeToGame);
  }

  async function fetchRawg(key, maxPages = 8) {
    const pageSize = 40;
    const requests = [];

    for (let page = 1; page <= maxPages; page++) {
      const url =
        "https://api.rawg.io/api/games?key=" +
        encodeURIComponent(key) +
        "&page=" +
        page +
        "&page_size=" +
        pageSize +
        "&ordering=-rating";
      requests.push(fetch(url).then((r) => (r.ok ? r.json() : { results: [] })));
    }

    const pages = await Promise.all(requests);
    const merged = [];
    const seen = new Set();

    pages.forEach((payload) => {
      (payload.results || []).forEach((game) => {
        if (seen.has(game.id)) return;
        seen.add(game.id);
        merged.push(fromRawg(game));
      });
    });

    return merged;
  }

  async function loadGames() {
    if (allGames) return allGames;

    const cached = readCache();
    if (cached?.length) {
      allGames = cached;
      return allGames;
    }

    const key = typeof window.GAME_API_KEY === "string" ? window.GAME_API_KEY.trim() : "";

    if (key) {
      allGames = await fetchRawg(key);
    } else {
      allGames = await fetchFreeToGame();
    }

    if (!allGames.length) {
      throw new Error("No games returned from API");
    }

    writeCache(allGames);
    return allGames;
  }

  function getAllGames() {
    return allGames || [];
  }

  /** Text search (title + genre) */
  function searchGames(games, query) {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q)
    );
  }

  /** Home page + saved settings (localStorage) */
  function filterBySettings(games) {
    const maxPrice = parseFloat(localStorage.getItem("maxPrice") || "");
    const minRating = parseFloat(localStorage.getItem("minRating") || "");
    const platform = localStorage.getItem("platform") || "";

    return games.filter((game) => {
      if (!Number.isNaN(maxPrice) && localStorage.getItem("maxPrice") !== "") {
        if (game.price > maxPrice) return false;
      }
      if (!Number.isNaN(minRating) && localStorage.getItem("minRating") !== "") {
        if (game.rating == null || game.rating < minRating) return false;
      }
      if (platform && game.platform !== platform) return false;
      return true;
    });
  }

  /** Explore page dropdown filters */
  function filterByExploreOptions(games, options) {
    const { price, genre, rating, platform } = options;

    return games.filter((game) => {
      if (platform && platform !== "Any" && game.platform !== platform) {
        return false;
      }

      if (genre && genre !== "Any") {
        if (!game.genre.toLowerCase().includes(genre.toLowerCase())) {
          return false;
        }
      }

      if (price && price !== "Any") {
        if (price === "Free" && game.price !== 0) return false;
        if (price === "Under $30" && game.price >= 30) return false;
        if (price === "$30 - $60" && (game.price < 30 || game.price > 60)) return false;
        if (price === "$60+" && game.price < 60) return false;
      }

      if (rating && rating !== "Any") {
        const min = parseFloat(String(rating).replace("+", ""));
        if (game.rating == null || game.rating < min) return false;
      }

      return true;
    });
  }

  function sortByRating(games) {
    return [...games].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  return {
    loadGames,
    getAllGames,
    searchGames,
    filterBySettings,
    filterByExploreOptions,
    sortByRating,
  };
})();
