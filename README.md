# HS Furniture — Backend API

Node.js + Express + TypeScript + MongoDB backend for the HS Furniture e-commerce website.

Covers all 5 user flows from your flowchart:
- **Order Placement** — Categories → Product → Cart → Checkout → Payment → Confirmation
- **Assembly Guide Finding** — lookup by product code/title → video/PDF manual
- **Order Tracking** — with login (My Orders) and without login (Tracking ID)
- **Login / Create Account** — register, login, email verification, password reset
- **Customer Support** — contact form (feeds WhatsApp/email/call channels)

## 1. Setup

```bash
cd hs-furniture-backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — local MongoDB or a MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `BANK_*` — your real bank account details (used for the Bank Transfer payment method)
- `FIREBASE_*` — needed for image uploads (admin product photos, payment-proof screenshots, custom-order reference images). See **FIREBASE_SETUP_GUIDE.md** for full step-by-step setup.
- `JAZZCASH_*` / `EASYPAISA_*` — leave blank for now; the API will run fine without them and clearly tell the frontend "not configured yet." Fill them in once your merchant account is approved — no code changes needed.

## 2. Run

```bash
npm run dev      # development (auto-restarts on file changes)
npm run build    # compile TypeScript -> dist/
npm start         # run compiled build
```

API will be live at `http://localhost:5000/api` — check `http://localhost:5000/api/health` first.

## 3. (Optional) Seed starter categories

Pre-loads the 10 categories from your business guide (Living Room, Bedroom, Iron Furniture, Handicrafts, etc.):

```bash
npx ts-node src/utils/seed.ts
```

## 4. Create your first admin user

There's no public "make me admin" endpoint (for security). After registering normally through `/api/auth/register`, open MongoDB (Compass or `mongosh`) and manually set that user's `role` field to `"admin"`. All admin-only routes will then work with that account's token.

## 5. Folder structure

```
src/
  config/      MongoDB connection, Firebase Admin SDK init
  models/      Mongoose schemas (User, Category, Product, Cart, Order, Review, CustomOrderRequest, ContactMessage)
  middleware/  auth (JWT), error handling, async wrapper
  controllers/ business logic per module
  routes/      Express routers per module
  utils/       JWT helper, email helper, seed script
  app.ts       Express app (middleware + route mounting)
  server.ts    entry point (loads env, connects DB, starts server)
```

## 6. Payment methods — current status

| Method | Status |
|---|---|
| Cash on Delivery | ✅ Fully working |
| Bank Transfer | ✅ Fully working (customer uploads proof → admin verifies) |
| JazzCash | 🟡 Code ready, waiting on your merchant credentials (sandbox-safe) |
| Easypaisa | 🟡 Code ready, waiting on your merchant credentials (sandbox-safe) |

See `src/controllers/payment.controller.ts` — the `TODO` comments mark exactly where to drop in the real JazzCash/Easypaisa hashing + redirect logic once you have live keys.

## 7. Image uploads (Firebase Storage)

`POST /api/upload` (requires login) accepts up to 10 files under the field name `images`, plus an optional `folder` text field (`products`, `payment-proofs`, `custom-orders`, `assembly-guides`). Files are uploaded straight to Firebase Storage and the response returns public URLs — those URLs are what you save into MongoDB (`Product.images`, `Order.paymentProofUrl`, `CustomOrderRequest.referenceImages`, etc.).

See **FIREBASE_SETUP_GUIDE.md** for getting your Firebase credentials.

## 8. Next steps

- Build the React + TypeScript frontend against this API
- Fill in JazzCash/Easypaisa credentials once merchant approval comes through
