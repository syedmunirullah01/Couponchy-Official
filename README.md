# Couponchy

Couponchy ek `Next.js` based coupons and deals platform hai. Product direction `SimplyCodes` jaisi clean coupon discovery UX se inspired hai, lekin visual theme aur brand language Couponchy ki apni hai.

Reference: `https://simplycodes.com/`

## Product Summary

- store-first coupon and deal discovery
- dedicated single-store savings pages
- verified / trust-oriented catalog positioning
- manual + future affiliate/network offer ingestion
- admin-managed coupon, deal, store, aur user workflows

## Core Rule

- **CRITICAL COLOR RULE**: Har jagah `app/globals.css` ke variables hi use karne hain, jaise `var(--color-primary)`, `var(--page-bg)`, `var(--text)`, `var(--surface)`, `var(--border)`.
- hardcoded hex colors aur default Tailwind palette colors avoid karne hain jab tak explicit reason na ho

## Current Status

Repository mein abhi yeh working state available hai:

- homepage, store directory, aur single-store page built hain
- admin dashboard shell built hai
- stores CRUD available hai
- bulk store import available hai
- coupons/deals CRUD available hai
- bulk CSV offer import available hai
- admin users and permissions flow available hai
- store logo upload Cloudinary ke through hota hai
- auth/settings MongoDB-backed flow use karte hain
- stores/offers catalog JSON files mein persist hota hai
- public pages same shared data source se render hoti hain
- demo seed catalog remove kiya ja chuka hai

## Routes

### Public

- `app/(public)/page.js` - homepage
- `app/(public)/stores/page.js` - store directory
- `app/(public)/stores/[category]/[store]/page.js` - single store page

### Admin

- `app/admin/layout.js` - admin shell
- `app/admin/page.js` - dashboard overview
- `app/admin/stores/page.js` - stores management
- `app/admin/offers/page.js` - coupons and deals management
- `app/admin/categories/page.js` - placeholder
- `app/admin/settings/page.js` - settings / users / access

### API

- `app/api/stores/route.js` - stores GET/POST
- `app/api/stores/[slug]/route.js` - store GET/PUT/DELETE
- `app/api/stores/bulk/route.js` - bulk store import
- `app/api/offers/route.js` - offers GET/POST
- `app/api/offers/[id]/route.js` - offer GET/PUT/DELETE
- `app/api/offers/bulk/route.js` - bulk CSV import
- `app/api/uploads/store-logo/route.js` - Cloudinary image upload
- `app/api/users/route.js` - users GET/POST
- `app/api/users/[id]/route.js` - user update/delete
- `app/api/auth/[...nextauth]/route.js` - auth
- `app/api/settings/route.js` - settings status/bootstrap
- `app/api/setup/route.js` - initial setup flow

## Important Folders

- `app/` - App Router
- `data/database/` - JSON mock database
- `src/components/ui/` - reusable UI primitives
- `src/components/layout/` - navbar/footer
- `src/features/home/` - homepage sections
- `src/features/stores/` - directory + store detail features
- `src/features/admin/` - dashboard UI
- `src/server/repositories/` - file-based repository layer
- `src/server/services/` - catalog shaping for frontend
- `src/server/database/` - low-level JSON helpers
- `src/server/cloudinary.js` - Cloudinary helper
- `src/server/auth.js` - auth/session permission helpers

## Admin Capabilities

### Stores

- create, edit, delete stores
- bulk import stores via CSV
- auto slug generation
- searchable category selection
- Cloudinary logo upload with preview
- inline validation via `react-hook-form` + `zod`

### Bulk Store Import

Store import flow `AdminStoresManager` se trigger hota hai aur yeh support karta hai:

- CSV template download
- drag and drop CSV upload
- client-side dry-run validation
- missing name / illegal slug validation
- missing slug par auto generation
- duplicate slug skip handling
- summary report with refresh action
- default `offersCount`, `isFeatured`, aur timestamps server-side

### Coupons And Deals

- create, edit, delete offers
- store-linked coupon/deal records
- bulk CSV import from offers dashboard

### Bulk CSV Import

Import flow `AdminOffersManager` se trigger hota hai aur yeh support karta hai:

- CSV template download
- drag and drop CSV upload
- `papaparse` client-side parsing
- required field validation
- invalid date validation
- duplicate detection inside same CSV
- backend duplicate detection for `code + storeSlug`
- missing store slug detection
- summary report with success / duplicate / error counts
- affected stores ke `offersCount` ka sync

CSV template headers:

- `storeSlug`
- `title`
- `description`
- `type`
- `code`
- `expiryDate`
- `status`
- `source`

### Users And Access

- admin user creation
- password set/reset
- role-based access
- page-level permission filtering

Supported role direction:

- `admin` - full access
- `editor` - catalog/content sections
- `social-media` - selected marketing-relevant sections

## Data Architecture

Abhi real relational DB nahi hai for catalog. Current architecture:

- `data/database/stores.json` and `data/database/offers.json` source of truth hain
- repositories read/write abstraction handle karte hain
- API routes CRUD aur bulk mutations expose karte hain
- store aur offer dono ke liye bulk CSV import routes available hain
- public pages shared `catalog-service` use karti hain
- imported ya manually added offers homepage aur store pages par naturally reflect karte hain

MongoDB ka use currently auth/settings side ke liye ho raha hai, catalog ke liye nahi.

## Frontend Coverage

### Homepage

- animated hero slider
- activity marquee
- trending stores
- featured coupons
- latest stores
- empty states for blank catalog

### Store Pages

- store intro and trust messaging
- coupon/deal tabs
- offer cards
- FAQs
- related stores

## UI System

Project mein official `shadcn/ui` install nahi hai. Instead local reusable primitives use ho rahe hain:

- `Button`
- `Input`
- `Dialog`
- `Card`
- `Table`
- `Badge`
- `Toaster`

Notes:

- components `globals.css` theme variables follow karte hain
- shared `Button` links aur buttons dono ke liye use ho sakta hai
- visual language ko centralize kiya gaya hai taake dashboard aur public UI consistent rahein

## Tech Stack

- `Next.js 16`
- `React 19`
- `Tailwind CSS 4`
- `react-hook-form`
- `zod`
- `papaparse`
- `next-auth`
- `mongoose`
- `cloudinary`
- `clsx`
- `tailwind-merge`
- `sonner`

## Development

Install:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Short Description

`Couponchy is a Next.js-based coupons and deals platform focused on store-first discovery, verified savings, admin-managed catalog workflows, and future affiliate-network integrations, while preserving its own visual theme instead of cloning SimplyCodes directly.`

## Notes For Future Chats

- name: `Couponchy`
- stack: `Next.js 16`, `React 19`, `Tailwind CSS 4`
- catalog storage: JSON files
- auth/settings storage: MongoDB
- uploads: Cloudinary
- core entities: `stores`, `coupons`, `deals`, `users`
- inspiration: `SimplyCodes` product structure, not exact visual clone
