# ASLSTORE.KZ — Online Store Website (Midterm, Web Technologies)

Website of **ASLSTORE.KZ**, a unisex streetwear boutique in Astana (Gulzhan Shopping Center, 2nd floor, boutique 246).
Technologies: HTML5, CSS3, Bootstrap 5.3.3 (CSS only). **No JavaScript** — the markup is prepared for JavaScript in the next assignment (see below).

**Team:** Azhar, Akdana, Karakat · **Group:** _fill in_
**Submission tag:** `midterm`

## Main goal of the website

A visitor chooses products, fills in the order form, chooses a payment method and **places the order**. The order ends with the confirmation "Заказ принят".

## Pages

| File | Page | Contents |
|---|---|---|
| `index.html` | Home | Categories, popular products, boutique address and opening hours |
| `clothing.html` | Clothing | Sections, size chart, "Заказать" (Order) buttons |
| `shoesandacc.html` | Shoes & Accessories | Sneakers, caps, bags, jewelry |
| `sale.html` | Sale | Sale terms with dates, discounted products |
| `order.html` | Order | Order form in 3 steps (products → contacts and delivery → payment method), order confirmation |
| `colophon.html` | About | About the store, address and hours, delivery and payment, question form |

The number of pages is the same as at the start of the project — 6. The order confirmation is a section of `order.html` (`#order-done`), not a separate file.

## Three visitor paths

1. **Order a hoodie (main path).**
   Home → "Смотреть одежду" → Clothing → section "Худи" → "Заказать" → `order.html` → step 1: choose the hoodie, size M, quantity 2 (more products under "Добавить ещё товары") → step 2: name, phone, courier or pickup, address → step 3: choose Kaspi.kz → tick the agreement → "Оформить заказ и получить счёт" → **"Заказ принят"**: the invoice will come to the Kaspi.kz app on the given phone number.
2. **Find the address and opening hours.** Any page → footer (address, hours, phone) **or** Home → "Контакты и как добраться" → `colophon.html#contacts`.
3. **Ask a question about size.** Clothing → "Таблица размеров" → footer "Задать вопрос" → `colophon.html#feedback` → topic "Подбор размера" → "Отправить вопрос" → message "Спасибо! Вопрос отправлен" under the form.

## How the order works without JavaScript

- The order form uses only HTML: `required`, `minlength`, `pattern` (phone), `type="email"`, `type="number" min="1" max="10"`. The browser itself does not let the visitor submit an empty or wrong form.
- Extra products are hidden in `<details>` / `<summary>` ("Добавить ещё товары") — this opens and closes without JavaScript.
- Payment methods: Kaspi.kz, Halyk Bank, Freedom Bank, Apple Pay, bank card, cash on delivery. One of them must be chosen (`required` radio group).
- The form is sent with `action="order.html#order-done" method="get"`. The confirmation block `#order-done` is hidden by CSS and shown with the `:target` selector; the form after it is hidden with `.order-done:target ~ .checkout`. The question form on `colophon.html` works the same way (`#feedback-done`).
- A static site cannot charge money or calculate a total without JavaScript and a server, so the total is shown in the bank invoice, and the price of every product is listed in "Цены всех товаров". This is how the order is finished: the visitor chooses how to pay and gets the invoice from the bank.
- The menu is always expanded (`navbar-expand`) and wraps on a phone, because the Bootstrap hamburger button needs Bootstrap's JavaScript.

## Prepared for JavaScript (next assignment)

| What | Where |
|---|---|
| `id` on forms and buttons | `#order-form`, `#order-submit`, `#feedback-form`, `#feedback-submit`, `#cart-link` |
| `data-` attributes on products | every card: `<article data-product-id data-name data-price>`, buttons `.add-to-cart` with `data-product-id`, section buttons `.filter-btn` with `data-filter`, product rows `data-row` |
| Empty containers | cart `#cart-items`, counter `#cart-count`, total `#order-total`, errors `#order-error`, `#feedback-error` |
| State classes in CSS (`base.css`) | `.hidden`, `.selected`, `.error`, `.success` (`.active` comes from Bootstrap) |

## Styles: Bootstrap + minimal own CSS

The site was first built with plain HTML, then CSS was added, then everything possible was replaced with Bootstrap. So the layout and design are made with **Bootstrap classes** directly in HTML (`d-flex`, `gap-3`, `p-4`, `rounded-3`, `border`, `shadow-sm`, `breadcrumb`, `form-control`, `is-invalid` / `invalid-feedback`, `d-none`, etc.), and our own CSS contains only what Bootstrap does not have:

| File | Contents | Lines |
|---|---|---|
| `css/base.css` | purple brand color: `text-purple`, `bg-purple`, buttons `btn-purple`, `btn-outline-purple`, active menu item, state classes for future JS | ~45 |
| `css/azhar.css` | product card: border and lift on hover, image height | ~14 |
| `css/akdana.css` | sticky order summary, step bar, selected payment method, bank logo size, showing confirmations with `:target` | ~45 |

## Payment method logos

Each payment method has a place for a logo (`<object>`). While there is no image file, the fallback inside `<object>` is shown — a letter on the bank's color (K, H, F, A, V, ₸). To use real logos, put square PNG files (80×80 recommended) here:

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
3. Placing an order led to the home page with no message. Now the confirmation "Заказ принят" is shown.
4. The total "12 500 ₸" was hard-coded and wrong. Removed; the total comes in the bank invoice, prices are listed on the order page.
5. "В корзину" promised a cart that did not exist. Renamed to "Заказать"; products, sizes and quantity are chosen in the order form.
6. "Регистрация / Войти" led nowhere, and sign-in is impossible without a server. The link was removed.
7. The anchor `clothing.html#outerwear` did not exist. Footer links now point to existing sections.
8. "Delivery and payment" led to a page without that information. Added the section `colophon.html#delivery`.
9. Opening hours were missing everywhere. Added.
10. The "About" page described the university course, not the store. Rewritten.
11. The sale table had no dates. Dates added.
12. Four identical "Pandora charm" cards with the same `alt`. Numbered.
13. The Shoes page had no sections. Sections added: sneakers, caps, bags, jewelry.
14. There was no size selection. Added size and quantity to the order form and a size chart.
15. There was no question form and no payment choice. Added.
16. The header was built from `div`s. Now it uses `<header>` + `<nav>`.
17. `<h1>` was only on the home page. Now every page has one.
18. Browser tab titles had different formats. One template now.
19. The hamburger menu button needed Bootstrap JavaScript. The menu is now always visible and wraps on phones.
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
- **What AI did:** rewrote the 6 pages (no new pages), made the order form with payment choice in pure HTML + CSS (no JavaScript), added JavaScript-ready ids, data attributes, empty containers and state classes, reduced CSS to three small files (the rest is Bootstrap), added the "Back" button, removed emoji, wrote this README.
- **What was not changed:** clothing image paths on `clothing.html`.
- **What AI made up and we must verify:** hours "Daily 10:00–20:00", courier 1 500 ₸ and 1–2 days, sale dates, 14-day returns, size chart, jeans sizes 28–34.
- **Checked:** all links and anchors exist, every form field has a `label`, no duplicate `id`s, all tags are closed, no `<script>` on any page. Run the W3C Validator manually: https://validator.w3.org/#validate_by_upload