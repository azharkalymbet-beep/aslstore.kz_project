# ASLSTORE.KZ — Online Store Website (Midterm, Web Technologies)

Website of **ASLSTORE.KZ**, a unisex streetwear boutique in Astana (Gulzhan Shopping Center, 2nd floor, boutique 246).
Technologies: HTML5, CSS3, Bootstrap 5.3.3, JavaScript (`js/main.js`).

**Team:** Azhar, Akdana, Karakat · **Group:** _fill in_
**Submission tag:** `midterm`

## Main goal of the website

A visitor chooses a product, adds it to the cart, signs in and **places an order with payment**. The order is saved in the visitor's account.

## Pages

| File | Page | Contents |
|---|---|---|
| `index.html` | Home | Categories, popular products, boutique address and opening hours |
| `clothing.html` | Clothing | Search, sections, size selection, size chart, "Add to cart" |
| `shoesandacc.html` | Shoes & Accessories | Sneakers (size selection), caps, bags, jewelry |
| `sale.html` | Sale | Sale terms with dates, discounted products |
| `order.html` | Cart & Checkout | Cart (+ / − / remove), total with delivery, checkout form, payment step, order confirmation, account (sign in, sign up, my orders) |
| `colophon.html` | About | About the store, address and hours, delivery and payment, question form |

The number of pages is the same as at the start of the project — 6. Sign-in, account and order confirmation are sections of `order.html` (`#account`, `#order-success`), not separate files.

## Three visitor paths

1. **Buy a hoodie (main path).**
   1. Clothing → choose size M → "В корзину" (Add to cart). The button turns into a counter "− 1 pcs · M · 22 000 ₸ +", the header shows "Cart 1".
   2. Press "+" on the card — 2 pcs, the sum on the card is recalculated (44 000 ₸).
   3. Cart: the site asks to sign in → "Sign in or register ↓" → registration on the same page.
   4. The page scrolls back to the cart; name and phone are already filled in.
   5. Enter the address → "Перейти к оплате" (Go to payment).
   6. Choose Kaspi.kz → "Pay 44 000 ₸" → "Invoice sent to Kaspi" → "I have paid".
   7. On the same page: "Order ASL-…… placed!" with items, total and the "Paid" mark. The order appears in "My orders".
2. **Come back a month later.** Open the site: the name is already in the header, the cart is still there → "My orders" shows previous orders → for a new order the address is filled in automatically.
3. **Find the address and hours / ask a question.** Footer of any page (address, hours, phone) → "Ask a question" → `colophon.html#feedback` → "Send" → the message "Thank you! Your question has been sent" appears right under the form.

## How JavaScript works (`js/main.js`)

The website has no server, so data is stored in the browser's **localStorage**:

| Key | What it stores |
|---|---|
| `asl_cart` | cart: id, name, price, size, image, quantity |
| `asl_users` | accounts: name, phone, email, password hash, orders, last address |
| `asl_session` | email of the signed-in user (stays signed in until "Log out") |

- **Add to cart:** takes `data-product-id`, `data-name`, `data-price` from the card and the selected size. After adding, the button is replaced by a "− N pcs +" counter with the sum, so the visitor sees how many are already in the cart. A different size is a separate cart line. Maximum 10 pcs of one product.
- **Cart:** calculates the subtotal, delivery (1 500 ₸, free from 30 000 ₸ or for pickup) and the total. Without signing in, the checkout button is disabled.
- **Registration:** checks name, phone (11 digits), email, password ≥ 6 characters and that both passwords match; a second account with the same email is not allowed. The password is stored as a hash, not as plain text.
- **"Back" button** on every page except Home: returns to the previous page of the site, or to Home if there is none.
- **Checkout in 4 steps** (step bar at the top of `order.html`): 1 Cart → 2 Details & delivery → 3 Payment → 4 Done.
  - "Go to payment" validates the fields and highlights errors (Bootstrap `is-invalid` / `invalid-feedback`), but **does not create the order yet**.
  - Payment step: Kaspi.kz, Halyk Bank, Freedom Bank, Apple Pay, bank card or cash on delivery. The button shows the amount: "Pay 42 000 ₸".
  - After choosing, a confirmation screen opens (e.g. "Invoice sent to Kaspi.kz to number …"). The visitor can "Cancel" and choose another method.
  - Only after the payment is confirmed (or "cash" is chosen) the order is saved to the account with the status "Paid" / "Pay on delivery", the cart is cleared and "Order ASL-… placed!" is shown.
  - The site never asks for card details: in a real store they are entered on the bank's page. The banks are simulated here — no real money is charged; that would require a contract with a bank and a server.
- **Calculation example:** hoodie 22 000 ₸ × 1 + T-shirt 10 000 ₸ × 2 = 42 000 ₸; this is more than 30 000 ₸, so delivery is free, total 42 000 ₸.
- **Search** on the Clothing page hides cards that do not match and shows "Nothing found".

