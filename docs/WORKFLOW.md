# צורת עבודה — צוות של שני מפתחים ושני סוכנים

## 1. העיקרון המרכזי

שני הסוכנים (Claude Code של הפרונט ו-Claude Code של הבקאנד) **לא מדברים זה עם זה**. כל התיאום ביניהם עובר דרך קבצים בריפו:

| ערוץ | מה עובר בו | מי כותב |
|---|---|---|
| `packages/shared` | סכמות Zod, טיפוסים, enums, `calcTotals()` — החוזה בקוד | מפתח הבקאנד (באישור שניהם) |
| `docs/API_CONTRACT.md` | החוזה בשפה אנושית, דוגמאות JSON | מתעדכן באותו PR עם `shared` |
| `docs/API_CHANGELOG.md` | מה השתנה בחוזה ומתי | כל מי ששינה |
| GitHub Issues עם תווית `api-request` | בקשה של הפרונט לשדה או endpoint חדש | מפתח הפרונט |
| תיאור ה-PR | מה נעשה, מה נשאר פתוח | הסוכן, ומפתח מאשר |

הכלל: **החוזה קודם, הקוד אחריו.** אף צד לא ממציא שדה או endpoint שלא קיים ב-`shared`.

## 2. חלוקת אחריות

| תחום | מפתח פרונט | מפתח בקאנד |
|---|---|---|
| `apps/web` | בעלים | לא נוגע |
| `apps/api` | לא נוגע | בעלים |
| `packages/shared` | מציע (Issue), מאשר PR | כותב, פותח PR |
| `prisma/schema.prisma` | — | בעלים |
| מוקים (MSW) | בעלים | — |
| בדיקות חוזה | — | בעלים |
| `docs/API_CONTRACT.md` | מאשר | כותב |
| CI, Docker, משתני סביבה | משותף | משותף |

## 3. מבנה הריפו (Monorepo)

ריפו אחד, pnpm workspaces. כך שני הסוכנים רואים את אותם טיפוסים, ושינוי בחוזה שובר את הקומפילציה בשני הצדדים מיד.

```
catering/
├── CLAUDE.md                  # הוראות לשני הסוכנים
├── docs/
│   ├── SPEC.docx              # מסמך האפיון
│   ├── API_CONTRACT.md
│   ├── API_CHANGELOG.md
│   └── WORKFLOW.md
├── packages/shared/src/
│   ├── enums.ts               # כל ה-enums + תוויות בעברית
│   ├── http.ts                # מעטפות תגובה, קודי שגיאה
│   ├── money.ts               # calcTotals, formatMoney
│   └── schemas/               # customer.ts, order.ts, dish.ts ...
├── apps/api/
│   ├── CLAUDE.md
│   ├── prisma/schema.prisma
│   └── src/modules/<module>/  # routes, controller, service, tests
├── apps/web/
│   ├── CLAUDE.md
│   └── src/
│       ├── api/               # client + hooks לכל מודול
│       ├── mocks/             # MSW handlers + fixtures
│       ├── pages/             # מסך לכל S01..S16
│       └── components/
├── .claude/commands/          # פקודות מותאמות לסוכנים
├── docker-compose.yml
└── .env.example
```

## 4. מחזור החיים של פיצ'ר

כל פיצ'ר (למשל "רשימת הזמנות") עובר את השלבים האלה:

1. **חוזה.** מפתח הבקאנד מוסיף סכמות ל-`packages/shared` ומעדכן את `API_CONTRACT.md`. ענף: `contract/<module>`. PR קטן, שניהם מאשרים. זה השלב היחיד שבו צריך את שניכם יחד.
2. **עבודה במקביל.**
   - פרונט: כותב hooks ומסכים מול מוקים של MSW שמחזירים נתונים לפי הסכמות. ענף: `fe/<module>`.
   - בקאנד: מיגרציה, service, routes ובדיקות חוזה. ענף: `be/<module>`.
3. **אינטגרציה.** אחרי מיזוג הבקאנד, הפרונט מכבה את המוקים (`VITE_USE_MOCKS=false`) ובודק מול השרת המקומי.
4. **מיזוג.** PR של הפרונט עובר CI ומתמזג.

אם הפרונט מגלה באמצע שחסר לו משהו — **לא ממציא**. פותח Issue עם תווית `api-request`, מוסיף מוק זמני מסומן `// TODO(api-request #<n>)`, וממשיך.

## 5. Git

### 5.1 ענפים

| ענף | שימוש |
|---|---|
| `main` | מוגן. תמיד ירוק ותמיד ניתן לפריסה |
| `contract/<module>` | שינויי חוזה בלבד (`packages/shared` + docs) |
| `fe/<module>-<desc>` | פרונט, למשל `fe/orders-list` |
| `be/<module>-<desc>` | בקאנד, למשל `be/orders-crud` |
| `fix/<desc>` | תיקון באג |

### 5.2 Commits

פורמט Conventional Commits באנגלית, עם scope:

