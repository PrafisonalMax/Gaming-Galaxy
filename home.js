document.addEventListener("DOMContentLoaded", function () {
  const TOP_COUNT = 10;
  let baseList = [];

  function getFilteredGames() {
    let list = GameAPI.filterBySettings(baseList);
    const query = document.getElementById("searchInput")?.value || "";
    list = GameAPI.searchGames(list, query);
    list = GameAPI.sortByRating(list);
    return list.slice(0, TOP_COUNT);
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
});
