'use strict';

/* ==========================================================================
   order.js · ЧИСТЫЙ JavaScript — корзина и главная форма заказа (order.html)
   - строки корзины генерируются циклом из массива корзины;
   - размер, + / −, «Удалить» работают через ДЕЛЕГИРОВАНИЕ на #cart-items;
   - итог: товары + доставка (1 500 ₸, бесплатно от 30 000 ₸ или самовывоз);
   - кнопка оформления заблокирована, пока заказ пустой;
   - полная валидация формы: ошибки рядом с полями, очистка при исправлении,
     фокус на первую ошибку;
   - итоговое резюме с демонстрационным номером. Данные никуда не отправляются.
   ========================================================================== */

// 'amiri-dove|M' → { id: 'amiri-dove', size: 'M' }; 'cap-la|one' → размер пустой
function parseSelectValue(value) {
    const parts = value.split('|');
    const size = parts[1] === 'one' || parts[1] === undefined ? '' : parts[1];
    return { id: parts[0], size: size };
}

// Количество из поля: целое 1–10, иначе 0
function readQty(input) {
    const qty = Number(input.value);
    return Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY ? qty : 0;
}

// Товары, выбранные прямо в форме (списки «Товар 1–3»)
function getSelectLines() {
    const lines = [];
    for (let i = 1; i <= 3; i += 1) {
        const select = document.getElementById(`product-${i}`);
        const qtyInput = document.getElementById(`qty-${i}`);
        if (select === null || qtyInput === null || select.value === '') {
            continue;
        }
        const parsed = parseSelectValue(select.value);
        const qty = readQty(qtyInput);
        if (findProduct(parsed.id) !== null && qty > 0) {
            lines.push({ id: parsed.id, size: parsed.size, qty: qty });
        }
    }
    return lines;
}

// Весь заказ = корзина + выбранное в форме
function getOrderLines() {
    return loadCart().concat(getSelectLines());
}

function getDeliveryMethod() {
    const checked = document.querySelector('input[name="delivery"]:checked');
    return checked !== null ? checked.value : 'courier';
}

// «Футболка AMIRI Dove Black, размер M × 2 — 25 000 ₸»
function describeLine(line) {
    const product = findProduct(line.id);
    const sizeText = line.size !== '' ? `, размер ${line.size}` : '';
    return `${product.name}${sizeText} × ${line.qty} — ${formatPrice(calcLineTotal(line))}`;
}

function updateCartItem(index, changes) {
    const cart = loadCart();
    if (index < 0 || index >= cart.length) {
        return;
    }
    Object.assign(cart[index], changes);
    saveCart(normalizeCart(cart)); // если выбрали размер, который уже есть, — строки объединятся
}

function removeCartItem(index) {
    const cart = loadCart();
    cart.splice(index, 1);
    saveCart(cart);
}

function createSmallButton(className, text, label, id) {
    const button = createEl('button', className, text);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    if (id) {
        button.id = id;
    }
    return button;
}

