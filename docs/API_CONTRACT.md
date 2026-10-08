# חוזה API — מערכת ניהול קייטרינג

גרסת חוזה: **v1.0** · כל שינוי נרשם ב-`docs/API_CHANGELOG.md`.

המסמך הזה הוא החוזה המחייב בין הפרונט לבקאנד. הסכמות ב-`packages/shared` הן המימוש שלו בקוד. אם יש סתירה בין המסמך לסכמות — **הסכמות קובעות**, ומעדכנים את המסמך באותו PR.

## 1. מוסכמות כלליות

### 1.1 בסיס

| נושא | החלטה |
|---|---|
| Base URL (פיתוח) | `http://localhost:4000/api/v1` — הפרונט פונה ל-`/api/v1` דרך proxy של Vite |
| Base URL (פרודקשן) | `https://api.<domain>/api/v1` |
| פורמט | JSON בלבד, `Content-Type: application/json; charset=utf-8` (חוץ מהעלאת קבצים: `multipart/form-data`) |
| שמות שדות | `camelCase` ב-JSON. בבסיס הנתונים `snake_case` — Prisma ממפה |
| מזהים | `id` מסוג string (cuid), למשל `"clx8k2..."`. מספר הזמנה לתצוגה הוא `number` (מספר שלם רץ) |
| תיעוד חי | Swagger UI ב-`/api/docs`, נוצר אוטומטית מהסכמות ב-`packages/shared` |

### 1.2 כסף

**כל סכום כספי הוא מספר שלם באגורות.** `479080` = ₪4,790.80. אין float בשום מקום. הפרונט ממיר לתצוגה בלבד עם `formatMoney()` מ-`packages/shared`.

