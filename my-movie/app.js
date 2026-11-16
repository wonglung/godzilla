(function () {
  "use strict";

  var m = window.MY_MOVIE;
  if (!m) return;

  function $(id) { return document.getElementById(id); }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  document.title = m.title + "：" + m.subtitle;
  $("title").textContent = m.title;
  $("subtitle").textContent = m.subtitle;
  $("tagline").textContent = m.tagline;
  m.info.forEach(function (t) { $("info").appendChild(el("li", null, t)); });
  $("synopsis").textContent = m.synopsis;

  m.characters.forEach(function (c) {
    var li = el("li", "character");
    var avatar = el("span", "avatar", c.name.charAt(0));
    avatar.style.background = c.color;
    li.appendChild(avatar);
    var body = el("div");
    body.appendChild(el("h3", null, c.name));
    body.appendChild(el("p", "role", c.role));
    body.appendChild(el("p", null, c.desc));
    li.appendChild(body);
    $("characters").appendChild(li);
  });

  m.acts.forEach(function (a) {
    var li = el("li", "act");
    li.appendChild(el("span", "act-label", a.label));
    li.appendChild(el("h3", null, a.title));
    li.appendChild(el("p", null, a.text));
    $("acts").appendChild(li);
  });

  m.scenes.forEach(function (s) { $("scenes").appendChild(el("li", null, s)); });

  $("song-title").textContent = m.song.title;
  $("song-lyrics").textContent = m.song.lyrics;
  $("post-credits").textContent = m.postCredits;
})();