// Одна строка корзины. Функция только рисует — клики обрабатывает делегирование в initOrderPage.
function createCartRow(item, index) {
    const product = findProduct(item.id);
    const row = createEl('li', 'py-2 border-bottom d-flex flex-wrap align-items-center gap-2');
    row.dataset.index = String(index);
    row.append(createEl('span', 'fw-bold flex-grow-1', product.name));

    if (hasSizes(product)) {
        const sizeSelect = createEl('select', 'form-select form-select-sm w-auto js-cart-size');
        sizeSelect.id = `cart-size-${index}`;
        sizeSelect.setAttribute('aria-label', `Размер: ${product.name}`);
        sizeSelect.append(new Option('Размер?', ''));
        product.sizes.forEach((size) => sizeSelect.append(new Option(size, size)));
        sizeSelect.value = item.size;
        row.append(sizeSelect);
    } else {
        row.append(createEl('span', 'small text-muted', 'без размера'));
    }

    const qtyGroup = createEl('div', 'd-flex align-items-center gap-1');
    const minus = createSmallButton('btn btn-sm btn-outline-purple js-cart-minus', '−',
        `Уменьшить количество: ${product.name}`, `cart-minus-${index}`);
    minus.disabled = item.qty <= 1;
    const qtyText = createEl('span', 'px-2 fw-bold', String(item.qty));
    qtyText.setAttribute('aria-label', `Количество: ${item.qty}`);
    const plus = createSmallButton('btn btn-sm btn-outline-purple js-cart-plus', '+',
        `Увеличить количество: ${product.name}`, `cart-plus-${index}`);
    plus.disabled = item.qty >= MAX_QTY;
    qtyGroup.append(minus, qtyText, plus);

    const lineTotal = createEl('span', 'text-purple fw-bold text-nowrap', formatPrice(calcLineTotal(item)));
    const removeButton = createSmallButton('btn btn-sm btn-outline-purple js-cart-remove', 'Удалить',
        `Удалить из корзины: ${product.name}`);

    row.append(qtyGroup, lineTotal, removeButton);
    return row;
}

