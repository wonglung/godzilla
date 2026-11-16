(function () {
  const D = window.TRAVEL_DATA;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => "NT$" + Math.round(n).toLocaleString("zh-TW");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 價格四捨五入到百位，避免看起來過度精準
  const round100 = (n) => Math.round(n / 100) * 100;

  const state = {
    picked: new Set(["tokyo", "seoul", "bangkok"]),
    days: 5,
    tier: 1,
    season: "normal",
    people: 2,
    budget: null
  };

  function renderControls() {
    $("destinations").innerHTML = D.destinations.map((d) => `
      <label class="chip"><input type="checkbox" value="${d.id}" ${state.picked.has(d.id) ? "checked" : ""}>
      <span>${d.flag} ${esc(d.name)}</span></label>`).join("");
    $("days").innerHTML = D.dayOptions.map((n) => `
      <label class="chip"><input type="radio" name="days" value="${n}" ${n === state.days ? "checked" : ""}>
      <span>${n} 天 ${n - 1} 夜</span></label>`).join("");
    $("tiers").innerHTML = D.tiers.map((t) => `
      <label class="option"><input type="radio" name="tier" value="${t.id}" ${t.id === state.tier ? "checked" : ""}>
      <span>${esc(t.label)}<small>${esc(t.note)}</small></span></label>`).join("");
    $("seasons").innerHTML = D.seasons.map((s) => `
      <label class="option"><input type="radio" name="season" value="${s.id}" ${s.id === state.season ? "checked" : ""}>
      <span>${esc(s.label)}<small>${esc(s.note)}</small></span></label>`).join("");
  }

  function estimate(dest) {
    const t = state.tier;
    const c = dest.cost;
    const days = state.days;
    const nights = days - 1;
    const season = D.seasons.find((s) => s.id === state.season).factor;
    // 一個人旅行要自己付整間房，約為兩人均分價的 1.7 倍
    const singleRoom = state.people === 1 ? 1.7 : 1;
    const items = [
      { label: "來回機票", note: D.tiers[t].label === "豪華" ? "商務艙" : "經濟艙", value: c.flight[t] * season },
      { label: "住宿", note: `${nights} 晚${singleRoom > 1 ? "・單人房" : "・兩人一房均分"}`, value: c.hotel[t] * nights * season * singleRoom },
      { label: "餐飲", note: `${days} 天`, value: c.food[t] * days },
      { label: "當地交通", note: "地鐵、巴士、計程車、城際交通", value: c.transport[t] * days },
      { label: "門票與活動", note: `${Math.max(nights, 1)} 天行程`, value: c.activity[t] * Math.max(nights, 1) },
      { label: "保險、網路與簽證", note: dest.visa, value: D.dailyMisc[t] * days + c.fixed }
    ].map((i) => ({ ...i, value: round100(i.value) }));
    const perPerson = items.reduce((s, i) => s + i.value, 0);
    return { items, perPerson, group: perPerson * state.people };
  }

  function itinerary(dest) {
    const days = state.days;
    const list = [{ text: `從台灣出發（飛行${dest.flightHours}），抵達${dest.name}，入住飯店、周邊散步與晚餐` }];
    for (let i = 0; i < days - 2; i++) {
      list.push(i < dest.plan.length
        ? { text: dest.plan[i] }
        : { text: "自由活動：再訪喜歡的地方、購物或安排近郊小旅行", free: true });
    }
    list.push({ text: "整理行李、最後採買伴手禮 → 搭機返回台灣" });
    return list;
  }

  function renderResults() {
    const chosen = D.destinations.filter((d) => state.picked.has(d.id));
    const rows = chosen.map((d) => ({ d, e: estimate(d) })).sort((a, b) => a.e.perPerson - b.e.perPerson);
    const tierLabel = D.tiers[state.tier].label;
    const seasonLabel = D.seasons.find((s) => s.id === state.season).label;

    if (!rows.length) {
      $("summary").textContent = "";
      $("compare").innerHTML = `<p class="empty">請在上方至少選一個目的地。</p>`;
      $("cards").innerHTML = "";
      return;
    }

    const max = rows[rows.length - 1].e.perPerson;
    const within = state.budget ? rows.filter((r) => r.e.perPerson <= state.budget).length : null;
    $("summary").textContent =
      `${state.days} 天 ${state.days - 1} 夜・${tierLabel}・${seasonLabel}・${state.people} 人，以每人費用由低到高排序` +
      (within !== null ? `。預算 ${fmt(state.budget)} 內有 ${within} 個選擇` : "");

    $("compare").innerHTML = `<div class="compare">${rows.map((r, i) => {
      const over = state.budget && r.e.perPerson > state.budget;
      const tag = over ? `<span class="tag over">超出預算</span>` : i === 0 && rows.length > 1 ? `<span class="tag cheap">最省</span>` : "";
      return `<div class="bar-row${over ? " over" : ""}">
        <a href="#dest-${r.d.id}">${r.d.flag} ${esc(r.d.name)}${tag}</a>
        <div class="bar" aria-hidden="true"><i style="width:${(r.e.perPerson / max) * 100}%;background:${r.d.color}"></i></div>
        <strong>${fmt(r.e.perPerson)}<small style="display:block;font-weight:400;color:var(--muted);font-size:.75rem">每人</small></strong>
      </div>`;
    }).join("")}</div>`;

    $("cards").innerHTML = rows.map(({ d, e }) => {
      const short = state.days < d.minDays
        ? `<p class="note">${esc(d.name)}建議至少 ${d.minDays} 天，${state.days} 天扣掉飛行時間會比較趕。</p>` : "";
      const over = state.budget && e.perPerson > state.budget
        ? `<p class="note">每人超出預算 ${fmt(e.perPerson - state.budget)}，可以改選「經濟」等級、淡季出發或縮短天數。</p>` : "";
      return `<article class="card" id="dest-${d.id}" style="--c:${d.color}">
        <div class="card-head">
          <h3>${d.flag} ${esc(d.name)}</h3>
          <p class="meta">${esc(d.region)}・飛行${esc(d.flightHours)}・${esc(d.visa)}</p>
          <div class="totals">
            <div>每人約<b>${fmt(e.perPerson)}</b></div>
            <div>${state.people} 人合計約<b>${fmt(e.group)}</b></div>
            <div>每人每天約<b>${fmt(e.perPerson / state.days)}</b></div>
          </div>
          ${short}${over}
        </div>
        <div class="card-body">
          <div>
            <h4>每人費用明細</h4>
            <table><tbody>
              ${e.items.map((i) => `<tr><td>${esc(i.label)}<small>${esc(i.note)}</small></td><td>${fmt(i.value)}</td></tr>`).join("")}
              <tr class="sum"><td>合計</td><td>${fmt(e.perPerson)}</td></tr>
            </tbody></table>
          </div>
          <div>
            <h4>建議行程</h4>
            <ol class="days">${itinerary(d).map((x) => `<li class="${x.free ? "free" : ""}">${esc(x.text)}</li>`).join("")}</ol>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function bind() {
    $("planner").addEventListener("change", (ev) => {
      const el = ev.target;
      if (el.closest("#destinations")) {
        el.checked ? state.picked.add(el.value) : state.picked.delete(el.value);
      } else if (el.name === "days") state.days = Number(el.value);
      else if (el.name === "tier") state.tier = Number(el.value);
      else if (el.name === "season") state.season = el.value;
      renderResults();
    });
    $("people").addEventListener("input", (ev) => {
      const n = Math.floor(Number(ev.target.value));
      state.people = n >= 1 ? Math.min(n, 20) : 1;
      renderResults();
    });
    $("budget").addEventListener("input", (ev) => {
      const n = Number(ev.target.value);
      state.budget = n > 0 ? n : null;
      renderResults();
    });
    document.querySelector(".quick").addEventListener("click", (ev) => {
      const pick = ev.target.dataset && ev.target.dataset.pick;
      if (!pick) return;
      state.picked = new Set(
        pick === "none" ? [] : D.destinations.filter((d) => pick === "all" || d.region === pick).map((d) => d.id)
      );
      renderControls();
      renderResults();
    });
    $("planner").addEventListener("submit", (ev) => ev.preventDefault());
  }

  renderControls();
  bind();
  renderResults();
})();