**Limitation (honestly):** localStorage lives in one browser on one device. A real store would keep accounts and orders on a server in a database — this is the next step after the midterm.

## Styles: Bootstrap + minimal own CSS

The site was first built with plain HTML, then CSS was added, then everything possible was replaced with Bootstrap. So the layout and design are made with **Bootstrap classes** directly in HTML (`d-flex`, `gap-3`, `p-4`, `rounded-3`, `border`, `shadow-sm`, `breadcrumb`, `form-control`, `is-invalid` / `invalid-feedback`, `d-none`, etc.), and our own CSS contains only what Bootstrap does not have:

| File | Contents | Lines |
|---|---|---|
| `css/base.css` | purple brand color: `text-purple`, `bg-purple`, buttons `btn-purple`, `btn-outline-purple`, active menu item | ~37 |
| `css/azhar.css` | product card: border and lift on hover, image height | ~14 |
| `css/akdana.css` | sticky order summary, checkout step bar, selected payment method, bank logo size | ~33 |

## Payment method logos

Each payment method has a place for a logo. While there is no image file, a letter on the bank's color is shown (K, H, F, A, V, ₸). To use real logos, put square PNG files (80×80 recommended) here:

```
imagess/pay/kaspi.png
imagess/pay/halyk.png
imagess/pay/freedom.png
imagess/pay/applepay.png
imagess/pay/card.png
imagess/pay/cash.png
```

Take the logos from the banks' official websites (partner / media kit section).

## Issues found and fixed

1. `order.html`: two unclosed `<div>` tags. Fixed.
2. Form fields had no `name`, so the form sent nothing. Fixed.
3. Placing an order led to the home page with no message. Now a confirmation with the order number is shown.
4. The total "12 500 ₸" was hard-coded. Now it is calculated from the cart.
5. "Add to cart" only opened the order page. Now the product is saved in the cart.
6. "Sign up / Sign in" led nowhere. Now there is sign-in, registration and "My orders" (`order.html#account`).
7. The anchor `clothing.html#outerwear` did not exist. Footer links now point to existing sections.
8. "Delivery and payment" led to a page without that information. Added the section `colophon.html#delivery`.
9. Opening hours were missing everywhere. Added.
10. The "About" page described the university course, not the store. Rewritten.
11. The sale table had no dates. Dates added.
12. Four identical "Pandora charm" cards with the same `alt`. Numbered.
13. The Shoes page had no sections. Sections added: sneakers, caps, bags, jewelry.
14. There was no size selection. Added a `select` and a size chart.
15. There was no search and no question form. Added.
16. The header was built from `div`s. Now it uses `<header>` + `<nav>`.
17. `<h1>` was only on the home page. Now every page has one.
18. Browser tab titles had different formats. One template now.
19. The menu button had no `aria-label`. Added.
20. The CSS had many rules duplicating Bootstrap, and `base.css` and `akdana.css` were not linked. Now all three files are linked and contain only what Bootstrap does not provide.
21. There was no way to go back from catalog pages. Added a Bootstrap breadcrumb ("Home / Sale") and a "← Back" button.

## Screenshots

Take them in the browser (F12 → Ctrl+Shift+M, width 375px) and put them in `screenshots/`:

| Page | Phone | Desktop |
|---|---|---|
| Home | `screenshots/index-phone.png` | `screenshots/index-desktop.png` |
| Clothing | `screenshots/clothing-phone.png` | `screenshots/clothing-desktop.png` |
| Shoes & Accessories | `screenshots/shoes-phone.png` | `screenshots/shoes-desktop.png` |
| Sale | `screenshots/sale-phone.png` | `screenshots/sale-desktop.png` |
| Cart & Checkout | `screenshots/order-phone.png` | `screenshots/order-desktop.png` |
| About | `screenshots/about-phone.png` | `screenshots/about-desktop.png` |

## AI log

This is the AI version of the project (the second version, for comparison with the version made without AI).

- **Tool:** Claude (Anthropic), October 9, 2026.
- **What AI did:** rewrote the 6 pages (no new pages), added `js/main.js` (cart, registration, checkout and payment step), reduced CSS to three small files (the rest is Bootstrap), added the "Back" button, removed emoji for a minimalist look, wrote this README.
- **What was not changed:** clothing image paths on `clothing.html`.
- **What AI made up and we must verify:** hours "Daily 10:00–20:00", courier 1 500 ₸ and 1–2 days, sale dates, 14-day returns, size chart, jeans sizes 28–34.
- **Checked:** all links and anchors exist, every form field has a `label`, no duplicate `id`s, all tags are closed, every `id` used by JavaScript exists on the pages. Run the W3C Validator manually: https://validator.w3.org/#validate_by_upload