עיגול: כל סכום מחושב (הנחה, מע"מ, מקדמה, `perGuest`) מעוגל לאגורה הקרובה בכל שלב, לפי הסדר: `subtotal → discount → vat → total → deposit`. הפונקציה היחידה שמחשבת את זה היא `calcTotals()` ב-`packages/shared`, והבקאנד משתמש בה.

אחוזים (מע"מ, מקדמה, הנחה) נשלחים כמספר שלם או עשרוני רגיל של אחוזים: `18` = 18%.

### 1.3 תאריכים וזמנים

| סוג | פורמט | דוגמה |
|---|---|---|
| נקודת זמן | ISO 8601 ב-UTC עם `Z` | `"2026-10-09T15:00:00.000Z"` |
| תאריך בלבד | `YYYY-MM-DD` | `"2026-10-15"` |

השרת שומר ומחזיר UTC. הפרונט מציג ב-`Asia/Jerusalem` בפורמט `DD/MM/YYYY HH:mm`. פרמטרים של טווח תאריכים (`from`, `to`) הם תאריך בלבד ומפורשים כשעון ישראל.

### 1.4 מעטפת תגובה

תגובה מוצלחת לפריט בודד:

```json
{ "data": { "id": "clx8k2", "name": "משפחת כהן" } }
```

תגובה מוצלחת לרשימה:

```json
{
  "data": [ { "id": "clx8k2" } ],
  "meta": { "page": 1, "pageSize": 25, "total": 134, "totalPages": 6 }
}
```

תגובת שגיאה (תמיד במבנה הזה):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "שדות לא תקינים",
    "details": { "fields": { "event.guests": "חובה" } },
    "requestId": "req_9f2a"
  }
}
```

- `code` — קבוע באנגלית, הפרונט מחליט לפיו מה לעשות.
- `message` — בעברית, אפשר להציג למשתמש כמו שהוא.
- `details.fields` — מפתחות בנתיב נקודות (`items.2.qty`), מתאים ישירות ל-`setError` של React Hook Form.
- `requestId` — מופיע גם בכותרת `X-Request-Id`, לחיפוש בלוגים.

`DELETE` מוצלח מחזיר `204` בלי גוף.

### 1.5 רשימות: עימוד, מיון, סינון, חיפוש

| פרמטר | ברירת מחדל | הערות |
|---|---|---|
| `page` | `1` | מתחיל מ-1 |
| `pageSize` | `25` | מקסימום 100 |
| `sort` | לפי משאב | שם שדה; מינוס = יורד. `sort=-startsAt` |
| `q` | — | חיפוש טקסט חופשי (שם, טלפון, מספר הזמנה) |
| `from`, `to` | — | טווח תאריכים `YYYY-MM-DD`, כולל |
| סינון לפי enum | — | ערכים מופרדים בפסיק: `status=CONFIRMED,QUOTE_SENT` |

### 1.6 קודי HTTP וקודי שגיאה

| HTTP | code | מתי | מה הפרונט עושה |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | גוף או פרמטרים לא עוברים סכמה | מציג שגיאות ליד השדות |
| 401 | `UNAUTHENTICATED` | אין טוקן או טוקן לא תקין | מעביר ל-`/login` |
| 401 | `TOKEN_EXPIRED` | Access token פג | קורא ל-`/auth/refresh` פעם אחת ומנסה שוב |
| 403 | `FORBIDDEN` | אין הרשאה לתפקיד | Toast "אין הרשאה" |
| 404 | `NOT_FOUND` | המשאב לא קיים או נמחק | מסך 404 |
| 409 | `VERSION_CONFLICT` | מישהו אחר עדכן את הרשומה | דיאלוג "הנתונים השתנו — לטעון מחדש?" |
| 409 | `INVALID_STATUS_TRANSITION` | מעבר סטטוס לא מותר | Toast עם ה-message |
| 409 | `ORDER_LOCKED` | עריכת מנות בסטטוס בייצור ואילך | Toast; מנהל יכול לשלוח `overrideReason` |
| 409 | `DUPLICATE` | ערך ייחודי קיים (למשל טלפון לקוח) | שגיאה ליד השדה |
| 422 | `KASHRUT_CONFLICT` | מנה חלבית בהזמנה בשרית וכו' | שגיאה ליד המנה |
| 422 | `DISCOUNT_REQUIRES_APPROVAL` | הנחה מעל 15% ע"י משתמש שאינו מנהל | הודעה |
| 429 | `RATE_LIMITED` | יותר מדי בקשות | Toast, ניסיון חוזר אחרי `Retry-After` |
| 429 | `ACCOUNT_LOCKED` | 5 failed login attempts | Show locked message with countdown |
| 500 | `INTERNAL_ERROR` | תקלה בשרת | Toast כללי + requestId |
| 502 | `PROVIDER_ERROR` | ספק חיצוני (סליקה, SMS, חשבוניות) נכשל | Toast, אפשרות לנסות שוב |

### 1.7 כותרות

| כותרת | כיוון | שימוש |
|---|---|---|
| `Authorization: Bearer <accessToken>` | בקשה | בכל הנתיבים חוץ מ-`/auth/*` ו-`/public/*` |
| `Idempotency-Key: <uuid>` | בקשה | חובה ב-`POST /payments` וב-`POST /orders/:id/quote/send`, למניעת כפילויות בלחיצה כפולה |
| `X-Request-Id` | תגובה | מזהה בקשה ללוגים |
| `Retry-After` | תגובה | ב-429 |

### 1.8 נעילה אופטימית

לכל רשומה שעורכים בטפסים (`order`, `customer`, `dish`) יש שדה `version` (מספר שלם). בכל `PATCH` / `PUT` הפרונט שולח את ה-`version` שקיבל. אם השרת מוצא גרסה אחרת — `409 VERSION_CONFLICT`. כל עדכון מוצלח מעלה את `version` ב-1 ומחזיר את הרשומה המעודכנת.

### 1.9 השרת מחשב, הפרונט מציג

סכומים, מע"מ, יתרות, כמויות חומרי גלם ו-`allowedTransitions` מחושבים **רק בשרת**. הפרונט רשאי להציג חישוב זמני בזמן הקלדה, אבל אחרי כל שמירה מציג את מה שהשרת החזיר.

## 2. אימות והרשאות

- `POST /auth/login` מחזיר `accessToken` (תוקף 15 דקות) בגוף התגובה, ו-refresh token (תוקף 7 ימים, או 30 עם `rememberMe`) בעוגייה `httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`.
- הפרונט שומר את ה-access token **בזיכרון בלבד** (לא ב-localStorage).
- בטעינת האפליקציה הפרונט קורא ל-`POST /auth/refresh`. הצלחה = המשתמש מחובר.
- ב-`401 TOKEN_EXPIRED` ה-interceptor קורא ל-refresh פעם אחת, ובקשות מקבילות ממתינות לאותה קריאה.

### 2.1 תפקידים

| enum | תפקיד |
|---|---|
| `ADMIN` | מנהל |
| `OFFICE` | משרד / מכירות |
| `KITCHEN_MANAGER` | מנהל מטבח |
| `KITCHEN_STAFF` | עובד מטבח |
| `DRIVER` | נהג |

`GET /auth/me` מחזיר גם `permissions` — רשימת מחרוזות כמו `orders:write`. הפרונט מסתיר תפריטים וכפתורים לפיהן, אבל **השרת בודק בכל מקרה**.

### 2.2 נקודות קצה

| Method | Path | גישה | תיאור |
|---|---|---|---|
| POST | `/auth/login` | ציבורי | `{ email, password, rememberMe? }` → `{ accessToken, user }` |
| POST | `/auth/refresh` | עוגייה | → `{ accessToken, user }` |
| POST | `/auth/logout` | מחובר | מוחק עוגייה, 204 |
| GET | `/auth/me` | מחובר | `{ user, permissions }` |
| POST | `/auth/forgot-password` | ציבורי | `{ email }` → 204 תמיד |
| POST | `/auth/reset-password` | ציבורי | `{ token, password }` → 204 |

```json
// POST /auth/login → 200
{
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { "id": "clu1", "name": "ידידיה", "email": "y@example.com", "role": "ADMIN" }
  }
}
```

## 3. ערכי Enum

כל ה-enums מוגדרים ב-`packages/shared/src/enums.ts`. התוויות בעברית לתצוגה נמצאות שם ב-`labels`.

| Enum | ערכים |
|---|---|
| `OrderStatus` | `DRAFT`, `QUOTE_SENT`, `CONFIRMED`, `IN_PRODUCTION`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CLOSED`, `LOST`, `CANCELLED` |
| `Kashrut` | `MEAT`, `DAIRY`, `PARVE` |
| `EventType` | `CELEBRATION`, `BRIT`, `BAR_MITZVAH`, `CORPORATE`, `SHABBAT`, `OTHER` |
| `ServiceType` | `DELIVERY`, `DELIVERY_AND_SERVING`, `PICKUP` |
| `CustomerType` | `PRIVATE`, `BUSINESS`, `INSTITUTION` |
| `DishCategory` | `STARTER`, `MAIN`, `SIDE`, `SALAD`, `DESSERT`, `DRINK` |
| `SaleUnit` | `PORTION`, `TRAY`, `KG`, `UNIT` |
| `DiscountType` | `NONE`, `FIXED`, `PERCENT` |
| `PaymentMethod` | `CASH`, `TRANSFER`, `CHECK`, `CREDIT_CARD` |
| `PaymentStatus` | `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED` |
| `KitchenTaskStatus` | `TODO`, `IN_PROGRESS`, `DONE`, `PACKED` |
| `DeliveryStatus` | `UNASSIGNED`, `ASSIGNED`, `EN_ROUTE`, `DELIVERED` |
| `StockMoveType` | `IN`, `OUT`, `ADJUST`, `WASTE` |
| `PurchaseOrderStatus` | `DRAFT`, `SENT`, `PARTIAL`, `RECEIVED` |

### 3.1 מעברי סטטוס של הזמנה

| מ- | אל | מי | תנאי |
|---|---|---|---|
| `DRAFT` | `QUOTE_SENT` | ADMIN, OFFICE | דרך `POST /orders/:id/quote/send` בלבד |
| `QUOTE_SENT` | `DRAFT` | ADMIN, OFFICE, לקוח | בקשת שינוי |
| `QUOTE_SENT` | `CONFIRMED` | ADMIN, לקוח | אישור + תשלום מקדמה, או אישור ידני של מנהל |
| `QUOTE_SENT` | `LOST` | ADMIN, OFFICE, מערכת | דחייה או פקיעת תוקף |
| `CONFIRMED` | `IN_PRODUCTION` | KITCHEN_MANAGER, מערכת | יום לפני האירוע ב-06:00 |
| `CONFIRMED` | `CANCELLED` | ADMIN | חובה `reason` |
| `IN_PRODUCTION` | `READY` | מערכת | כל משימות המטבח `PACKED` |
| `READY` | `OUT_FOR_DELIVERY` | DRIVER | `POST /deliveries/:id/start` |
| `OUT_FOR_DELIVERY` | `DELIVERED` | DRIVER | `POST /deliveries/:id/complete` |
| `DELIVERED` | `CLOSED` | מערכת | `balance = 0` |

השרת מחזיר בכל הזמנה את `allowedTransitions` — המעברים שהמשתמש הנוכחי רשאי לבצע עכשיו. **הפרונט לא משכפל את הלוגיקה הזו**, רק מציג כפתורים לפי הרשימה.

## 4. אובייקטים מרכזיים

### 4.1 Order (פרטי הזמנה)

```json
{
  "id": "clo45",
  "number": 1045,
  "status": "DRAFT",
  "version": 3,
  "customer": { "id": "clc12", "name": "משפחת כהן", "phone": "0501234567" },
  "event": {
    "id": "cle77",
    "title": "בר מצווה — יוסף",
    "type": "BAR_MITZVAH",
    "startsAt": "2026-10-09T15:00:00.000Z",
    "address": "אולם הגן, נתיבות",
    "lat": 31.42,
    "lng": 34.59,
    "guests": 120,
    "kashrut": "MEAT",
    "serviceType": "DELIVERY",
    "notes": "2 מנות ללא גלוטן"
  },
  "items": [
    {
      "id": "cli1",
      "dishId": "cld9",
      "dishName": "עוף בגריל",
      "category": "MAIN",
      "unit": "PORTION",
      "qty": 80,
      "unitPrice": 3200,
      "priceOverridden": false,
      "lineTotal": 256000,
      "notes": null
    }
  ],
  "services": [
    { "id": "cls1", "serviceId": "srv3", "name": "מלצר (לשעה)", "qty": 8, "unitPrice": 6000, "lineTotal": 48000 }
  ],
  "pricing": {
    "discountType": "PERCENT",
    "discountValue": 5,
    "vatPercent": 18,
    "pricesIncludeVat": false,
    "depositPercent": 30,
    "paymentTerms": "CREDIT_CARD",
    "validUntil": "2026-10-15"
  },
  "totals": {
    "subtotal": 304000,
    "discount": 15200,
    "vat": 51984,
    "total": 340784,
    "deposit": 102235,
    "paid": 0,
    "balance": 340784,
    "perGuest": 2840
  },
  "allowedTransitions": ["QUOTE_SENT"],
  "isLocked": false,
  "latestQuoteVersion": null,
  "createdAt": "2026-10-08T07:12:00.000Z",
  "updatedAt": "2026-10-08T07:30:00.000Z",
  "createdBy": { "id": "clu1", "name": "ידידיה" }
}
```

### 4.2 OrderListItem (שורה ברשימה)

```json
{
  "id": "clo45", "number": 1045, "status": "CONFIRMED",
  "customerName": "משפחת כהן", "eventStartsAt": "2026-10-09T15:00:00.000Z",
  "guests": 120, "total": 340784, "paid": 102235, "balance": 238549,
  "driverName": null, "createdByName": "ידידיה"
}
```

### 4.3 Customer

```json
{
  "id": "clc12", "version": 1, "name": "משפחת כהן", "type": "PRIVATE",
  "phone": "0501234567", "email": "cohen@example.com", "taxId": null,
  "billingAddress": null, "tags": ["VIP"], "notes": "",
  "contacts": [ { "id": "clk1", "name": "דוד כהן", "role": "אבא", "phone": "0527654321", "email": null } ],
  "stats": { "ordersCount": 4, "totalRevenue": 1820000, "openBalance": 0 },
  "createdAt": "2026-01-03T10:00:00.000Z"
}
```

### 4.4 Dish

```json
{
  "id": "cld9", "version": 2, "name": "עוף בגריל", "category": "MAIN", "kashrut": "MEAT",
  "unit": "PORTION", "portionsPerUnit": 1, "price": 3200, "imageUrl": null,
  "allergens": [], "active": true,
  "recipe": [ { "ingredientId": "cig4", "ingredientName": "שוק עוף", "unit": "KG", "qtyPerPortion": 0.25 } ],
  "cost": { "perPortion": 1180, "marginPercent": 63.1 }
}
```

## 5. נקודות קצה לפי מודול

בכל טבלה: עמודת "גישה" מפרטת תפקידים. `*` = כל משתמש מחובר.

### 5.1 לקוחות

| Method | Path | גישה | גוף / פרמטרים | תגובה |
|---|---|---|---|---|
| GET | `/customers` | ADMIN, OFFICE | `q, type, tag, page, pageSize, sort` | `Customer[]` (בלי contacts) |
| POST | `/customers` | ADMIN, OFFICE | `CustomerCreate` | `201 Customer` |
| GET | `/customers/:id` | ADMIN, OFFICE, KITCHEN_MANAGER | — | `Customer` |
| PATCH | `/customers/:id` | ADMIN, OFFICE | חלקי + `version` | `Customer` |
| DELETE | `/customers/:id` | ADMIN | — | `204` (מחיקה רכה; 409 אם יש הזמנות פתוחות) |
| GET | `/customers/:id/orders` | ADMIN, OFFICE | `page, pageSize` | `OrderListItem[]` |

`CustomerCreate`: `name` (חובה), `type` (חובה), `phone` (חובה, ישראלי, ייחודי), `email`, `taxId` (חובה אם `BUSINESS`), `billingAddress`, `tags`, `notes`, `contacts[]`.

### 5.2 הזמנות

| Method | Path | גישה | גוף / פרמטרים | תגובה |
|---|---|---|---|---|
| GET | `/orders` | ADMIN, OFFICE | `status, from, to, customerId, q, minTotal, maxTotal, hasBalance, page, pageSize, sort` | `OrderListItem[]` |
| POST | `/orders` | ADMIN, OFFICE | `{ customerId, event }` | `201 Order` (סטטוס `DRAFT`) |
| GET | `/orders/:id` | ADMIN, OFFICE, KITCHEN_MANAGER (צפייה) | — | `Order` |
| PATCH | `/orders/:id` | ADMIN, OFFICE | `{ version, event?, pricing? }` | `Order` |
| PUT | `/orders/:id/items` | ADMIN, OFFICE | `{ version, items: [{ dishId, qty, unitPrice?, notes? }], overrideReason? }` | `Order` |
| PUT | `/orders/:id/services` | ADMIN, OFFICE | `{ version, services: [{ serviceId, qty }] }` | `Order` |
| POST | `/orders/:id/transition` | לפי טבלה 3.1 | `{ to, reason? }` | `Order` |
| POST | `/orders/:id/duplicate` | ADMIN, OFFICE | `{ startsAt }` | `201 Order` |
| POST | `/orders/:id/quote/preview` | ADMIN, OFFICE | — | `{ pdfUrl }` (לא משנה סטטוס) |
| POST | `/orders/:id/quote/send` | ADMIN, OFFICE | `{ channels: ["WHATSAPP","SMS","EMAIL"], message? }` + `Idempotency-Key` | `{ order, quoteVersion, publicUrl }` |
| GET | `/orders/:id/quotes` | ADMIN, OFFICE | — | `QuoteVersion[]` |
| GET | `/orders/:id/history` | ADMIN, OFFICE | — | `AuditEntry[]` |
| GET | `/orders/:id/files` | ADMIN, OFFICE | — | `File[]` |
| POST | `/orders/:id/files` | ADMIN, OFFICE | multipart `file` | `201 File` |

הערות לנתיבי הזמנות:

- `PUT /items` מחליף את **כל** רשימת המנות. הפרונט שולח את הרשימה המלאה אחרי כל שינוי (debounce של 500ms), ומקבל `Order` עם `totals` מעודכן.
- `unitPrice` נשלח רק אם המשתמש שינה מחיר ידנית. אחרת השרת לוקח את מחיר המנה הנוכחי.
- מנה בכשרות לא מתאימה → `422 KASHRUT_CONFLICT` עם `details.fields["items.<index>.dishId"]`.
- בסטטוס `IN_PRODUCTION` ומעלה → `409 ORDER_LOCKED`, אלא אם `ADMIN` שולח `overrideReason`.
- `GET /orders?view=calendar&from=&to=` מחזיר מבנה מקוצר ליומן: `{ id, number, status, customerName, startsAt, guests, kashrut }[]` בלי עימוד (מקסימום 62 ימים).

### 5.3 פורטל לקוח (ציבורי, בלי JWT)

| Method | Path | גוף | תגובה |
|---|---|---|---|
| GET | `/public/quotes/:token` | — | `PublicQuote` |
| POST | `/public/quotes/:token/approve` | `{ signerName, signaturePng (base64) }` | `{ paymentUrl }` — דף סליקה למקדמה |
| POST | `/public/quotes/:token/request-change` | `{ message }` | `204` |
| GET | `/public/quotes/:token/pdf` | — | קובץ PDF |

`PublicQuote` הוא תת-קבוצה של `Order`: פרטי עסק (שם, לוגו, טלפון), `event`, `items` (שם, כמות, מחיר, סה"כ), `services`, `totals`, `validUntil`, `status`, `terms`. **לא כולל**: `createdBy`, היסטוריה, הערות פנימיות, עלויות.

טוקן לא קיים או שפג → `404 NOT_FOUND` (לא מבדילים בין המקרים). הגבלת קצב: 30 בקשות לדקה ל-IP.

### 5.4 תפריטים ומנות

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/dishes` | * | `q, category, kashrut, active` · ל-KITCHEN_STAFF בלי `price` ו-`cost` |
| POST | `/dishes` | ADMIN, KITCHEN_MANAGER | `201 Dish` |
| GET / PATCH / DELETE | `/dishes/:id` | ADMIN, KITCHEN_MANAGER | PATCH עם `version` |
| PUT | `/dishes/:id/recipe` | ADMIN, KITCHEN_MANAGER | `{ version, lines: [{ ingredientId, qtyPerPortion }] }` |
| POST | `/dishes/:id/image` | ADMIN, KITCHEN_MANAGER | multipart, JPG/PNG עד 5MB → `{ imageUrl }` |
| GET / POST | `/menus` | ADMIN, OFFICE (צפייה), KITCHEN_MANAGER | |
| GET / PATCH / DELETE | `/menus/:id` | ADMIN, KITCHEN_MANAGER | |
| GET | `/menus/:id/expand?guests=120` | ADMIN, OFFICE | מחזיר `items` מוכנים להזמנה עם כמויות מחושבות |
| GET / POST / PATCH | `/services` | ADMIN | שירותים נוספים (מלצרים, ציוד, משלוח) |

### 5.5 מלאי, ספקים ורכש

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/ingredients` | ADMIN, KITCHEN_MANAGER | `q, category, belowMin` |
| POST / PATCH | `/ingredients`, `/ingredients/:id` | ADMIN, KITCHEN_MANAGER | |
| GET | `/inventory/forecast?days=7` | ADMIN, KITCHEN_MANAGER | ראה דוגמה |
| GET | `/inventory/moves` | ADMIN, KITCHEN_MANAGER | `ingredientId, type, from, to` |
| POST | `/inventory/moves` | ADMIN, KITCHEN_MANAGER | `{ ingredientId, type, qty, reason }` |
| GET / POST | `/suppliers` | ADMIN, KITCHEN_MANAGER | |
| GET / PATCH | `/suppliers/:id` | ADMIN, KITCHEN_MANAGER | |
| GET / POST | `/purchase-orders` | ADMIN, KITCHEN_MANAGER | `status, supplierId` |
| POST | `/purchase-orders/from-shortages` | ADMIN, KITCHEN_MANAGER | `{ days }` → `201 PurchaseOrder[]` (טיוטות, אחת לכל ספק) |
| PATCH | `/purchase-orders/:id` | ADMIN, KITCHEN_MANAGER | |
| POST | `/purchase-orders/:id/send` | ADMIN, KITCHEN_MANAGER | `{ channel }` |
| POST | `/purchase-orders/:id/receive` | ADMIN, KITCHEN_MANAGER | `{ lines: [{ lineId, receivedQty, price }] }` → מעדכן מלאי |

```json
// GET /inventory/forecast?days=7 → 200
{
  "data": [
    {
      "ingredientId": "cig4", "name": "שוק עוף", "unit": "KG",
      "stock": 12, "minStock": 5, "required": 38.5, "incoming": 10,
      "shortage": 21.5, "supplier": { "id": "csu2", "name": "עוף טוב" }
    }
  ],
  "meta": { "from": "2026-10-08", "to": "2026-10-14" }
}
```

כמויות מלאי הן מספרים עשרוניים ביחידה של חומר הגלם (ק"ג, ליטר, יחידה), עד 3 ספרות אחרי הנקודה.

### 5.6 מטבח

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/kitchen/tasks?date=2026-10-09` | KITCHEN_MANAGER, KITCHEN_STAFF, ADMIN | ל-STAFF: רק משימות שלו או לא משובצות |
| PATCH | `/kitchen/tasks/:id` | KITCHEN_MANAGER (הכל), KITCHEN_STAFF (רק `status`) | `{ status?, assigneeId? }` |
| GET | `/kitchen/production-sheet?date=` | KITCHEN_MANAGER, ADMIN | `{ pdfUrl }` |
| GET | `/kitchen/updates?date=&since=` | כמו tasks | משימות שהשתנו מאז `since` — לרענון כל 15 שניות |

```json
// GET /kitchen/tasks?date=2026-10-09 → 200
{
  "data": [
    {
      "id": "ckt1", "date": "2026-10-09", "status": "TODO",
      "dish": { "id": "cld9", "name": "עוף בגריל", "kashrut": "MEAT" },
      "qty": 80, "unit": "PORTION",
      "earliestDepartureAt": "2026-10-09T13:30:00.000Z",
      "assignee": null,
      "orders": [ { "id": "clo45", "number": 1045, "customerName": "משפחת כהן", "qty": 80 } ],
      "updatedAt": "2026-10-08T06:00:00.000Z"
    }
  ]
}
```

### 5.7 משלוחים ונהגים

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/deliveries?date=` | ADMIN, OFFICE | כל משלוחי היום |
| PATCH | `/deliveries/:id` | ADMIN, OFFICE | `{ driverId, sequence, plannedDepartureAt }` |
| GET | `/driver/deliveries/today` | DRIVER | רק המשלוחים שלו, לפי `sequence` |
| POST | `/deliveries/:id/start` | DRIVER | → `OUT_FOR_DELIVERY`, שולח SMS ללקוח |
| POST | `/deliveries/:id/complete` | DRIVER | multipart: `receiverName`, `signature` (PNG), `photo?`, `notes?`, `lat`, `lng`, `checkedBoxes` (JSON), `clientCompletedAt` |

`complete` הוא אידמפוטנטי לפי `deliveryId`: אם נשלח פעמיים (למשל אחרי חזרת קליטה) — מחזיר `200` עם אותו מצב. `clientCompletedAt` הוא הזמן שבו הנהג לחץ, גם אם הבקשה נשלחה מאוחר יותר.

### 5.8 תשלומים וחשבוניות

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/payments` | ADMIN, OFFICE | `orderId, status, method, from, to` |
| POST | `/payments` | ADMIN, OFFICE | `{ orderId, amount, method, reference? }` + `Idempotency-Key` → מפיק קבלה |
| POST | `/payments/link` | ADMIN, OFFICE | `{ orderId, amount }` → `{ paymentUrl, expiresAt }` |
| GET | `/payments/open-balances` | ADMIN, OFFICE | הזמנות `DELIVERED` עם יתרה, כולל `daysOverdue` |
| POST | `/payments/:id/refund` | ADMIN | `{ amount, reason }` |
| GET | `/invoices?orderId=` | ADMIN, OFFICE | |
| POST | `/webhooks/payment` | ספק סליקה | שימוש פנימי של הבקאנד; אימות חתימה. **לא נקרא מהפרונט** |

### 5.9 לוח בקרה ודוחות

| Method | Path | גישה | תגובה |
|---|---|---|---|
| GET | `/dashboard` | ADMIN, OFFICE | ראה דוגמה; ל-OFFICE בלי `revenue` |
| GET | `/reports/revenue?from=&to=&groupBy=month` | ADMIN | `[{ period, revenue, ordersCount, prevYearRevenue }]` |
| GET | `/reports/profitability?from=&to=` | ADMIN | `[{ orderId, number, customerName, revenue, ingredientCost, grossProfit, marginPercent }]` |
| GET | `/reports/top-dishes?from=&to=` | ADMIN | `[{ dishId, name, qty, revenue, profit }]` |
| GET | `/reports/conversion?from=&to=` | ADMIN | `{ quotesSent, quotesApproved, rate }` |
| GET | `/reports/:type/export?format=xlsx` | ADMIN | קובץ |

```json
// GET /dashboard → 200
{
  "data": {
    "kpis": { "eventsThisWeek": 12, "pendingQuotes": 5, "revenueThisMonth": 18450000, "openBalances": 3720000 },
    "upcoming": [ { "orderId": "clo45", "number": 1045, "startsAt": "2026-10-09T15:00:00.000Z", "customerName": "משפחת כהן", "guests": 120, "status": "IN_PRODUCTION", "paymentState": "DEPOSIT" } ],
    "alerts": [ { "type": "LOW_STOCK", "message": "מלאי נמוך: אורז (3 ק\"ג)", "link": "/inventory?ingredientId=cig7" } ],
    "revenueChart": [ { "month": "2026-05", "revenue": 15200000 } ]
  }
}
```

סוגי `alerts.type`: `LOW_STOCK`, `QUOTE_EXPIRING`, `NO_DRIVER`, `PAYMENT_RECEIVED`, `CHANGE_REQUESTED`. השדה `link` הוא נתיב פנימי בפרונט.

### 5.10 הגדרות ומשתמשים

| Method | Path | גישה | הערות |
|---|---|---|---|
| GET | `/settings` | * | ל-ADMIN הכל; לאחרים רק `business` ו-`defaults` |
| PATCH | `/settings` | ADMIN | |
| GET / POST | `/users` | ADMIN | |
| PATCH | `/users/:id` | ADMIN | `{ role?, active?, name?, phone? }` |
| POST | `/users/:id/reset-password` | ADMIN | שולח קישור במייל |
| GET / PUT | `/settings/blocked-dates` | GET: *, PUT: ADMIN | `[{ date, reason }]` |
| GET / PUT | `/settings/message-templates` | ADMIN | משתנים מותרים: `{{customerName}}`, `{{orderNumber}}`, `{{eventDate}}`, `{{link}}`, `{{amount}}` |

### 5.11 קבצים

העלאות עוברות דרך השרת (multipart), והשרת מחזיר URL ציבורי חתום (Cloudinary / S3). מגבלות: תמונות JPG/PNG/WEBP עד 5MB, PDF עד 10MB. סוג לא מותר → `400 VALIDATION_ERROR`.

## 6. אירועים בזמן אמת

בגרסה 1 **אין WebSocket**. מסכי המטבח והמשלוחים מתרעננים ב-polling (15 שניות) דרך נתיבי `updates`. לוח הבקרה — 60 שניות. כשנעבור ל-SSE / WebSocket זה ייכנס כגרסת חוזה חדשה.

## 7. ניהול גרסאות של החוזה

- שינוי **מוסיף** (שדה חדש בתגובה, endpoint חדש, פרמטר אופציונלי) — מותר בכל PR חוזה, מעלה minor: v1.0 → v1.1.
- שינוי **שובר** (מחיקה או שינוי שם של שדה, שינוי סוג, שדה אופציונלי שהופך לחובה) — דורש תיאום בין שני המפתחים, ותקופת מעבר שבה שני הפורמטים נתמכים.
- כל שינוי נרשם ב-`docs/API_CHANGELOG.md` עם תאריך, גרסה ומה השתנה.
