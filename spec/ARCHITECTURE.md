# ARCHITECTURE – מערכת לניהול הוצאות

**גרסה:** 2.0 · **תאריך עדכון:** 9 בנובמבר 2026  
**מסמך דרישות:** `PRD.md` המעודכן.  
**מטרת מסמך זה:** תכנון מוצר Web רספונסיבי בעברית (RTL) עם Backend ב-Vercel, מסד נתונים ב-Supabase, וניהול קוד ופריסה אוטומטית דרך GitHub.

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
|---|---|---|
| Frontend | React + TypeScript | ארבעת דפי האתר, טפסים, טבלאות ו-Modal |
| Build | Vite | שרת פיתוח ו-Build סטטי מהיר |
| Navigation | React Router | ניתוב בצד הלקוח לארבעה דפים |
| עיצוב | CSS Modules + CSS רגיל | תצוגה רספונסיבית, RTL ו-Layout משותף |
| Backend | Vercel Functions (Node.js + TypeScript) | REST API, ולידציה, גישה מאובטחת לסודות ול-Database |
| Database | Supabase PostgreSQL | שמירה קבועה של הוצאות |
| Database Client | `postgres` (postgres.js) בצד השרת בלבד | חיבור ישיר ל-PostgreSQL דרך Transaction pooler של Supabase, כמשתמש מוגבל `app_backend`; ללא DB credentials בדפדפן |
| Validation | Zod | סכמות קלט ב-Backend ושיתוף טיפוסים/כללים עם Frontend לפי הצורך |
| Charts | Chart.js + react-chartjs-2 | Pie וגרף עמודות |
| CSV | Papa Parse | יצירת CSV בצד הדפדפן מתוך נתונים שהתקבלו מה-API |
| PDF | pdfmake + Font עם תמיכה בעברית | יצירת PDF להורדה, כולל טיפול ב-RTL |
| Testing | Vitest + React Testing Library; בדיקות API | בדיקות חוקים עסקיים, ממשק ו-Backend |
| Source Control | Git + GitHub | Repository משותף ליישום ול-Migrations |
| CI/CD | Supabase GitHub Integration + Vercel Git Integration | Migrations ל-Production ופריסת האתר בעקבות Push ל-`main` (ראה ADR-1) |
| Hosting | Vercel | Hosting ל-Frontend ול-Serverless Backend באותו דומיין |

### נימוק ההחלטות
- **React + Vite:** פתרון Mainstream המתאים לאתר רספונסיבי בארבעה דפים ללא צורך ב-SSR. חלופות שנשקלו: Next.js ו-Vue. Next.js מוסיף כאן מורכבות מיותרת; Vue מתאים גם הוא, אך React מלווה בתיעוד ובדוגמאות רחבות.
- **Vercel Functions:** Backend קטן המבצע CRUD ללא שרת מנוהל תמידית. חלופות: Express בשרת מתמשך ו-Supabase Edge Functions; ב-Vercel Functions אין צורך בתחזוקת שרת נוסף וה-Frontend וה-API פועלים יחד.
- **Supabase PostgreSQL:** מסד נתונים רלציוני מנוהל ובשל, הנתמך ב-Migrations. חלופות: MongoDB Atlas ו-Neon Postgres; Supabase נבחר לפי הדרישה המפורשת ולפשטות חיבורו.
- **~~GitHub Actions כמתאם פריסה יחיד~~** — הוחלף ב-ADR-1: Supabase GitHub Integration מחיל Migrations על Production, ו-Vercel פורס מ-GitHub.
- **יצירת הגרפים והייצוא בדפדפן:** הנתונים ממילא נשלפים עבור טבלאות, והיקפי השימוש הצפויים קטנים; אין הצדקה לשירות Reporting נוסף.

