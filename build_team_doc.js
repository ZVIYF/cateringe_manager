const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, ImageRun, PageBreak, LevelFormat, TableOfContents, Footer, PageNumber,
  BorderStyle
} = require('docx');

const FONT = 'Arial';
const W = 9638;
const D = __dirname + '/docs';
const heb = s => /[֐-׿]/.test(s);

function runs(text, opts = {}) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean);
  return parts.map(p => {
    const bold = p.startsWith('**');
    const code = p.startsWith('`');
    const t = bold ? p.slice(2, -2) : code ? p.slice(1, -1) : p;
    const isHeb = heb(t);
    return new TextRun({
      text: t, bold: bold || opts.bold, italics: opts.italics,
      rightToLeft: isHeb, font: code ? 'Consolas' : FONT, size: code ? (opts.size || 20) : opts.size, color: opts.color
    });
  });
}
const P = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 120, line: 300 }, children: runs(text, o) });
const H = (lvl, text) => new Paragraph({ heading: lvl, bidirectional: true, alignment: AlignmentType.RIGHT, keepNext: true, children: [new TextRun({ text, rightToLeft: true, font: FONT })] });
const H1 = t => H(HeadingLevel.HEADING_1, t);
const H2 = t => H(HeadingLevel.HEADING_2, t);
const H3 = t => H(HeadingLevel.HEADING_3, t);
const B = (text, lvl = 0) => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: 'bul', level: lvl }, spacing: { after: 60 }, children: runs(text) });
const BR = () => new Paragraph({ children: [new PageBreak()] });
const CODE = (lines) => new Paragraph({
  alignment: AlignmentType.LEFT, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' },
  spacing: { after: 0 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: '9CA3AF' } },
  children: [new TextRun({ text: lines, font: 'Consolas', size: 18 })]
});
const CODEBLOCK = (text) => text.split('\n').map(l => CODE(l || ' ')).concat([new Paragraph({ spacing: { after: 160 }, children: [] })]);

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
function cellPara(text, header) {
  const parts = String(text).split(/(`[^`]+`)/).filter(Boolean);
  const isHeb = heb(text.replace(/`[^`]+`/g, ''));
  return new Paragraph({
    bidirectional: isHeb, alignment: isHeb ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0 },
    children: parts.map(p => {
      const code = p.startsWith('`');
      const t = code ? p.slice(1, -1) : p;
      return new TextRun({ text: t, bold: header, font: code ? 'Consolas' : FONT, size: code ? 18 : 19, rightToLeft: heb(t) && !code });
    })
  });
}
function T(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const ws = widths.map(w => Math.round(w / total * W));
  ws[ws.length - 1] += W - ws.reduce((a, b) => a + b, 0);
  const mk = (cells) => new TableRow({
    children: cells.map((c, i) => new TableCell({
      width: { size: ws[i], type: WidthType.DXA }, borders,
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: String(c).split('\n').map(line => cellPara(line, false))
    }))
  });
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((c, i) => new TableCell({
      width: { size: ws[i], type: WidthType.DXA }, borders,
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      shading: { type: ShadingType.CLEAR, fill: '1F3864' },
      children: [new Paragraph({ bidirectional: heb(c), alignment: heb(c) ? AlignmentType.RIGHT : AlignmentType.LEFT, spacing: { after: 0 }, children: [new TextRun({ text: c, bold: true, color: 'FFFFFF', font: FONT, size: 19, rightToLeft: heb(c) })] })]
    }))
  });
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: ws, visuallyRightToLeft: true, rows: [headerRow, ...rows.map(mk)] }), new Paragraph({ spacing: { after: 120 }, children: [] })];
}
function IMG(file, caption, maxW = 640, maxH = 820) {
  const buf = fs.readFileSync(file);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  let sw = maxW, sh = h * maxW / w;
  if (sh > maxH) { sh = maxH; sw = w * maxH / h; }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: Math.round(sw), height: Math.round(sh) } })] }),
    new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: runs(caption, { italics: true, size: 18, color: '595959' }) })
  ];
}

const c = [];