function initOrderPage() {
    const form = document.getElementById('order-form');
    if (form === null) {
        return;
    }
    /* required, pattern, minlength в HTML остаются — правила записаны в разметке.
       noValidate выключает только всплывающие подсказки браузера, чтобы показывать свои сообщения.
       Проверка в браузере не заменяет серверную: её можно обойти, сервер всегда проверяет заново. */
    form.noValidate = true;

    const cartList = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const totalEl = document.getElementById('order-total');
    const submitButton = document.getElementById('order-submit');
    const errorBox = document.getElementById('order-error');
    const orderDone = document.getElementById('order-done');
    const checkout = document.getElementById('checkout');
    const fullName = document.getElementById('fullName');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');
    const address = document.getElementById('address');
    const comment = document.getElementById('comment');
    const agree = document.getElementById('agree');
    const payRadios = Array.from(document.querySelectorAll('input[name="payment"]'));
    const payGroup = payRadios[0].closest('.d-grid');

    let submitted = false;
    const touched = new Set(); // поля, которые пользователь уже трогал (каждое по одному разу)

    /* --- Дополнительные элементы, созданные через DOM --- */
    const breakdown = createEl('div', 'small border-top pt-3 mb-2');
    const subtotalRow = createEl('p', 'd-flex justify-content-between mb-1');
    const subtotalValue = createEl('span');
    subtotalRow.append(createEl('span', '', 'Товары:'), subtotalValue);
    const deliveryRow = createEl('p', 'd-flex justify-content-between mb-1');
    const deliveryValue = createEl('span');
    deliveryRow.append(createEl('span', '', 'Доставка:'), deliveryValue);
    const freeHint = createEl('p', 'text-purple fw-bold mb-0');
    breakdown.append(subtotalRow, deliveryRow, freeHint);
    totalEl.parentElement.before(breakdown);
    totalEl.parentElement.setAttribute('aria-live', 'polite');

    const emptyHint = createEl('p', 'small text-muted text-center mt-2 mb-0 hidden',
        'Добавьте хотя бы один товар, чтобы оформить заказ.');
    submitButton.after(emptyHint);

    const commentCounter = createEl('p', 'small text-muted text-end mb-3');
    comment.classList.remove('mb-3');
    comment.after(commentCounter);

    /* --- Отрисовка --- */
    function renderCart(focusId) {
        const cart = loadCart();
        cartList.replaceChildren();
        cart.forEach((item, index) => {             // строки генерируются циклом из массива корзины
            cartList.append(createCartRow(item, index));
        });
        cartEmpty.classList.toggle('hidden', cart.length > 0);
        if (focusId) {
            const target = document.getElementById(focusId);
            if (target !== null && !target.disabled) {
                target.focus();
            }
        }
    }

    function renderTotals() {
        const lines = getOrderLines();
        const method = getDeliveryMethod();
        const subtotal = calcSubtotal(lines);
        const delivery = calcDelivery(subtotal, method);
        const total = subtotal + delivery;              // вычисляемое число: итог заказа

        subtotalValue.textContent = formatPrice(subtotal);
        deliveryValue.textContent = delivery === 0 ? 'бесплатно' : formatPrice(delivery);
        totalEl.textContent = formatPrice(total);
        totalEl.dataset.value = String(total);

        if (method === 'courier' && subtotal > 0 && subtotal < FREE_DELIVERY_FROM) {
            freeHint.textContent = `До бесплатной доставки: ${formatPrice(FREE_DELIVERY_FROM - subtotal)}`;
            freeHint.classList.remove('hidden');
        } else if (method === 'courier' && subtotal >= FREE_DELIVERY_FROM) {
            freeHint.textContent = 'Доставка курьером бесплатная.';
            freeHint.classList.remove('hidden');
        } else {
            freeHint.classList.add('hidden');
        }

        const isEmpty = lines.length === 0;
        submitButton.disabled = isEmpty;
        emptyHint.classList.toggle('hidden', !isEmpty);
        address.disabled = method === 'pickup'; // адрес нужен только курьеру
    }

    function renderCommentCounter() {
        const max = Number(comment.getAttribute('maxlength')) || 300;
        commentCounter.textContent = `${comment.value.length} / ${max} символов`;
    }

    function renderAll(focusId) {
        renderCart(focusId);
        renderTotals();
        updateCartBadge();
        if (submitted || touched.size > 0) {
            applyChecks(collectChecks());
        }
    }

    /* --- Валидация --- */
    // Каждая проверка: что подсветить, куда вывести ошибку, куда поставить фокус и текст ошибки
    function collectChecks() {
        const checks = [];
        const cart = loadCart();
        const lines = getOrderLines();
        const method = getDeliveryMethod();

        // 1) Товары: заказ не пустой и у всех вещей выбран размер
        let itemsMessage = '';
        let itemsFocus = document.getElementById('product-1');
        const missingSize = cart.findIndex((item) => hasSizes(findProduct(item.id)) && item.size === '');
        if (lines.length === 0) {
            itemsMessage = 'Добавьте хотя бы один товар — из каталога или в списке ниже.';
        } else if (missingSize !== -1) {
            itemsMessage = `Выберите размер: ${findProduct(cart[missingSize].id).name}.`;
            itemsFocus = document.getElementById(`cart-size-${missingSize}`);
        }
        checks.push({ key: 'items', field: cartList, anchor: cartList, focus: itemsFocus, message: itemsMessage });

        // 2) Количество в строках формы: целое число 1–10
        for (let i = 1; i <= 3; i += 1) {
            const select = document.getElementById(`product-${i}`);
            const qtyInput = document.getElementById(`qty-${i}`);
            const message = select.value !== '' && readQty(qtyInput) === 0
                ? `Количество — целое число от 1 до ${MAX_QTY}.`
                : '';
            checks.push({ key: qtyInput.id, field: qtyInput, anchor: qtyInput, focus: qtyInput, message: message });
        }

        // 3) Имя и фамилия (обязательный текст с trim)
        const nameValue = fullName.value.trim();
        let nameMessage = '';
        if (nameValue === '') {
            nameMessage = 'Введите имя и фамилию.';
        } else if (!isValidName(nameValue)) {
            nameMessage = 'Только буквы, пробел или дефис, минимум 2 символа.';
        } else if (nameValue.split(/\s+/).length < 2) {
            nameMessage = 'Укажите и имя, и фамилию через пробел.';
        }
        checks.push({ key: 'fullName', field: fullName, anchor: fullName, focus: fullName, message: nameMessage, valid: true });

        // 4) Телефон
        let phoneMessage = '';
        if (phone.value.trim() === '') {
            phoneMessage = 'Введите телефон — на него придёт счёт.';
        } else if (!isValidPhone(phone.value)) {
            phoneMessage = 'Формат: +7 700 000 00 00 (11 цифр).';
        }
        checks.push({ key: 'phone', field: phone, anchor: phone, focus: phone, message: phoneMessage, valid: true });

        // 5) Email — необязательный, но если указан, то правильный
        const emailMessage = email.value.trim() !== '' && !isValidEmail(email.value)
            ? 'Проверьте email, например: example@mail.kz'
            : '';
        checks.push({ key: 'email', field: email, anchor: email, focus: email, message: emailMessage, valid: email.value.trim() !== '' });

        // 6) Составное правило: курьер → нужен адрес (улица и дом)
        const addressMessage = method === 'courier' && address.value.trim().length < 5
            ? 'Для доставки курьером укажите адрес: улица, дом.'
            : '';
        checks.push({ key: 'address', field: address, anchor: address, focus: address, message: addressMessage, valid: method === 'courier' });

        // 7) Способ оплаты (выбор)
        const paySelected = payRadios.some((radio) => radio.checked);
        checks.push({ key: 'payment', field: payRadios[0], anchor: payGroup, focus: payRadios[0],
            message: paySelected ? '' : 'Выберите способ оплаты.', group: payRadios });

        // 8) Согласие
        checks.push({ key: 'agree', field: agree, anchor: agree.nextElementSibling, focus: agree,
            message: agree.checked ? '' : 'Нужно согласие на обработку данных.' });

        return checks;
    }

    // Показываем ошибки: после отправки — все, до неё — только у полей, которые уже трогали
    function applyChecks(checks) {
        checks.forEach((check) => {
            if (!submitted && !touched.has(check.key)) {
                return;
            }
            const hasError = setFieldError(check.field, check.anchor, check.message, check.valid === true);
            if (check.group) {
                check.group.forEach((radio) => radio.classList.toggle('is-invalid', hasError));
            }
        });
        return checks.filter((check) => check.message !== '');
    }

    function keyForField(target) {
        if (target.name === 'payment') {
            return 'payment';
        }
        if (target.id.startsWith('cart-size-') || target.id.startsWith('product-')) {
            return 'items';
        }
        return target.id;
    }

    /* --- Итоговое резюме --- */
    function showSummary() {
        const lines = getOrderLines();
        const method = getDeliveryMethod();
        const subtotal = calcSubtotal(lines);
        const delivery = calcDelivery(subtotal, method);
        const checkedPay = payRadios.find((radio) => radio.checked);
        const payName = checkedPay.closest('label').querySelector('strong').textContent;
        const orderNumber = generateDemoNumber('ASL');

        const buttons = orderDone.querySelector('.d-flex');
        orderDone.replaceChildren();
        orderDone.append(
            createEl('h1', 'h2 text-purple fw-bold mb-3', 'Заказ оформлен (демо)'),
            createEl('p', 'lead mb-2', `Демонстрационный номер заказа: ${orderNumber}`),
            createEl('p', 'bg-light border rounded-3 p-3 small text-muted',
                'Это учебный проект: данные не отправляются на сервер, счёт не выставляется и оплата не списывается. ' +
                'Номер создан случайно только для демонстрации.')
        );

        const details = createEl('div', 'text-start mx-auto mb-4');
        details.append(createEl('h2', 'h5 text-purple fw-bold', 'Состав заказа'));
        const list = createEl('ul', 'mb-3');
        lines.forEach((line) => list.append(createEl('li', '', describeLine(line))));
        details.append(
            list,
            createEl('p', 'mb-1', `Товары: ${formatPrice(subtotal)}`),
            createEl('p', 'mb-1', `Доставка: ${delivery === 0 ? 'бесплатно' : formatPrice(delivery)}`),
            createEl('p', 'fw-bold mb-3', `Итого: ${formatPrice(subtotal + delivery)}`),
            createEl('h2', 'h5 text-purple fw-bold', 'Получатель'),
            createEl('p', 'mb-1', `Имя: ${fullName.value.trim()}`),
            createEl('p', 'mb-1', `Телефон: ${phone.value.trim()}`)
        );
        if (email.value.trim() !== '') {
            details.append(createEl('p', 'mb-1', `Email: ${email.value.trim()}`));
        }
        details.append(createEl('p', 'mb-1', method === 'pickup'
            ? 'Получение: самовывоз, ТД «Гулжан», бутик 246'
            : `Получение: курьер, ${address.value.trim()}`));
        details.append(createEl('p', 'mb-1', `Оплата: ${payName}`));
        if (comment.value.trim() !== '') {
            details.append(createEl('p', 'mb-1', `Комментарий: ${comment.value.trim()}`));
        }
        orderDone.append(details);
        if (buttons !== null) {
            orderDone.append(buttons);
        }

        // Показываем подтверждение и прячем форму (классы из Bootstrap и base.css)
        orderDone.classList.add('d-block');
        checkout.classList.add('hidden');
        orderDone.focus();

        saveCart([]); // заказ «оформлен» — корзину очищаем
        updateCartBadge();
    }

    /* --- События --- */

    /* Делегирование: строки корзины пересоздаются после каждого изменения, поэтому обработчики
       вешаем один раз на постоянный родитель #cart-items. Клик всплывает от кнопки к списку,
       closest() определяет, какая кнопка нажата, а data-index строки — какой товар. */
    cartList.addEventListener('click', (event) => {
        const button = event.target.closest('.js-cart-plus, .js-cart-minus, .js-cart-remove');
        if (button === null) {
            return;
        }
        const index = Number(button.closest('li').dataset.index);
        const item = loadCart()[index];
        if (item === undefined) {
            return;
        }
        if (button.classList.contains('js-cart-remove')) {
            removeCartItem(index);
            renderAll('');
            return;
        }
        const delta = button.classList.contains('js-cart-plus') ? 1 : -1;
        updateCartItem(index, { qty: item.qty + delta });
        renderAll(button.id);
    });

    cartList.addEventListener('change', (event) => {
        const select = event.target.closest('.js-cart-size');
        if (select === null) {
            return;
        }
        touched.add('items');
        updateCartItem(Number(select.closest('li').dataset.index), { size: select.value });
        renderAll(select.id);
    });

    // Делегирование на форме: input/change/focusout от любого поля всплывают до <form>
    form.addEventListener('input', (event) => {
        if (event.target === comment) {
            renderCommentCounter();
        }
        renderTotals();
        if (submitted || touched.has(keyForField(event.target))) {
            applyChecks(collectChecks()); // ошибка исчезает сразу, как только поле исправили
        }
    });

    form.addEventListener('change', (event) => {
        touched.add(keyForField(event.target));
        renderTotals();
        applyChecks(collectChecks());
    });

    form.addEventListener('focusout', (event) => {
        if (event.target.id) {
            touched.add(keyForField(event.target));
            applyChecks(collectChecks());
        }
    });

    form.addEventListener('submit', (event) => {
        // Без preventDefault браузер отправил бы форму и перезагрузил страницу (данные попали бы в адрес)
        event.preventDefault();
        submitted = true;
        const errors = applyChecks(collectChecks());
        if (errors.length > 0) {
            errorBox.textContent = `Проверьте форму: ошибок — ${errors.length}. Первая: ${errors[0].message}`;
            errorBox.classList.remove('hidden');
            const first = errors[0].focus;
            const closedDetails = first.closest('details');
            if (closedDetails !== null) {
                closedDetails.open = true; // поле внутри «Добавить ещё товары»
            }
            first.focus();
            return;
        }
        errorBox.classList.add('hidden');
        showSummary();
    });

    renderAll('');
    renderCommentCounter();
}

initOrderPage();