### סיכונים ומגבלות מרכזיים
1. **ללא Authentication = מסד נתונים משותף וחשוף דרך ה-API:** ה-Backend מסתיר מפתחות אך **אינו יכול לזהות את המשתמש המורשה**. כל מי שיכול לפנות ל-API הציבורי יכול לקרוא, ליצור, לעדכן ולמחוק את הנתונים. אין להציג מערכת זו כמאובטחת עבור הוצאות פרטיות או מידע רגיש. להגנת מידע אמיתית יידרש שינוי דרישות והוספת Authentication/Authorization. Rate Limiting ו-CORS אינם תחליף לכך.
2. **שירותים חיצוניים וזמינות:** תלות ב-Vercel, Supabase ובגישה לאינטרנט; בתוכנית Free יש מגבלות ושירותי DB עלולים להיות מושהים כשאין פעילות.
3. **Vercel Functions הן Stateless:** אין לשמור מצב יישומי בזיכרון בין בקשות או בקבצים מקומיים.
4. **CSV/PDF בעברית:** יש לבדוק פלטי RTL, טקסט דו-כיווני ומספרים. לקובצי PDF נדרש Font חוקי ותואם עברית, הנארז עם היישום.
5. **נתונים משותפים, ללא Real-time:** שני חלונות עשויים להציג נתונים שונים עד לרענון. אין מנגנון Conflict Resolution ייעודי מעבר להתנהגות מסד הנתונים.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```text
Browser (React + Vite build)
  ├─ Home / Filters / Reports / About
  ├─ Client-side charts, filters, CSV & PDF
  └─ HTTPS /api/expenses/*  (אותו Origin)
             │
             ▼
Vercel – Node.js Serverless Functions (REST API)
  ├─ Input validation (Zod)
  ├─ Business rules + standardized errors
  └─ postgres.js (DATABASE_URL, user app_backend)
             │  TLS, Transaction pooler :6543
             ▼
Supabase – PostgreSQL (Data API disabled)
  └─ public.expenses

GitHub main → Supabase GitHub Integration → Production migrations
            → Vercel Git Integration     → Production deployment
```

**Frontend אינו מתחבר ישירות ל-Supabase.** אין להשתמש ב-`VITE_` עבור פרטי חיבור למסד הנתונים, ואין לשלוח את `DATABASE_URL` ל-Browser. אין צורך ב-Backend אחר, ב-ORM או בשירות Storage לשמירת ההוצאות.

### 2.2 Modules ואחריות

| Module/שכבה | אחריות |
|---|---|
| Shared Layout + Navigation | כותרת, תפריט ו-RTL בכל ארבעת הדפים |
| Expenses UI | טופס יצירה, Modal עריכה, אישור מחיקה וטבלת בית |
| Filters UI | סינון משולב לפי שנה/חודש/יום וסכום מקסימלי; מיון עצמאי |
| Reports UI | Pie לפי קטגוריות, עמודות לפי שנה/חודש, מצב סכום או כמות |
| Export UI | פילטרים עצמאיים לייצוא בלבד, בחירת כל ההוצאות או מסוננות, CSV/PDF |
| API Client | בקשות ל-`/api`, ניהול Loading/Errors ורענון הנתונים לאחר שינוי |
| API Handlers | פירוק בקשות, אימות גוף הבקשה, מיפוי קודי סטטוס |
| Expenses Service | כללים עסקיים: קטגוריות, סכום, תאריך, תיאור, CRUD |
| Database Access | גישה ל-PostgreSQL דרך postgres.js כמשתמש `app_backend` |
| Shared Schemas | טיפוסים וולידציה עקביים בין Frontend ל-Backend |

חלוקה לוגית בלבד; אין צורך ב-Microservices או בשכבות הנדסיות רבות.

### 2.3 Data Model

טבלת `public.expenses` יחידה; אין משתמשים או טבלאות קשר.

| עמודה | PostgreSQL | כללים |
|---|---|---|
| `id` | `uuid` | Primary Key; ערך אוטומטי באמצעות `gen_random_uuid()` |
| `category` | `text` | NOT NULL; אחת מ-11 הקטגוריות המאושרות; CHECK ב-Database |
| `description` | `text` | nullable; חובה כאשר `category = 'אחר'` (CHECK נוסף) |
| `amount_agorot` | `integer` | NOT NULL; טווח `1..10000000` (עד ₪100,000.00) |
| `expense_date` | `date` | NOT NULL; תאריך בלבד, ללא שעה |
| `created_at` | `timestamptz` | NOT NULL, ברירת מחדל `now()`; לצורכי ניהול נתונים |
| `updated_at` | `timestamptz` | NOT NULL, מתעדכן בפעולת Update; לצורכי ניהול נתונים |