// Title
c.push(new Paragraph({ spacing: { before: 3000 }, children: [] }));
c.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'צורת עבודה וחוזה API', rightToLeft: true, font: FONT, size: 56, bold: true, color: '1F3864' })] }));
c.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { before: 200, after: 600 }, children: [new TextRun({ text: 'מערכת ניהול קייטרינג — צוות פיתוח עם Claude Code', rightToLeft: true, font: FONT, size: 32, color: '2E75B6' })] }));
c.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: runs('גרסה 1.0 · אוקטובר 2026 · הוכן על ידי ידידיה פרידלנד', { size: 22 }) }));
c.push(new Paragraph({ children: [new PageBreak()] }));
c.push(new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, children: runs('תוכן עניינים', { bold: true, size: 32 }) }));
c.push(new TableOfContents('תוכן עניינים', { hyperlink: true, headingStyleRange: '1-2' }));
c.push(new Paragraph({ children: [new PageBreak()] }));

// 1
c.push(H1('1. העיקרון המרכזי'));
c.push(P('שני סוכני Claude Code — אחד עובד על הפרונט (`apps/web`) ואחד על הבקאנד (`apps/api`) — **לא מדברים זה עם זה**. כל התיאום ביניהם עובר דרך קבצים בריפו המשותף. זה המבנה שמאפשר לשני המפתחים לעבוד במקביל בלי להתנגש, ולסוכנים לדעת בדיוק מה מותר להם לגעת.'));
c.push(...T(['ערוץ', 'מה עובר בו', 'מי כותב'], [
  ['`packages/shared`', 'סכמות Zod, טיפוסים, enums, חישוב סכומים — החוזה בקוד', 'מפתח הבקאנד, באישור שניהם'],
  ['`docs/API_CONTRACT.md`', 'החוזה בשפה אנושית עם דוגמאות JSON', 'מתעדכן באותו PR עם shared'],
  ['`docs/API_CHANGELOG.md`', 'מה השתנה בחוזה ומתי', 'כל מי ששינה'],
  ['GitHub Issues, תווית `api-request`', 'בקשה של הפרונט לשדה או endpoint חדש', 'מפתח הפרונט'],
  ['תיאור ה-PR', 'מה נעשה, מה נשאר פתוח', 'הסוכן, מאושר ע"י המפתח']
], [2, 4.5, 2]));
c.push(P('הכלל המנחה: **החוזה קודם, הקוד אחריו**. אף צד לא ממציא שדה או endpoint שלא קיים ב-shared.'));
c.push(...IMG(D + '/collab.png', 'תרשים 1: איך שני הסוכנים משתפים פעולה דרך הריפו'));

// 2
c.push(H1('2. חלוקת אחריות'));
c.push(...T(['תחום', 'מפתח פרונט', 'מפתח בקאנד'], [
  ['`apps/web`', 'בעלים', 'לא נוגע'],
  ['`apps/api`', 'לא נוגע', 'בעלים'],
  ['`packages/shared`', 'מציע (Issue), מאשר PR', 'כותב, פותח PR'],
  ['`prisma/schema.prisma`', '—', 'בעלים'],
  ['מוקים (MSW)', 'בעלים', '—'],
  ['בדיקות חוזה', '—', 'בעלים'],
  ['`docs/API_CONTRACT.md`', 'מאשר', 'כותב'],
  ['CI, Docker, משתני סביבה', 'משותף', 'משותף']
], [2.5, 3, 3]));

// 3
c.push(H1('3. מבנה הריפו'));
c.push(P('ריפו אחד (monorepo) עם pnpm workspaces, כדי ששני הסוכנים יראו את אותם טיפוסים, ושינוי בחוזה ישבור קומפילציה בשני הצדדים מיד אם מישהו לא עדכן.'));
c.push(...CODEBLOCK(
`catering/
├── CLAUDE.md                  # הוראות לשני הסוכנים
├── docs/
│   ├── SPEC.docx               # מסמך האפיון
│   ├── API_CONTRACT.md
│   ├── API_CHANGELOG.md
│   └── WORKFLOW.md
├── packages/shared/src/
│   ├── enums.ts                # כל ה-enums + תוויות בעברית
│   ├── http.ts                 # מעטפות תגובה, קודי שגיאה
│   ├── money.ts                # calcTotals, formatMoney
│   └── schemas/                # customer.ts, order.ts, dish.ts ...
├── apps/api/
│   ├── CLAUDE.md
│   ├── prisma/schema.prisma
│   └── src/modules/<module>/   # routes, controller, service, tests
├── apps/web/
│   ├── CLAUDE.md
│   └── src/
│       ├── api/                # client + hooks לכל מודול
│       ├── mocks/               # MSW handlers + fixtures
│       ├── pages/                # מסך לכל S01..S16
│       └── components/
├── .claude/commands/            # פקודות מותאמות לסוכנים
├── docker-compose.yml
└── .env.example`));

