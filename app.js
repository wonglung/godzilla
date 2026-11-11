(() => {
  "use strict";
  const form = document.querySelector("#repair-form");
  const fields = document.querySelector("#form-fields");
  const submitButton = document.querySelector("#submit-button");
  const refreshButton = document.querySelector("#refresh-button");
  const formMessage = document.querySelector("#form-message");
  const listMessage = document.querySelector("#list-message");
  const list = document.querySelector("#request-list");
  const categories = ["設備", "網路", "環境", "其他"];
  const urgencies = ["低", "中", "高"];
  let client;
  let submitting = false;
  let loading = false;

  function message(element, text, tone = "") {
    element.textContent = text;
    element.dataset.tone = tone;
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function renderRequests(rows) {
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const card = node("article", "request", "");
      const heading = node("div", "request-heading", "");
      heading.append(node("h3", "", row.location), node("span", "badge", row.category),
        node("span", row.urgency === "高" ? "badge high" : "badge", `緊急程度：${row.urgency}`),
        node("span", "badge", row.status));
      const date = new Date(row.created_at);
      const time = Number.isNaN(date.getTime()) ? "時間無法顯示" : date.toLocaleString("zh-TW", { hour12: false });
      card.append(heading, node("p", "description", row.description),
        node("p", "metadata", `${row.reporter_name} · ${time}（當地時間）`));
      fragment.append(card);
    }
    list.replaceChildren(fragment);
  }

  async function loadRequests() {
    if (loading) return;
    loading = true;
    refreshButton.disabled = true;
    list.setAttribute("aria-busy", "true");
    message(listMessage, "正在載入報修清單…");
    try {
      const { data, error } = await client.from("repair_requests")
        .select("id,created_at,reporter_name,location,category,description,urgency,status")
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(20);
      if (error) throw error;
      renderRequests(data || []);
      message(listMessage, data?.length ? "" : "目前沒有報修紀錄。");
    } catch {
      message(listMessage, "清單載入失敗，請檢查網路連線後按「重新整理」。若仍失敗，請聯絡管理員確認設定與讀取權限。", "error");
    } finally {
      loading = false;
      refreshButton.disabled = false;
      list.setAttribute("aria-busy", "false");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client || submitting || !form.reportValidity()) return;
    const values = new FormData(form);
    // 只送出獲授權的五個欄位；id、created_at、status 由資料庫預設值產生。
    const payload = Object.fromEntries(["reporter_name", "location", "category", "description", "urgency"]
      .map((key) => [key, String(values.get(key) || "").trim()]));
    const limits = { reporter_name: 100, location: 200, description: 2000 };
    if (Object.entries(limits).some(([key, limit]) => !payload[key] || [...payload[key]].length > limit)
      || !categories.includes(payload.category) || !urgencies.includes(payload.urgency)) {
      message(formMessage, "請填妥所有欄位，文字不可只有空白，並確認字數及選項。", "error");
      return;
    }
    submitting = true;
    fields.disabled = true;
    submitButton.textContent = "送出中…";
    message(formMessage, "正在送出，請稍候…");
    try {
      const { error } = await client.from("repair_requests").insert(payload);
      if (error) throw error;
      form.reset();
      message(formMessage, "報修已成功送出！", "success");
      await loadRequests();
    } catch {
      message(formMessage, "送出失敗或結果尚未確認，內容已保留。請先重新整理清單確認是否已有紀錄，再決定是否重送；若持續失敗，請聯絡管理員。", "error");
    } finally {
      submitting = false;
      fields.disabled = false;
      submitButton.textContent = "送出報修";
    }
  });
  refreshButton.addEventListener("click", loadRequests);

  try {
    const config = window.REPAIR_CONFIG || {};
    const url = new URL(config.supabaseUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash
      || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.supabasePublishableKey || "")) throw new Error("invalid config");
    if (!window.supabase?.createClient) throw new Error("SDK unavailable");
    client = window.supabase.createClient(url.href, config.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    loadRequests();
  } catch {
    fields.disabled = true;
    refreshButton.disabled = true;
    message(formMessage, "系統尚未就緒，暫時無法送出。請聯絡管理員確認連線設定與程式載入。", "error");
    message(listMessage, "暫時無法載入清單。", "error");
  }
})();