- סכומים נשמרים **באגורות שלמות** ללא Floating-Point: ₪49.90 נשמר כ-`4990`. Frontend מציג שקלים עם עד שתי ספרות אחרי הנקודה.
- `expense_date` מוחזר במבנה `YYYY-MM-DD` ואינו מומיר ל-UTC timestamp. ברירת מחדל ב-Frontend: היום לפי תאריך מקומי; ה-Backend מאמת שאינו בעתיד לפי אזור זמן עסקי מוגדר `Asia/Jerusalem` (הנחת מימוש עבור אתר בעברית ושקלים).
- יש להגדיר אינדקס על `expense_date` (למשל `expense_date DESC`) למיון וסינון, ו-`CHECK` לערכי סכום וקטגוריה; בדיקת תאריך עתידי נעשית ב-Backend בזמן הבקשה, ולא ב-`CHECK` תלוי-זמן.
- הקטגוריות הן: מזון, דלק, פנאי, רשויות, בריאות, קניות, תחבורה, דיור, חינוך, אחר, הכשרה.
- `created_at` ו-`updated_at` שדות טכניים ולא פיצ'ר גלוי.

### 2.4 REST API

כל הנתיבים מתחת ל-`/api/expenses` ומאוחסנים על אותו Origin עם האתר. JSON בלבד מלבד קודי תגובה ללא גוף.

| Method | Route | התנהגות |
|---|---|---|
| `GET` | `/api/expenses` | מחזיר מערך כל ההוצאות, לשימוש בטבלאות, גרפים וייצוא |
| `POST` | `/api/expenses` | יוצר הוצאה תקינה; מחזיר `201` וההוצאה שנוצרה |
| `PUT` | `/api/expenses/:id` | מחליף נתונים הניתנים לעריכה בהוצאה קיימת; מחזיר את ההוצאה המעודכנת |
| `DELETE` | `/api/expenses/:id` | מוחק הוצאה קיימת; מחזיר `204` |

**גוף Create/Update:** `category`, `description`, `amount` (ערך שקלי דצימלי, לכל היותר שתי ספרות), `expenseDate` (`YYYY-MM-DD`). ה-Backend ממיר ל-`amount_agorot` בשלמים, בודק שהסכום חיובי ועד ₪100,000, שקטגוריה תקינה, שתיאור אינו ריק בקטגוריית 'אחר', ושהתאריך חוקי ולא עתידי. שמירה תיעשה רק לאחר ולידציה בצד שרת; בדיקות UI אינן תחליף.

**תגובות שגיאה:** `400` נתונים לא חוקיים/UUID שגוי, `404` הוצאה לא נמצאה בעת Update/Delete, `405` Method לא נתמך, `500/503` כשל שירות; גוף אחיד לדוגמה `{"error":{"code":"VALIDATION_ERROR","message":"נתוני ההוצאה אינם תקינים"}}`, בלי חשיפת SQL, Token או Stack Trace. אין צורך ב-EndPoints ייעודיים לגרפים ולייצוא בשלב הנוכחי.

### 2.5 Data Flow

**טעינה:** Frontend מבצע `GET /api/expenses` → Backend פונה ל-Supabase → מחזיר רשומות → הלקוח מחזיק אותן ב-State לצורך תצוגה וסינון. במצב כשל יש להציג שגיאת טעינה, לא הודעת 'אין הוצאות'.

**יצירה/עדכון/מחיקה:** פעולה ב-UI → ולידציה מקומית → API → ולידציה עסקית ב-Backend → כתיבה ל-Supabase → אישור הצלחה → עדכון/רענון State. אם הפעולה נכשלה אין לשנות רשומה בתצוגה כאילו נשמרה.

