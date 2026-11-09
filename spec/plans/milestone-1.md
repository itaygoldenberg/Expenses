# Milestone 1 — הקמה, התחברות ואתר חי: תוכנית בנייה

> מקורות: `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`.
> תמונות ה-Wireframes / Mockups / Style Guide עדיין placeholders — הבנייה מתבססת על הטקסט ב-DESIGN.md בלבד.
> שם האפליקציה (מוצג במסך ההתחברות ובכותרת הדפדפן): **"הוצאות"** — אושר על ידי המשתמש.

## 1. מטרה ותחום

בסוף ה-Milestone:
- פרויקט React + Vite + TypeScript + Tailwind רץ מקומית, בעברית ו-RTL, עם הגופן Rubik וצבעי ה-Style Guide.
- התחברות עם אימייל וסיסמה דרך Supabase Auth (משתמש יחיד, בלי הרשמה).
- מעטפת ניווט: סרגל לשוניות בתחתית בטלפון, תפריט צד מימין במחשב.
- כל המסכים קיימים כמסכים ריקים עם כותרת בלבד.
- Vitest מותקן ויש פקודת הרצה.
- האתר מפורסם ב-Vercel ומחובר ל-Supabase Production (בזמן הדחיפה, באישור המשתמש).

**מחוץ לתחום של Milestone זה:** טבלאות במסד הנתונים, migrations, טופס הרישום (כפתור ➕ קיים אבל עדיין לא פותח כלום — הטופס נבנה ב-Milestone 2), Recharts, SheetJS.

## 2. תלויות (npm)

| חבילה | למה |
|-------|-----|
| `react`, `react-dom` | ה-UI |
| `react-router` (v7, library mode) | ניווט בין מסכים |
| `@supabase/supabase-js` | התחברות (ובהמשך נתונים) |
| `lucide-react` | אייקונים קוויים (סגנון Lucide לפי DESIGN) |
| dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom` | בנייה |
| dev: `tailwindcss`, `@tailwindcss/vite` (Tailwind v4) | עיצוב |
| dev: `vitest` | בדיקות אוטומטיות |

Recharts ו-SheetJS **לא** מותקנים עכשיו — רק ב-Milestones שצריכים אותם.

## 3. קבצים ליצור / לשנות

```
package.json                 scripts: dev, build, preview, test
index.html                   <html lang="he" dir="rtl">, <title>הוצאות</title>, Rubik מ-Google Fonts, viewport
vite.config.ts               react + tailwind plugins; הגדרת vitest (environment: node)
tsconfig.json (+ tsconfig.app.json, tsconfig.node.json)   לפי תבנית Vite
vercel.json                  rewrite של כל הכתובות ל-/index.html
.env.example                 VITE_SUPABASE_URL=, VITE_SUPABASE_ANON_KEY=  (בלי ערכים)
.env                         העתק חד-פעמי של .env.example — המשתמש ממלא (Claude לא קורא אותו)
src/
  main.tsx                   createRoot + BrowserRouter + AuthProvider
  App.tsx                    הגדרת הנתיבים
  index.css                  @import "tailwindcss"; @theme עם צבעים וגופן; רקע/טקסט בסיס
  vite-env.d.ts              טיפוסים ל-import.meta.env
  lib/
    supabase.ts              createClient מתוך משתני הסביבה; שגיאה ברורה אם חסרים
  features/auth/
    AuthProvider.tsx         Context: session, loading, signIn, signOut; getSession + onAuthStateChange
    RequireAuth.tsx          אם loading → מסך טעינה; אם אין session → <Navigate to="/login">
    LoginPage.tsx            מסך ההתחברות
    authErrors.ts            פונקציה טהורה: שגיאת Supabase → הודעה בעברית
    authErrors.test.ts       בדיקות Vitest לפונקציה
  components/
    AppLayout.tsx            מעטפת: תפריט צד (מחשב) / סרגל לשוניות (טלפון) + <Outlet/>
    navItems.ts              רשימת הלשוניות (נתיב, תווית, אייקון) — מקור אחד לשני סוגי הניווט
    PageTitle.tsx            כותרת מסך אחידה (22px / 600)
  pages/  (או בתוך features — מסך ריק לכל אחד)
    SummaryPage.tsx          "סיכום"
    TransactionsPage.tsx     "רישומים"
    RecurringPage.tsx        "הוצאות קבועות"
    MorePage.tsx             "עוד" + קישורים
    CategoriesPage.tsx       "קטגוריות"
    ImportPage.tsx           "ייבוא קובץ"
