# ARCHITECTURE – מערכת לניהול הוצאות (Personal Finance)

**גרסה:** 3.0 · **תאריך עדכון:** 9 בנובמבר 2026  
**מסמך דרישות:** `PRD.md` גרסה 3.0.  
**מטרת מסמך זה:** ארכיטקטורה לאתר Web רספונסיבי בעברית (RTL) עם חשבונות משתמשים ובידוד נתונים, Backend ב-Vercel, Supabase (PostgreSQL + Auth), ייבוא דוחות בדפדפן, ופריסה דרך GitHub.
**מה השתנה מגרסה 2.0:** נוספו Supabase Auth, אימות JWT בשרת, RLS לפי משתמש דרך החיבור הישיר (ADR-6), ייבוא דוחות בדפדפן (ADR-8), Rate limiting משלנו (ADR-7), SMTP חיצוני (ADR-9) ומערכת עיצוב בלי ספריית אנימציה (ADR-10). ADR-1 עד ADR-5 נשארים בתוקף.

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
|---|---|---|
| Frontend | React + TypeScript | כל המסכים, טפסים, טבלאות, Modals |
| Build | Vite | שרת פיתוח ו-Build סטטי |
| Navigation | React Router | ניתוב בצד הלקוח, Protected routes |
| עיצוב | CSS Modules + CSS רגיל + CSS custom properties | Design System "Liquid Glass", RTL, רספונסיביות, Motion ב-CSS (ADR-10) |
| Auth בדפדפן | `@supabase/supabase-js` — **מודול Auth בלבד** (מפתח Publishable) | שמירה וחידוש Session, התנתקות, סיסמה חדשה בזרימת שחזור. **לא** לגישה לטבלאות |
| Backend | Vercel Functions (Node.js + TypeScript) | REST API, ולידציה, אימות Session, הרשאות, גישה ל-DB |
| אימות JWT בשרת | `jose` | אימות חתימת ה-Access Token מול JWKS של Supabase |
| Auth | Supabase Auth | חשבונות, סיסמאות, אימות אימייל, שחזור סיסמה, Sessions |
| Database | Supabase PostgreSQL | נתונים לכל משתמש, RLS |
| Database Client | `postgres` (postgres.js) בצד השרת בלבד | חיבור דרך Transaction pooler כמשתמש `app_backend`, שמתחזה ל-`authenticated` בכל בקשה (ADR-6) |
| Validation | Zod | סכמות קלט משותפות לדפדפן ולשרת |
| Charts | Chart.js + react-chartjs-2 | גרפים |
| CSV | Papa Parse | ייצוא, וקריאת CSV בייבוא |
| XLSX (ייבוא) | SheetJS — **מההפצה הרשמית `cdn.sheetjs.com`** בגרסה נעולה | קריאת Excel בדפדפן (הגרסה ב-npm ישנה ופגיעה) |
| PDF (ייבוא) | `pdfjs-dist` | חילוץ טקסט ממסמכי PDF טקסטואליים בדפדפן |
| PDF (ייצוא) | pdfmake + Heebo TTF | כמו היום (ADR-5) |
| מיילים | SMTP חיצוני (מומלץ Resend, תוכנית חינמית), מוגדר בתוך Supabase Auth | מיילי אימות ושחזור (ADR-9) |
| Testing | Vitest + React Testing Library; בדיקות API; בדיקות SQL לבידוד | חוקים עסקיים, ממשק, Backend, הרשאות |
| Source Control | Git + GitHub | קוד ו-Migrations |
| CI/CD | Supabase GitHub Integration + Vercel Git Integration | Migrations ל-Production ופריסה (ADR-1) |
| Hosting | Vercel | Frontend + Functions באותו דומיין |

### נימוק ההחלטות
- **שמירה על ה-Stack הקיים:** כל היכולות החדשות נבנות על אותם React/Vite/Vercel/Supabase/postgres.js. התוספות (`supabase-js` ל-Auth, `jose`, SheetJS, `pdfjs-dist`) נדרשות ליכולות שאין להן תחליף קיים.
- **Supabase Auth ולא מנגנון משלנו:** סיסמאות, אימות מייל, שחזור וחידוש Session הם תחום רגיש; Supabase מספק אותם בצורה בדוקה, ואנחנו לא שומרים סיסמאות.
- **RLS אמיתי דרך החיבור הישיר (ADR-6)** ולא מעבר ל-Data API: שומר על שכבת ה-API שנבנתה (ADR-1), ועדיין אוכף את ההרשאות במסד עצמו.
- **ייבוא בדפדפן (ADR-8):** פרטיות (הקובץ לא עוזב את המכשיר), בלי אחסון קבצים, בלי מגבלות גודל וזמן של Vercel.
- **בלי ספריית אנימציה (ADR-10):** CSS ו-View Transitions מספיקים לתנועה העדינה שנדרשת, בלי משקל נוסף.