**סינון:** טבלת דף הפילטרים מסננת State לפי שנה, חודש, יום וסכום, בתנאי AND. בוחרים חודש רק אחרי שנה ויום רק אחרי חודש; מספרי ימים מתעדכנים לפי החודש והשנה. טבלת הבית ודף הפילטרים ממוינים עצמאית לפי תאריך, קטגוריה או סכום, ברירת מחדל תאריך יורד.

**גרפים:** הנתונים המלאים שנשלפו מה-API משמשים ל-Pie (קטגוריות עם הוצאות בלבד) ולעמודות (קיבוץ לפי שנים או חודשים בשנה נבחרת); מדד לפי סכום ₪ או לפי מספר הוצאות. פילטרי הייצוא **אינם משפיעים** על הגרפים.

**ייצוא:** המשתמש בוחר כל ההוצאות/מסוננות; פילטרי הייצוא בדף הדו"חות עצמאיים מדף הפילטרים. מתוך רשימת הנתונים המלאה יוצרים CSV (כולל כותרות בעברית וקידוד UTF-8, לפי צורך BOM ל-Excel), או PDF מעוצב. ההורדה מתבצעת בדפדפן; אם אין התאמות מציגים הודעה בלי הורדה. יש לנטרל ערכי CSV המתחילים בתווים שעלולים להתפרש כנוסחאות בגיליונות אלקטרוניים (`=`, `+`, `-`, `@` וכו').

### 2.6 אבטחה, הרשאות ופרטיות

- **הדרישה היא ללא התחברות.** אין Supabase Auth, Sessions או Accounts. לפיכך אין בעלות על הוצאות ואין הגנת פרטיות למשתמש יחיד אם האתר פתוח באינטרנט.
- **משתמש מסד נתונים מוגבל:** ה-Backend מתחבר כמשתמש `app_backend` (נוצר ידנית בכל פרויקט ב-SQL Editor, עם סיסמה שונה בכל פרויקט, באותיות וספרות בלבד, לפחות 20 תווים). הוא מקבל רק `SELECT/INSERT/UPDATE/DELETE` על טבלאות האפליקציה ו-Policy של RLS עבורו בלבד — לא הרשאות מנהל. `DATABASE_URL` נשמר **רק** ב-`.env` המקומי (Development) וב-Environment Variables של Vercel (Production), לעולם לא בקוד Frontend, ב-GitHub או בתגובת API.
- **Data API כבוי** בשני הפרויקטים, ולכן אין גישה לטבלאות דרך REST של Supabase או מפתחות ציבוריים. בנוסף: RLS מופעל על `public.expenses`, ולתפקידי `anon` ו-`authenticated` אין הרשאות על הטבלה. יש לבדוק בפועל שקריאה ישירה ל-REST של Supabase אינה מחזירה נתונים.
- HTTPS ב-Vercel; ולידציה ב-Backend, הגבלת גודל גוף הבקשה, טיפול בטעויות כללי, והימנעות מחשיפת סודות בלוגים. ניתן להחיל הגנת Abuse בסיסית על API ציבורי, אך היא **לא** מגינה על הוצאות מפני מבקרים אחרים.
- CORS יוגבל ל-Origin של האתר אם יוגדר, אך אין להתייחס לכך כ-Authorization: לקוחות שאינם דפדפן יכולים לשלוח בקשות ישירות.
- להגנה על הוצאות רגישות או אתר הנגיש לציבור נדרש עדכון PRD עם Authentication/Authorization או מנגנון הגנה מוסכם. לא להוסיף מנגנון זה ללא אישור שינוי דרישות.

### 2.7 Development ו-Production

**שני פרויקטי Supabase עצמאיים בענן** (לא נדרש Docker או Supabase מקומי):