```

מבנה התיקיות ב-`src/` לפי ARCHITECTURE.md: מסכים ריקים של יכולות עתידיות יישבו כבר בתיקיית ה-feature שלהם (`features/summary/SummaryPage.tsx`, `features/transactions/...` וכו'), כדי שלא יהיה צורך להזיז אותם אחר כך. `MorePage` ב-`components/` (אינו feature).

`.gitignore` כבר מכסה `node_modules/`, `dist/`, `.env`, `.vercel/` — אין צורך בשינוי.

## 4. נתיבים (React Router)

| נתיב | מסך | הגנה |
|------|-----|------|
| `/login` | התחברות (בלי ניווט). משתמש מחובר שמגיע לכאן מועבר ל-`/` | ציבורי |
| `/` | סיכום (מסך הבית) | מוגן |
| `/transactions` | רישומים | מוגן |
| `/recurring` | הוצאות קבועות | מוגן |
| `/more` | עוד | מוגן |
| `/categories` | קטגוריות (דרך "עוד") | מוגן |
| `/import` | ייבוא קובץ (דרך "עוד") | מוגן |
| `*` | הפניה ל-`/` | — |

כל הנתיבים המוגנים עטופים ב-`RequireAuth` → `AppLayout`.

## 5. התחברות — התנהגות

- `AuthProvider` טוען את ה-session הקיים (`supabase.auth.getSession()`) ומאזין ל-`onAuthStateChange`. עד שהטעינה הראשונה מסתיימת — מוצג מסך טעינה פשוט (כדי שלא יהיה "הבהוב" של מסך ההתחברות אצל משתמש מחובר).
- **מסך ההתחברות** (לפי DESIGN): "הוצאות" בראש, שדה אימייל (`type=email`, `autocomplete=username`), שדה סיסמה (`type=password`, `autocomplete=current-password`), אזור הודעת שגיאה מעל הכפתור, כפתור "כניסה" ברוחב מלא. אין קישור להרשמה. בזמן שליחה הכפתור מושבת.
  - תוויות: "אימייל", "סיסמה".
  - שדות אימייל וכתובות מוצגים LTR בתוך הטופס (`dir="ltr"`), התווית נשארת מימין.
- **שגיאות (`authErrors.ts`):**
  - פרטים שגויים (`invalid_credentials` / סטטוס 400) → **"אימייל או סיסמה שגויים"** (לפי ה-DoD).
  - שדה ריק → חסימה בדפדפן (`required`) בלי פנייה לשרת.
  - כל שגיאה אחרת (למשל אין אינטרנט) → **"לא הצלחנו להתחבר — בדוק את החיבור לאינטרנט ונסה שוב"** (נוסח מותאם מהודעת "אין אינטרנט" שב-DESIGN.md; אם תרצה נוסח אחר — אפשר לשנות).
- כניסה מוצלחת → ניווט ל-`/`.
- **התנתקות:** ב"עוד" ← "התנתקות" → `supabase.auth.signOut()` → ניווט ל-`/login`. ה-session נמחק מהדפדפן, כך שרענון לא מחזיר פנימה.
- **אין הרשמה:** אין שום קריאה ל-`signUp` בקוד, וההרשמה מבוטלת גם בהגדרות שני פרויקטי Supabase (ראה סעיף 8).

## 6. מעטפת הניווט ועיצוב

**Tailwind theme (`index.css`, `@theme`)** — צבעים מה-Style Guide כשמות קבועים:
`primary #15803D`, `primary-light #DCFCE7`, `income #15803D`, `expense #DC2626`, `warning-bg #FEF3C7`, `warning-text #B45309`, `bg #F6FAF7`, `surface #FFFFFF`, `text #1F2937`, `muted #6B7280`, `border #E5E7EB`; גופן `Rubik`. רקע הדף `bg`, טקסט 16px, `font-variant-numeric: tabular-nums` כברירת מחדל לסכומים (ישמש בהמשך).

