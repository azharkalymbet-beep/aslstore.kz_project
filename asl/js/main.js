'use strict';

/* ==========================================================================
   ASLSTORE.KZ — main.js · ЧИСТЫЙ JavaScript (без jQuery)
   Сквозное поведение на всех страницах (общая функция команды):
   - кнопки «В корзину» / «Заказать» кладут товар в корзину (делегирование клика);
   - счётчик товаров в шапке;
   - общие DOM-функции для JS-части: createEl(), setFieldError().
   Подключается после data.js. Скрипт стоит с defer, поэтому выполняется,
   когда HTML уже загружен, — ждать DOMContentLoaded не нужно.
   ========================================================================== */

// Создать DOM-элемент с классами и текстом. Текст всегда через textContent (безопасно).
function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

// Показать или убрать ошибку под полем. Блок ошибки создаётся через DOM один раз.
// Классы is-invalid / is-valid / invalid-feedback — из подключённого Bootstrap, hidden — из base.css.
function setFieldError(field, anchor, message, markValid) {
    const errorId = `${field.name || field.id}-error`;
    let box = document.getElementById(errorId);
    if (box === null) {
        box = createEl('div', 'invalid-feedback d-block');
        box.id = errorId;
        anchor.after(box);
    }
    const hasError = message !== '';
    box.textContent = message;
    box.classList.toggle('hidden', !hasError);
    field.classList.toggle('is-invalid', hasError);
    field.classList.toggle('is-valid', !hasError && markValid === true);
    field.setAttribute('aria-invalid', String(hasError));
    field.setAttribute('aria-describedby', errorId);
    return hasError;
}

// Счётчик товаров в шапке: число + скрыт, когда корзина пустая
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge === null) {
        return 0;
    }
    const count = countItems(loadCart());
    badge.textContent = String(count);
    badge.dataset.count = String(count);
    badge.classList.toggle('hidden', count === 0);
    const link = document.getElementById('cart-link');
    if (link !== null) {
        link.setAttribute('aria-label', `Корзина, товаров: ${count}`);
    }
    return count;
}

// Текст на кнопке после добавления: «В корзине, M: 2 шт.» или «Максимум 10 шт.»
function addedLabel(result, size) {
    if (!result.added) {
        return `Максимум ${MAX_QTY} шт.`;
    }
    const sizeText = size !== '' ? `, ${size}` : '';
    return `В корзине${sizeText}: ${result.qty} шт.`;
}

/* Кнопки «В корзину» (index, clothing) и ссылки «Заказать» (sale, shoesandacc).
   Делегирование: один обработчик на <main> вместо обработчика на каждой из 40 кнопок.
   Клик по кнопке всплывает до <main>, а closest('.add-to-cart') находит, по какой кнопке кликнули.
   Работает и после того, как каталог переставит карточки при сортировке. */
function initAddToCart() {
    const main = document.querySelector('main');
    if (main === null) {
        return;
    }
    main.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart');
        if (button === null) {
            return; // кликнули не по кнопке «В корзину»
        }
        // «Заказать» — это ссылка <a href="order.html">. Без preventDefault браузер сразу ушёл бы
        // на страницу заказа, и покупатель не увидел бы, что товар добавлен.
        event.preventDefault();
        const product = findProduct(button.dataset.productId);
        if (product === null) {
            return;
        }
        const card = button.closest('.product-card');
        const sizeSelect = card !== null ? card.querySelector('.size-select') : null;
        const size = sizeSelect !== null ? sizeSelect.value : '';
        const result = addToCart(product.id, size);
        button.textContent = addedLabel(result, size);
        updateCartBadge();
    });
}

initAddToCart();
updateCartBadge();
window.addEventListener('storage', updateCartBadge); // корзину изменили в другой вкладке