| היבט | Development | Production |
|---|---|---|
| Supabase Project | `expenses-dev` (שם דוגמה) | `expenses-prod` (שם דוגמה) |
| Dataset | הוצאות ניסוי בלבד | הוצאות אמיתיות |
| Backend | Vercel Development/Preview או API מקומי שמחובר ל-Dev | Vercel Production Functions |
| Secrets | קובץ `.env` שאינו ב-Git ומכיל **רק Dev** (`DATABASE_URL` של `app_backend` ב-Development) | **רק** Vercel Production Environment (`DATABASE_URL` של `app_backend` ב-Production) |
| Migrations | נבדקות כאן קודם (Claude דרך Supabase MCP המוגבל לפרויקט ה-Development, או המשתמש ב-SQL Editor) | מוחלות אוטומטית על ידי Supabase GitHub Integration ב-Push ל-`main` |

פרטי הגישה הטכניים: משתנה יחיד, `DATABASE_URL`, בפורמט `postgresql://app_backend.<project-ref>:<password>@<pooler-host>:6543/postgres` (Transaction pooler). אין לפרסם את הערכים. משתני Production אינם זמינים במחשב המפתח; קובץ `.env.example` מכיל שמות משתנים בלבד.

**הגדרות נפרדות שאינן מסונכרנות אוטומטית ב-Migrations:** כיבוי ה-Data API, יצירת המשתמש `app_backend` וסיסמתו (חייב להתבצע **לפני** ה-Migration הראשונה, כי היא מעניקה לו הרשאות), סודות, הרשאות וגישה לפרויקט, נתוני טבלאות ונתוני Test. אין שימוש ב-Supabase Storage או Auth במוצר הזה.

### 2.8 GitHub, Database Migrations ו-Automatic Deployment

**Repository אחד ב-GitHub** כולל Frontend, פונקציות Backend, סכמות/טיפוסים, בדיקות ותיקיית `supabase/migrations/` עם קובצי SQL גרסאיים; אין מפתחות או `.env` ב-Repository. כל שינוי מבנה Database מנוהל ב-Migration ולא בעריכה ידנית ב-Production.

**Workflow חד-משמעי:**

1. פיתוח מבוצע מול Supabase Development בלבד. קוד ומיגרציות נבחנים תחילה ב-Development בענן, לא ב-Production. בדיקות ו-Build רצים מקומית לפני כל Push.
2. **אישור המשתמש ל-Production הוא אישור ה-Push ל-`main`.** אין צורך באישור ידני נוסף בין ה-Migration לבין פריסת האתר.
3. פרויקט ה-Production ב-Supabase מחובר ל-Repository דרך **Supabase GitHub Integration** (Project Settings ← Integrations), עם "Deploy to production" על הענף `main` ו-Working directory `.`. בכל Push ל-`main` הוא מחיל את קובצי `supabase/migrations/` שטרם הוחלו. פרויקט ה-Development **אינו** מחובר ל-GitHub.
4. Vercel מחובר ל-Repository ופורס את `main` ל-Production. עד Milestone 6 הפריסה האוטומטית של `main` כבויה (`vercel.json` ← `git.deploymentEnabled.main = false`), ומופעלת מחדש בשלב הפרסום.
5. **סדר בין Migration לפריסה:** שתי האינטגרציות פועלות במקביל על אותו Push, ולכן אין הבטחה שה-Migration יסתיים לפני שהקוד החדש עולה. לכן שינויים בסכימה חייבים להיות **Backward Compatible** (למשל Add Column לפני Remove/Rename), כך שגם הגרסה הקודמת וגם החדשה עובדות מול המבנה החדש. Rollback של Frontend ב-Vercel אינו מחזיר Migration אחורה; שינוי הרסני דורש תוכנית Recovery נפרדת.
6. לא מפעילים מסלול נוסף שמחיל את אותן Migrations על Production (למשל Supabase CLI ידני או GitHub Actions).

**הבהרה חשובה:** חיבור GitHub ל-Supabase אינו מעביר שינויי Dashboard או נתונים ל-Production. הוא מחיל **קובצי Migration שב-Repository** בלבד, ולא מעתיק נתוני Development ל-Production.

### 2.9 Hosting, Configuration ועלויות

