# Milestone 1 — יסודות הפרויקט ורישום הוצאה מקצה לקצה: תוכנית בנייה

> מקורות: `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md` (גרסה 2.0), `DESIGN.md`, והתמונות `wireframes-desktop.png`, `wireframes-mobile.png`, `mockups-desktop.png`, `mockups-mobile.png`, `style-guide.png`.
> התוכנית מחליפה תוכנית קודמת שנכתבה לפי spec ישן (אפליקציה עם התחברות). הקוד הקיים ב-repo נבנה לפי ה-spec הישן — חלקו נשמר וחלקו מוסר (סעיף 3).
>
> **עדכון במהלך הבנייה (ADR-1 ב-ARCHITECTURE.md, באישור המשתמש):** החיבור למסד הנתונים עבר לשיטת המרצה, וזה גובר על הכתוב בהמשך התוכנית:
> - במקום `@supabase/supabase-js` עם `SUPABASE_URL`/`SUPABASE_SECRET_KEY`: הספרייה `postgres` עם משתנה יחיד `DATABASE_URL` (משתמש `app_backend`, Transaction pooler, פורט 6543). הקובץ `api/_lib/supabaseAdmin.ts` הוחלף ב-`api/_lib/db.ts`.
> - Data API כבוי בשני הפרויקטים; ה-Migration מעניקה ל-`app_backend` הרשאות CRUD ו-Policy של RLS.
> - המשתמש יוצר ב-Development את `app_backend` ב-SQL Editor, ומריץ שם את ה-Migration (ה-Supabase MCP לא זמין בשיחה הנוכחית).
> - Production: Supabase GitHub Integration (במקום GitHub Actions) — יוגדר ב-Milestone 6.
> - בדיקת "קריאה ישירה נחסמת": קריאת REST לפרויקט נכשלת כי ה-Data API כבוי, ו-`anon` בלי הרשאות.

## 1. מטרה ותחום

**בסוף ה-Milestone:** פותחים את האתר מקומית, ממלאים טופס "הוספת הוצאה", ההוצאה עוברת Browser → `/api/expenses` → Supabase **Development**, ומופיעה ברשימה — וגם אחרי Reload.

**בתחום:**
- שלד הפרויקט לפי ARCHITECTURE: React + TS + Vite, **CSS Modules + CSS רגיל** (לא Tailwind), React Router, Vercel Functions, Zod, Vitest + React Testing Library.
- Migration ראשונה: טבלת `public.expenses` + RLS בלי גישה ל-`anon`/`authenticated`. מורצת על Development בלבד.
- API: `GET /api/expenses`, `POST /api/expenses` בלבד.
- דף הבית: טופס הוספה עם כל כללי הוולידציה + רשימת ההוצאות (קריאה בלבד) + מצבי טעינה / ריק / שגיאה.
- Layout משותף: כותרת "ניהול הוצאות" וניווט לארבעת הדפים (פס עליון במחשב, פס תחתון בטלפון), עיצוב כהה לפי ה-Style Guide.
- מניעת Production Deployment אוטומטי של Vercel מ-`main`.

**מחוץ לתחום (Milestones הבאים):** עדכון/מחיקה (`PUT`/`DELETE`, Modal, Dialog) ומיון — M2; תוכן דפי פילטרים / דו"חות / אודות — M3–M5 (בשלב זה כל אחד מהם מציג רק את הכותרת שלו); Chart.js, Papa Parse, pdfmake — לא מותקנים; GitHub Actions וכל נגיעה ב-Supabase Production — M6.

## 2. החלטות טכניות לאבן הדרך (יתועדו כ-ADR ב-ARCHITECTURE.md)

