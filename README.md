# 消費者同理心地圖生成器

教學用工具：學員輸入品牌名稱，AI 自動產出四種消費族群（品牌大使／既有消費者／一次性買家／未觸及消費者）的同理心地圖與消費者旅程。

線上版：<https://consumer-insight-map.vercel.app>

## 帳號

- **管理員（看得到全部學員產出，可設定課程密碼）**
  - `kuoyo20@gmail.com`
  - `kuoyo@miaolin.com.tw`
  - `kuoyo@miraclex.com.tw`
  - `wendy.tyw@gmail.com`
- **學員**：用自己的 email + 老師當期發的密碼登入；首次登入會自動建立帳號。

要新增管理員：改兩個地方並重新部署 — `src/lib/auth.ts` 的 `ADMIN_EMAILS`、`supabase/functions/set-course-password/index.ts` 的 `ADMIN_EMAILS`，以及 DB 的 `public.is_admin()` function。

## 本機開發

```bash
cp .env.example .env       # 填入 Supabase URL / anon key
npm install
npm run dev
```

## 部署架構

- **前端**：Vite + React + Tailwind + shadcn-ui，部署在 Vercel（push 到 main 自動部署）。
- **後端**：Supabase（Auth + Postgres + Edge Functions）。
  - 資料表：`course_settings`、`empathy_results`（皆有 RLS：學員只看自己、admin 看全部）
  - Edge Functions：
    - `research-brand` / `generate-empathy-maps` / `generate-consumer-journey` → 透過 Lovable AI Gateway 呼叫 LLM，需要 `LOVABLE_API_KEY` secret
    - `set-course-password` → 管理員才能呼叫，更新課程密碼並重設所有非管理員的密碼

## Supabase 必要設定（每個新環境只做一次）

在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 加入：

```
LOVABLE_API_KEY=<從 lovable.dev 工作區設定取得>
```

> `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` Supabase 預設已注入，不用手動設。

部署 / 更新 Edge Functions：

```bash
export SUPABASE_ACCESS_TOKEN=<sbp_...>
supabase link --project-ref <project-ref>
supabase functions deploy   # 一次部署所有 functions
```

## 主要技術

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn-ui + Radix
- Supabase JS v2（Auth + DB + Edge Functions）
- AI：Google Gemini（透過 Lovable AI Gateway，可改打直連）
- 匯出：jspdf / html2canvas（dynamic import）
- 文件解析：pdfjs-dist / mammoth（dynamic import）
