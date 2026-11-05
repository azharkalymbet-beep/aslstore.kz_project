'use strict';

/* ==========================================================================
   order.js — корзина и оформление заказа (order.html), Assignment 6: jQuery
   - строки корзины генерируются из массива корзины через .append();
   - +/−, размер и «Удалить» работают через ДЕЛЕГИРОВАННЫЕ обработчики на #cart-items;
   - итог: товары + доставка (1 500 ₸, бесплатно от 30 000 ₸ или самовывоз);
   - валидация формы на jQuery: ошибки рядом с полями, фокус на первую ошибку;
   - резюме с демонстрационным номером. Данные никуда не отправляются.
   ========================================================================== */

/* --- Чистая логика (без DOM) --- */

// 'amiri-dove|M' → { id: 'amiri-dove', size: 'M' }; 'cap-la|one' → размер пустой
function parseSelectValue(value) {
    const parts = value.split('|');
    const size = parts[1] === 'one' || parts[1] === undefined ? '' : parts[1];
    return { id: parts[0], size: size };
}

// Количество: целое 1–10, иначе 0
function parseQty(value) {
    const qty = Number(value);
    return Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY ? qty : 0;
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
    saveCart(normalizeCart(cart)); // выбрали размер, который уже есть, — строки объединятся
}

function removeCartItem(index) {
    const cart = loadCart();
    cart.splice(index, 1);
    saveCart(cart);
}

/* --- jQuery-функции --- */

// Товары, выбранные прямо в форме (списки «Товар 1–3»)
function getSelectLines() {
    const lines = [];
    $('#step-items select[name^="item"]').each(function () {           // селектор по атрибуту: name начинается с item
        const $select = $(this);
        const $qty = $select.closest('.row').find('input[type="number"]'); // поле количества в той же строке
        if ($select.val() === '') {
            return; // в .each() return = перейти к следующему
        }
        const parsed = parseSelectValue($select.val());
        const qty = parseQty($qty.val());
        if (findProduct(parsed.id) !== null && qty > 0) {
            lines.push({ id: parsed.id, size: parsed.size, qty: qty });
        }
    });
    return lines;
}

// Весь заказ = корзина + выбранное в форме
function getOrderLines() {
    return loadCart().concat(getSelectLines());
}

function getDeliveryMethod() {
    return $('input[name="delivery"]:checked').val() || 'courier'; // фильтр :checked — выбранная радиокнопка
}

/* Рефакторинг №3: createCartRow() → buildCartRow() — генерация строки корзины (старая версия в old-js-version.js).
   createElement + className + textContent + new Option() + appendChild заменены на $('<tag>', {...}),
   цепочки .addClass().attr().text() и .appendTo(); строк стало меньше примерно на 40 %.
   Обработчики теперь не внутри функции, а один раз — делегированием на #cart-items, поэтому функция только рисует. */
function buildCartRow(item, index) {
    const product = findProduct(item.id);

    // Цепочка: создать <li> → добавить классы → запомнить номер строки в data-index
    const $row = $('<li>')
        .addClass('py-2 border-bottom d-flex flex-wrap align-items-center gap-2')
        .attr('data-index', index);

    $('<span>').addClass('fw-bold flex-grow-1').text(product.name).appendTo($row);

    if (hasSizes(product)) {
        const $size = $('<select>', {
            id: `cart-size-${index}`,
            class: 'form-select form-select-sm w-auto js-cart-size',
            'aria-label': `Размер: ${product.name}`
        }).append($('<option>').val('').text('Размер?'));
        $.each(product.sizes, function (i, size) {
            $size.append($('<option>').val(size).text(size));
        });
        $size.val(item.size).appendTo($row);
    } else {
        $('<span>').addClass('small text-muted').text('без размера').appendTo($row);
    }

    const $qtyGroup = $('<div>').addClass('d-flex align-items-center gap-1').append(
        $('<button>', {
            type: 'button',
            id: `cart-minus-${index}`,
            class: 'btn btn-sm btn-outline-purple js-cart-minus',
            'aria-label': `Уменьшить количество: ${product.name}`
        }).text('−').prop('disabled', item.qty <= 1),
        $('<span>').addClass('px-2 fw-bold').attr('aria-label', `Количество: ${item.qty}`).text(item.qty),
        $('<button>', {
            type: 'button',
            id: `cart-plus-${index}`,
            class: 'btn btn-sm btn-outline-purple js-cart-plus',
            'aria-label': `Увеличить количество: ${product.name}`
        }).text('+').prop('disabled', item.qty >= MAX_QTY)
    );

    $row.append(
        $qtyGroup,
        $('<span>').addClass('text-purple fw-bold text-nowrap').text(formatPrice(calcLineTotal(item))),
        $('<button>', {
            type: 'button',
            class: 'btn btn-sm btn-outline-purple js-cart-remove',
            'aria-label': `Удалить из корзины: ${product.name}`
        }).text('Удалить')
    );
    return $row;
}