**לשוניות (`navItems.ts`)** — סדר מימין לשמאל: **סיכום** (`/`) · **רישומים** (`/transactions`) · **➕ הוספה** · **קבועות** (`/recurring`) · **עוד** (`/more`). אייקונים מ-Lucide (למשל `PieChart`, `List`, `Plus`, `Repeat`, `Menu`).

**טלפון (< 768px, `md` ב-Tailwind):**
- סרגל קבוע בתחתית, רקע לבן, צל עליון רך; כל לשונית: אייקון + תווית 14px.
- לשונית פעילה בירוק (`primary`), השאר באפור (`muted`).
- כפתור ההוספה באמצע: עגול, ירוק, בולט (מוגבה מעט מעל הסרגל), אייקון `+` לבן.
- לתוכן יש ריפוד תחתון כדי שהסרגל לא יסתיר אותו; ריפוד צד 16px; תמיכה ב-`safe-area-inset-bottom` (אייפון).

**מחשב (≥ 768px):**
- תפריט צד קבוע בצד **ימין** (טבעי ב-RTL), רקע לבן.
- בראשו "הוצאות" וכפתור "הוספה" ירוק ברוחב התפריט (48px, פינות 12px).
- מתחתיו הלשוניות סיכום · רישומים · קבועות · עוד; פעילה עם רקע `primary-light` וטקסט ירוק.
- התוכן במרכז השטח הנותר, `max-width: 960px`.

**כפתור ההוספה ב-Milestone 1:** מוצג בשני המצבים, אבל עדיין לא פותח כלום (`onClick` ריק עם הערה `// TODO(milestone-2): open transaction form`). הטופס נבנה ב-Milestone 2.

**לשונית "עוד" פעילה** גם כשנמצאים ב-`/categories` או `/import` (שאליהם מגיעים דרכה).

**מסכים ריקים:** כל מסך מציג רק `PageTitle` עם הכותרת שלו. מסך "עוד" מציג גם את רשימת הקישורים: "קטגוריות", "ייבוא קובץ", "התנתקות" (כרטיס לבן, פינות 16px, שורה לכל קישור בגובה 48px לפחות, חץ שמתהפך ל-RTL).

## 7. בדיקות אוטומטיות (Vitest)

- `npm test` → `vitest run`.
- `authErrors.test.ts`: שגיאת פרטים שגויים → "אימייל או סיסמה שגויים"; שגיאת רשת / לא מוכרת → הודעת החיבור.
- `environment: node` (אין צורך ב-jsdom ב-Milestone זה; המסכים נבדקים ידנית לפי ARCHITECTURE).

## 8. מה המשתמש עושה בעצמו (הדרכה צעד אחר צעד בזמן הבנייה)

Claude עוצר ומדריך בשפה פשוטה. **Claude לא נוגע בסיסמאות ולא קורא את `.env`.**

**א. Supabase — לפני שאפשר לבדוק התחברות (בזמן הבנייה):**
1. יצירת חשבון ב-supabase.com (אם אין).
2. יצירת שני פרויקטים: `expenses-dev` ו-`expenses-prod` (אזור קרוב, למשל Frankfurt/EU). לשמור את סיסמת מסד הנתונים במקום בטוח.
3. בכל פרויקט: Authentication → Sign In / Providers → לכבות "Allow new users to sign up".
4. בכל פרויקט: Authentication → Users → Add user → Create new user, עם אימייל וסיסמה, ו-"Auto Confirm User".
5. בפרויקט ה-Development: Project Settings → API → להעתיק את Project URL ואת ה-anon / publishable key ל-`.env` המקומי. (לא את ה-service role!)
6. Site URL בפרויקט ה-Development: `http://localhost:5173`.