### סיכונים ומגבלות מרכזיים
1. **אבטחת Session בדפדפן:** ה-Access/Refresh tokens נשמרים ב-localStorage (ברירת המחדל של supabase-js) ולכן חשופים ל-XSS. הגנות: Content-Security-Policy קפדני, בלי `innerHTML` עם נתוני משתמש, מעט תלויות.
2. **מיילים:** בלי SMTP חיצוני, Supabase שולח מיילים רק לחברי צוות הפרויקט ובמכסה קטנה — הרשמה ושחזור לא יעבדו למשתמשים אמיתיים (ADR-9).
3. **Rate limiting:** כל ההתחברויות דרך השרת מגיעות ל-Supabase מכתובות של Vercel, ולכן ההגבלה המובנית לפי IP לא מבחינה בין משתמשים (ADR-7).
4. **RLS בחיבור ישיר:** טעות בהגדרת ה-Role או ה-Claims בטרנזקציה עלולה לבטל את הבידוד — מכוסה בבדיקות SQL ייעודיות ובסינון כפול בקוד.
5. **דיוק פענוח דוחות:** פורמטים שונים בין בנקים וחברות אשראי; PDF תלוי פריסה; PDF סרוק לא נתמך.
6. **ביצועי Glass:** `backdrop-filter` כבד בטלפונים חלשים — טשטוש מתון, מעט שכבות, Fallback אטום.
7. **שירותים חיצוניים וזמינות:** Vercel, Supabase, ספק SMTP; פרויקט Supabase חינמי מושהה אחרי כשבוע ללא פעילות.
8. **Vercel Functions הן Stateless:** אין מצב בזיכרון בין בקשות; Rate limiting נשמר במסד.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```text
Browser (React + Vite build)
  ├─ Public: Login / Register / Forgot / Reset password / About
  ├─ Protected: Dashboard / Expenses / Reports / Import / Import history / Profile
  ├─ supabase-js (Auth only): session storage + refresh, sign-out, set new password
  ├─ Client-side: charts, filters, CSV/PDF export, statement parsing (CSV/XLSX/PDF)
  └─ HTTPS /api/*  (same origin)  — Authorization: Bearer <access token>
             │
             ▼
Vercel – Node.js Functions (REST API)
  ├─ /api/auth/*  : register, login (username → account), password recovery  ──► Supabase Auth
  ├─ verify JWT (jose + JWKS) → user_id   (identity only from the verified token)
  ├─ Zod validation, business rules, rate limiting (DB table)
  └─ postgres.js as app_backend:
        BEGIN; SET LOCAL ROLE authenticated;
        set_config('request.jwt.claims', <verified claims>, true);
        <queries>  → RLS: user_id = auth.uid()
        COMMIT
             │  TLS, Transaction pooler :6543
             ▼
Supabase – PostgreSQL (Data API disabled) + Supabase Auth (+ external SMTP)
  ├─ public.profiles, public.expenses, public.imports   (RLS per user)
  └─ private.auth_attempts                               (server only)

GitHub main → Supabase GitHub Integration → Production migrations
            → Vercel Git Integration     → Production deployment (enabled only at Milestone H)
```

- **הדפדפן לא ניגש לטבלאות.** ה-Data API כבוי; supabase-js בדפדפן משמש רק ל-Auth.
- **זהות = הטוקן המאומת בלבד.** כל `user_id` שמגיע בגוף בקשה או בכתובת מתעלמים ממנו.

### 2.2 Modules ואחריות

| Module/שכבה | אחריות |
|---|---|
| Design System | Tokens, רכיבי Glass, טיפוגרפיה, Motion, נגישות (DESIGN.md) |
| App Shell | Sidebar / Tab bar, תפריט משתמש, כפתור הוספה, מעברי דפים |
| Auth UI + Session | מסכי הרשמה/התחברות/שחזור/פרופיל, `AuthProvider`, Protected routes, טיפול ב-Session שפג |
| Dashboard UI | KPI, מגמה, פילוח, אחרונות, פעולות מהירות |
| Expenses UI | טבלה/כרטיסים, חיפוש, פילטרים, מיון, טופס, Modal, מחיקה |
| Reports + Export UI | גרפים, תקופות והשוואה, ייצוא CSV/PDF |
| Import UI + Parsers | העלאה, זיהוי סוג, קריאת CSV/XLSX/PDF, זיהוי כותרות, נרמול, כפילויות, תצוגה מקדימה |
| Analytics (pure functions) | חישובי מדדים באגורות, לפי הגדרות ה-PRD (4.8) |
| API Client | `fetch` עם Bearer token, חידוש Session, טיפול ב-401 |
| API Handlers | Auth, Expenses, Imports, Profile |
| Auth Service (server) | אימות JWT, מיפוי שם משתמש, קריאות ל-Supabase Auth, Rate limiting |
| Database Access | `withUser(claims, fn)` — טרנזקציה עם `SET LOCAL ROLE` ו-Claims (ADR-6) |
| Shared Schemas | Zod + טיפוסים + פונקציות טהורות משותפות |

### 2.3 Data Model

כל הטבלאות הפרטיות כוללות `user_id uuid NOT NULL references auth.users(id) on delete cascade` ו-RLS.

**`public.profiles`**
| עמודה | סוג | כללים |
|---|---|---|
| `user_id` | `uuid` | PK, מפנה ל-`auth.users` |
| `username` | `citext` | UNIQUE, `^[A-Za-z0-9_]{3,20}$` |
| `created_at` | `timestamptz` | ברירת מחדל `now()` |
- נוצרת ב-Trigger על `auth.users` (insert) מתוך `raw_user_meta_data.username`. אילוץ ה-UNIQUE מבטיח ייחודיות גם בהרשמות בו-זמניות.

