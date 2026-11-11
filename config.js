// 僅能填入專案網址及公開 publishable key；絕不可填入 sb_secret_ 或 service_role 金鑰。
// 正確值尚待提供，保留空值時網頁會顯示尚未完成設定，不會發送資料。
window.REPAIR_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabasePublishableKey: ""
});
