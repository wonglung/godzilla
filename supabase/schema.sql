-- 報修登記系統：僅供人工審查的建表腳本，本次未執行。
-- 適用 Supabase 的 public schema、anon 與 authenticated 角色。
-- 本腳本以全新資料表為前提；若同名資料表已存在即失敗，避免覆蓋既有設計。
-- 所有步驟置於同一交易，避免建表後尚未完成權限設定便對外開放。
BEGIN;

-- 建立資料表：識別碼與建立時間由資料庫產生；所有欄位均不可為空值。
-- 文字上限為本次設計決定，需求筆記未規定：姓名 100、地點 200、說明 2000 字元。
-- 時間使用含時區型態；實際顯示時區由用戶端決定。
CREATE TABLE public.repair_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    reporter_name text NOT NULL,
    location text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    urgency text NOT NULL DEFAULT '中',
    status text NOT NULL DEFAULT '待處理',

    -- CHECK：文字必須包含非空白字元，並限制原始文字的字元數。
    CONSTRAINT repair_requests_reporter_name_check
        CHECK (reporter_name ~ '[^[:space:]]' AND char_length(reporter_name) BETWEEN 1 AND 100),
    CONSTRAINT repair_requests_location_check
        CHECK (location ~ '[^[:space:]]' AND char_length(location) BETWEEN 1 AND 200),
    CONSTRAINT repair_requests_description_check
        CHECK (description ~ '[^[:space:]]' AND char_length(description) BETWEEN 1 AND 2000),

    -- CHECK：以精確選項限制類別、緊急程度與狀態；選項同時限制文字長度。
    CONSTRAINT repair_requests_category_check
        CHECK (category IN ('設備', '網路', '環境', '其他')),
    CONSTRAINT repair_requests_urgency_check
        CHECK (urgency IN ('低', '中', '高')),
    CONSTRAINT repair_requests_status_check
        CHECK (status IN ('待處理', '處理中', '已完成'))
);

-- GRANT：清除可能由預設權限繼承的資料表權限，採取最小授權。
-- PUBLIC 是所有角色的共同權限；authenticated 本次不開放，登入後不會繼承 anon 權限。
-- 資料表擁有者與 service_role 屬管理用途，不應將其憑證交給前端。
REVOKE ALL PRIVILEGES ON TABLE public.repair_requests FROM PUBLIC, anon, authenticated;

-- GRANT：anon 可以讀取清單，並只可新增下列業務欄位。
-- 不授予資料表層級 INSERT，避免用戶端指定 id、created_at 或 status。
-- urgency 可省略以採用預設值；不授予 UPDATE、DELETE 或 TRUNCATE。
GRANT SELECT ON TABLE public.repair_requests TO anon;
GRANT INSERT (reporter_name, location, category, description, urgency)
    ON TABLE public.repair_requests TO anon;

-- RLS：啟用資料列安全；權限與政策必須同時允許，請求才能成功。
-- 未建立修改或刪除政策；即使日後誤授予相關權限，anon 仍不能修改或刪除資料列。
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- RLS：匿名訪客可以讀取所有報修資料；本示範只應使用虛構姓名與地點。
CREATE POLICY repair_requests_anon_select
    ON public.repair_requests
    FOR SELECT
    TO anon
    USING (true);

-- RLS：匿名訪客可以新增，但經預設值處理後的狀態必須為「待處理」。
-- 與欄位級 INSERT 授權互相防護；即使日後開放 status 輸入，仍不能以其他狀態新增。
CREATE POLICY repair_requests_anon_insert
    ON public.repair_requests
    FOR INSERT
    TO anon
    WITH CHECK (status = '待處理');

-- 完成建表、限制與授權後才提交；本檔案不包含任何執行或連線指令。
COMMIT;