**`public.expenses`** (הרחבה של הטבלה הקיימת — אותו שם, תואם-לאחור)
| עמודה | סוג | כללים |
|---|---|---|
| קיימות | `id, category, description, amount_agorot, expense_date, created_at, updated_at` | כמו היום |
| `user_id` | `uuid` | NOT NULL (אחרי שיוך הנתונים הקיימים, סעיף 2.9) |
| `kind` | `text` | `'expense' / 'refund' / 'income'`, ברירת מחדל `'expense'` |
| `category` | (שינוי) | חובה ב-expense/refund, NULL ב-income (CHECK) |
| `source` | `text` | `'manual' / 'import'`, ברירת מחדל `'manual'` |
| `import_id` | `uuid` | nullable, מפנה ל-`imports` (`on delete set null`) |
| `merchant` | `text` | nullable — שם בית העסק מהדוח |
| `posting_date` | `date` | nullable — תאריך חיוב |
| `original_amount_minor`, `original_currency` | `bigint`, `char(3)` | nullable — עסקה במטבע זר (מידע בלבד) |
| `installment_number`, `installments_total` | `smallint` | nullable |
| `external_ref` | `text` | nullable — מזהה עסקה מהדוח |
| `field_origin` | `jsonb` | nullable — לכל שדה: `"extracted"` או `"inferred"` |
| `fingerprint` | `text` | nullable — לזיהוי כפילויות (סעיף 2.6) |
- אינדקסים: `(user_id, expense_date desc, created_at desc)`, `(user_id, fingerprint)`, `(import_id)`.

**`public.imports`**
| עמודה | סוג | כללים |
|---|---|---|
| `id`, `user_id`, `created_at` | | |
| `file_name` | `text` | מנוקה, עד 120 תווים, טקסט בלבד |
| `file_hash` | `text` | SHA-256 של תוכן הקובץ (מחושב בדפדפן) |
| `source_kind` | `text` | `'bank' / 'card' / 'unknown'` |
| `format` | `text` | `'csv' / 'xlsx' / 'pdf'` |
| `status` | `text` | `'completed' / 'reverted'` |
| `rows_detected`, `rows_imported`, `rows_rejected`, `rows_duplicate` | `integer` | מונים |
| `period_from`, `period_to` | `date` | טווח התאריכים בקובץ |
- **הקובץ עצמו לא נשמר** — אין Storage.

**`private.auth_attempts`** (סכמה שאינה חשופה לשום Role ציבורי)
| עמודה | סוג |
|---|---|
| `key_hash` | `text` — SHA-256 של `kind:username` או `kind:ip` עם מלח שרת |
| `attempted_at` | `timestamptz` |
| `succeeded` | `boolean` |
- נמחקות רשומות מעל 24 שעות (ניקוי בכל בקשת התחברות — בלי CRON).

**כללים כלליים (ללא שינוי):** סכומים באגורות שלמות; תאריכים `YYYY-MM-DD`; "היום" לפי `Asia/Jerusalem`; 11 הקטגוריות הקבועות; `created_at/updated_at` טכניים.

### 2.4 REST API

כל הנתיבים מוגנים ב-`Authorization: Bearer` חוץ מ-`/api/auth/*`. JSON בלבד. גוף שגיאה אחיד `{"error":{"code","message","fields?"}}` בלי SQL, טוקנים או Stack Trace.

| Method | Route | התנהגות |
|---|---|---|
| `POST` | `/api/auth/register` | `{username, email, password}` → ולידציה, Rate limit, בדיקת זמינות שם, `signUp` ב-Supabase Auth עם `username` ב-metadata. שם תפוס → `409 USERNAME_TAKEN`. אימייל קיים → אותה תשובה כמו הצלחה (Supabase ממסך) |
| `POST` | `/api/auth/login` | `{username, password}` → Rate limit → איתור האימייל דרך פונקציית `security definer` שזמינה ל-`app_backend` בלבד → `signInWithPassword` מול Supabase Auth → מחזיר `{access_token, refresh_token, expires_at}`. כל כישלון → `401 INVALID_CREDENTIALS` אחיד, בזמן תגובה מינימלי קבוע |
| `POST` | `/api/auth/recover` | `{identifier}` (שם משתמש או אימייל) → Rate limit → `resetPasswordForEmail` אם קיים → תמיד `202` עם אותה תשובה |
| `GET` | `/api/profile` | שם המשתמש והאימייל של המשתמש המחובר |
| `GET` | `/api/expenses` | כל הרישומים של המשתמש המחובר |
| `POST` | `/api/expenses` | יצירה (כולל `kind`); `201` |
| `PUT` | `/api/expenses/:id` | עדכון; רשומה של משתמש אחר → `404` (לא `403`, כדי לא לחשוף שהיא קיימת) |
| `DELETE` | `/api/expenses/:id` | מחיקה; `204`; של אחר → `404` |
| `GET` | `/api/imports` | היסטוריית הייבוא של המשתמש (כולל `file_hash` לזיהוי העלאה חוזרת) |
| `POST` | `/api/imports` | `{meta, transactions[]}` → ולידציה לכל שורה, עד 2,000 עסקאות ו-1MB לבקשה → טרנזקציה אחת: `imports` + כל העסקאות. כישלון → כלום לא נשמר |
| `GET` | `/api/imports/:id/revert-preview` | אילו עסקאות יימחקו ואילו נערכו מאז הייבוא (`updated_at > created_at`) |
| `POST` | `/api/imports/:id/revert` | `{deleteEdited: boolean}` → מחיקה בטרנזקציה, `status='reverted'` |