// 4
c.push(H1('4. מחזור החיים של פיצ\'ר'));
c.push(...IMG(D + '/feature.png', 'תרשים 2: ארבעת השלבים של כל פיצ\'ר'));
['**חוזה.** מפתח הבקאנד מוסיף סכמות ל-`packages/shared` ומעדכן את `API_CONTRACT.md`. ענף `contract/<module>`, PR קטן ששניהם מאשרים. זה השלב היחיד שדורש את שניכם יחד.',
 '**עבודה במקביל.** פרונט כותב hooks ומסכים מול מוקים של MSW. בקאנד כותב מיגרציה, service, routes ובדיקות. ענפים נפרדים: `fe/<module>` ו-`be/<module>`.',
 '**אינטגרציה.** אחרי מיזוג הבקאנד, הפרונט מכבה מוקים (`VITE_USE_MOCKS=false`) ובודק מול שרת מקומי.',
 '**מיזוג.** PR של הפרונט עובר CI ומתמזג.'].forEach((x, i) => c.push(B(x)));
c.push(P('אם הפרונט מגלה שחסר לו משהו — **לא ממציא**. פותח Issue עם תווית `api-request`, מוסיף מוק זמני מסומן `// TODO(api-request #<n>)`, וממשיך. ראו סעיף 6.3 לפקודה המוכנה.'));

// 5 Git
c.push(H1('5. ניהול גרסאות (Git)'));
c.push(H2('5.1 ענפים'));
c.push(...T(['ענף', 'שימוש'], [
  ['`main`', 'מוגן, תמיד ירוק וניתן לפריסה'],
  ['`contract/<module>`', 'שינויי חוזה בלבד'],
  ['`fe/<module>-<desc>`', 'פרונט, לדוגמה fe/orders-list'],
  ['`be/<module>-<desc>`', 'בקאנד, לדוגמה be/orders-crud'],
  ['`fix/<desc>`', 'תיקון באג']
], [2.5, 6]));
c.push(H2('5.2 הודעות Commit'));
c.push(P('פורמט Conventional Commits באנגלית, עם scope:'));
c.push(...CODEBLOCK(`feat(api/orders): add PUT /orders/:id/items
feat(web/orders): order wizard step 2
fix(shared): calcTotals rounding of deposit
contract(orders): add allowedTransitions to Order`));
c.push(H2('5.3 Pull Requests'));
['PR קטן: עד כ-400 שורות שינוי (לא כולל קבצים אוטומטיים).', 'PR של חוזה דורש אישור **של שניכם**. כל PR אחר — אישור המפתח השני, או אישור עצמי אם הוא בתחום שלך ו-CI ירוק.', 'Squash merge בלבד.', 'תבנית ה-PR (`.github/pull_request_template.md`) חובה.'].forEach(x => c.push(B(x)));
c.push(H2('5.4 CI'));
c.push(P('בכל PR: `pnpm install` → `typecheck` → `lint` → `test` → `build`. אם `packages/shared` השתנה, רץ typecheck גם בשתי האפליקציות. בבקאנד, בדיקות החוזה מוודאות שכל תגובה עוברת `schema.parse()` של הסכמה המשותפת.'));
c.push(BR());

