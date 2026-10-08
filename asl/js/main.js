/* ===== ASLSTORE.KZ — корзина, аккаунт и оформление заказа =====
   Сервера нет, поэтому данные хранятся в localStorage браузера:
     asl_cart    — корзина: [{id, name, price, size, img, qty}]
     asl_users   — аккаунты: {email: {name, phone, email, pass, orders: [], lastAddress}}
     asl_session — email вошедшего пользователя
*/
(function () {
    'use strict';

    var KEYS = { cart: 'asl_cart', users: 'asl_users', session: 'asl_session' };
    var FREE_DELIVERY_FROM = 30000;
    var COURIER_PRICE = 1500;
    var MAX_QTY = 10;
    var PAYMENT_NAMES = {
        kaspi: 'Kaspi.kz',
        halyk: 'Halyk Bank (Homebank)',
        freedom: 'Freedom Bank',
        applepay: 'Apple Pay',
        card: 'Банковская карта',
        cash: 'Наличными при получении'
    };

    /* ---------- Хранилище ---------- */
    function load(key, fallback) {
        try {
            var value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ---------- Вспомогательные ---------- */
    function $(id) { return document.getElementById(id); }
    function show(el) { if (el) el.classList.remove('d-none'); }
    function hide(el) { if (el) el.classList.add('d-none'); }
    function toggle(el, visible) { if (el) el.classList.toggle('d-none', !visible); }
    function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; }
    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function param(name) { return new URLSearchParams(window.location.search).get(name); }
    function digits(text) { return String(text).replace(/\D/g, ''); }
    function isEmail(text) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text); }
    function isPhone(text) { return digits(text).length === 11; }

    function toast(html) {
        var old = document.querySelector('.toast-msg');
        if (old) old.remove();
        var box = document.createElement('div');
        box.className = 'toast-msg position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-3 rounded-pill shadow bg-purple text-white text-center z-3';
        box.setAttribute('role', 'status');
        box.innerHTML = html;
        document.body.appendChild(box);
        setTimeout(function () { box.remove(); }, 3000);
    }

    // Простое хеширование пароля, чтобы не хранить его открытым текстом
    function hashPassword(password) {
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (var i = 0; i < password.length; i++) {
            var ch = password.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
    }

    /* ---------- Корзина ---------- */
    function getCart() {
        var cart = load(KEYS.cart, []);
        if (!Array.isArray(cart)) return [];
        // Убираем испорченные записи (без названия, цены или количества)
        return cart.filter(function (item) {
            return item && item.name && Number(item.price) > 0 && Number(item.qty) > 0;
        }).map(function (item) {
            item.price = Number(item.price);
            item.qty = Number(item.qty);
            return item;
        });
    }
    function setCart(cart) { save(KEYS.cart, cart); updateHeader(); }
    function cartCount(cart) {
        return (cart || getCart()).reduce(function (sum, item) { return sum + item.qty; }, 0);
    }
    function cartSubtotal(cart) {
        return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    }
    function deliveryCost(subtotal, method) {
        if (method === 'pickup' || subtotal === 0) return 0;
        return subtotal >= FREE_DELIVERY_FROM ? 0 : COURIER_PRICE;
    }
    function findIndex(cart, id, size) {
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === id && cart[i].size === size) return i;
        }
        return -1;
    }
    // Изменить количество товара: delta = +1 или −1. Возвращает новое количество.
    function changeQty(product, delta) {
        var cart = getCart();
        var i = findIndex(cart, product.id, product.size);
        if (i === -1) {
            if (delta <= 0) return 0;
            product.qty = 1;
            cart.push(product);
            setCart(cart);
            return 1;
        }
        var next = cart[i].qty + delta;
        if (next > MAX_QTY) {
            toast('Максимум ' + MAX_QTY + ' шт. одного товара в заказе.');
            return cart[i].qty;
        }
        if (next < 1) {
            cart.splice(i, 1);
            next = 0;
        } else {
            cart[i].qty = next;
        }
        setCart(cart);
        return next;
    }

    /* ---------- Пользователи ---------- */
    function getUsers() { return load(KEYS.users, {}); }
    function currentUser() {
        var email = load(KEYS.session, null);
        return email ? getUsers()[email] || null : null;
    }
    function saveUser(user) {
        var users = getUsers();
        users[user.email] = user;
        save(KEYS.users, users);
    }

    /* ---------- Шапка: имя и счётчик корзины ---------- */
    function updateHeader() {
        var count = $('cart-count');
        if (count) count.textContent = cartCount();
        var name = $('account-name');
        var user = currentUser();
        if (name) name.textContent = user ? user.name.split(' ')[0] : 'Войти / Регистрация';
    }

    /* ---------- Карточки товаров: «В корзину» и счётчик − N + ---------- */
    function initCatalog() {
        document.querySelectorAll('article[data-product-id]').forEach(function (card) {
            var addButton = card.querySelector('.add-to-cart');
            if (!addButton) return;
            var sizeSelect = card.querySelector('.size-select');
            var img = card.querySelector('img');

            // Блок «− 2 шт. +», который заменяет кнопку, когда товар уже в корзине
            var stepper = document.createElement('div');
            stepper.className = 'cart-stepper mt-auto d-none';
            stepper.innerHTML =
                '<div class="d-flex align-items-center justify-content-center gap-2">' +
                    '<button type="button" class="btn btn-outline-purple fw-bold px-3" data-step="-1" aria-label="Убрать одну штуку">−</button>' +
                    '<span class="stepper-qty fw-bold text-purple text-nowrap" aria-live="polite"></span>' +
                    '<button type="button" class="btn btn-outline-purple fw-bold px-3" data-step="1" aria-label="Добавить ещё одну штуку">+</button>' +
                '</div>' +
                '<a href="order.html" class="d-block small mt-2 link-secondary">Перейти в корзину →</a>';
            addButton.insertAdjacentElement('afterend', stepper);

            function product() {
                return {
                    id: card.dataset.productId,
                    name: card.dataset.name,
                    price: Number(card.dataset.price),
                    size: sizeSelect ? sizeSelect.value : '',
                    img: img ? img.getAttribute('src') : ''
                };
            }

            function render() {
                var p = product();
                var cart = getCart();
                var i = findIndex(cart, p.id, p.size);
                var qty = i === -1 ? 0 : cart[i].qty;
                toggle(addButton, qty === 0);
                toggle(stepper, qty > 0);
                stepper.querySelector('.stepper-qty').textContent =
                    qty + ' шт.' + (p.size ? ' · ' + p.size : '') + ' · ' + money(p.price * qty);
            }

            addButton.addEventListener('click', function () {
                var p = product();
                changeQty(p, 1);
                render();
                toast('Добавлено: ' + escapeHtml(p.name) + (p.size ? ' (' + escapeHtml(p.size) + ')' : '') +
                      ' · <a href="order.html" class="link-light fw-bold">Оформить заказ →</a>');
            });

            stepper.addEventListener('click', function (e) {
                var button = e.target.closest('button[data-step]');
                if (!button) return;
                changeQty(product(), Number(button.dataset.step));
                render();
            });

            // Другой размер — другая позиция в корзине
            if (sizeSelect) sizeSelect.addEventListener('change', render);

            render();
        });
    }

    /* ---------- Поиск на странице «Одежда» ---------- */
    function initSearch() {
        var form = $('search-form');
        var input = $('search-input');
        if (!form || !input) return;

        function filter() {
            var query = input.value.trim().toLowerCase();
            var found = 0;
            document.querySelectorAll('main article[data-product-id]').forEach(function (card) {
                var desc = card.querySelector('p.text-muted');
                var text = (card.dataset.name + ' ' + (desc ? desc.textContent : '')).toLowerCase();
                var match = text.indexOf(query) !== -1;
                card.parentElement.classList.toggle('d-none', !match);
                if (match) found++;
            });
            document.querySelectorAll('main section[id]').forEach(function (section) {
                var cards = section.querySelectorAll('article[data-product-id]');
                if (!cards.length) return;
                var visible = Array.prototype.some.call(cards, function (c) {
                    return !c.parentElement.classList.contains('d-none');
                });
                section.classList.toggle('d-none', !visible);
            });
            toggle($('search-empty'), found === 0);
        }

        form.addEventListener('submit', function (e) { e.preventDefault(); filter(); });
        input.addEventListener('input', filter);
        var q = param('q');
        if (q) { input.value = q; filter(); }
    }

    /* ---------- Карточка заказа (подтверждение и «Мои заказы») ---------- */
    function orderHtml(order) {
        var items = order.items.map(function (item) {
            return '<li>' + escapeHtml(item.name) + (item.size ? ' (' + escapeHtml(item.size) + ')' : '') +
                   ' — ' + money(item.price) + ' × ' + item.qty + ' = <strong>' + money(item.price * item.qty) + '</strong></li>';
        }).join('');
        return '<div class="border rounded-3 p-3 mb-3">' +
            '<div class="d-flex flex-wrap justify-content-between gap-2 mb-2">' +
                '<strong class="text-purple">Заказ ' + escapeHtml(order.id) + '</strong>' +
                '<span class="badge ' + (order.paid ? 'bg-success' : 'bg-secondary') + '">' + (order.paid ? 'Оплачен' : 'Оплата при получении') + '</span>' +
                '<span class="small text-muted">' + new Date(order.date).toLocaleString('ru-RU') + '</span>' +
            '</div>' +
            '<ul class="small mb-2">' + items + '</ul>' +
            '<p class="small mb-1"><strong>Товары:</strong> ' + money(order.subtotal) + '</p>' +
            '<p class="small mb-1"><strong>Доставка:</strong> ' + escapeHtml(order.address) + ' — ' + (order.delivery ? money(order.delivery) : 'бесплатно') + '</p>' +
            '<p class="small mb-1"><strong>Оплата:</strong> ' + escapeHtml(PAYMENT_NAMES[order.payment] || order.payment) + '</p>' +
            '<p class="small mb-1"><strong>Статус:</strong> ' + escapeHtml(order.status) + '</p>' +
            '<p class="fw-bold mb-0">Итого: ' + money(order.total) + '</p>' +
        '</div>';
    }

    /* ---------- Шаги оформления: 1 корзина, 2 данные, 3 оплата, 4 готово ---------- */
    function setStep(step) {
        ['step-cart', 'step-details', 'step-pay', 'step-done'].forEach(function (id, i) {
            var li = $(id);
            if (!li) return;
            li.classList.toggle('done', i + 1 < step);
            li.classList.toggle('active', i + 1 === step);
            if (i + 1 === step) li.setAttribute('aria-current', 'step');
            else li.removeAttribute('aria-current');
        });
    }

    /* ---------- Страница «Корзина и заказ» (корзина + оплата + кабинет + подтверждение) ---------- */
    function initOrderPage() {
        var form = $('checkout-form');
        if (!form) return;
        var prefilled = false;
        var pending = null;   // заказ, который ждёт оплаты

        function selectedDelivery() {
            return form.querySelector('input[name="delivery"]:checked').value;
        }

        /* --- Корзина и итог --- */
        function renderCart() {
            var cart = getCart();
            var user = currentUser();
            var list = $('cart-items');
            list.innerHTML = '';

            cart.forEach(function (item, index) {
                var li = document.createElement('li');
                li.className = 'd-flex gap-3 align-items-center py-3 border-bottom';
                li.innerHTML =
                    '<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.name) + '" width="64" height="64" class="rounded bg-light object-fit-contain flex-shrink-0">' +
                    '<div class="flex-grow-1">' +
                        '<div class="fw-bold">' + escapeHtml(item.name) + '</div>' +
                        '<div class="small text-muted">' + (item.size ? 'Размер: ' + escapeHtml(item.size) + ' · ' : '') + money(item.price) + ' × ' + item.qty + '</div>' +
                        '<div class="fw-bold text-purple">' + money(item.price * item.qty) + '</div>' +
                    '</div>' +
                    '<div class="d-flex align-items-center gap-1">' +
                        '<button type="button" class="btn btn-sm btn-outline-purple" data-action="minus" data-index="' + index + '" aria-label="Уменьшить количество">−</button>' +
                        '<span class="fw-bold px-2">' + item.qty + '</span>' +
                        '<button type="button" class="btn btn-sm btn-outline-purple" data-action="plus" data-index="' + index + '" aria-label="Увеличить количество">+</button>' +
                        '<button type="button" class="btn btn-sm btn-outline-danger ms-1" data-action="remove" data-index="' + index + '" aria-label="Удалить товар">×</button>' +
                    '</div>';
                list.appendChild(li);
            });

            var empty = cart.length === 0;
            toggle($('cart-empty'), empty);
            toggle($('login-required'), !empty && !user);
            toggle(form, !empty && !!user);

            // Подставляем данные из профиля один раз
            if (user && !prefilled) {
                $('fullName').value = user.name;
                $('phone').value = user.phone;
                if (user.lastAddress) $('address').value = user.lastAddress;
                prefilled = true;
            }

            var method = selectedDelivery();
            toggle($('address-block'), method === 'courier');

            var subtotal = cartSubtotal(cart);
            var delivery = deliveryCost(subtotal, method);
            $('summary-count').textContent = cartCount(cart);
            $('subtotal').textContent = money(subtotal);
            $('delivery-cost').textContent = method === 'pickup' ? 'Самовывоз, 0 ₸' : (delivery === 0 && subtotal > 0 ? 'Бесплатно' : money(delivery));
            $('order-total').textContent = money(subtotal + delivery);

            var hint = $('free-delivery-hint');
            if (method === 'courier' && subtotal > 0 && subtotal < FREE_DELIVERY_FROM) {
                hint.textContent = 'Добавьте ещё на ' + money(FREE_DELIVERY_FROM - subtotal) + ' — доставка станет бесплатной.';
                show(hint);
            } else {
                hide(hint);
            }

            if (!pending) setStep(empty || !user ? 1 : 2);
            $('order-submit').disabled = empty || !user;
            $('submit-hint').textContent = empty ? 'Добавьте товары в корзину.'
                : (!user ? 'Чтобы оформить заказ, войдите в аккаунт ниже.' : 'Нажимая кнопку, вы подтверждаете заказ.');
        }

        /* --- Личный кабинет --- */
        function renderAccount() {
            var user = currentUser();
            toggle($('auth-section'), !user);
            toggle($('profile-section'), !!user);
            if (!user) return;
            $('profile-name').textContent = user.name;
            $('profile-email').textContent = user.email;
            $('profile-phone').textContent = user.phone;
            var orders = user.orders || [];
            toggle($('orders-empty'), orders.length === 0);
            $('orders-list').innerHTML = orders.map(orderHtml).join('');
        }

        /* --- Подтверждение заказа --- */
        function renderSuccess() {
            var id = param('order');
            var user = currentUser();
            var order = user && id ? (user.orders || []).find(function (o) { return o.id === id; }) : null;
            toggle($('order-success'), !!order);
            if (!order) return;
            $('success-title').textContent = 'Заказ ' + order.id + ' оформлен!';
            $('success-text').textContent = order.name + ', ' + (order.paid ? 'оплата прошла. ' : 'оплата при получении. ') +
                'Менеджер позвонит на ' + order.phone + ' в течение часа в рабочее время, чтобы согласовать доставку.';
            $('order-details').innerHTML = orderHtml(order);
            // Пока корзина пуста, прячем пустую корзину, чтобы не мешала подтверждению
            toggle($('checkout-area'), getCart().length > 0);
            if (!getCart().length) setStep(4);
        }

        function renderAll() {
            updateHeader();
            renderCart();
            renderAccount();
            renderSuccess();
        }

        /* --- Кнопки в корзине --- */
        $('cart-items').addEventListener('click', function (e) {
            var button = e.target.closest('button[data-action]');
            if (!button) return;
            var cart = getCart();
            var index = Number(button.dataset.index);
            var item = cart[index];
            if (!item) return;
            if (button.dataset.action === 'plus') {
                if (item.qty >= MAX_QTY) toast('Максимум ' + MAX_QTY + ' шт. одного товара в заказе.');
                else item.qty += 1;
            }
            if (button.dataset.action === 'minus') item.qty -= 1;
            if (button.dataset.action === 'remove' || item.qty < 1) cart.splice(index, 1);
            setCart(cart);
            renderCart();
        });

        form.querySelectorAll('input[name="delivery"]').forEach(function (radio) {
            radio.addEventListener('change', renderCart);
        });

        function setFieldError(id, hasError) {
            $(id).classList.toggle('is-invalid', hasError);
            return hasError;
        }

        /* --- Оформление заказа --- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var user = currentUser();
            var cart = getCart();
            if (!user || cart.length === 0) { renderCart(); return; }

            var method = selectedDelivery();
            var bad = false;
            bad = setFieldError('fullName', $('fullName').value.trim().length < 2) || bad;
            bad = setFieldError('phone', !isPhone($('phone').value)) || bad;
            bad = setFieldError('address', method === 'courier' && $('address').value.trim().length < 5) || bad;
            toggle($('checkout-error'), bad);
            if (bad) {
                form.querySelector('.is-invalid').focus();
                return;
            }

            var subtotal = cartSubtotal(cart);
            var delivery = deliveryCost(subtotal, method);
            pending = {
                items: cart,
                subtotal: subtotal,
                delivery: delivery,
                total: subtotal + delivery,
                method: method,
                address: method === 'courier' ? $('address').value.trim() : 'Самовывоз: ТД «Гулжан», бутик 246',
                name: $('fullName').value.trim(),
                phone: $('phone').value.trim(),
                comment: $('comment').value.trim()
            };
            openPayment();
        });

        /* --- Шаг «Оплата» --- */
        var payForm = $('payment-form');

        function selectedPayment() {
            var checked = payForm.querySelector('input[name="payment"]:checked');
            return checked ? checked.value : '';
        }

        function updatePayButton() {
            var method = selectedPayment();
            $('payment-submit').textContent = method === 'cash'
                ? 'Подтвердить заказ'
                : 'Оплатить ' + money(pending.total);
        }

        function openPayment() {
            hide($('checkout-area'));
            show($('payment-section'));
            show(payForm);
            hide($('payment-process'));
            hide($('payment-error'));
            setStep(3);
            $('pay-cash-title').textContent = pending.method === 'courier' ? 'Наличными курьеру' : 'Оплата в бутике при самовывозе';
            $('pay-summary').innerHTML = pending.items.map(function (item) {
                return '<div class="d-flex justify-content-between gap-2 mb-1"><span>' + escapeHtml(item.name) +
                       (item.size ? ' (' + escapeHtml(item.size) + ')' : '') + ' × ' + item.qty + '</span><span>' +
                       money(item.price * item.qty) + '</span></div>';
            }).join('') +
            '<div class="d-flex justify-content-between gap-2 mt-2 pt-2 border-top"><span>Доставка</span><span>' +
                (pending.delivery ? money(pending.delivery) : 'бесплатно') + '</span></div>';
            $('pay-total').textContent = money(pending.total);
            updatePayButton();
            if ($('payment-section').scrollIntoView) $('payment-section').scrollIntoView({ behavior: 'smooth' });
        }

        function closePayment() {
            pending = null;
            hide($('payment-section'));
            show($('checkout-area'));
            renderCart();
        }

        payForm.querySelectorAll('input[name="payment"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                hide($('payment-error'));
                updatePayButton();
            });
        });

        $('payment-back').addEventListener('click', closePayment);

        // Тексты экрана подтверждения для каждого способа
        function processInfo(method) {
            var sum = money(pending.total);
            var info = {
                kaspi: {
                    title: 'Оплата через Kaspi.kz',
                    text: 'Счёт на ' + sum + ' отправлен в приложение Kaspi.kz на номер ' + pending.phone +
                          '. Откройте «Платежи» → «Счета к оплате», подтвердите оплату и нажмите кнопку ниже.',
                    button: 'Я оплатил(а)',
                    wait: false
                },
                halyk: {
                    title: 'Оплата через Halyk Bank',
                    text: 'Подтвердите платёж ' + sum + ' в приложении Homebank. После подтверждения нажмите кнопку ниже.',
                    button: 'Платёж подтверждён',
                    wait: true
                },
                freedom: {
                    title: 'Оплата через Freedom Bank',
                    text: 'Подтвердите платёж ' + sum + ' в приложении Freedom. После подтверждения нажмите кнопку ниже.',
                    button: 'Платёж подтверждён',
                    wait: true
                },
                applepay: {
                    title: 'Apple Pay',
                    text: 'Подтвердите оплату ' + sum + ' на iPhone или Mac с помощью Face ID или Touch ID.',
                    button: 'Подтвердить Apple Pay',
                    wait: false
                },
                card: {
                    title: 'Оплата банковской картой',
                    text: 'Данные карты вводятся на защищённой странице банка — ASLSTORE.KZ их не видит и не хранит. Подтвердите платёж ' + sum + ' кодом из SMS.',
                    button: 'Подтвердить оплату',
                    wait: true
                }
            };
            return info[method];
        }

        payForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var method = selectedPayment();
            if (!method) {
                show($('payment-error'));
                return;
            }
            if (method === 'cash') {
                finishOrder('cash', false);
                return;
            }
            var info = processInfo(method);
            hide(payForm);
            show($('payment-process'));
            $('process-title').textContent = info.title;
            $('process-text').textContent = info.text;
            $('process-confirm').textContent = info.button;
            $('process-confirm').dataset.method = method;
            // Банк «соединяется» пару секунд, потом можно подтвердить
            toggle($('process-loading'), info.wait);
            $('process-confirm').disabled = info.wait;
            if (info.wait) {
                setTimeout(function () {
                    hide($('process-loading'));
                    $('process-confirm').disabled = false;
                }, 1500);
            }
        });

        $('process-cancel').addEventListener('click', function () {
            hide($('payment-process'));
            show(payForm);
            toast('Оплата отменена. Выберите другой способ или попробуйте снова.');
        });

        $('process-confirm').addEventListener('click', function () {
            finishOrder($('process-confirm').dataset.method, true);
        });

        /* --- Заказ оформляется только здесь: после оплаты или выбора «при получении» --- */
        function finishOrder(payment, paid) {
            var user = currentUser();
            if (!user || !pending) return;
            var order = {
                id: 'ASL-' + String(Date.now()).slice(-6),
                date: new Date().toISOString(),
                items: pending.items,
                subtotal: pending.subtotal,
                delivery: pending.delivery,
                total: pending.total,
                method: pending.method,
                address: pending.address,
                payment: payment,
                paid: paid,
                name: pending.name,
                phone: pending.phone,
                comment: pending.comment,
                status: paid ? 'Оплачен, собираем заказ' : 'Принят, оплата при получении'
            };
            user.orders = user.orders || [];
            user.orders.unshift(order);
            if (order.method === 'courier') user.lastAddress = order.address;
            saveUser(user);
            setCart([]);
            pending = null;
            // Та же страница, но с номером заказа — показываем подтверждение
            window.location.href = 'order.html?order=' + encodeURIComponent(order.id) + '#order-success';
        }

        /* --- Вход --- */
        function fail(box, message) {
            box.textContent = message;
            show(box);
        }

        function afterLogin(message) {
            prefilled = false;
            renderAll();
            toast(message);
            // Если в корзине есть товары — сразу ведём к оформлению
            var target = getCart().length ? $('cart-section') : $('account');
            if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth' });
        }

        $('login-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var box = $('login-error');
            var email = $('login-email').value.trim().toLowerCase();
            var password = $('login-password').value;
            if (!email || !password) return fail(box, 'Введите email и пароль.');
            var user = getUsers()[email];
            if (!user || user.pass !== hashPassword(password)) return fail(box, 'Неверный email или пароль.');
            hide(box);
            save(KEYS.session, email);
            afterLogin('Вы вошли как ' + escapeHtml(user.name.split(' ')[0]) + '.');
        });

        /* --- Регистрация --- */
        $('register-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var box = $('register-error');
            var name = $('reg-name').value.trim();
            var phone = $('reg-phone').value.trim();
            var email = $('reg-email').value.trim().toLowerCase();
            var password = $('reg-password').value;
            if (name.length < 2) return fail(box, 'Введите имя (минимум 2 буквы).');
            if (!isPhone(phone)) return fail(box, 'Введите телефон: 11 цифр, например +7 700 000 00 00.');
            if (!isEmail(email)) return fail(box, 'Введите корректный email, например example@mail.kz.');
            if (password.length < 6) return fail(box, 'Пароль должен быть не короче 6 символов.');
            if (password !== $('reg-password2').value) return fail(box, 'Пароли не совпадают.');
            if (getUsers()[email]) return fail(box, 'Аккаунт с таким email уже есть. Войдите слева.');
            hide(box);
            saveUser({ name: name, phone: phone, email: email, pass: hashPassword(password), orders: [], created: new Date().toISOString() });
            save(KEYS.session, email);
            afterLogin('Аккаунт создан. Добро пожаловать, ' + escapeHtml(name.split(' ')[0]) + '!');
        });

        /* --- Выход --- */
        $('logout-btn').addEventListener('click', function () {
            try { localStorage.removeItem(KEYS.session); } catch (err) { /* нет доступа — ничего */ }
            prefilled = false;
            $('fullName').value = '';
            $('phone').value = '';
            $('address').value = '';
            renderAll();
        });

        renderAll();
    }

    /* ---------- Форма вопроса на странице «О нас» ---------- */
    function initFeedback() {
        var form = $('feedback-form');
        if (!form) return;
        var user = currentUser();
        if (user) {
            if (!$('fb-name').value) $('fb-name').value = user.name;
            if (!$('fb-phone').value) $('fb-phone').value = user.phone;
        }
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var ok = $('fb-name').value.trim().length >= 2 && isPhone($('fb-phone').value) && $('fb-message').value.trim().length > 0;
            toggle($('feedback-error'), !ok);
            hide($('feedback-success'));
            if (!ok) return;
            $('feedback-success').textContent = 'Спасибо, ' + $('fb-name').value.trim() +
                '! Вопрос отправлен. Мы перезвоним на ' + $('fb-phone').value.trim() + ' в рабочее время.';
            show($('feedback-success'));
            $('fb-message').value = '';
        });
    }

    /* ---------- Кнопка «Назад»: на предыдущую страницу сайта, иначе на главную ---------- */
    function initBackButton() {
        document.querySelectorAll('.js-back').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var fromOurSite = document.referrer && document.referrer.indexOf(window.location.host) !== -1;
                if (fromOurSite && window.history.length > 1) {
                    e.preventDefault();
                    window.history.back();
                }
            });
        });
    }

    /* ---------- Логотипы банков: если файла нет, остаётся буква на цвете банка ---------- */
    function initPayLogos() {
        document.querySelectorAll('.pay-logo img').forEach(function (img) {
            if (img.complete && img.naturalWidth === 0) img.remove();
            else img.addEventListener('error', function () { img.remove(); });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateHeader();
        initBackButton();
        initPayLogos();
        initCatalog();
        initSearch();
        initOrderPage();
        initFeedback();
    });
})();