- **שינוי סיסמה ו"סיסמה חדשה" בזרימת שחזור** נעשים ישירות מהדפדפן מול Supabase Auth (`updateUser`), עם ה-Session של המשתמש — אין צורך ב-Endpoint.
- **התנתקות:** `signOut` של supabase-js (מבטל את ה-Refresh token).

### 2.5 Data Flow

- **התחברות:** טופס → `/api/auth/login` → Session חוזר → `supabase.auth.setSession()` → supabase-js שומר ומחדש → כל בקשה ל-API שולחת את ה-Access token הנוכחי. `401` מה-API → ניסיון חידוש אחד → אם נכשל: התנתקות ומעבר להתחברות עם הודעה.
- **קריאה/כתיבה:** API מאמת JWT (חתימה מול JWKS, `iss`, `aud = authenticated`, `exp`) → `withUser(claims)` פותח טרנזקציה עם `SET LOCAL ROLE authenticated` ו-`request.jwt.claims` → שאילתות שמסננות גם `where user_id = $uid` → RLS אוכף שוב → `COMMIT`.
- **ייבוא:** קובץ → בדיקת חתימה וגודל → פענוח בדפדפן (CSV/XLSX/PDF) → זיהוי כותרות / התאמה ידנית → נרמול → סיווג לפי כללים → השוואה לרישומים הקיימים של המשתמש (`GET /api/expenses`, כבר בזיכרון) ולהיסטוריית הייבוא (`file_hash`) → תצוגה מקדימה → אישור → `POST /api/imports` (רק עסקאות שנבחרו, JSON מנורמל) → השרת מאמת שוב כל שורה ושומר בטרנזקציה.
- **דו"חות וניתוח:** מחושבים בדפדפן מהרישומים של המשתמש (פונקציות טהורות, באגורות). "הוצאות" = הוצאות פחות זיכויים; הכנסות בנפרד; אין חיבור מטבעות.
- **ייצוא:** כמו היום (ADR-5), מתוך הנתונים של המשתמש בלבד, עם עמודת "סוג".

### 2.6 ייבוא דוחות — פרטים טכניים (ADR-8)
- **סוג קובץ אמיתי:** XLSX = ZIP (`PK\x03\x04`) שמכיל `xl/workbook.xml`; PDF = `%PDF-`; CSV = טקסט ללא בתים בינאריים. סיומת לא תואמת → שגיאה. גודל מקסימלי 10MB. פענוח ב-Web Worker כדי לא לתקוע את הממשק, עם אפשרות ביטול.
- **קידוד CSV:** UTF-8 (עם/בלי BOM), ואם יש תווים לא חוקיים → `TextDecoder('windows-1255')`.
- **XLSX:** SheetJS, גיליון ראשון כברירת מחדל (בחירה כשיש כמה), דילוג על שורות פתיחה עד שורת הכותרות, תאריכי Excel מספריים מומרים.
- **PDF:** `pdfjs-dist` — חילוץ פריטי טקסט עם קואורדינטות → קיבוץ לשורות לפי Y → עמודות לפי X → אותו מנגנון זיהוי כותרות. אין טקסט בעמודים → "סרוק — לא נתמך". `PasswordException` → "מוגן בסיסמה". פורמט PDF מסומן "נתמך" רק אחרי בדיקה על מבנה אמיתי.
- **זיהוי כותרות:** מילון עברית/אנגלית (תאריך עסקה / תאריך רכישה / תאריך חיוב / שם בית העסק / תיאור / פרטים / סכום עסקה / סכום חיוב / סכום / חובה / זכות / מטבע / הערות / מספר שובר …) עם ציון ביטחון; מתחת לסף → התאמה ידנית. פרופילים לפורמטים ספציפיים רק לפי דוגמאות מבנה שהמשתמש יספק (כותרות בלבד).
- **נרמול סכומים:** מפרידי אלפים, `₪`/`ILS`/`NIS`, מינוס בהתחלה/בסוף, סוגריים, עמודות חובה/זכות נפרדות. סכום שלילי / "זכות" / "זיכוי" → `refund` (בדוח אשראי) או `income` (בדוח בנק, לפי עמודה). סכום חיוב בש"ח עדיף על סכום העסקה; עסקה במטבע זר בלי סכום ש"ח → "דורש תיקון".
- **`fingerprint`** = SHA-256 של `expense_date | amount_agorot | kind | normalize(description/merchant) | external_ref`. כפילות אפשרית = אותו fingerprint כבר קיים אצל המשתמש **ומספר ההופעות בקובץ גדול ממספר ההופעות שכבר יובאו מקבצים אחרים**.
- **חיוב כרטיס אשראי בדוח בנק:** שורות שהתיאור שלהן תואם רשימת מילים (ישראכרט, מקס, כאל, לאומי קארד, אמריקן אקספרס, דיינרס, "חיוב כרטיס", "כרטיס אשראי"…) מסומנות `card_payment` ולא מסומנות לייבוא כברירת מחדל.
- **סיווג לפי כללים:** מילון בית עסק → קטגוריה (למשל "סופר", "שופרסל", "רמי לוי" → מזון; "פז", "דלק", "סונול" → דלק; "רב קו", "רכבת" → תחבורה …) + קטגוריית הדוח אם קיימת. אין התאמה → "לבדיקה" (קטגוריה ריקה שהמשתמש חייב לבחור).
- **מה לא נעשה:** OCR, AI, שליחת הקובץ לשרת, שמירת הקובץ.