- Vercel מארח את ה-Frontend ואת פונקציות `/api/*` באותו פרויקט ודומיין; קובצי Frontend נבנים באמצעות Vite, ה-API מבוצע בפונקציות Node.js. יש להגדיר Rewrite לנתיבי React Router כדי שרענון בדף פנימי לא יחזיר 404, בלי לדרוס `/api/*`.
- Vercel Hobby מתאים לדמו אישי/לימודי לא-מסחרי, בכפוף למגבלות ולמדיניות השימוש; שימוש מסחרי מחייב בדיקת תוכנית מתאימה. מחירי ותקרות שירות עשויים להשתנות.
- Supabase Free מאפשר לפי התיעוד **שני פרויקטים פעילים בחינם**, ולכן Development ו-Production יכולים להיכלל במכסה אם אין פרויקטים חינמיים פעילים נוספים באותו חשבון לפי כללי השירות. כל פרויקט Free מוגבל, בין היתר, ל-500MB Database. פרויקט Free בעל פעילות DB נמוכה עלול **להיעצר אחרי כ-7 ימים**; ניתן להפעילו מחדש, אך זמינות רציפה חשובה מצדיקה תשלום. תוכנית Pro מתחילה סביב $25 לחודש לארגון, ופרויקט נוסף עשוי להיות בעלות נוספת.
- הגדרות Rate/Timeout/Region של ה-Function ייבחרו על בסיס שימוש בפועל. מומלץ לבחור Region קרוב למיקום Supabase כדי לצמצם זמן תגובה.
- אין צורך ב-Supabase Storage, Object Storage נוסף, שירות AI, SMTP או CRON.

### 2.10 בדיקות וקבלת התנהגות תקינה

- **CRUD:** יצירה, עריכה ומחיקה נשמרות לאחר Reload; מחיקה רק לאחר אישור; Modal לא שומר קלט שגוי.
- **Validation:** קטגוריית 'אחר' ללא תיאור, סכום לא חיובי/מעל 100,000/מעל 2 ספרות עשרוניות, תאריך עתידי/לא חוקי ו-UUID שגוי – נדחים בצד שרת.
- **סינון ומיון:** שילוב AND; שינוי חודש/שנה/יום; מיון בטבלאות; תוצאה ריקה לעומת שגיאת API.
- **גרפים:** Pie ללא קטגוריות ריקות; עמודות שנתיות/חודשיות; סכומים מול כמות; פילטרי ייצוא אינם משנים גרפים.
- **ייצוא:** כל הרשומות או מסוננות, UTF-8/עברית, הורדת PDF ב-RTL, טיפול ב-CSV Formula Injection ומצב ללא תוצאות.
- **סביבות ו-Deployment:** כתיבה בפיתוח אינה נוגעת ל-Production; Push ל-`main` מחיל את ה-Migrations ב-Production דרך Supabase GitHub Integration ופורס דרך Vercel; API לא חושף את `DATABASE_URL`.

## 3. מקורות עיקריים והחלטות המבוססות על תיעוד רשמי

