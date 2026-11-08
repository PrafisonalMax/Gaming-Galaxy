document.addEventListener("DOMContentLoaded", function () {
  let baseList = [];

  function readExploreFilters() {
    return {
      price: document.getElementById("filterPrice")?.value || "Any",
      genre: document.getElementById("filterGenre")?.value || "Any",
      rating: document.getElementById("filterRating")?.value || "Any",
      platform: document.getElementById("filterPlatform")?.value || "Any",
    };
  }

  function getFilteredGames() {
    let list = GameAPI.filterBySettings(baseList);
    list = GameAPI.filterByExploreOptions(list, readExploreFilters());
    const query = document.getElementById("searchInput")?.value || "";
    list = GameAPI.searchGames(list, query);
    return GameAPI.sortByRating(list);
  }

  showLoading(".games-grid");

  initSharedUI({
    containerSelector: ".games-grid",
    getFilteredGames,
    onGamesReady(refresh) {
      GameAPI.loadGames()
        .then((games) => {
          baseList = games;
          refresh();
        })
        .catch((err) => {
          showLoadError(err.message);
        });
    },
  });

  document.getElementById("applyExploreFilters")?.addEventListener("click", () => {
    displayGames(getFilteredGames(), ".games-grid");
  });
});
