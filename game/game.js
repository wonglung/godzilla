// 時間守護大作戰：以原創劇場版《風見町劇場版》為題材的「一二三木頭人」小遊戲
(function () {
  "use strict";

  var movie = window.MY_MOVIE || { characters: [] };
  function colorOf(name, fallback) {
    var found = (movie.characters || []).filter(function (c) { return c.name === name; })[0];
    return found ? found.color : fallback;
  }

  var HEROES = [
    {
      name: "小風", color: colorOf("小風", "#e8473d"), speed: 1.0, lives: 3,
      skill: "手電筒", effect: "blind",
      desc: "速度普通。技能「手電筒」：照得黑時計睜不開眼，3 秒內不會回頭。",
    },
    {
      name: "月影", color: colorOf("月影", "#3a4bb0"), speed: 1.25, lives: 3,
      skill: "隱身術", effect: "hide",
      desc: "跑最快。技能「隱身術」：2.5 秒內被看到也不會被抓（這次忍住不打噴嚏！）。",
    },
    {
      name: "鐵之介", color: colorOf("鐵之介", "#b0611a"), speed: 0.9, lives: 4,
      skill: "刀背守護", effect: "shield",
      desc: "比較慢但多一顆愛心。技能「刀背守護」：擋下下一次被抓。",
    },
  ];

  var LEVELS = [
    { name: "第一關・村子廣場", back: [1.8, 3.2], warn: 0.9, watch: [1.4, 2.0], fake: 0, limit: 40 },
    { name: "第二關・竹林小路", back: [1.3, 2.6], warn: 0.65, watch: [1.6, 2.4], fake: 0.15, limit: 40 },
    { name: "第三關・時計城", back: [1.0, 2.2], warn: 0.45, watch: [1.8, 2.8], fake: 0.3, limit: 45 },
  ];

  var BASE_SPEED = 12;      // 每秒前進百分比
  var KNOCKBACK = 15;       // 被抓後退百分比
  var GRACE = 0.08;         // 剛回頭時的反應緩衝（秒）
  var BEST_KEY = "time-guardian:best";

  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    stage: $("stage"), player: $("player"), initial: $("player-initial"),
    guardFace: $("guard-face"), guardLabel: $("guard-label"), status: $("status"),
    level: $("hud-level"), lives: $("hud-lives"), score: $("hud-score"),
    moon: $("moon-fill"), moonLabel: $("moon-label"),
    move: $("btn-move"), skill: $("btn-skill"),
    overlay: $("overlay"), title: $("panel-title"), text: $("panel-text"), body: $("panel-body"),
    best: $("best"),
  };

  var s = {
    screen: "title", hero: HEROES[0], level: 0, lives: 3, score: 0,
    progress: 0, timeLeft: 0, guard: "back", guardT: 0, watchT: 0,
    holding: false, needRelease: false, stunT: 0, msgT: 0,
    skillUsed: false, blindT: 0, hideT: 0, shield: false, message: "",
  };
  window.__timeGuardian = s; // 方便測試讀取狀態

  function rand(range) { return range[0] + Math.random() * (range[1] - range[0]); }

  function readBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }
  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* 無法儲存就略過 */ }
  }
  function showBest() {
    var b = readBest();
    ui.best.textContent = b ? "　最高分：" + b : "";
  }

  // hold：這則訊息至少顯示幾秒，之後才換回依黑時計狀態的預設提示
  function say(msg, hold) {
    s.msgT = hold || 0;
    if (s.message === msg) return;
    s.message = msg;
    ui.status.textContent = msg;
  }
  var DEFAULT_TIP = {
    back: "趁黑時計背對你，按住前進！",
    warn: "滴答滴答……他要回頭了，快放開！",
    watch: "別動！他正盯著你看！",
  };

  // ---------- 畫面切換 ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function openPanel(title, text, buildBody) {
    ui.title.textContent = title;
    ui.text.textContent = text;
    ui.body.textContent = "";
    if (buildBody) buildBody(ui.body);
    ui.overlay.classList.add("show");
    var first = ui.body.querySelector("button");
    if (first) first.focus();
  }
  function closePanel() { ui.overlay.classList.remove("show"); }

  function showTitle() {
    s.screen = "title";
    openPanel("選擇你的角色", movie.tagline || "在月圓之夜前，奪回被偷走的時間！", function (body) {
      var list = el("div", "hero-list");
      HEROES.forEach(function (h) {
        var btn = el("button", "hero-card");
        btn.type = "button";
        var av = el("span", "hero-avatar", h.name.charAt(0));
        av.style.background = h.color;
        btn.appendChild(av);
        var info = el("span", "hero-info");
        info.appendChild(el("strong", null, h.name));
        info.appendChild(el("span", null, h.desc));
        btn.appendChild(info);
        btn.addEventListener("click", function () { startGame(h); });
        list.appendChild(btn);
      });
      body.appendChild(list);
    });
  }

  function startGame(hero) {
    s.hero = hero;
    s.lives = hero.lives;
    s.score = 0;
    s.level = 0;
    ui.player.style.background = hero.color;
    ui.initial.textContent = hero.name.charAt(0);
    startLevel();
  }

  function startLevel() {
    var L = LEVELS[s.level];
    s.progress = 0;
    s.timeLeft = L.limit;
    s.guard = "back";
    s.guardT = rand(L.back);
    s.watchT = 0;
    s.stunT = 0;
    s.needRelease = s.holding;
    s.skillUsed = false;
    s.blindT = 0;
    s.hideT = 0;
    s.shield = false;
    ui.stage.classList.remove("cleared");
    closePanel();
    s.screen = "play";
    say(L.name + "：趁黑時計背對你，按住前進！", 2);
    ui.move.focus();
  }

  function clearLevel() {
    s.screen = "between";
    var bonus = Math.round(s.timeLeft) * 10 + s.lives * 50;
    s.score += bonus;
    ui.stage.classList.add("cleared");
    if (s.level >= LEVELS.length - 1) return win();
    openPanel("打破沙漏！", "被凍結的村民動起來了！過關加分 +" + bonus + "。", function (body) {
      var btn = el("button", "primary", "前往" + LEVELS[s.level + 1].name);
      btn.type = "button";
      btn.addEventListener("click", function () { s.level += 1; startLevel(); });
      body.appendChild(btn);
    });
  }

  function endPanel(title, text) {
    var best = readBest();
    var isNew = s.score > best;
    if (isNew) writeBest(s.score);
    showBest();
    openPanel(title, text, function (body) {
      body.appendChild(el("p", "final-score", "總分：" + s.score + (isNew ? "（新紀錄！）" : "")));
      var again = el("button", "primary", "再玩一次（" + s.hero.name + "）");
      again.type = "button";
      again.addEventListener("click", function () { startGame(s.hero); });
      var pick = el("button", null, "換角色");
      pick.type = "button";
      pick.addEventListener("click", showTitle);
      body.appendChild(again);
      body.appendChild(pick);
    });
  }

  function win() {
    s.screen = "end";
    endPanel("時間回來了！",
      "沙漏全部碎掉，被偷走的時間像螢火蟲一樣飛回每個人身上。" + s.hero.name + "和夥伴們守住了月圓之夜！");
  }

  function lose(reason) {
    s.screen = "end";
    endPanel("被凍結了……", reason + " 別灰心，月影也是第 13 次才成功的！");
  }

  // ---------- 遊戲邏輯 ----------
  function setGuard(state, duration) {
    s.guard = state;
    s.guardT = duration;
    s.watchT = 0;
  }

  function nextGuard() {
    var L = LEVELS[s.level];
    if (s.blindT > 0) return setGuard("back", s.blindT);
    if (s.guard === "back") return setGuard("warn", L.warn);
    if (s.guard === "warn") {
      if (Math.random() < L.fake) { say("假動作！黑時計又轉回去了，快走！", 1.2); return setGuard("back", rand(L.back)); }
      return setGuard("watch", rand(L.watch));
    }
    setGuard("back", rand(L.back));
  }

  function useSkill() {
    if (s.screen !== "play" || s.skillUsed) return;
    s.skillUsed = true;
    var e = s.hero.effect;
    if (e === "blind") {
      s.blindT = 3;
      setGuard("back", 3);
      say("手電筒一照！黑時計睜不開眼，3 秒內快衝！", 3);
    } else if (e === "hide") {
      s.hideT = 2.5;
      say("隱身術成功！2.5 秒內被看到也沒關係！", 2.5);
    } else {
      s.shield = true;
      say("刀背守護！下一次被抓會被擋下來。", 1.5);
    }
  }

  function caught() {
    s.needRelease = true;
    if (s.shield) {
      s.shield = false;
      s.stunT = 0.6;
      say("鏘！鐵之介用刀背擋下了！先放開，等他轉回去。", 1.5);
      return;
    }
    s.lives -= 1;
    s.progress = Math.max(0, s.progress - KNOCKBACK);
    s.stunT = 1.0;
    ui.stage.classList.remove("hit");
    void ui.stage.offsetWidth;
    ui.stage.classList.add("hit");
    if (s.lives <= 0) return lose("被黑時計抓到太多次了。");
    say("被看到了！往後退……放開按鈕，等他轉回去。", 1.5);
  }

  function update(dt) {
    if (s.screen !== "play") return;
    var L = LEVELS[s.level];

    s.timeLeft -= dt;
    if (s.timeLeft <= 0) { s.timeLeft = 0; return lose("月亮升到最高點了，時間被黑時計全部買走。"); }

    s.stunT = Math.max(0, s.stunT - dt);
    s.blindT = Math.max(0, s.blindT - dt);
    s.hideT = Math.max(0, s.hideT - dt);

    s.guardT -= dt;
    if (s.guard === "watch") s.watchT += dt;
    if (s.guardT <= 0) nextGuard();

    var moving = s.holding && !s.needRelease && s.stunT <= 0;
    if (moving) s.progress = Math.min(100, s.progress + BASE_SPEED * s.hero.speed * dt);

    if (moving && s.guard === "watch" && s.watchT > GRACE && s.hideT <= 0) caught();
    if (s.screen !== "play") return;

    if (s.progress >= 100) return clearLevel();

    s.msgT -= dt;
    if (s.msgT <= 0 && s.stunT <= 0) say(s.blindT > 0 ? "黑時計睜不開眼，快衝！" : DEFAULT_TIP[s.guard]);
  }

  // ---------- 繪製 ----------
  var GUARD_TEXT = { back: "背對中", warn: "滴答滴答…", watch: "盯著你！" };

  function render() {
    var L = LEVELS[s.level];
    ui.stage.setAttribute("data-guard", s.guard);
    ui.guardLabel.textContent = s.blindT > 0 ? "睜不開眼！" : GUARD_TEXT[s.guard];
    ui.guardFace.textContent = s.guard === "watch" ? "👀" : "黑";

    ui.player.style.left = "calc(" + (s.progress * 0.72).toFixed(2) + "% + 8px)";
    ui.player.classList.toggle("moving", s.holding && !s.needRelease && s.stunT <= 0 && s.screen === "play");
    ui.player.classList.toggle("hidden", s.hideT > 0);
    ui.player.classList.toggle("shielded", s.shield);

    ui.level.textContent = L.name;
    var hearts = "";
    for (var i = 0; i < s.hero.lives; i++) hearts += i < s.lives ? "❤" : "♡";
    ui.lives.textContent = hearts;
    ui.lives.setAttribute("aria-label", "生命 " + s.lives);
    ui.score.textContent = "分數 " + s.score;

    var ratio = L.limit ? 1 - s.timeLeft / L.limit : 0;
    ui.moon.style.width = (ratio * 100).toFixed(1) + "%";
    ui.moonLabel.textContent = "月圓之夜倒數：" + Math.ceil(s.timeLeft) + " 秒";

    ui.skill.textContent = s.skillUsed ? s.hero.skill + "（已使用）" : "技能：" + s.hero.skill;
    ui.skill.disabled = s.skillUsed || s.screen !== "play";
    ui.move.disabled = s.screen !== "play";
  }

  var last = 0;
  function frame(t) {
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ---------- 操作 ----------
  function press() { s.holding = true; }
  function release() { s.holding = false; s.needRelease = false; }

  ui.move.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    try { ui.move.setPointerCapture(e.pointerId); } catch (err) { /* 略過 */ }
    press();
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (type) {
    ui.move.addEventListener(type, release);
  });
  ui.move.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  ui.skill.addEventListener("click", useSkill);

  window.addEventListener("keydown", function (e) {
    if (s.screen !== "play") return;
    if (e.code === "Space" || e.code === "ArrowRight") {
      e.preventDefault();
      if (!e.repeat) press();
    } else if (e.code === "KeyE") {
      useSkill();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.code === "ArrowRight") release();
  });
  window.addEventListener("blur", release);

  showBest();
  showTitle();
  requestAnimationFrame(frame);
})();