### 2.7 אבטחה, הרשאות ופרטיות

- **אימות:** Supabase Auth; אימות אימייל חובה; מדיניות סיסמה ≥10 תווים + חסימת סיסמאות דלופות (הגדרה ב-Supabase); שם משתמש ייחודי.
- **מיפוי שם משתמש:** פונקציה `private.login_email_for(username)` עם `security definer`, `execute` רק ל-`app_backend` — לא לדפדפן, לא ל-`authenticated`. האימייל לא חוזר אף פעם בתשובה.
- **בידוד נתונים (ADR-6):** RLS על `profiles`, `expenses`, `imports` עם Policies נפרדות ל-SELECT/INSERT/UPDATE/DELETE: `using (user_id = (select auth.uid()))` ו-`with check (user_id = (select auth.uid()))`, ל-Role `authenticated` בלבד. `app_backend` **לא** מקבל הרשאות ישירות על הטבלאות האלה — רק חברות ב-Role `authenticated` (כדי לבצע `SET LOCAL ROLE`). `anon` בלי שום הרשאה.
- **הגנה כפולה:** כל שאילתה בשרת מסננת גם לפי ה-`user_id` מהטוקן; ניסיון לגשת לרשומה של אחר → `404`.
- **User Enumeration:** הודעות אחידות בהתחברות ובשחזור; זמן תגובה מינימלי קבוע בהתחברות; אימייל קיים בהרשמה לא נחשף.
- **Rate limiting (ADR-7):** התחברות — 5 כישלונות לשם משתמש / 15 דקות, 20 בקשות ל-IP / 15 דקות; הרשמה — 5 ל-IP / שעה; שחזור — 3 לשם/אימייל / שעה. חריגה → `429` עם הודעה כללית.
- **CSRF:** הזהות עוברת ב-Authorization header ולא ב-Cookie → CSRF קלאסי לא רלוונטי.
- **CSP ו-Headers** (`vercel.json`): `default-src 'self'`; `script-src 'self'`; `worker-src 'self' blob:`; `connect-src 'self' https://<project>.supabase.co`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src 'self' https://fonts.gstatic.com`; `img-src 'self' data: blob:`; `frame-ancestors 'none'`; וכן `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **סודות:** `DATABASE_URL` ומלח ה-Rate limit רק בשרת. בדפדפן רק כתובת Supabase ומפתח Publishable (בטוח לחשיפה: ה-Data API כבוי וה-Auth API ציבורי ממילא).
- **לוגים:** רק קודי שגיאה; אף פעם לא סיסמאות, טוקנים, אימיילים, תוכן דוחות או סכומים.
- **קבצים:** לא עוזבים את הדפדפן ולא נשמרים; שם הקובץ נשמר כטקסט מנוקה בלבד.

### 2.8 Development ו-Production

| היבט | Development | Production |
|---|---|---|
| Supabase Project | `expenses-dev` | `expenses-prod` |
| Dataset | נתוני בדיקה + שני משתמשי בדיקה | נתונים אמיתיים |
| Backend | API מקומי (ADR-2) מחובר ל-Dev | Vercel Production Functions |
| Secrets (שרת) | `.env` (רק Dev): `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RATE_LIMIT_SALT` | Vercel Production Environment בלבד |
| משתני דפדפן | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (ציבוריים) | אותו דבר, ערכי Production |
| SMTP | ספק חיצוני, מוגדר ב-Supabase Auth | אותו ספק, מוגדר בנפרד |
| Migrations | נבדקות כאן קודם | Supabase GitHub Integration ב-Push ל-`main` (ADR-1) |

**הגדרות ידניות בכל פרויקט (בהדרכה, לא ב-Migrations):** כיבוי Data API, יצירת `app_backend` לפני ה-Migration הראשונה, הגדרות Auth (אימות אימייל חובה, אורך סיסמה, חסימת סיסמאות דלופות, Site URL ו-Redirect URLs, תבניות מייל בעברית), חיבור SMTP.

### 2.9 Database Migrations ושיוך הנתונים הקיימים
- כל Migration **תואמת-לאחור** ומלווה בתסריט ביטול כתוב (בהערה בקובץ).
- **סדר:** (1) `profiles` + Trigger + `private` schema; (2) עמודות חדשות ב-`expenses` כ-**nullable**, `imports`; (3) Policies חדשות + `grant authenticated to app_backend` + ביטול ההרשאות הישירות של `app_backend` על טבלאות פרטיות; (4) אחרי שיוך הנתונים — `user_id NOT NULL`.
- **שיוך ב-Development:** המשתמש נרשם → מוצגת לו רשימת הרשומות הקיימות ו-`user_id` שלו → רק באישורו: `UPDATE ... SET user_id = <id> WHERE user_id IS NULL`. שום רשומה לא נמחקת.
- **Production:** כרגע אין בו טבלאות או נתונים; כל ה-Migrations יוחלו לפי הסדר בפרסום (Milestone H), באישור.