**ב. Vercel — בזמן הדחיפה (באישור המשתמש, לא בזמן הבנייה):**
1. התחברות ל-vercel.com עם GitHub, Import של ה-repo `itaygoldenberg/Expenses`. Vercel מזהה Vite אוטומטית.
2. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — עם הערכים של פרויקט ה-**Production**.
3. Deploy, ואז ב-Supabase Production: Authentication → URL Configuration → Site URL = כתובת Vercel.
4. בדיקת האתר החי לפי ה-DoD.

> הסדר: הבנייה והבדיקה המקומית מול Development בלבד. ה-push (שמפעיל את הפרסום ב-Vercel) רק כשהמשתמש מבקש "דחוף שינויים לגיטהאב". אין ב-Milestone זה שינויי מבנה במסד הנתונים, ולכן אין migration להריץ על Production.

## 9. סדר העבודה בבנייה

1. יצירת שלד Vite (React + TS) בשורש הפרויקט, בלי לגעת ב-`spec/`, `CLAUDE.md`, `.gitignore`. ניקוי קבצי הדוגמה של Vite.
2. התקנת התלויות (סעיף 2).
3. Tailwind + theme + Rubik + `lang="he" dir="rtl"`.
4. `.env.example` + העתקה ל-`.env`; `lib/supabase.ts`.
5. `AuthProvider`, `RequireAuth`, `LoginPage`, `authErrors` + בדיקות.
6. `AppLayout`, `navItems`, `PageTitle`, מסכים ריקים, `MorePage` עם התנתקות; נתיבים ב-`App.tsx`.
7. `vercel.json`.
8. Vitest: `npm test` עובר; `npm run build` עובר בלי שגיאות TypeScript.
9. **עצירה להדרכת Supabase (סעיף 8א)** — אחרי שהמשתמש מילא `.env`, בדיקה בדפדפן: מסך התחברות, סיסמה שגויה, כניסה, ניווט בטלפון (375px) ובמחשב, התנתקות + רענון, רענון בתוך `/transactions` ב-`npm run preview`.
10. מילוי "פקודות הרצה" ב-CLAUDE.md (`npm run dev`, `npm test`), סימון 🟡 ב-MILESTONES.md, סגירת השרת.
11. ADR קצר ב-ARCHITECTURE.md: Tailwind v4 עם `@tailwindcss/vite` ו-React Router v7 (library mode) — רק אם מתקבלת החלטה שחורגת מהכתוב.

## 10. בדיקה מול Definition of Done

| תנאי | איך נבדק |
|------|----------|
| פתיחה מקומית בלי התחברות → מסך התחברות | `npm run dev`, פתיחת `/` ו-`/transactions` בחלון נקי → הפניה ל-`/login` |
| סיסמה שגויה → "אימייל או סיסמה שגויים" | ניסיון עם סיסמה שגויה מול Development |
| אחרי התחברות → מסך הסיכום הריק, הכל בעברית ומיושר לימין | בדיקה ויזואלית |
| טלפון: סרגל בתחתית; מחשב: תפריט צד מימין; כל לשונית מעבירה למסך שלה | רוחב 375px ו-1280px, לחיצה על כל לשונית + קטגוריות/ייבוא דרך "עוד" |
| התנתקות → מסך התחברות; רענון לא מחזיר פנימה | לחיצה על "התנתקות" ורענון |
| אתר חי ב-Vercel: התחברות עם משתמש Production, מעבר בין מסכים, רענון במסך פנימי בלי שגיאה | **אחרי הדחיפה בלבד**, יחד עם המשתמש (`vercel.json` נבדק מקומית מראש ב-`npm run preview`) |
| אין אפשרות להירשם | אין מסך/קישור הרשמה בקוד; ההרשמה מבוטלת בשני הפרויקטים (המשתמש מאשר שביצע) |