1. **הרצת ה-API מקומית בלי Vercel CLI.** ARCHITECTURE מתיר "API מקומי שמחובר ל-Dev". הפונקציות נכתבות בתיקיית `api/` בפורמט Vercel Functions (Web standard: `export async function GET(request: Request)` / `POST`), ובפיתוח מקומי Plugin קטן ב-`vite.config.ts` מנתב בקשות `/api/*` לאותן פונקציות בדיוק (דרך `server.ssrLoadModule`). כך `npm run dev` אחד מריץ אתר + API, בלי התחברות ל-Vercel מהמחשב.
2. **הרצת Migrations על Development דרך חיבור ה-Supabase MCP** שכבר הוגדר בפרויקט (`.mcp.json`), שמוגבל לפרויקט ה-Development בלבד (`project_ref=vlezqqgleidvqrwwpdkf`) — כך אין אפשרות טכנית לגעת ב-Production. קובץ ה-SQL נשמר ב-`supabase/migrations/<version>_create_expenses.sql`, ושם הגרסה בקובץ יהיה **זהה** לגרסה שנרשמת ב-Development, כדי ש-`supabase db push` ב-M6 יעבוד בלי התנגשויות. חלופה אם ה-MCP לא זמין: `npx supabase` CLI (דורש Access Token — הדרכה צעד אחר צעד).
3. **שם קובץ הסודות המקומי:** CLAUDE.md קובע `.env` (שכבר קיים ומוחרג מ-Git), ו-ARCHITECTURE מזכיר `.env.local`. Vite וה-Plugin טוענים את שניהם; **נשארים עם `.env`** לפי CLAUDE.md, בלי ליצור קובץ נוסף.
4. **גופן:** Heebo (מתוך "Heebo / Assistant" ב-Style Guide), דרך Google Fonts; ספרות ב-Inter לפי ה-Style Guide (`font-family: Heebo, Inter, sans-serif` + `tabular-nums`).

## 3. מה קורה לקוד הקיים

| נשמר | מוסר / מוחלף |
|------|------|
| `package.json`, Vite, TypeScript, React, React Router, Vitest, `lucide-react` (אייקוני Outline כמו ב-Style Guide) | Tailwind (`tailwindcss`, `@tailwindcss/vite`) → CSS Modules |
| `index.html` (עברית/RTL) — מתעדכן: כותרת "ניהול הוצאות", Heebo + Inter, `theme-color` כהה | כל קוד ההתחברות: `src/features/auth/*`, `src/lib/supabase.ts` (הדפדפן לא מדבר עוד עם Supabase) |
| `.claude/launch.json`, `.mcp.json`, Agent Skills | `MorePage`, `navItems` הישנים, `AppLayout` הישן (נכתב מחדש) |
| `@supabase/supabase-js` — עובר לשימוש **בצד השרת בלבד** | משתני `VITE_SUPABASE_*` ב-`.env.example` |

## 4. תלויות

