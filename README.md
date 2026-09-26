
  # Eyewear Website Template Design

  This is a code bundle for Eyewear Website Template Design. The original project is available at https://www.figma.com/design/Ywbq5HbdPy4URUsWVBL1JA/Eyewear-Website-Template-Design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Customer & sales-rep accounts (shared with the POS)

  This app and the POS (helium33/visionary) use **one Firestore database**. A shop
  signed in here orders on credit straight into the POS: the order becomes an
  ordinary POS voucher (`channel: 'WEB'`), stock comes off `LOC-MAIN`, and the
  shop's balance goes up — in one atomic batch (`src/lib/pos/handle-purchase.ts`).
  Defective returns go the other way (`src/lib/pos/process-return.ts`).

  To switch it on:

  1. **Point both apps at the same Firebase project** (`VITE_FIREBASE_*` in each
     `.env.local`, and `.firebaserc` in each repo).
  2. **Deploy the shared rules once** — `firebase deploy --only firestore:rules`
     from either repo. `firestore.rules` is identical in both and covers both
     apps; keep it that way (a deploy from either repo replaces the whole ruleset).
     Deploy indexes from the POS repo.
  3. **Create accounts in the POS repo** with `npm run set-role`:
     - `npm run set-role -- owner@example.com ADMIN "Owner"` — everything
     - `npm run set-role -- rep@example.com SALES "Ko Zin"` — their assigned shops
     - `npm run set-role -- shop@example.com SHOP <shopId>` — one shop's own account
  4. **Link the catalogue to POS stock**: sign in here with the ADMIN account,
     open Admin → Frames, and press **Link now**. Frames are matched to POS
     products by model number; the page lists any it could not match.

  Roles in this app (`src/lib/rbac.ts`): a **shop** sees the catalogue, its own
  credit dashboard (`/credit`) and its own orders; a **sales rep** also chooses
  among their assigned shops and processes returns; an **admin** sees everything.
  Costs never reach a shop's device — the rules keep POS `products` staff-only.