```
feat(api/orders): add PUT /orders/:id/items
feat(web/orders): order wizard step 2
fix(shared): calcTotals rounding of deposit
contract(orders): add allowedTransitions to Order
```

### 5.3 Pull Requests

- PR קטן: עד כ-400 שורות שינוי (בלי קבצים שנוצרים אוטומטית).
- PR של חוזה דורש אישור **של שניכם**. כל PR אחר — אישור של המפתח השני, או אישור עצמי אם הוא רק בתחום שלך ו-CI ירוק.
- Squash merge בלבד.
- התבנית ב-`.github/pull_request_template.md` חובה.

### 5.4 CI (GitHub Actions)

בכל PR רץ: `pnpm install` → `typecheck` → `lint` → `test` → `build`. אם `packages/shared` השתנה, רץ גם `typecheck` של שתי האפליקציות. בבקאנד, בדיקות החוזה מאמתות שכל תגובה עוברת `schema.parse()` של הסכמה מ-`shared`.

## 6. עבודה עם Claude Code

### 6.1 קבצי הוראות

| קובץ | נקרא ע"י | תוכן |
|---|---|---|
| `CLAUDE.md` (שורש) | שני הסוכנים | חוקי ברזל, מוסכמות, איפה החוזה |
| `apps/web/CLAUDE.md` | סוכן הפרונט | סטאק, מבנה תיקיות, RTL, מוקים |
| `apps/api/CLAUDE.md` | סוכן הבקאנד | שכבות, Prisma, שגיאות, בדיקות |

Claude Code טוען את `CLAUDE.md` אוטומטית מהתיקייה שבה הוא רץ ומתיקיות האב שלה. לכן כל מפתח מפעיל את Claude Code מתוך התיקייה שלו (`apps/web` או `apps/api`), והסוכן מקבל גם את ההוראות הכלליות וגם את הספציפיות.

### 6.2 חוקי ברזל לשני הסוכנים

1. קרא את הסעיף הרלוונטי ב-`docs/API_CONTRACT.md` לפני כל משימה שנוגעת ל-API.
2. אל תשנה קבצים מחוץ לתחום שלך. סוכן הפרונט לא נוגע ב-`apps/api` וב-`packages/shared`.
3. אל תמציא שדות, endpoints או קודי שגיאה. אם חסר — עצור ותגיד.
4. כסף באגורות, זמנים ב-UTC, `camelCase` ב-JSON.
5. אל תשכפל לוגיקה עסקית בפרונט (סטטוסים, הרשאות, חישובים). השתמש במה שהשרת מחזיר או ב-`shared`.
6. כל משימה מסתיימת ב-`pnpm typecheck && pnpm lint && pnpm test` ירוקים.

### 6.3 פקודות מותאמות

ב-`.claude/commands/` יש פקודות שמפעילים כ-slash command:

| פקודה | למי | מה עושה |
|---|---|---|
| `/contract-change` | בקאנד | מעדכן `shared`, את `API_CONTRACT.md` ואת ה-CHANGELOG יחד, ומוודא ששתי האפליקציות מתקמפלות |
| `/api-request` | פרונט | מנסח Issue מסודר לבקשת API, ומוסיף מוק זמני |
| `/feature-done` | שניהם | מריץ בדיקות, עובר על Definition of Done, ומנסח תיאור PR |

### 6.4 איך לתת משימה לסוכן

תבנית מומלצת לפתיחת משימה:

```
Task: Implement screen S04 (Orders list).
Read first: docs/API_CONTRACT.md §5.2, docs/SPEC.docx screen S04.
Scope: apps/web only.
Use: useOrdersList hook from src/api/orders.ts (create it if missing).
Done when: filters + pagination + tabs work against MSW mocks, typecheck/lint/test pass.
Start in plan mode and show me the plan before writing code.
```

עקרונות:

- משימה אחת = מסך אחד או מודול API אחד. לא "תבנה את כל ההזמנות".
- הפנה למספר המסך (S01–S16) ולסעיף בחוזה, במקום להסביר מחדש.
- בקש תוכנית לפני קוד (plan mode) בכל משימה שנוגעת ביותר משלושה קבצים.
- אחרי כל משימה: `git diff`, קריאה, ורק אז commit.
- בסשן חדש לכל פיצ'ר. סשן ארוך מדי מתחיל "לשכוח" את ההוראות.

### 6.5 מה עושים כשהסוכן תקוע או סוטה

- אם הוא מתחיל לשנות קבצים מחוץ לתחום — עצור, והזכר לו את חוק 2.
- אם הוא ממציא שדה — הפנה אותו ל-`packages/shared/src/schemas` והזכר את חוק 3.
- אם אותה שגיאה חוזרת פעמיים — עצור, תקן ידנית או פרק את המשימה לחלקים קטנים יותר.

## 7. מוקים (פרונט)

