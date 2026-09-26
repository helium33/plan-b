# PLAN B VISION WHOLESALE APP UPDATES

## 1. UI/UX & Branding
- Primary Theme: Deep Teal/Slate Blue (#557C89) matched with Plan B Logo. Clean, white background for products.
- Layout: 
  - Desktop: Fixed Left Sidebar for Navigation & Filters.
  - Mobile: Top Navbar with Hamburger menu for filters.
- Components:
  - Splash Screen: Animated bounce effect on app load.
  - Floating Cart Drawer: A floating action button (FAB) that opens a right-side sliding drawer to view selected items.

## 2. Business Logic & Access Control
- Strict Auth Rule: Users MUST be logged in to add items to the cart. If logged out, display "Sign In to Shop" on product cards.
- Voucher/Pricing: All automated wholesale discounts (volume, color assortments) are REMOVED. Pure Subtotal calculation only. User will handle custom pricing manually.
- Direct Checkout: Order confirmation automatically formats the cart into a readable text block and opens tg:// (Telegram) or viber:// (Viber) links to send directly to the admin.

## 3. Product Catalog
- Include specific sections for "New Arrivals" and "Best Sellers".
- Product detail view should mirror a clean layout: Main image on the left, variations (Colors, Sizes) on the right, and clearly indicate Case/Accessories inclusion.


# UI/UX UPDATE: Ultra-Simple Single Column Layout

## 1. Single Column Product View
- The main product feed must display ONE product per row (Single Column Layout) to ensure maximum size and clarity, especially on mobile devices.
- The image displayed should be a detailed "Collage" image (showing various angles or color options of the same model).
- Remove all extra clutter (prices, small details) from the main feed.

## 2. Minimalist Action
- Underneath the large collage image, provide only ONE clear, bold button: "ဝယ်ယူရန်" (Buy Now).

## 3. Detail & Purchase Flow
- When the user clicks "ဝယ်ယူရန်", open a full-screen or large modal.
- This modal will show the large image again, along with the specific details (Size, Material, Colors) and the exact steps to finalize the purchase.
- The flow must be "Dead Simple": See Image -> Click Buy -> Choose Color -> Checkout.