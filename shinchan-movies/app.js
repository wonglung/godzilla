(function () {
  "use strict";

  var STORAGE_KEY = "shinchan-movies:watched";
  var movies = (window.MOVIES || []).slice().sort(function (a, b) {
    return a.year - b.year;
  });

  var listEl = document.getElementById("list");
  var emptyEl = document.getElementById("empty");
  var progressEl = document.getElementById("progress");
  var searchEl = document.getElementById("search");
  var hideWatchedEl = document.getElementById("hide-watched");
  var filterButtons = document.querySelectorAll("[data-series]");

  var state = { series: "全部", query: "", hideWatched: false, watched: loadWatched() };

  function loadWatched() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var ids = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(ids) ? ids : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveWatched() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.watched)));
    } catch (e) {
      /* 無法儲存時只保留在本次頁面 */
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function matches(movie) {
    if (state.series !== "全部" && movie.series !== state.series) return false;
    if (state.hideWatched && state.watched.has(movie.id)) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    return (movie.title + " " + movie.original + " " + movie.year).toLowerCase().indexOf(q) !== -1;
  }

  function render() {
    listEl.textContent = "";
    var shown = movies.filter(matches);

    shown.forEach(function (movie) {
      var watched = state.watched.has(movie.id);
      var item = el("li", "card" + (watched ? " is-watched" : ""));

      var meta = el("div", "meta");
      meta.appendChild(el("span", "tag tag-" + (movie.series === "忍者" ? "ninja" : "samurai"), movie.series));
      meta.appendChild(el("span", "year", movie.year + " 年"));
      item.appendChild(meta);

      item.appendChild(el("h2", "title", movie.title));
      item.appendChild(el("p", "original", movie.original));
      item.appendChild(el("p", "summary", movie.summary));

      var label = el("label", "watch");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = watched;
      box.addEventListener("change", function () {
        if (box.checked) state.watched.add(movie.id);
        else state.watched.delete(movie.id);
        saveWatched();
        render();
      });
      label.appendChild(box);
      label.appendChild(document.createTextNode(" 已看過"));
      item.appendChild(label);

      listEl.appendChild(item);
    });

    emptyEl.hidden = shown.length > 0;
    var watchedCount = movies.filter(function (m) { return state.watched.has(m.id); }).length;
    progressEl.textContent = "已看過 " + watchedCount + " / " + movies.length + " 部，目前顯示 " + shown.length + " 部";
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.series = btn.getAttribute("data-series");
      filterButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      render();
    });
  });

  searchEl.addEventListener("input", function () {
    state.query = searchEl.value;
    render();
  });

  hideWatchedEl.addEventListener("change", function () {
    state.hideWatched = hideWatchedEl.checked;
    render();
  });

  render();
})();