- MSW (Mock Service Worker) ב-`apps/web/src/mocks`.
- כל handler מחזיר נתונים שעוברים את סכמת ה-Zod מ-`shared`. ה-fixtures נבדקים ב-test: `OrderSchema.parse(fixture)`.
- `VITE_USE_MOCKS=true` מפעיל את המוקים. אפשר להפעיל מוקים רק למודולים שעוד לא מוכנים בשרת: `VITE_MOCK_MODULES=kitchen,deliveries`.
- המוקים מדמים גם שגיאות: הוסף `?__mockError=VERSION_CONFLICT` לכתובת כדי לבדוק את הטיפול בשגיאה.

## 8. סביבת פיתוח מקומית

```
pnpm install
cp .env.example .env
docker compose up -d          # postgres + redis
pnpm --filter api db:migrate
pnpm --filter api db:seed     # משתמש לכל תפקיד, 20 מנות, 10 לקוחות, 15 הזמנות
pnpm dev                      # web על 5173, api על 4000
```

משתמשי seed (סיסמה לכולם: `Passw0rd!`):

| אימייל | תפקיד |
|---|---|
| `admin@dev.local` | ADMIN |
| `office@dev.local` | OFFICE |
| `chef@dev.local` | KITCHEN_MANAGER |
| `cook@dev.local` | KITCHEN_STAFF |
| `driver@dev.local` | DRIVER |

### 8.1 משתני סביבה

| משתנה | צד | דוגמה |
|---|---|---|
| `DATABASE_URL` | api | `postgresql://catering:catering@localhost:5432/catering` |
| `REDIS_URL` | api | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | api | מחרוזות אקראיות ארוכות |
| `WEB_ORIGIN` | api | `http://localhost:5173` (ל-CORS) |
| `PUBLIC_QUOTE_BASE_URL` | api | `http://localhost:5173/p` |
| `PAYMENT_PROVIDER`, `PAYMENT_API_KEY` | api | `mock` בפיתוח |
| `INVOICE_PROVIDER`, `INVOICE_API_KEY` | api | `mock` בפיתוח |
| `SMS_PROVIDER`, `SMS_API_KEY` | api | `console` בפיתוח (מדפיס ללוג) |
| `STORAGE_PROVIDER` | api | `local` בפיתוח |
| `VITE_API_URL` | web | `/api/v1` |
| `VITE_USE_MOCKS` | web | `true` / `false` |

כל ספק חיצוני מאחורי interface עם מימוש `mock`, כך שאפשר לפתח ולבדוק בלי מפתחות אמיתיים.

## 9. הגדרת "סיום" (Definition of Done)

### 9.1 בקאנד

- ה-endpoint תואם בדיוק את הסכמה ב-`shared` (קלט ופלט), עם בדיקת חוזה.
- בדיקת הרשאות: לפחות בדיקה אחת לתפקיד מורשה ואחת ללא מורשה (403).
- שגיאות לפי טבלת הקודים בחוזה, הודעות בעברית.
- מיגרציה + seed מעודכנים.
- מופיע ב-Swagger.

### 9.2 פרונט

- עובד מול מוקים **ומול** השרת המקומי.
- מצבי טעינה (skeleton), ריק (empty state) ושגיאה.
- RTL תקין, נבדק ברוחב המכשיר שנקבע למסך (דסקטופ / טאבלט / מובייל).
- שגיאות ולידציה מהשרת מוצגות ליד השדות.
- כפתורים לפי `allowedTransitions` ו-`permissions`, לא לפי לוגיקה מקומית.

## 10. תיאום בין המפתחים

- **סנכרון יומי של 10 דקות:** מה מוזג, מה תקוע, אילו `api-request` פתוחים.
- **פתיחת שבוע:** בוחרים יחד את המודולים לשבוע, ובקאנד מתחיל בחוזים שלהם ביום הראשון.
- הבקאנד תמיד צעד אחד לפני בחוזים, לא בהכרח במימוש. בזכות המוקים הפרונט לא מחכה.

## 11. סדר בניית המודולים

| שבוע | חוזה (שניכם) | בקאנד | פרונט |
|---|---|---|---|
| 1 | auth, users, settings | שלד, Prisma, auth, RBAC, seed, CI | שלד, Layout RTL, ניתוב, login, interceptor |
| 2 | customers, dishes, menus | CRUD לקוחות ומנות | S08, S09 |
| 3–4 | orders, quotes | הזמנות, items, transitions, calcTotals, PDF | S04, S05, S06 |
| 5 | public quotes, payments | פורטל, סליקה (mock), קבלות | S07, S14 |
| 6 | calendar, dashboard | view=calendar, dashboard | S02, S03 |
| 7–8 | inventory, purchasing, kitchen | תחזית, רכש, משימות מטבח, דף ייצור | S10, S11, S12 |
| 9 | deliveries, driver | שיבוץ, start/complete, SMS | S13 + PWA |
| 10–11 | reports, notifications | דוחות, BullMQ, תזכורות | S15, S16 |
