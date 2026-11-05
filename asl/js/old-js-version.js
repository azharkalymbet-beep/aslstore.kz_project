'use strict';

/* ==========================================================================
   old-js-version.js — СТАРЫЕ версии функций на чистом JavaScript (Assignment 4–5).
   Файл НЕ подключён ни к одной странице: он нужен только для сравнения
   с новыми jQuery-версиями.

   Старая функция          →  новая jQuery-версия
   1. setFieldError()      →  showFieldError()   в js/main.js  (вывод ошибки валидации)
   2. updateCartBadge()    →  updateCartBadge()  в js/main.js  (показ/скрытие счётчика корзины)
   3. createCartRow()      →  buildCartRow()     в js/order.js (генерация строки корзины из данных)
   ========================================================================== */

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

// Счётчик товаров в шапке
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge === null) {
        return;
    }
    const count = countItems(loadCart());
    badge.textContent = String(count);
    badge.dataset.count = String(count);
    badge.classList.toggle('hidden', count === 0);
    const link = document.getElementById('cart-link');
    if (link !== null) {
        link.setAttribute('aria-label', `Корзина, товаров: ${count}`);
    }
}

// Одна строка корзины (переиспользуемая функция отрисовки)
function createCartRow(item, index, onChange) {
    const product = findProduct(item.id);
    const row = createEl('li', 'py-2 border-bottom d-flex flex-wrap align-items-center gap-2');
    row.append(createEl('span', 'fw-bold flex-grow-1', product.name));

    if (hasSizes(product)) {
        const sizeSelect = createEl('select', 'form-select form-select-sm w-auto');
        sizeSelect.id = `cart-size-${index}`;
        sizeSelect.setAttribute('aria-label', `Размер: ${product.name}`);
        sizeSelect.append(new Option('Размер?', ''));
        product.sizes.forEach((size) => sizeSelect.append(new Option(size, size)));
        sizeSelect.value = item.size;
        sizeSelect.addEventListener('change', () => {
            updateCartItem(index, { size: sizeSelect.value });
            onChange(sizeSelect.id);
        });
        row.append(sizeSelect);
    } else {
        row.append(createEl('span', 'small text-muted', 'без размера'));
    }

    const qtyGroup = createEl('div', 'd-flex align-items-center gap-1');
    const minus = createEl('button', 'btn btn-sm btn-outline-purple', '−');
    minus.type = 'button';
    minus.id = `cart-minus-${index}`;
    minus.setAttribute('aria-label', `Уменьшить количество: ${product.name}`);
    minus.disabled = item.qty <= 1;
    minus.addEventListener('click', () => {
        updateCartItem(index, { qty: item.qty - 1 });
        onChange(minus.id);
    });

    const qtyText = createEl('span', 'px-2 fw-bold', String(item.qty));
    qtyText.setAttribute('aria-label', `Количество: ${item.qty}`);

    const plus = createEl('button', 'btn btn-sm btn-outline-purple', '+');
    plus.type = 'button';
    plus.id = `cart-plus-${index}`;
    plus.setAttribute('aria-label', `Увеличить количество: ${product.name}`);
    plus.disabled = item.qty >= MAX_QTY;
    plus.addEventListener('click', () => {
        updateCartItem(index, { qty: item.qty + 1 });
        onChange(plus.id);
    });
    qtyGroup.append(minus, qtyText, plus);

    const lineTotal = createEl('span', 'text-purple fw-bold text-nowrap', formatPrice(calcLineTotal(item)));

    const removeButton = createEl('button', 'btn btn-sm btn-outline-purple', 'Удалить');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Удалить из корзины: ${product.name}`);
    removeButton.addEventListener('click', () => {
        removeCartItem(index);
        onChange('');
    });

    row.append(qtyGroup, lineTotal, removeButton);
    return row;
}
