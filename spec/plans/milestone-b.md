# Milestone B — בסיס עיצובי (Liquid Glass Foundation): תוכנית בנייה

> מקורות: `MILESTONES.md` (Milestone B), `DESIGN.md` 3.0 (סעיף 1.0 ניווט, 1.9 מצבים, סעיף 2 Style Guide), `ARCHITECTURE.md` 3.0 (ADR-10), `PRD.md` 3.0 (UX Requirements).
> נקודת פתיחה (הקוד הקיים): `src/styles/global.css` (Tokens בסגנון Neon), `src/components/Layout.tsx` (פס עליון + פס תחתון, 4 דפים), `Modal.tsx` (`<dialog>`), `Toast.tsx`, וסגנונות המסכים ב-CSS Modules שמשתמשים במשתני הצבע הישנים (`--cyan`, `--panel-blue`, `--hot-pink`, `--gradient-primary` וכו'). React Router 8 תומך ב-`viewTransition` על קישורים.

## 1. מטרה ותחום

**בסוף ה-Milestone:**
- **Design System** עובד: Tokens, ספריית רכיבים בשפת Liquid Glass, תנועה ונגישות.
- **מעטפת חדשה** (App Shell) לכל האתר: Sidebar במחשב, Sidebar מצומצם בטאבלט, Header + Tab bar בטלפון, רקע עם אור סביבתי, ומעברי דפים.
- **דף "רכיבים"** פנימי שמציג את כל הרכיבים בכל המצבים — לבדיקה שלך ושלי.
- **ארבעת המסכים הקיימים ממשיכים לעבוד בדיוק כמו היום**, בתוך המעטפת החדשה ועם הפלטה החדשה (העיצוב המלא שלהם — ב-Milestone C).

**מחוץ לתחום:** שינוי מבנה המסכים, דף ראשי, חיפוש, הכנסות/זיכויים (C); התחברות (D); ייבוא (F). אין שינוי ב-API, במסד הנתונים או ב-Production. **אין ספריות חדשות** (ADR-10).

## 2. Design Tokens — `src/styles/tokens.css`

כל הערכים מ-DESIGN 2.1–2.6, כ-CSS custom properties על `:root`:

| קבוצה | Tokens |
|-------|--------|
| צבעים | `--bg-0`, `--bg-1`, `--graphite-900`, `--graphite-400`, `--text`, `--text-2` (טקסט משני), `--accent`, `--accent-2`, `--positive`, `--negative`, `--warning`, `--on-accent` (טקסט על כפתור ראשי = Midnight) |
| זכוכית | `--glass-fill`, `--glass-fill-strong`, `--glass-fill-dark`, `--glass-border`, `--glass-highlight`, `--glass-blur-1/2/3` (18/24/12px), `--glass-saturate` (140%) |
| עומק | `--shadow`, `--shadow-lg`, `--focus-ring` (2px Soft Blue + offset) |
| טיפוגרפיה | `--font` (Heebo, Inter), `--font-num` (Inter, Heebo); `--fs-display/h1/h2/h3/body/small/caption` + משקלים ו-line-height |
| מרווחים | `--space-1`…`--space-12` (בסיס 4px) |
| רדיוסים | `--r-field` 12, `--r-sm` 16, `--r-card` 22, `--r-xl` 28, `--r-pill` |
| תנועה | `--dur-press` 120ms, `--dur-ui` 200ms, `--dur-enter` 320ms, `--ease` `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| גרפים | `--chart-1`…`--chart-11` (11 הצבעים של DESIGN 2.1) |
| Breakpoints | 768px, 1200px (כ-media queries; מתועדים בקובץ) |

**תאימות למסכים הקיימים:** המשתנים הישנים (`--cyan`, `--panel-blue`, `--hot-pink`, `--gradient-primary`, `--glow-*`, `--border*`, `--text-light`, `--text-muted`, `--radius-*`, `--deep-navy` …) **נשארים כשמות** אבל מצביעים על ה-Tokens החדשים (למשל `--cyan → var(--accent-2)`, `--hot-pink → var(--negative)`, `--gradient-primary → var(--accent)`, `--panel-blue → var(--glass-fill)` עם fallback אטום). כך המסכים הקיימים מקבלים את הפלטה הרגועה מיד — בלי לגעת בקוד שלהם ובלי לשבור אותם. השמות הישנים יוסרו ב-C, כשכל מסך יעבור לרכיבים החדשים.

**צבעי הגרפים:** `chartTheme.ts` יעבור ל-11 צבעי DESIGN 2.1 (במקום ה-Neon), אותו סדר קבוע לפי קטגוריה. ה-PDF והתוכן לא משתנים.

## 3. זכוכית, רקע ונגישות — `src/styles/glass.css`, `src/styles/motion.css`

- **מחלקות זכוכית:** `.glass-1` / `.glass-2` / `.glass-3` — `background` + `backdrop-filter: blur() saturate()` + גבול + השתקפות עליונה (`::before` עם `--glass-highlight`) + צל. לא יותר משתי שכבות זכוכית זו על זו (הרכיבים הפנימיים בתוך כרטיס משתמשים במשטח "inset" כהה ולא בזכוכית נוספת).
- **Fallback:** `@supports not (backdrop-filter: blur(1px))` → משטח אטום `--graphite-900`.
- **הפחתת שקיפות:** `@media (prefers-reduced-transparency: reduce)` → משטחים אטומים, בלי blur.
- **הפחתת תנועה:** `@media (prefers-reduced-motion: reduce)` → ביטול אנימציית הרקע, ההחלקות, ה"ברק" של ה-Skeleton והספירות; נשאר רק שינוי שקיפות קצר.
- **מתגי בדיקה:** `data-reduce-motion="true"` ו-`data-reduce-transparency="true"` על `<html>` מפעילים את אותם כללים בדיוק — כדי לבדוק אותם מתוך דף הרכיבים בלי לשנות הגדרות במחשב.
- **רקע אמביינט** (`AmbientBackground`): שכבה קבועה מאחורי הכול — גרדיאנט Midnight→Navy + שלושה "כתמי אור" גדולים מטושטשים (Soft Blue / Cyan / Emerald, שקיפות נמוכה) שזזים לאט מאוד ב-`transform` בלבד (20–40 שניות). `pointer-events: none`, `aria-hidden`.
- **פוקוס:** `:focus-visible` אחיד לכל רכיב — טבעת 2px ב-Soft Blue עם מרווח, נראית על כל רקע.
- **Skip link** "דלג לתוכן" — מופיע רק במקלדת.
- **ניגודיות:** בדיקה אוטומטית (סעיף 7) של כל צמד טקסט/רקע.

## 4. רכיבים — `src/ui/`

כל רכיב: קובץ `.tsx` + `.module.css`, עם `aria-*` מתאים, אזור לחיצה ≥ 44px, RTL ו-`:focus-visible`.

| רכיב | תכונות עיקריות |
|------|----------------|
| `Button` | `variant`: primary / secondary / ghost / danger; `size`: md / sm; `loading` (Spinner + מושבת); `icon`; לחיצה `scale(0.98)`, Hover הבהרה + הרמה 1px |
| `IconButton` | כפתור אייקון עגול עם `aria-label` חובה ו-Tooltip אופציונלי |
| `TextField` | תווית מעל, `hint`, `error` (הודעה מתחת + `aria-invalid` + `aria-describedby`), `startAdornment`/`endAdornment` (למשל ₪, אייקון), מצב `numeric` (LTR, `tabular-nums`) |
| `PasswordField` | `TextField` + כפתור עין להצגה/הסתרה (`aria-pressed`) — יוכן כבר עכשיו, ישמש ב-D |
| `SelectField` | `<select>` טבעי מעוצב (נגישות ומקלדת של הדפדפן, נוח בטלפון) + חץ |
| `SegmentedControl` | `role="radiogroup"`, מחוון נע (`transform`), ניווט בחיצים (בהיפוך ל-RTL), Home/End |
| `Tabs` | `role="tablist"`/`tab`/`tabpanel`, חיצים, מחוון נע |
| `Card` | `level` 1/2/3, `padding`, כותרת ואייקון אופציונליים, `interactive` (Hover) |
| `DataTable` | עטיפה לטבלה: כותרת דביקה, שורות עם Hover, יישור מספרים, כותרות ממיינות (`aria-sort`) — ממשק דומה ל-`ExpenseList` הקיים כדי שב-C המעבר יהיה פשוט |
| `Badge`, `Chip` | גלולה; `tone` (neutral/positive/negative/warning/accent); נקודת צבע; `Chip` עם כפתור X אופציונלי |
| `Modal` | שדרוג של ה-`<dialog>` הקיים לסגנון `glass-2` + כניסה (opacity/scale) + רקע מטושטש. **אותו ממשק** כדי שמודאל העדכון ודיאלוג המחיקה ימשיכו לעבוד |
| `ConfirmDialog` | Modal קטן: כותרת, תוכן, כפתור מסוכן/ראשי, "ביטול" עם פוקוס ראשוני |
| `Sheet` | בטלפון: חלון שעולה מלמטה עם ידית ו-Safe Area; במחשב: Modal. אותו ממשק |
| `Tooltip` | מופיע ב-Hover ובפוקוס, `role="tooltip"` + `aria-describedby`, `glass-3`, נסגר ב-Esc |
| `Toast` | שדרוג של הקיים: `glass-3`, `tone` success/error/info, מעל ה-Tab bar בטלפון / בפינה במחשב, `role="status"` |
| `Skeleton` | קו / בלוק / עיגול, "ברק" איטי (מושבת ב-reduced-motion), `aria-hidden` + טקסט "טוען…" נסתר לקורא מסך |
| `EmptyState` | אייקון גדול בקו דק, כותרת, הסבר, פעולה אופציונלית |
| `ErrorState` | גבול Coral עדין, הסבר, כפתור "נסו שוב" |
| `UploadArea` | אזור גרירה + כפתור בחירה, מצבים: רגיל / Hover / גרירה / מעבד (Progress) / שגיאה; `accept`, `maxSize`, מחזיר את הקובץ שנבחר ל-callback. **רק התצוגה וההתנהגות של הבחירה** — בדיקת סוג אמיתי ופענוח ב-F |

## 5. מעטפת האפליקציה (App Shell)

קבצים: `src/components/AppShell.tsx` (מחליף את `Layout.tsx`), `Sidebar.tsx`, `TabBar.tsx`, `MobileHeader.tsx`, `MoreSheet.tsx`, `navigation.ts` (הגדרת פריטי הניווט במקום אחד).

| גודל מסך | מבנה |
|----------|------|
| **טלפון** (< 768px) | Header זכוכית דק עם הלוגו "ניהול הוצאות". **Tab bar זכוכית תחתון:** בית · פילטרים · **➕** (מרכזי, בולט) · דו"חות · עוד. "עוד" פותח `Sheet` עם "אודות" (ובהמשך: ייבוא, היסטוריה, פרופיל, התנתקות). Safe Areas. |
| **טאבלט** (768–1199px) | Sidebar זכוכית צר (אייקונים בלבד, 76px) עם Tooltip לכל פריט; ➕ בראשו. |
| **מחשב** (≥ 1200px) | Sidebar זכוכית קבוע בימין (260px): לוגו, כפתור "הוספה" ראשי, הניווט, ו"אודות" בתחתית. תוכן עד 1280px. |

- **פריטי הניווט ב-B** הם הדפים שקיימים היום (בית, פילטרים, דו"חות, אודות). המבנה הסופי (ראשי, הוצאות, ייבוא, היסטוריה, פרופיל) ייכנס ב-C/D/F — מספיק להוסיף פריטים ל-`navigation.ts`.
- **כפתור ➕ / "הוספה" ב-B:** מעביר לדף הבית וממקד את טופס "הוספת הוצאה" (כמו היום הטופס נמצא שם). פתיחת הטופס כ-Sheet/Modal מכל דף — ב-C.
- **פריט פעיל:** רקע `--glass-fill-strong` + פס הדגשה דק ב-Soft Blue + טקסט מודגש; `aria-current="page"`.
- **מעברי דפים:** `viewTransition` של React Router על קישורי הניווט + CSS ל-View Transitions (fade + החלקה 8px). דפדפן בלי תמיכה / reduced-motion → החלפה מיידית.
- **רענון בתוך דף** והניווט הקיים ממשיכים לעבוד (אותם נתיבים).

## 6. דף הרכיבים — `/design-system`

- נתיב פנימי, **זמין רק בהרצת פיתוח** (`import.meta.env.DEV`), לא מופיע בניווט ולא נבנה לאתר החי.
- מציג כל רכיב בכל המצבים: Buttons (כל ה-variants, disabled, loading), שדות (רגיל, פוקוס, שגיאה, מושבת, ₪, סיסמה), Select, Segmented, Tabs, Cards ברמות 1/2/3, טבלה לדוגמה (נתוני דמו **מסומנים כדוגמה**, לא נתוני משתמש), Badges/Chips, כפתורים שפותחים Modal / ConfirmDialog / Sheet / Toast, Tooltip, Skeletons, Empty/Error, UploadArea.
- **פאנל בקרה** בראש הדף: מתגים "הפחתת תנועה" ו"הפחתת שקיפות" (מפעילים את `data-*` על `<html>`), וטבלת ניגודיות שמציגה את היחס המחושב לכל צמד צבעים.

## 7. בדיקות

- **רכיבים (Vitest + Testing Library, jsdom):** Button (disabled/loading חוסם לחיצה), TextField (`aria-invalid` + הודעה מקושרת), PasswordField (הצגה/הסתרה), SegmentedControl ו-Tabs (בחירה בחיצים ב-RTL, Home/End, `aria-selected`), Modal/ConfirmDialog/Sheet (פוקוס ראשוני, Esc סוגר, הפוקוס חוזר), Tooltip (מופיע בפוקוס, `aria-describedby`), Toast (`role="status"`, נעלם), UploadArea (בחירה בכפתור, גרירה, קובץ גדול מ-`maxSize` → שגיאה), EmptyState/ErrorState ("נסו שוב").
- **ניגודיות:** פונקציה `contrastRatio(fg, bg)` (נוסחת WCAG) + בדיקה לכל צמד: טקסט ראשי ומשני על הרקע ועל הזכוכית (מחושבת כשכבה מעל הרקע הכהה), טקסט על כפתור ראשי, טקסט Coral/Emerald/Amber — כולם ≥ 4.5:1 (טקסט גדול ≥ 3:1).
- **מעטפת:** הניווט מציג את הפריטים הנכונים, `aria-current` על הפעיל, "עוד" פותח את ה-Sheet, ➕ מוביל לטופס.
- **Regression:** כל 149 הבדיקות הקיימות עוברות בלי שינוי בהתנהגות. `npm run build` עובר, והדף `/design-system` לא נכלל בבנייה לאתר החי.

## 8. סדר העבודה בבנייה
1. `tokens.css` + `glass.css` + `motion.css`; מיפוי השמות הישנים; עדכון `index.html` (theme-color).
2. `contrastRatio` + בדיקת ניגודיות — ותיקון Tokens שלא עומדים ביחס הנדרש לפני שממשיכים.
3. רכיבי `src/ui/` + בדיקות.
4. `AmbientBackground`, `AppShell` (Sidebar / TabBar / MobileHeader / MoreSheet), מעברי דפים; החלפת `Layout`.
5. שדרוג `Modal` ו-`Toast` הקיימים לרכיבים החדשים (אותו ממשק); עדכון צבעי `chartTheme`.
6. דף `/design-system`.
7. בדיקה בדפדפן: 375px, 820px, 1280px ו-1440px — כל הרכיבים, ללא גלילה אופקית, מקלדת בלבד (Tab/Shift+Tab/חיצים/Esc), מתגי הפחתת תנועה ושקיפות, Fallback (סימולציה בכיבוי `backdrop-filter`), ארבעת המסכים הקיימים: הוספה, עדכון, מחיקה, סינון, גרפים, ייצוא CSV/PDF — עובדים כמו קודם.
8. `npm test`, `npm run build`, ADR אם התקבלה החלטה משמעותית, סימון 🟡 ב-MILESTONES.md, סגירת השרת.

## 9. בדיקה מול Definition of Done

| תנאי | איך נבדק |
|------|----------|
| כל הרכיבים מוצגים בדף הרכיבים במחשב, בטאבלט ובטלפון, בלי גלילה אופקית | `/design-system` ב-375 / 820 / 1280 / 1440px; בדיקת `scrollWidth` |
| ניגודיות ≥ 4.5:1; פוקוס גלוי; ניווט מקלדת | בדיקת הניגודיות האוטומטית + טבלת הניגודיות בדף; מעבר במקלדת בלבד על כל רכיב ועל הניווט |
| reduced-motion מבטל תנועה; reduced-transparency ו-Fallback אטומים | מתגי הבדיקה בדף + `prefers-*` באמולציה של הדפדפן + סימולציית `backdrop-filter` לא נתמך |
| בדיקות רכיבים, כל הבדיקות הקיימות ו-Build עוברים | `npm test`, `npm run build` |
| אין שינוי בהתנהגות, ב-API או במסד | אין שינוי בקבצי `api/`, `shared/` ו-`supabase/`; ארבעת המסכים נבדקים ידנית בדפדפן |