- [Vercel – Deploying Git Repositories](https://vercel.com/docs/git) – קישור Git, פריסה אוטומטית והתנהגות Production Branch.
- [Vercel – Deploying GitHub Projects](https://vercel.com/docs/git/vercel-for-github) – אינטגרציה ו-GitHub Actions.
- [Vercel – Git Configuration](https://vercel.com/docs/project-configuration/git-configuration) – שליטה בהפעלת Deployments אוטומטיים למניעת Race Conditions.
- [Vercel – GitHub Actions Deployment](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel) – Deploy באמצעות CLI לאחר צעדי CI.
- [Supabase – Deployment & Branching](https://supabase.com/docs/guides/deployment) – Migrations דרך GitHub וכללי פריסה.
- [Supabase – Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments) – הפרדת Development ו-Production ו-GitHub Actions.
- [Supabase – CLI Reference](https://supabase.com/docs/reference/cli/introduction) – `supabase db push`, היסטוריית Migrations ו-`--dry-run`.
- [Supabase – Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) – הגנת DB ומפתחות שרת בעלי הרשאות.
- [Supabase – Free project limits](https://supabase.com/docs/guides/platform/billing-on-supabase) ו-[Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) – שתי סביבות Free והשהיה עקב חוסר פעילות.
- [Vercel – Hobby Plan](https://vercel.com/docs/plans/hobby) – התאמת תוכנית חינמית לדמו לא-מסחרי.

---

**סיכום החלטה:** פיתוח React + TypeScript עם REST API על Vercel Functions ו-Supabase PostgreSQL, שאליו ה-Backend מתחבר כמשתמש מוגבל `app_backend`. שני פרויקטי Supabase (Development/Production) עם Data API כבוי. Supabase GitHub Integration מחיל Migrations על Production, ו-Vercel פורס את האתר (ראה ADR-1). ללא Authentication בהתאם ל-PRD, אך **מגבלת הפרטיות של נתונים משותפים חשופה ומהותית**.

## החלטות מרכזיות (ADRs)

### ADR-1: חיבור למסד הנתונים כמשתמש מוגבל ופריסת Migrations דרך Supabase GitHub Integration
**הקשר:** הגרסה הקודמת של המסמך קבעה חיבור דרך `@supabase/supabase-js` עם מפתח Secret שעוקף RLS, ו-Pipeline ב-GitHub Actions (Supabase CLI + Vercel CLI) לפריסת Production. המשתמש הציג את הדרך שבה המרצה מקים את אותו מבנה, והיא פשוטה יותר להגדרה: פחות סודות, בלי Access Tokens ובלי GitHub Actions. המשתמש אישר לעבור אליה (9 בנובמבר 2026).
**החלטה:** (1) בכל פרויקט Supabase ה-Data API כבוי, ונוצר ידנית משתמש `app_backend` עם סיסמה ייחודית. (2) ה-Backend מתחבר עם `postgres` (postgres.js) דרך Transaction pooler (פורט 6543, `prepare: false`) באמצעות משתנה יחיד `DATABASE_URL`. (3) ה-Migrations מעניקות ל-`app_backend` הרשאות CRUD ו-Policy של RLS על טבלאות האפליקציה בלבד. (4) ב-Production, Supabase GitHub Integration מחיל את ה-Migrations ב-Push ל-`main`, ו-Vercel פורס מ-GitHub.
**השלכות:** גם אם `DATABASE_URL` דולף, הוא נותן גישה לטבלאות האפליקציה בלבד, ולא לניהול הפרויקט. אין עוד מפתח Secret שעוקף RLS. אין הבטחת סדר בין Migration לפריסה, ולכן חובה לכתוב Migrations תואמות-לאחור. יצירת `app_backend` היא צעד ידני שחייב לקרות לפני ה-Migration הראשונה בכל פרויקט. Milestone 6 יתבסס על האינטגרציות במקום על GitHub Actions.

### ADR-2: הרצת ה-API מקומית בלי Vercel CLI
**הקשר:** בפיתוח מקומי צריך להריץ את פונקציות `api/` בלי להתחבר ל-Vercel מהמחשב.
**החלטה:** Plugin קטן ב-`vite.config.ts` (פעיל רק ב-`npm run dev`) מנתב בקשות `/api/*` לאותם קבצים בדיוק שרצים ב-Vercel, וטוען את `.env` לשרת בלבד.
**השלכות:** פקודה אחת (`npm run dev`) מריצה אתר ו-API. ההבדלים בין סביבת הפיתוח לבין Vercel קטנים (אותו קוד), אבל בעיות שקשורות לאריזה ב-Vercel יתגלו רק בפריסה.

### ADR-3: קובץ הסודות המקומי הוא `.env`
**הקשר:** המסמך הזכיר `.env.local`, ו-CLAUDE.md קובע `.env`.
**החלטה:** משתמשים ב-`.env` (מוחרג מ-Git), עם `.env.example` שמכיל שמות משתנים בלבד.
**השלכות:** אין שינוי מעשי: Vite וה-Plugin טוענים את שניהם.
