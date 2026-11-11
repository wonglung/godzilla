'use strict';

(() => {
  const form = document.querySelector('#repair-form');
  const submitButton = document.querySelector('#submit-button');
  const refreshButton = document.querySelector('#refresh-button');
  const formMessage = document.querySelector('#form-message');
  const listMessage = document.querySelector('#list-message');
  const list = document.querySelector('#request-list');
  const filterButtons = document.querySelectorAll('[data-urgency]');
  const filterMessage = document.querySelector('#filter-message');
  let requests = [];
  let selectedUrgency = '全部';
  let client;
  let sending = false;
  let loading = false;

  function updateControls() {
    submitButton.disabled = !client || !navigator.onLine || sending;
    refreshButton.disabled = !client || !navigator.onLine || loading;
  }

  window.addEventListener('offline', () => {
    updateControls();
    message(listMessage, '目前離線，無法取得最新清單。既有畫面中的紀錄可能不是最新。', 'error');
  });
  window.addEventListener('online', () => {
    updateControls();
    if (client) loadRequests();
    else message(formMessage, '已恢復網路，但系統尚未初始化。請先保留填寫內容，再重新載入頁面。', 'error');
  });

  function renderFilteredRequests() {
    const visible = selectedUrgency === '全部'
      ? requests : requests.filter(request => request.urgency === selectedUrgency);
    list.replaceChildren(...visible.map(renderRequest));
    message(filterMessage, requests.length && !visible.length
      ? `最近 20 筆紀錄中，沒有緊急程度為「${selectedUrgency}」的報修。` : '');
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedUrgency = button.dataset.urgency;
      filterButtons.forEach(filter => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      renderFilteredRequests();
    });
  });

  function message(element, text, type = '') {
    element.textContent = text;
    element.className = `message ${type}`;
    element.hidden = !text;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  const dateFormat = new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Taipei'
  });

  function renderRequest(request) {
    const card = element('article', 'request', '');
    const top = element('div', 'request-top', '');
    top.append(element('h3', '', request.location), element('span', 'badge', request.category));
    const urgencyClass = request.urgency === '高' ? 'urgency-high' : request.urgency === '中' ? 'urgency-medium' : '';
    top.append(element('span', `badge ${urgencyClass}`, `緊急：${request.urgency}`));
    const meta = element('div', 'request-meta', '');
    meta.append(element('span', '', `報修人：${request.reporter_name}`));
    const date = new Date(request.created_at);
    const time = element('time', '', Number.isNaN(date.getTime()) ? '時間未提供' : `${dateFormat.format(date)}（台北時間）`);
    if (!Number.isNaN(date.getTime())) time.dateTime = date.toISOString();
    meta.append(time, element('span', '', `狀態：${request.status}`));
    card.append(top, element('p', 'request-description', request.description), meta);
    return card;
  }

  async function loadRequests() {
    if (!navigator.onLine) {
      updateControls();
      list.setAttribute('aria-busy', 'false');
      message(listMessage, '目前離線，無法取得最新清單。既有畫面中的紀錄可能不是最新。', 'error');
      return;
    }
    loading = true;
    updateControls();
    list.setAttribute('aria-busy', 'true');
    message(listMessage, '正在載入報修紀錄…');
    try {
      const { data, error } = await client.from('repair_requests')
        .select('id,reporter_name,location,category,description,urgency,status,created_at')
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(20);
      if (error) throw error;
      requests = data;
      renderFilteredRequests();
      message(listMessage, data.length ? '' : '目前還沒有報修紀錄，歡迎登記第一筆。');
    } catch (error) {
      message(listMessage, `無法載入清單，請按「重新整理」再試。${requests.length ? '保留上次載入的紀錄，可切換篩選查看。' : ''} 錯誤：${error.message || '連線失敗'}`, 'error');
    } finally {
      loading = false;
      updateControls();
      list.setAttribute('aria-busy', 'false');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!navigator.onLine) {
      message(formMessage, '目前離線，報修尚未送出。請保持此頁面，恢復連線後再送出。', 'error');
      return;
    }
    if (!client || sending) return;
    const values = new FormData(form);
    // Only the five permitted business fields are sent. Status and timestamps use database defaults.
    const payload = Object.fromEntries(['reporter_name', 'location', 'category', 'description', 'urgency']
      .map(key => [key, String(values.get(key) || '').trim()]));
    if (Object.values(payload).some(value => !value)) {
      message(formMessage, '請完整填寫所有欄位，內容不能只有空白。', 'error');
      return;
    }
    sending = true;
    updateControls();
    submitButton.textContent = '送出中…';
    message(formMessage, '正在送出報修…');
    try {
      const { error } = await client.from('repair_requests').insert(payload);
      if (error) throw error;
      form.reset();
      message(formMessage, '報修已成功送出！感謝你的登記。', 'success');
      await loadRequests();
    } catch (error) {
      message(formMessage, `送出失敗，填寫內容已保留。請確認連線後再試。錯誤：${error.message || '連線失敗'}`, 'error');
    } finally {
      sending = false;
      updateControls();
      submitButton.textContent = '送出報修 ↗';
    }
  });

  try {
    const config = window.REPAIR_CONFIG;
    client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    updateControls();
    refreshButton.addEventListener('click', loadRequests);
    loadRequests();
  } catch (error) {
    submitButton.disabled = true;
    refreshButton.disabled = true;
    list.setAttribute('aria-busy', 'false');
    message(formMessage, navigator.onLine ? '系統初始化失敗，請重新載入頁面，並確認網路及網站設定。' : '目前離線，連線元件尚未準備完成。填寫內容尚未送出；請先保留內容，恢復連線後重新載入頁面。', 'error');
    message(listMessage, '無法連接報修系統，請稍後重新載入頁面。', 'error');
  }
})();