// 6 Claude Code
c.push(H1('6. עבודה עם Claude Code'));
c.push(H2('6.1 קבצי הוראות'));
c.push(...T(['קובץ', 'נקרא ע"י', 'תוכן'], [
  ['`CLAUDE.md` (שורש)', 'שני הסוכנים', 'חוקי ברזל, מוסכמות, איפה החוזה'],
  ['`apps/web/CLAUDE.md`', 'סוכן הפרונט', 'סטאק, מבנה תיקיות, RTL, מוקים'],
  ['`apps/api/CLAUDE.md`', 'סוכן הבקאנד', 'שכבות, Prisma, שגיאות, בדיקות']
], [2.5, 1.8, 4.2]));
c.push(P('Claude Code טוען `CLAUDE.md` אוטומטית מהתיקייה שבה הוא רץ ומתיקיות האב שלה. לכן כל מפתח מפעיל את Claude Code מתוך התיקייה שלו (`apps/web` או `apps/api`), והסוכן מקבל גם את ההוראות הכלליות וגם את הספציפיות לו.'));
c.push(H2('6.2 חוקי ברזל לשני הסוכנים'));
['קרא את הסעיף הרלוונטי ב-`docs/API_CONTRACT.md` לפני כל משימה שנוגעת ל-API.', 'אל תשנה קבצים מחוץ לתחום שלך. סוכן הפרונט לא נוגע ב-`apps/api` וב-`packages/shared`.', 'אל תמציא שדות, endpoints או קודי שגיאה. אם חסר — עצור ותגיד.', 'כסף באגורות (מספר שלם), זמנים ב-UTC, שמות שדות ב-camelCase.', 'אל תשכפל לוגיקה עסקית בפרונט (סטטוסים, הרשאות, חישובים). השתמש במה שהשרת מחזיר או בפונקציות מ-shared.', 'טקסט למשתמש בעברית. קוד, מזהים, commits והערות קוד — באנגלית.', 'כל משימה מסתיימת עם `typecheck`, `lint` ו-`test` ירוקים.'].forEach(x => c.push(B(x)));
c.push(H2('6.3 פקודות מותאמות (Slash Commands)'));
c.push(P('ב-`.claude/commands/` יש שלוש פקודות מוכנות:'));
c.push(...T(['פקודה', 'למי', 'מה עושה'], [
  ['`/contract-change`', 'בקאנד', 'מעדכן את shared, את API_CONTRACT.md ואת ה-CHANGELOG יחד, ובודק ששתי האפליקציות עדיין מתקמפלות. עוצר אם השינוי שובר ולא אושר.'],
  ['`/api-request`', 'פרונט', 'מנסח Issue מסודר לבקשת API, ומוסיף מוק זמני במקום להמציא שדה'],
  ['`/feature-done`', 'שניהם', 'מריץ בדיקות, עובר על Definition of Done, ומנסח תיאור PR']
], [2.2, 1.3, 5.2]));
c.push(H2('6.4 איך לתת משימה לסוכן'));
c.push(P('תבנית מומלצת לפתיחת משימה (באנגלית, ישירות לסוכן):'));
c.push(...CODEBLOCK(`Task: Implement screen S04 (Orders list).
Read first: docs/API_CONTRACT.md §5.2, docs/SPEC.docx screen S04.
Scope: apps/web only.
Use: useOrdersList hook from src/api/orders.ts (create it if missing).
Done when: filters + pagination + tabs work against MSW mocks,
typecheck/lint/test pass.
Start in plan mode and show me the plan before writing code.`));
['משימה אחת = מסך אחד או מודול API אחד. לא "תבנה את כל ההזמנות".', 'הפנו למספר המסך (S01–S16) ולסעיף בחוזה, במקום להסביר מחדש.', 'בקשו תוכנית לפני קוד (plan mode) בכל משימה שנוגעת ביותר משלושה קבצים.', 'אחרי כל משימה: `git diff`, קריאה, ורק אז commit.', 'סשן חדש לכל פיצ\'ר — סשן ארוך מדי "שוכח" הוראות.'].forEach(x => c.push(B(x)));
c.push(H2('6.5 כשהסוכן תקוע או סוטה'));
['משנה קבצים מחוץ לתחום — עצרו, הפנו לחוק 2 בסעיף 6.2.', 'ממציא שדה — הפנו ל-`packages/shared/src/schemas` ולחוק 3.', 'אותה שגיאה חוזרת פעמיים — עצרו, תקנו ידנית או פרקו למשימות קטנות יותר.'].forEach(x => c.push(B(x)));
c.push(BR());

// 7 mocks + env
c.push(H1('7. מוקים בפרונט'));
['MSW (Mock Service Worker) ב-`apps/web/src/mocks`.', 'כל handler מחזיר נתונים שעוברים את סכמת ה-Zod המשותפת. ה-fixtures נבדקים בבדיקה: `OrderSchema.parse(fixture)`.', '`VITE_USE_MOCKS=true` מפעיל את כל המוקים. `VITE_MOCK_MODULES=kitchen,deliveries` מפעיל מוקים רק למודולים שעוד לא מוכנים בשרת.', 'סימולציית שגיאות: `?__mockError=VERSION_CONFLICT` בכתובת גורם לבקשה הבאה להיכשל עם הקוד הזה.'].forEach(x => c.push(B(x)));