### 2.10 GitHub ופריסה
ללא שינוי מ-ADR-1, עם תוספת: **הפריסה האוטומטית של `main` נשארת כבויה (`vercel.json`) עד Milestone H**, ואז מופעלת באישור — אחרי שבידוד הנתונים נבדק. אין לפרסם את האתר עם חשבונות ללא בידוד.

### 2.11 Hosting, Configuration ועלויות
- Vercel: Rewrite לנתיבי React Router בלי לדרוס `/api/*`; Headers של CSP; גוף בקשה עד 4.5MB (הייבוא שולח JSON מנורמל, הרבה מתחת לזה).
- Supabase Free: 2 פרויקטים, 500MB, השהיה אחרי כשבוע ללא פעילות; מגבלות Auth (מיילים/שעה) תלויות בספק ה-SMTP.
- ספק SMTP (Resend): תוכנית חינמית מספיקה להיקף אישי/לימודי; דורש אימות דומיין לשליחה מכתובת מותאמת.

### 2.12 בדיקות
- **קיימות:** CRUD, ולידציה, סינון/מיון, גרפים, ייצוא — חייבות להמשיך לעבור (Regression).
- **Auth:** הרשמה (שם תפוס, ולידציה, אימייל קיים לא נחשף), התחברות (הודעה אחידה, Rate limit, `429`), Session שפג, Protected routes, התנתקות.
- **בידוד (חובה לפני פרסום):** שני משתמשי בדיקה. ברמת SQL — בתור `authenticated` עם ה-Claims של A: אין שורות של B ב-SELECT, ו-UPDATE/DELETE/INSERT עם `user_id` של B נכשלים. ברמת API — קריאה, עדכון, מחיקה וייצוא של רשומות B עם טוקן של A → `404`/ריק; בלי טוקן → `401`; טוקן מזויף/פג → `401`.
- **ייבוא:** קבצים **סינתטיים בלבד** — CSV (UTF-8, Windows-1255, BOM), XLSX, PDF טקסטואלי, PDF סרוק, מוגן, פגום, ריק, שמות קבצים חריגים, פורמטי תאריך, סכומים שליליים, זיכויים, תשלומים, מטבע זר, שדות חסרים, כפילויות אמיתיות ומדומות, חיוב כרטיס בדוח בנק.
- **דיוק מדדים:** בדיקות לכל הגדרה ב-PRD 4.8.
- **ממשק:** מחשב/טאבלט/טלפון, RTL, Overflow, reduced-motion, reduced-transparency, מקלדת, ניגודיות.

## 3. מקורות עיקריים

