'use strict';

(() => {
  const status = document.querySelector('#connection-status');
  const installButton = document.querySelector('#install-button');
  const help = document.querySelector('#install-help');
  let installPrompt;

  function showConnection() {
    status.hidden = navigator.onLine;
    status.textContent = navigator.onLine ? '' : '目前離線：可以開啟已快取的頁面，但不能送出報修或取得最新清單。填寫內容尚未送出，離開或重新載入將不保留。';
  }
  window.addEventListener('online', showConnection);
  window.addEventListener('offline', showConnection);
  showConnection();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      help.textContent = '請使用瀏覽器選單中的「安裝應用程式」或「加入主畫面」。';
    }
  });
  function installed() {
    installButton.hidden = true;
    installPrompt = null;
    help.hidden = true;
  }
  window.addEventListener('appinstalled', installed);
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) installed();

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
        .catch(() => {
          help.hidden = false;
          help.textContent = '離線頁面尚未準備完成。請保持連線，稍後重新開啟；仍可使用一般網頁功能。';
        });
    });
  }
})();