c.push(H1('8. סביבת פיתוח מקומית'));
c.push(...CODEBLOCK(`pnpm install
cp .env.example .env
docker compose up -d          # postgres + redis
pnpm --filter api db:migrate
pnpm --filter api db:seed     # משתמש לכל תפקיד, מנות, לקוחות, הזמנות
pnpm dev                      # web על 5173, api על 4000`));
c.push(P('משתמשי seed (סיסמה לכולם: `Passw0rd!`): `admin@dev.local` (מנהל), `office@dev.local` (משרד), `chef@dev.local` (מנהל מטבח), `cook@dev.local` (עובד מטבח), `driver@dev.local` (נהג).'));
c.push(H2('8.1 ספקים חיצוניים'));
c.push(P('כל ספק חיצוני (סליקה, חשבוניות, SMS, אחסון קבצים) נמצא מאחורי interface, עם מימוש `mock` לפיתוח ובדיקות. כך אפשר לפתח ולהריץ בדיקות בלי מפתחות אמיתיים. המעבר לספק אמיתי הוא שינוי של משתנה סביבה אחד (`PAYMENT_PROVIDER=cardcom` וכו\'), בלי לגעת בקוד שמשתמש בו.'));
c.push(BR());

// 9 DoD
c.push(H1('9. הגדרת "סיום" (Definition of Done)'));
c.push(H2('9.1 בקאנד'));
['ה-endpoint תואם בדיוק את הסכמה המשותפת (קלט ופלט), עם בדיקת חוזה.', 'בדיקת הרשאות: לפחות בדיקה אחת לתפקיד מורשה ואחת ללא (403).', 'שגיאות לפי טבלת הקודים בחוזה, הודעות בעברית.', 'מיגרציה ו-seed מעודכנים.', 'מופיע ב-Swagger (`/api/docs`).'].forEach(x => c.push(B(x)));
c.push(H2('9.2 פרונט'));
['עובד מול מוקים **וגם** מול השרת המקומי.', 'מצבי טעינה (skeleton), ריק (empty state) ושגיאה.', 'RTL תקין, נבדק ברוחב המכשיר שנקבע למסך.', 'שגיאות ולידציה מהשרת מוצגות ליד השדות.', 'כפתורים וסטטוסים לפי `allowedTransitions` ו-`permissions` מהשרת, לא לפי לוגיקה מקומית.'].forEach(x => c.push(B(x)));

// 10 coordination
c.push(H1('10. תיאום בין המפתחים'));
['**סנכרון יומי של 10 דקות:** מה מוזג, מה תקוע, אילו api-request פתוחים.', '**פתיחת שבוע:** בוחרים יחד את המודולים לשבוע; הבקאנד מתחיל בחוזים שלהם ביום הראשון.', 'הבקאנד תמיד צעד אחד לפני בחוזים (לא בהכרח במימוש) — בזכות המוקים הפרונט לא מחכה.'].forEach(x => c.push(B(x)));

c.push(H1('11. סדר בניית המודולים המוצע'));
c.push(...T(['שבוע', 'חוזה (שניכם)', 'בקאנד', 'פרונט'], [
  ['1', 'auth, users, settings', 'שלד, Prisma, auth, RBAC, seed, CI', 'שלד, Layout RTL, ניתוב, login'],
  ['2', 'customers, dishes, menus', 'CRUD לקוחות ומנות', 'S08, S09'],
  ['3–4', 'orders, quotes', 'הזמנות, items, מעברי סטטוס, PDF', 'S04, S05, S06'],
  ['5', 'public quotes, payments', 'פורטל, סליקה (mock), קבלות', 'S07, S14'],
  ['6', 'calendar, dashboard', 'view=calendar, dashboard', 'S02, S03'],
  ['7–8', 'inventory, purchasing, kitchen', 'תחזית, רכש, משימות מטבח', 'S10, S11, S12'],
  ['9', 'deliveries, driver', 'שיבוץ, start/complete, SMS', 'S13 + PWA'],
  ['10–11', 'reports, notifications', 'דוחות, BullMQ, תזכורות', 'S15, S16']
], [0.9, 2.3, 3.3, 2.5]));