- [Vercel – Deploying Git Repositories](https://vercel.com/docs/git) · [Git Configuration](https://vercel.com/docs/project-configuration/git-configuration) · [Hobby Plan](https://vercel.com/docs/plans/hobby)
- [Supabase – Auth](https://supabase.com/docs/guides/auth) · [Password security](https://supabase.com/docs/guides/auth/password-security) · [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) · [JWT signing keys / JWKS](https://supabase.com/docs/guides/auth/signing-keys)
- [Supabase – Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments) · [Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [SheetJS – Installation (official CDN)](https://docs.sheetjs.com/docs/getting-started/installation/frameworks) · [PDF.js](https://mozilla.github.io/pdf.js/)

---

**סיכום החלטה:** React + TypeScript עם REST API על Vercel Functions, Supabase Auth לחשבונות, ו-Supabase PostgreSQL שאליו ה-Backend מתחבר כ-`app_backend` ומתחזה ל-`authenticated` עם ה-Claims המאומתים של המשתמש, כך ש-RLS אוכף בידוד מלא. ייבוא דוחות בדפדפן בלבד. Data API כבוי. פרסום רק אחרי שבידוד הנתונים נבדק.

## החלטות מרכזיות (ADRs)

### ADR-1: חיבור למסד הנתונים כמשתמש מוגבל ופריסת Migrations דרך Supabase GitHub Integration
**הקשר:** הגרסה הקודמת של המסמך קבעה חיבור דרך `@supabase/supabase-js` עם מפתח Secret שעוקף RLS, ו-Pipeline ב-GitHub Actions (Supabase CLI + Vercel CLI) לפריסת Production. המשתמש הציג את הדרך שבה המרצה מקים את אותו מבנה, והיא פשוטה יותר להגדרה: פחות סודות, בלי Access Tokens ובלי GitHub Actions. המשתמש אישר לעבור אליה (9 בנובמבר 2026).
**החלטה:** (1) בכל פרויקט Supabase ה-Data API כבוי, ונוצר ידנית משתמש `app_backend` עם סיסמה ייחודית. (2) ה-Backend מתחבר עם `postgres` (postgres.js) דרך Transaction pooler (פורט 6543, `prepare: false`) באמצעות משתנה יחיד `DATABASE_URL`. (3) ה-Migrations מעניקות ל-`app_backend` הרשאות CRUD ו-Policy של RLS על טבלאות האפליקציה בלבד. (4) ב-Production, Supabase GitHub Integration מחיל את ה-Migrations ב-Push ל-`main`, ו-Vercel פורס מ-GitHub.
**השלכות:** גם אם `DATABASE_URL` דולף, הוא נותן גישה לטבלאות האפליקציה בלבד, ולא לניהול הפרויקט. אין עוד מפתח Secret שעוקף RLS. אין הבטחת סדר בין Migration לפריסה, ולכן חובה לכתוב Migrations תואמות-לאחור. יצירת `app_backend` היא צעד ידני שחייב לקרות לפני ה-Migration הראשונה בכל פרויקט. **עדכון (ADR-6):** סעיף (3) מוחלף — `app_backend` מאבד את ההרשאות הישירות על טבלאות פרטיות ופועל דרך `SET LOCAL ROLE authenticated`.

### ADR-2: הרצת ה-API מקומית בלי Vercel CLI
**הקשר:** בפיתוח מקומי צריך להריץ את פונקציות `api/` בלי להתחבר ל-Vercel מהמחשב.
**החלטה:** Plugin קטן ב-`vite.config.ts` (פעיל רק ב-`npm run dev`) מנתב בקשות `/api/*` לאותם קבצים בדיוק שרצים ב-Vercel, וטוען את `.env` לשרת בלבד.
**השלכות:** פקודה אחת (`npm run dev`) מריצה אתר ו-API. ההבדלים בין סביבת הפיתוח לבין Vercel קטנים (אותו קוד), אבל בעיות שקשורות לאריזה ב-Vercel יתגלו רק בפריסה.

### ADR-3: קובץ הסודות המקומי הוא `.env`
**הקשר:** המסמך הזכיר `.env.local`, ו-CLAUDE.md קובע `.env`.
**החלטה:** משתמשים ב-`.env` (מוחרג מ-Git), עם `.env.example` שמכיל שמות משתנים בלבד.
**השלכות:** אין שינוי מעשי: Vite וה-Plugin טוענים את שניהם.

### ADR-4: בלי Pipelining בחיבור למסד הנתונים
**הקשר:** בבדיקות התגלה שכאשר כמה שאילתות מגיעות יחד (למשל בטעינת דף), החיבור ל-Transaction pooler של Supabase (Supavisor) נתקע לצמיתות. postgres.js שולח כברירת מחדל כמה שאילתות על אותו חיבור לפני שהתשובות חוזרות (Pipelining), ו-Supavisor לפני גרסה 2.10 לא מחזיר תשובות במצב הזה — כפי שמתועד ב-README של postgres.js.
**החלטה:** ב-`api/_lib/db.ts`: `max_pipeline: 1` (שאילתה אחת בכל פעם על כל חיבור), ובנוסף `query_timeout: 10` ו-`queue_timeout: 15` כרשת ביטחון, כך שחיבור שמפסיק לענות מחזיר שגיאה במקום להיתקע.
**השלכות:** שאילתות שמגיעות יחד ממתינות זו לזו (הבדל זניח בהיקף אישי). אם החיבור נתקע מסיבה אחרת, המשתמש רואה הודעת שגיאה ו"נסו שוב" ולא טעינה אינסופית. נבדק: 6 שאילתות בו-זמנית על חיבור חדש ועל חיבור פתוח, וחמש בקשות בו-זמנית לשרת מיד אחרי הפעלה.

### ADR-5: עברית ב-PDF עם pdfmake — גופן TTF מלא וסידור כיווניות ידני
**הקשר:** ל-pdfmake אין תמיכה מובנית בכתיבה מימין לשמאל. בבדיקה על קובצי PDF אמיתיים נמצא ש: (1) גופני Web בפורמט WOFF מוצגים בצורה שגויה (מרווחים ואותיות חסרות, גם באנגלית); (2) מנוע הגופנים (fontkit) הופך בעצמו את סדר האותיות של כל מקטע שמכיל עברית, אבל לא מסדר מילים, לא הופך סוגריים, והופך גם מספרים ואנגלית שנמצאים באותו מקטע.
**החלטה:** (1) גופן Heebo מלא בפורמט TTF (עברית + לטינית + ספרות בקובץ אחד), מחבילת npm `@expo-google-fonts/heebo` (רישיון OFL), נטען רק בלחיצה על "הורדת PDF". (2) `src/features/export/rtl.ts` מחלק כל שורה למקטעי כיוון (BiDi מפושט, בסיס RTL), מסדר אותם מימין לשמאל, משאיר אותיות עבריות בסדר רגיל (fontkit הופך אותן), הופך סוגריים, ומשתמש ברווח לא-שובר כדי ש-pdfmake לא יפצל מקטע עברי. (3) תיאור ארוך נשבר לשורות מראש (`wrapLines`), כי pdfmake לא יכול לשבור מקטע עברי. (4) העמודות בטבלה מסודרות מימין לשמאל.
**השלכות:** ה-PDF מציג נכון עברית, תאריכים, סכומים, אנגלית וסוגריים (נבדק ויזואלית על קובץ שהופק מהאפליקציה). שבירת השורות לפי מספר תווים היא קירוב — תיאור עם מילים ארוכות במיוחד עשוי ליצור שורה רחבה מעט. הגדלת הקובץ: כ-110KB גופנים, נטענים רק בהפקת PDF.

### ADR-6: RLS לפי משתמש דרך החיבור הישיר (`SET LOCAL ROLE authenticated`)
**הקשר:** המוצר עובר לחשבונות מרובים, ונדרש שבידוד הנתונים ייאכף גם במסד. ה-Backend מתחבר ישירות ל-PostgreSQL (ADR-1), ובחיבור כזה RLS לא יודע מי המשתמש. נשקלו: (א) העברת זהות המשתמש לטרנזקציה; (ב) הדלקת Data API ומעבר ל-supabase-js מהדפדפן; (ג) סינון בקוד בלבד. המשתמש אישר את (א) (9 בנובמבר 2026).
**החלטה:** כל גישה לנתונים פרטיים עוברת דרך `withUser(claims, fn)`: טרנזקציה שמבצעת `SET LOCAL ROLE authenticated` ו-`set_config('request.jwt.claims', <claims מאומתים>, true)`, כך ש-`auth.uid()` מחזיר את המשתמש וה-Policies (`user_id = auth.uid()`) חלות. `app_backend` מקבל רק חברות ב-`authenticated` ומאבד הרשאות ישירות על טבלאות פרטיות. בנוסף, השאילתות בקוד מסננות לפי `user_id` (הגנה כפולה).
**השלכות:** באג בשרת לא יחשוף נתונים של משתמש אחר — המסד יחסום. נשמרת שכבת ה-API הקיימת. כל טרנזקציה מוסיפה שתי פקודות קצרות. חובה לכסות בבדיקות SQL שה-Role וה-Claims מוגדרים נכון. עובד עם Transaction pooler כי ההגדרות הן `LOCAL` לטרנזקציה.

### ADR-7: Rate limiting במסד הנתונים
**הקשר:** ההתחברות עם שם משתמש עוברת דרך השרת, ולכן כל הבקשות ל-Supabase Auth מגיעות מכתובות של Vercel; ההגבלה המובנית של Supabase לפי IP לא מבחינה בין משתמשים, ותוקף אחד יכול לחסום את כולם. Vercel Functions הן Stateless.
**החלטה:** טבלה `private.auth_attempts` עם מפתחות מגובבים (שם משתמש / IP + מלח שרת) וחלונות זמן; בדיקה לפני כל התחברות, הרשמה ושחזור; ניקוי רשומות ישנות בזמן הבקשה.
**השלכות:** שאילתה נוספת לכל פעולת Auth; אין שמירה של שמות משתמש או כתובות IP בטקסט גלוי; אין צורך בשירות חיצוני (Redis). הגבולות ניתנים לכוונון.

### ADR-8: ייבוא דוחות בדפדפן בלבד
**הקשר:** דוחות בנק ואשראי הם מידע רגיש; Vercel מגביל גוף בקשה ל-4.5MB וזמן ריצה; הדרישה היא לא לשמור קבצים מקוריים ולא לשתף צד שלישי.
**החלטה:** הקובץ נקרא ומפוענח בדפדפן (Papa Parse, SheetJS מה-CDN הרשמי, pdfjs-dist), ב-Web Worker. לשרת נשלחות רק העסקאות שאושרו כ-JSON מנורמל, והשרת מאמת אותן מחדש ושומר בטרנזקציה. אין Storage, אין OCR ואין AI.
**השלכות:** פרטיות מרבית ואין מגבלות קבצים בשרת. הפענוח תלוי בכוח המכשיר (קבצים עד 10MB). אין אפשרות "לעבד מחדש" קובץ מהשרת — צריך להעלות שוב. PDF סרוק לא נתמך.

### ADR-9: SMTP חיצוני למיילי Auth
**הקשר:** שירות המייל המובנה של Supabase שולח רק לכתובות של חברי צוות הפרויקט ובמכסה זעירה; הרשמה עם אימות ושחזור סיסמה דורשים שליחה לכל משתמש.
**החלטה:** חיבור ספק SMTP חיצוני (מומלץ Resend, תוכנית חינמית) בהגדרות Auth של כל פרויקט Supabase, עם תבניות מייל בעברית. המשתמש פותח את החשבון בהדרכה; הפרטים נשמרים רק בהגדרות Supabase.
**השלכות:** תלות בשירות נוסף; שליחה מכתובת מותאמת דורשת אימות דומיין, אחרת שליחה מכתובת ברירת המחדל של הספק (בכפוף לתנאיו).

### ADR-10: Design System "Liquid Glass" בלי ספריית אנימציה
**הקשר:** נדרש עיצוב Premium עם זכוכית ותנועה, בלי לפגוע בביצועים, בנגישות ובגודל האתר.
**החלטה:** Design Tokens ב-CSS custom properties, רכיבים ב-CSS Modules, תנועה ב-CSS transitions/animations (רק `transform` ו-`opacity`) ו-View Transitions API כשקיים. כיבוד `prefers-reduced-motion` ו-`prefers-reduced-transparency`, ו-Fallback אטום כשאין `backdrop-filter`. ספריית אנימציה תוצע רק אם יתברר צורך שאי אפשר לממש כך.
**השלכות:** אין תלות נוספת; חלק מאפקטים מורכבים (מעברי Layout משותפים) יהיו פשוטים יותר; ביצועים צפויים.