- **להוסיף:** `zod`; dev: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@vercel/node` (טיפוסים בלבד, אם יידרש).
- **להסיר:** `tailwindcss`, `@tailwindcss/vite`.

## 5. קבצים

```
vercel.json                     rewrites: כל נתיב שאינו /api/* → /index.html;
                                git.deploymentEnabled.main = false  (אין Auto-Deploy ל-Production מ-Vercel)
.env.example                    SUPABASE_URL=, SUPABASE_SECRET_KEY=   (בלי ערכים, בלי VITE_)
vite.config.ts                  react() + devApi() plugin; vitest: environment jsdom לקבצי UI, node ל-API
supabase/migrations/<version>_create_expenses.sql

shared/                         קוד משותף ל-Frontend ול-Backend (ללא תלות ב-DOM או ב-Node)
  categories.ts                 11 הקטגוריות לפי PRD, בסדר: מזון, דלק, פנאי, רשויות, בריאות, קניות, תחבורה, דיור, חינוך, אחר, הכשרה
  money.ts                      parseShekelsToAgorot("49.9") → 4990 (מחרוזת → שלמים, בלי float); formatAgorot(4990) → "49.90"
  dates.ts                      todayInJerusalem() → "YYYY-MM-DD"; isValidIsoDate; isFutureDate
  expenseSchema.ts              Zod: גוף Create { category, description, amount, expenseDate } + הודעות שגיאה בעברית
  types.ts                      Expense { id, category, description, amount (string "249.90"), expenseDate }
  *.test.ts                     בדיקות לכל הנ"ל

api/
  expenses/index.ts             GET → כל ההוצאות ממוינות expense_date DESC, created_at DESC; POST → ולידציה Zod → insert → 201
  _lib/supabaseAdmin.ts         createClient(SUPABASE_URL, SUPABASE_SECRET_KEY) — שרת בלבד; שגיאה ברורה אם חסר משתנה
  _lib/http.ts                  json(), errorResponse(code, message, status), הגבלת גודל גוף (למשל 10KB), 405 ל-Method אחר
  _lib/expenseRow.ts            המרה בין שורת DB (amount_agorot, expense_date) לבין Expense של ה-API
  expenses.test.ts              בדיקות ה-Handlers עם Supabase מדומה (mock): 201, 400 לכל כלל, 405, 500 בלי חשיפת פרטים

src/
  main.tsx, App.tsx             BrowserRouter; נתיבים: / (בית), /filters, /reports, /about, * → /
  styles/global.css             משתני צבע, גופן, רקע, RTL, focus ברור
  components/Layout.tsx (+ .module.css)   כותרת "ניהול הוצאות" + ניווט 4 קישורים: עליון במחשב, תחתון בטלפון
  components/PageTitle.tsx
  api/client.ts                 fetchExpenses(), createExpense(); מבחין בין שגיאת ולידציה (400) לשגיאת רשת/שרת
  pages/HomePage.tsx (+ .module.css)
  features/expenses/ExpenseForm.tsx (+ .module.css)
  features/expenses/ExpenseList.tsx (+ .module.css)   טבלה במחשב, כרטיסים בטלפון
  features/expenses/ExpenseForm.test.tsx              RTL: ברירת מחדל של תאריך, הודעות ולידציה, אין שליחה כשקלט שגוי
  pages/FiltersPage.tsx, ReportsPage.tsx, AboutPage.tsx   כותרת בלבד ("סינון הוצאות", "דו"חות וניתוח הוצאות", "אודות המערכת")
```

`tsconfig.json` יכלול את `src`, `shared`, `api`. ייבוא יחסי בתוך `api/` ו-`shared/` עם סיומת `.js` (נדרש ל-ESM בפונקציות של Vercel; TypeScript ו-Vite מתרגמים לקובץ `.ts`).

## 6. מסד הנתונים (Migration ראשונה)

```sql
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('מזון','דלק','פנאי','רשויות','בריאות','קניות','תחבורה','דיור','חינוך','אחר','הכשרה')),
  description text,
  amount_agorot integer not null check (amount_agorot between 1 and 10000000),
  expense_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint description_required_for_other
    check (category <> 'אחר' or (description is not null and length(btrim(description)) > 0))
);
create index expenses_expense_date_idx on public.expenses (expense_date desc);
-- updated_at: trigger function שמעדכנת now() ב-UPDATE
alter table public.expenses enable row level security;
revoke all on table public.expenses from anon, authenticated;
-- אין Policies: רק מפתח ה-Secret בשרת (שעוקף RLS) ניגש לטבלה
```

**בדיקות אחרי ההרצה (על Development):** הטבלה, האילוצים והאינדקס קיימים; `insert` עם סכום 0 / קטגוריה לא מוכרת / "אחר" בלי תיאור נכשל ב-DB; קריאת REST ישירה ל-`/rest/v1/expenses` עם ה-Publishable key של Development מחזירה שגיאת הרשאה ולא נתונים.

## 7. API

- **`GET /api/expenses`** → `200` עם מערך `{ id, category, description, amount, expenseDate }`. `amount` כמחרוזת שקלים עם 2 ספרות ("249.90"), מחושבת מאגורות בשלמים.
- **`POST /api/expenses`** → גוף `{ category, description, amount, expenseDate }`:
  - `amount` מתקבל כמחרוזת (או מספר) ונבדק בביטוי `^\d+(\.\d{1,2})?$`, מומר לאגורות, וחייב להיות 1..10,000,000.
  - `expenseDate` בפורמט `YYYY-MM-DD`, תאריך קיים, **לא אחרי היום לפי `Asia/Jerusalem`**.
  - `description`: נחתך מרווחים; ריק → `null`; חובה כשהקטגוריה "אחר"; אורך מקסימלי סביר (למשל 200 תווים).
  - הצלחה → `201` עם ההוצאה שנוצרה.
- **שגיאות:** `400 VALIDATION_ERROR` (עם פירוט שדות להצגה בטופס), `405 METHOD_NOT_ALLOWED`, `413` לגוף גדול מדי, `500/503 SERVER_ERROR` — בגוף אחיד `{"error":{"code","message"}}`, בלי SQL, מפתחות או Stack Trace.

## 8. דף הבית — ממשק

**טופס "הוספת הוצאה"** (שדות לפי DESIGN, במחשב בשתי עמודות, בטלפון אחד מתחת לשני):
- **קטגוריה** — Select, אפשרות פתיחה "בחר קטגוריה" + 11 הקטגוריות.
- **תיאור** — טקסט, placeholder "תיאור ההוצאה (אופציונלי)"; כשנבחר "אחר" ה-placeholder משתנה ל"תיאור ההוצאה (חובה)".
- **סכום (₪)** — `inputMode="decimal"`, placeholder "0.00".
- **תאריך** — `type="date"`, ברירת מחדל היום (תאריך מקומי), `max` = היום.
- כפתור **"הוסף הוצאה"** (Primary, Pink→Magenta). בזמן שליחה: מושבת, טקסט "שומר…".

**הודעות ולידציה** (מוצגות מתחת לשדה; אותו נוסח מגיע מה-Backend דרך `shared/expenseSchema.ts`). ה-PRD לא מגדיר נוסחים, ולכן אלה הצעה:
- קטגוריה חסרה: "יש לבחור קטגוריה"
- "אחר" בלי תיאור: "בקטגוריה 'אחר' יש להזין תיאור"
- סכום חסר: "יש להזין סכום"
- סכום לא חוקי / 0 / שלילי: "יש להזין סכום חיובי"
- יותר משתי ספרות אחרי הנקודה: "עד שתי ספרות אחרי הנקודה"
- מעל 100,000: "הסכום המרבי הוא ₪100,000"
- תאריך חסר / לא חוקי: "יש לבחור תאריך תקין"
- תאריך עתידי: "לא ניתן לבחור תאריך עתידי"

**אחרי שמירה:** רק לאחר `201` — הטופס מתאפס (קטגוריה ריקה, תאריך היום), הרשימה נטענת מחדש, ומופיעה הודעה קצרה "ההוצאה נשמרה". כשל רשת/שרת — הודעה אדומה "השמירה נכשלה, ההוצאה לא נשמרה. נסו שוב." והקלט נשאר בטופס.

**"רשימת הוצאות"** (מתחת לקו מפריד):
- **מחשב:** טבלה — תאריך, תיאור, קטגוריה, סכום (₪). בלי עמודת "פעולות" (נוספת ב-M2). סדר: מהחדש לישן (מה-API).
- **טלפון:** כרטיס לכל הוצאה — סכום בולט "₪ 249.90", תיאור · קטגוריה, תאריך.
- תאריכים מוצגים `DD/MM/YYYY`, סכומים עם 2 ספרות; שניהם עטופים ב-`dir="ltr"`/`<bdi>` כדי שלא יתהפכו.
- **טעינה:** "טוען הוצאות…".
- **ריק:** "עדיין אין הוצאות. אפשר להוסיף את הראשונה בטופס למעלה."
- **כשל טעינה:** "לא הצלחנו לטעון את ההוצאות" + כפתור "נסו שוב" — **לעולם לא** מוצג כרשימה ריקה.

## 9. עיצוב (לפי Style Guide ו-Mockups)

- **צבעים** כמשתני CSS ב-`global.css`: `--deep-navy #0A1020` (רקע), `--panel-blue #0F1E34` (כרטיסים ושדות), `--cyan #22E1FF`, `--aqua #4DE8DC`, `--teal #2DD4BF`, `--hot-pink #FF3B78`, `--magenta #E91E8A`, `--violet #8B7CFF`, `--text-light #EAF2FF`. טקסט משני: `--text-light` בשקיפות (לא HEX חדש).
- **טיפוגרפיה:** H1 32/700, H2 24/700, H3 20/600, Body 16/400, Caption 12/400.
- **רכיבים:** כפתור Primary עם Gradient Pink→Magenta; שדות כהים עם מסגרת דקה בגוון Cyan שקוף ו-Glow עדין בפוקוס; כרטיסים Panel Blue עם גבול דק; Radius 8–16px; מרווחים בכפולות 8px.
- **ניווט:** מחשב — פס עליון: "ניהול הוצאות" + אייקון מימין, קישורים "בית · פילטרים · דו"חות · אודות", הפעיל בגלולה עם Glow ב-Cyan. טלפון (< 768px) — כותרת עליונה + **פס ניווט תחתון** עם 4 אייקונים ותוויות. ה-Wireframe הנייד מציג גם אייקון "המבורגר" בכותרת — **לא** ממומש, כי DESIGN קובע שהפס התחתון הוא הייחוס ושאין להוסיף ניווט נוסף.
- גל ה-Neon הדקורטיבי מה-Mockups: לא חובה ב-M1 (DESIGN: "הדגשה גרפית מינורית").

## 10. בדיקות אוטומטיות

- `shared/`: המרת סכומים (`"0.1"`→10, `"49.90"`→4990, `"100000"`→10000000, דחיית `"1.234"`, `"-5"`, `"0"`, `"abc"`, `"100000.01"`), תאריך עתידי לפי ירושלים, כל כללי ה-Schema.
- `api/`: Handlers עם Supabase מדומה — 201 בהצלחה, 400 לכל כלל, 405, 500 בלי חשיפת פרטים, המרת אגורות.
- `src/`: טופס — תאריך ברירת מחדל, הודעות שגיאה, אין קריאה ל-API כשהקלט שגוי.
- `npm test` ו-`npm run build` (כולל Type Check) עוברים.

## 11. מה המשתמש עושה (הדרכה צעד אחר צעד בזמן הבנייה)

1. **מפתח Secret של Development:** Supabase → `expenses-dev` → Project Settings → API Keys → Secret keys → יצירה/העתקה של מפתח `sb_secret_...`. ב-`.env`: למחוק את שתי שורות ה-`VITE_SUPABASE_*`, ולהוסיף `SUPABASE_URL=` (אותה כתובת כמו קודם) ו-`SUPABASE_SECRET_KEY=`. לא להדביק בשיחה.
2. **Vercel:** למחוק מ-Environment Variables של הפרויקט את `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` (כבר לא בשימוש). סודות ה-Production יוגדרו רק ב-M6. האתר החי הנוכחי (הגרסה הישנה עם ההתחברות) יישאר כמו שהוא עד M6, כי Auto-Deploy יכובה.
3. **ה-Supabase MCP:** אם הכלים שלו לא זמינים בשיחה, לפתוח את השיחה מחדש (ההתחברות כבר בוצעה).

הגדרות ההתחברות שהוגדרו קודם ב-Supabase (המשתמש שנוצר, ביטול ההרשמה) כבר לא רלוונטיות. לא מוחקים אותן — אין להן השפעה.

## 12. סדר העבודה בבנייה

1. הסרת Tailwind וקוד ההתחברות; התקנת Zod ו-Testing Library; עדכון `tsconfig`, `vite.config.ts`, `vercel.json`, `.env.example`, `index.html`.
2. `shared/` + בדיקות.
3. **עצירה להדרכה (סעיף 11.1–11.3).**
4. Migration: כתיבת הקובץ, הרצה על Development דרך ה-MCP, בדיקות סעיף 6.
5. `api/` + בדיקות; Plugin ה-API בפיתוח.
6. Layout, ניווט, עיצוב גלובלי, דפים ריקים.
7. דף הבית: טופס, רשימה, מצבים; בדיקת הטופס.
8. בדיקה בדפדפן מול Development: הוספות תקינות ושגויות, Reload, מצב כשל (עצירת ה-API), מחשב וטלפון.
9. בדיקת סודות: חיפוש `sb_secret` וכתובת Supabase ב-`dist/` וב-Git; קריאת REST ישירה עם Publishable key נחסמת.
10. ADR-ים (סעיף 2), עדכון "פקודות הרצה" ב-CLAUDE.md אם השתנו, סימון 🟡 ב-MILESTONES.md, סגירת השרת.

## 13. בדיקה מול Definition of Done

| תנאי | איך נבדק |
|------|----------|
| שני פרויקטי Supabase נפרדים; הפיתוח פונה ל-Development בלבד | `.env` מכיל רק Development (המשתמש מאשר); ה-MCP מוגבל ל-`project_ref` של Development |
| Migration שמורה ב-Git והורצה ב-Development; טבלה, אילוצים והרשאות נבדקו | בדיקות סעיף 6 |
| יצירת הוצאה עם אחת מ-11 הקטגוריות, תאריך היום כברירת מחדל, תיאור אופציונלי חוץ מ"אחר", סכום עד 2 ספרות | בדיקה בדפדפן + בדיקות אוטומטיות |
| Frontend ו-Backend דוחים קלט שגוי (שדה חובה, "אחר" בלי תיאור, סכום לא חוקי / מעל ₪100,000, תאריך עתידי) | בדיקות טופס + בדיקות API + שליחה ישירה ל-API עם גוף שגוי |
| הנתונים מה-API נשארים אחרי Reload; כשל API לא מוצג כאפס הוצאות או כהצלחה | Reload; עצירת ה-API / ניתוק ומעקב אחרי ההודעות |
| אין Secrets בקוד, ב-Commit או ב-Bundle; קריאה ישירה לטבלה נחסמת | סעיף 12.9 |
| בדיקות ו-Build עוברים; תוצאת בדיקה ידנית מוצגת למשתמש | `npm test`, `npm run build`, סיכום בסוף הבנייה |