// 12 API summary — the heavy part
c.push(BR());
c.push(H1('12. סיכום חוזה ה-API'));
c.push(P('הגרסה המלאה עם כל השדות, דוגמאות JSON וכללים עסקיים נמצאת ב-`docs/API_CONTRACT.md` (נטען אוטומטית לשני הסוכנים). כאן סיכום לעיון מהיר.'));

c.push(H2('12.1 מוסכמות ליבה'));
c.push(...T(['נושא', 'החלטה'], [
  ['Base URL', 'פיתוח: `http://localhost:4000/api/v1` · פרודקשן: `https://api.<domain>/api/v1`'],
  ['פורמט', 'JSON, `camelCase`. העלאת קבצים: `multipart/form-data`'],
  ['כסף', 'מספר שלם באגורות בלבד. `479080` = ₪4,790.80. אין float. חישוב רק דרך `calcTotals()` ב-shared'],
  ['זמן', 'ISO 8601 UTC (`...Z`) לנקודות זמן. `YYYY-MM-DD` לתאריך בלבד. תצוגה: Asia/Jerusalem'],
  ['מזהים', '`id` מסוג string (cuid). מספר הזמנה לתצוגה הוא `number` שלם ורץ'],
  ['נעילה אופטימית', 'שדה `version` בכל רשומה ניתנת לעריכה. אי-התאמה → `409 VERSION_CONFLICT`'],
  ['תיעוד חי', 'Swagger ב-`/api/docs`, נוצר אוטומטית מהסכמות המשותפות']
], [1.8, 6.5]));

c.push(H2('12.2 מעטפת תגובה'));
c.push(P('פריט בודד: `{ "data": {...} }`  ·  רשימה: `{ "data": [...], "meta": { page, pageSize, total, totalPages } }`'));
c.push(...CODEBLOCK(`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "שדות לא תקינים",
    "details": { "fields": { "event.guests": "חובה" } },
    "requestId": "req_9f2a"
  }
}`));
c.push(P('`DELETE` מוצלח מחזיר `204` בלי גוף. `code` קבוע באנגלית לקבלת החלטה בפרונט; `message` בעברית מוצג למשתמש כמו שהוא; `details.fields` במפתחות נתיב-נקודות, מתאים ישירות ל-setError של React Hook Form.'));

c.push(H2('12.3 קודי שגיאה'));
c.push(...T(['HTTP', 'code', 'מתי'], [
  ['400', '`VALIDATION_ERROR`', 'גוף או פרמטרים לא עוברים סכמה'],
  ['401', '`UNAUTHENTICATED` / `TOKEN_EXPIRED`', 'אין טוקן תקין / פג תוקף'],
  ['403', '`FORBIDDEN`', 'אין הרשאה לתפקיד'],
  ['404', '`NOT_FOUND`', 'המשאב לא קיים או נמחק'],
  ['409', '`VERSION_CONFLICT`', 'מישהו אחר עדכן את הרשומה'],
  ['409', '`INVALID_STATUS_TRANSITION`', 'מעבר סטטוס לא מותר'],
  ['409', '`ORDER_LOCKED`', 'עריכת מנות בסטטוס בייצור ומעלה'],
  ['422', '`KASHRUT_CONFLICT`', 'מנה חלבית בהזמנה בשרית וכו\''],
  ['429', '`RATE_LIMITED`', 'יותר מדי בקשות'],
  ['502', '`PROVIDER_ERROR`', 'ספק חיצוני נכשל (סליקה, SMS, חשבוניות)']
], [1, 2.8, 4.5]));

c.push(H2('12.4 אימות'));
c.push(...IMG(D + '/auth.png', 'תרשים 3: זרימת התחברות וחידוש טוקן'));
['Access token בתוקף 15 דקות, מוחזר בגוף התגובה. נשמר בפרונט **בזיכרון בלבד**, לא ב-localStorage.', 'Refresh token בעוגיית httpOnly, תוקף 7 ימים (30 עם "זכור אותי").', 'ב-401 TOKEN_EXPIRED: רענון אוטומטי פעם אחת, בקשות מקבילות ממתינות לאותה קריאה.', 'תפקידים: `ADMIN`, `OFFICE`, `KITCHEN_MANAGER`, `KITCHEN_STAFF`, `DRIVER`. `GET /auth/me` מחזיר גם `permissions` להצגה; האכיפה האמיתית תמיד בשרת.'].forEach(x => c.push(B(x)));