/* Документ готов — запускаем страницу заказа (jQuery 3.7.1, см. комментарий в main.js) */
$(function () {
    const $form = $('#order-form');
    if ($form.length === 0) {
        return;
    }

    /* Атрибуты required, minlength, pattern, maxlength в HTML оставляем: они описывают правила
       и сработают, даже если JavaScript отключён. novalidate только выключает всплывающие подсказки
       браузера, чтобы показывать наши сообщения рядом с полями.
       Важно: проверка в браузере НЕ заменяет серверную. Её легко обойти — отключить JS, поменять
       код в DevTools или отправить запрос напрямую. Поэтому настоящий сервер всегда проверяет данные заново. */
    $form.attr('novalidate', 'novalidate');

    const $cartList = $('#cart-items');
    const $cartEmpty = $('#cart-empty');
    const $total = $('#order-total');
    const $submit = $('#order-submit');
    const $errorBox = $('#order-error');
    const $done = $('#order-done');
    const $checkout = $('#checkout');
    const $fullName = $('#fullName');
    const $phone = $('#phone');
    const $email = $('#email');
    const $address = $('#address');
    const $comment = $('#comment');
    const $agree = $('#agree');
    const $payRadios = $('input[name="payment"]');
    const $payGroup = $payRadios.first().closest('.d-grid');

    let submitted = false;
    const touched = new Set();

    /* --- Дополнительные элементы создаются кодом --- */
    const $subtotalValue = $('<span>');
    const $deliveryValue = $('<span>');
    const $freeHint = $('<p>').addClass('text-purple mb-0');
    $('<div>')
        .addClass('small border-top pt-3 mb-2')
        .append(
            $('<p>').addClass('d-flex justify-content-between mb-1').append($('<span>').text('Товары:'), $subtotalValue),
            $('<p>').addClass('d-flex justify-content-between mb-1').append($('<span>').text('Доставка:'), $deliveryValue),
            $freeHint
        )
        .insertBefore($total.parent());
    $total.parent().attr('aria-live', 'polite');

    const $emptyHint = $('<p>')
        .addClass('small text-muted text-center mt-2 mb-0 hidden')
        .text('Добавьте хотя бы один товар, чтобы оформить заказ.')
        .insertAfter($submit);

    const $commentCounter = $('<p>').addClass('small text-muted text-end mb-3');
    $comment.removeClass('mb-3').after($commentCounter);

    /* --- Отрисовка --- */
    function renderCart(focusId) {
        const cart = loadCart();
        $cartList.empty();
        // Строки генерируются из массива корзины и добавляются через .append()
        $.each(cart, function (index, item) {
            $cartList.append(buildCartRow(item, index));
        });
        $cartEmpty.toggleClass('hidden', cart.length > 0);
        if (focusId) {
            $(`#${focusId}`).filter(':not(:disabled)').trigger('focus'); // фокус остаётся на той же кнопке
        }
    }

    function renderTotals() {
        const lines = getOrderLines();
        const method = getDeliveryMethod();
        const subtotal = calcSubtotal(lines);
        const delivery = calcDelivery(subtotal, method);
        const total = subtotal + delivery;

        $subtotalValue.text(formatPrice(subtotal));
        $deliveryValue.text(delivery === 0 ? 'бесплатно' : formatPrice(delivery));
        $total.text(formatPrice(total)).attr('data-value', total);

        /* .html() vs .text(): .html() разбирает строку как разметку (здесь нужен <strong>),
           .text() вставляет всё как обычный текст. .html() используем ТОЛЬКО с нашими данными
           (число из расчёта), а всё, что ввёл пользователь, — только через .text(). */
        if (method === 'courier' && subtotal > 0 && subtotal < FREE_DELIVERY_FROM) {
            $freeHint.html(`До бесплатной доставки: <strong>${formatPrice(FREE_DELIVERY_FROM - subtotal)}</strong>`).removeClass('hidden');
        } else if (method === 'courier' && subtotal >= FREE_DELIVERY_FROM) {
            $freeHint.html('<strong>Доставка курьером бесплатная.</strong>').removeClass('hidden');
        } else {
            $freeHint.addClass('hidden');
        }

        const isEmpty = lines.length === 0;
        $submit.prop('disabled', isEmpty);        // .prop: текущее состояние кнопки (заблокирована или нет)
        $emptyHint.toggleClass('hidden', !isEmpty);
        $address.prop('disabled', method === 'pickup'); // адрес нужен только курьеру
    }

    function renderCommentCounter() {
        const max = Number($comment.attr('maxlength')) || 300; // .attr: значение атрибута из HTML
        $commentCounter.text(`${$comment.val().length} / ${max} символов`);
    }

    function renderAll(focusId) {
        renderCart(focusId);
        renderTotals();
        updateCartBadge();
        if (submitted || touched.size > 0) {
            applyChecks(collectChecks());
        }
    }

    /* --- Валидация на jQuery --- */
    // Каждая проверка: какое поле подсветить, куда вывести ошибку, куда поставить фокус, текст ошибки
    function collectChecks() {
        const checks = [];
        const cart = loadCart();
        const lines = getOrderLines();
        const method = getDeliveryMethod();

        // 1) Товары: заказ не пустой, у всех вещей выбран размер
        let itemsMessage = '';
        let $itemsFocus = $('#product-1');
        const missingSize = cart.findIndex((item) => hasSizes(findProduct(item.id)) && item.size === '');
        if (lines.length === 0) {
            itemsMessage = 'Добавьте хотя бы один товар — из каталога или в списке ниже.';
        } else if (missingSize !== -1) {
            itemsMessage = `Выберите размер: ${findProduct(cart[missingSize].id).name}.`;
            $itemsFocus = $(`#cart-size-${missingSize}`);
        }
        checks.push({ key: 'items', $field: $cartList, $anchor: $cartList, $focus: $itemsFocus, message: itemsMessage });

        // 2) Количество в строках формы — целое 1–10 (числовое правило)
        $('#step-items input[type="number"]').each(function () {
            const $qty = $(this);
            const $select = $qty.closest('.row').find('select');
            const message = $select.val() !== '' && parseQty($qty.val()) === 0
                ? `Количество — целое число от 1 до ${MAX_QTY}.`
                : '';
            checks.push({ key: $qty.attr('id'), $field: $qty, $anchor: $qty, $focus: $qty, message: message });
        });

        // 3) Имя и фамилия — обязательный текст, пробелы по краям убираем через .trim()
        const nameValue = $fullName.val().trim();
        let nameMessage = '';
        if (nameValue === '') {
            nameMessage = 'Введите имя и фамилию.';
        } else if (!isValidName(nameValue)) {
            nameMessage = 'Только буквы, пробел или дефис, минимум 2 символа.';
        } else if (nameValue.split(/\s+/).length < 2) {
            nameMessage = 'Укажите и имя, и фамилию через пробел.';
        }
        checks.push({ key: 'fullName', $field: $fullName, $anchor: $fullName, $focus: $fullName, message: nameMessage, valid: true });

        // 4) Телефон (формат)
        let phoneMessage = '';
        if ($phone.val().trim() === '') {
            phoneMessage = 'Введите телефон — на него придёт счёт.';
        } else if (!isValidPhone($phone.val())) {
            phoneMessage = 'Формат: +7 700 000 00 00 (11 цифр).';
        }
        checks.push({ key: 'phone', $field: $phone, $anchor: $phone, $focus: $phone, message: phoneMessage, valid: true });

        // 5) Email (формат) — необязательный, но если указан, то правильный
        const emailValue = $email.val().trim();
        const emailMessage = emailValue !== '' && !isValidEmail(emailValue)
            ? 'Проверьте email, например: example@mail.kz'
            : '';
        checks.push({ key: 'email', $field: $email, $anchor: $email, $focus: $email, message: emailMessage, valid: emailValue !== '' });

        // 6) Составное правило: курьер → нужен адрес
        const addressMessage = method === 'courier' && $address.val().trim().length < 5
            ? 'Для доставки курьером укажите адрес: улица, дом.'
            : '';
        checks.push({ key: 'address', $field: $address, $anchor: $address, $focus: $address, message: addressMessage, valid: method === 'courier' });

        // 7) Способ оплаты — выбрана ли хоть одна радиокнопка (фильтр :checked)
        const paySelected = $payRadios.filter(':checked').length > 0;
        checks.push({ key: 'payment', $field: $payRadios.first(), $anchor: $payGroup, $focus: $payRadios.first(),
            message: paySelected ? '' : 'Выберите способ оплаты.', $group: $payRadios });

        /* 8) Согласие. .prop('checked') — ТЕКУЩЕЕ состояние галочки (true/false, меняется при клике).
           .attr('checked') вернул бы только то, что написано в HTML при загрузке (здесь undefined),
           и не изменился бы после клика. Поэтому для чекбоксов — только .prop(). */
        checks.push({ key: 'agree', $field: $agree, $anchor: $agree.siblings('label'), $focus: $agree,
            message: $agree.prop('checked') ? '' : 'Нужно согласие на обработку данных.' });

        return checks;
    }

    // Показываем ошибки: после отправки — все, до неё — только у полей, которые уже трогали
    function applyChecks(checks) {
        $.each(checks, function (index, check) {
            if (!submitted && !touched.has(check.key)) {
                return;
            }
            const hasError = showFieldError(check.$field, check.$anchor, check.message, check.valid === true);
            if (check.$group) {
                check.$group.toggleClass('is-invalid', hasError);
            }
        });
        return checks.filter((check) => check.message !== '');
    }

    function keyForField($target) {
        const id = $target.attr('id') || '';
        if ($target.attr('name') === 'payment') {
            return 'payment';
        }
        if (id.startsWith('cart-size-') || id.startsWith('product-')) {
            return 'items';
        }
        return id;
    }

    function clearValidation() {
        submitted = false;
        touched.clear();
        $form.find('.is-invalid, .is-valid').removeClass('is-invalid is-valid').attr('aria-invalid', 'false');
        $form.find('.invalid-feedback').addClass('hidden').removeAttr('style');
    }

    /* --- Итоговое резюме --- */
    function showSummary() {
        const lines = getOrderLines();
        const method = getDeliveryMethod();
        const subtotal = calcSubtotal(lines);
        const delivery = calcDelivery(subtotal, method);
        const payName = $payRadios.filter(':checked').closest('label').find('strong').text();
        const orderNumber = generateDemoNumber('ASL');

        const $buttons = $done.find('.d-flex').detach(); // кнопки «На главную» / «Продолжить покупки» сохраняем
        const $list = $('<ul>').addClass('mb-3');
        $.each(lines, function (index, line) {
            $('<li>').text(describeLine(line)).appendTo($list);
        });

        // Всё, что ввёл пользователь, выводим через .text()
        const $details = $('<div>').addClass('text-start mb-4').append(
            $('<h2>').addClass('h5 text-purple fw-bold').text('Состав заказа'),
            $list,
            $('<p>').addClass('mb-1').text(`Товары: ${formatPrice(subtotal)}`),
            $('<p>').addClass('mb-1').text(`Доставка: ${delivery === 0 ? 'бесплатно' : formatPrice(delivery)}`),
            $('<p>').addClass('fw-bold mb-3').text(`Итого: ${formatPrice(subtotal + delivery)}`),
            $('<h2>').addClass('h5 text-purple fw-bold').text('Получатель'),
            $('<p>').addClass('mb-1').text(`Имя: ${$fullName.val().trim()}`),
            $('<p>').addClass('mb-1').text(`Телефон: ${$phone.val().trim()}`)
        );
        if ($email.val().trim() !== '') {
            $details.append($('<p>').addClass('mb-1').text(`Email: ${$email.val().trim()}`));
        }
        $details.append(
            $('<p>').addClass('mb-1').text(method === 'pickup'
                ? 'Получение: самовывоз, ТД «Гулжан», бутик 246'
                : `Получение: курьер, ${$address.val().trim()}`),
            $('<p>').addClass('mb-1').text(`Оплата: ${payName}`)
        );
        if ($comment.val().trim() !== '') {
            $details.append($('<p>').addClass('mb-1').text(`Комментарий: ${$comment.val().trim()}`));
        }

        $done.empty().append(
            $('<h1>').addClass('h2 text-purple fw-bold mb-3').text('Заказ оформлен (демо)'),
            $('<p>').addClass('lead mb-2').text(`Демонстрационный номер заказа: ${orderNumber}`),
            $('<p>').addClass('bg-light border rounded-3 p-3 small text-muted').text(
                'Это учебный проект: данные не отправляются на сервер, счёт не выставляется и оплата не списывается. ' +
                'Номер создан случайно только для демонстрации.'),
            $details,
            $buttons
        );

        // Эффекты: форма уезжает вверх (slideUp, 300 мс), в callback после анимации — плавно показываем резюме
        concealBlock($checkout, 300, 'slide', function () {
            revealBlock($done, 400, 'fade');
            $done.trigger('focus');
        });

        saveCart([]); // заказ «оформлен» — корзину очищаем
        updateCartBadge();
    }

    /* --- События --- */

    /* Делегирование событий. Строки корзины создаются кодом и пересоздаются после каждого изменения.
       Прямая привязка $('.js-cart-plus').on('click', ...) нашла бы только кнопки, которые есть
       в момент вызова: после перерисовки новые кнопки остались бы без обработчика.
       Поэтому обработчик вешаем на постоянного родителя #cart-items: клик «всплывает» от кнопки
       к родителю, и jQuery проверяет, совпадает ли кнопка с селектором '.js-cart-plus, .js-cart-minus'. */
    $cartList.on('click', '.js-cart-plus, .js-cart-minus', function () {
        const $button = $(this);                                   // конкретная нажатая кнопка
        const index = Number($button.closest('li').attr('data-index'));
        const delta = $button.hasClass('js-cart-plus') ? 1 : -1;
        const item = loadCart()[index];
        if (item === undefined) {
            return;
        }
        updateCartItem(index, { qty: item.qty + delta });
        renderAll($button.attr('id'));
    });

    $cartList.on('click', '.js-cart-remove', function () {
        const $row = $(this).closest('li');
        if ($row.is(':animated')) {
            return; // второй клик во время анимации игнорируем
        }
        const index = Number($row.attr('data-index'));
        // fadeOut 250 мс: строка плавно исчезает, а в callback (после анимации) удаляем товар и пересчитываем итог
        $row.fadeOut(250, function () {
            removeCartItem(index);
            renderAll('');
        });
    });

    $cartList.on('change', '.js-cart-size', function () {
        const $select = $(this);
        updateCartItem(Number($select.closest('li').attr('data-index')), { size: $select.val() });
        renderAll($select.attr('id'));
    });

    // Ввод в любое поле: пересчитываем итог, и если поле уже проверялось — сразу убираем/обновляем ошибку
    $form.on('input', 'input, select, textarea', function () {
        const $field = $(this);
        if ($field.is($comment)) {
            renderCommentCounter();
        }
        renderTotals();
        if (submitted || touched.has(keyForField($field))) {
            applyChecks(collectChecks());
        }
    });

    $form.on('change', 'input, select, textarea', function () {
        touched.add(keyForField($(this)));
        renderTotals();
        applyChecks(collectChecks());
    });

    $form.on('focusout', 'input, select, textarea', function () {
        touched.add(keyForField($(this)));
        applyChecks(collectChecks());
    });

    $form.on('submit', function (event) {
        /* preventDefault: без него браузер отправил бы форму по action="order.html#order-done" методом GET —
           страница перезагрузилась бы, имя и телефон оказались бы в адресной строке,
           а наша проверка и резюме не успели бы показаться. */
        event.preventDefault();
        submitted = true;

        const errors = applyChecks(collectChecks());
        if (errors.length > 0) {
            $errorBox.text(`Проверьте форму: ошибок — ${errors.length}. Первая: ${errors[0].message}`);
            revealBlock($errorBox, 200, 'fade');
            errors[0].$focus.closest('details').prop('open', true); // поле внутри «Добавить ещё товары»
            errors[0].$focus.trigger('focus');
            return;
        }

        concealBlock($errorBox, 150, 'fade');
        showSummary();

        // Все проверки пройдены — сбрасываем форму (trigger('reset') вызывает стандартный сброс формы)
        $form.trigger('reset');
        clearValidation();
        renderAll('');
        renderCommentCounter();
    });

    renderAll('');
    renderCommentCounter();
});