c.push(H2('12.5 מודולים ונתיבים עיקריים'));
c.push(...T(['מודול', 'נתיבים מרכזיים'], [
  ['אימות', '`POST /auth/login, /refresh, /logout` · `GET /auth/me`'],
  ['לקוחות', '`GET/POST /customers` · `GET/PATCH/DELETE /customers/:id`'],
  ['הזמנות', '`GET/POST /orders` · `PATCH /orders/:id` · `PUT /orders/:id/items` · `POST /orders/:id/transition`'],
  ['הצעות מחיר', '`POST /orders/:id/quote/send` · `GET /public/quotes/:token` (ציבורי)'],
  ['תפריטים ומנות', '`GET/POST /dishes` · `PUT /dishes/:id/recipe` · `GET/POST /menus`'],
  ['מלאי ורכש', '`GET /inventory/forecast` · `POST /inventory/moves` · `GET/POST /purchase-orders`'],
  ['מטבח', '`GET /kitchen/tasks?date=` · `PATCH /kitchen/tasks/:id`'],
  ['משלוחים', '`GET /driver/deliveries/today` · `POST /deliveries/:id/start|complete`'],
  ['תשלומים', '`GET/POST /payments` · `POST /payments/link` · `GET /payments/open-balances`'],
  ['דוחות', '`GET /dashboard` · `GET /reports/revenue|profitability|top-dishes|conversion`'],
  ['הגדרות', '`GET/PATCH /settings` · `GET/POST /users`']
], [1.8, 6.5]));
c.push(P('הרשימה המלאה, כולל כל הפרמטרים, גופי הבקשה, ודוגמאות JSON — ב-`docs/API_CONTRACT.md` סעיף 5.'));

c.push(H2('12.6 כללים שהפרונט לא ממציא'));
['**סטטוסים ומעברים:** כל הזמנה חוזרת עם `allowedTransitions` — רשימת המעברים שמותרים למשתמש הנוכחי עכשיו. הפרונט מציג כפתורים לפיה, לא משחזר את מכונת המצבים.', '**חישובי כסף:** `subtotal`, `discount`, `vat`, `total`, `deposit`, `balance` — כולם מחושבים בשרת. הפרונט רשאי להציג הערכה זמנית תוך כדי הקלדה (עם `calcTotals()` מ-shared), אבל אחרי שמירה מציג את מה שהשרת החזיר.', '**כשרות:** מנה חלבית לא יכולה להיכנס להזמנה בשרית. הבדיקה בשרת (`422 KASHRUT_CONFLICT`); הפרונט יכול לסנן מראש לנוחות אבל לא סומך על הסינון שלו בלבד.', '**הרשאות:** תפריטים, כפתורים ושדות נסתרים/מוצגים לפי `permissions` מהשרת — לא לפי רשימת תפקידים קשיחה בקוד הפרונט.'].forEach(x => c.push(B(x)));

c.push(H2('12.7 ניהול גרסאות של החוזה'));
['שינוי **מוסיף** (שדה חדש, endpoint חדש, פרמטר אופציונלי) — מעלה גרסה מינורית (v1.0 → v1.1), מותר בכל PR חוזה.', 'שינוי **שובר** (מחיקה/שינוי שם/שינוי סוג/הפיכת שדה לחובה) — דורש תיאום בין שני המפתחים ותקופת מעבר.', 'כל שינוי נרשם ב-`docs/API_CHANGELOG.md`: תאריך, גרסה, מה השתנה.'].forEach(x => c.push(B(x)));

const doc = new Document({
  creator: 'Yedidya Friedland',
  title: 'צורת עבודה וחוזה API — מערכת קייטרינג',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 22, rightToLeft: true } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: '1F3864', font: FONT }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, color: '2E75B6', font: FONT }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '404040', font: FONT }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { right: 500, hanging: 260 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '7F7F7F' })] })] }) },
    children: c
  }]
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(__dirname + '/צורת_עבודה_וחוזה_API.docx', b); console.log('ok'); });
