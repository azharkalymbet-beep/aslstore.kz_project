'use strict';

/* ==========================================================================
   minicart.js · jQuery — мини-корзина «Добавлено в корзину»
   (index, clothing, shoesandacc, sale)
   Как у Nike: после нажатия «В корзину» в правом верхнем углу выезжает панель
   с фото товара, размером, ценой, суммой корзины и полосой до бесплатной доставки.
   Кнопки: «Оформить заказ» и «Продолжить покупки». Панель сама скрывается через
   5 секунд; если навести на неё мышь — ждёт. Панель создаётся кодом из классов Bootstrap.
   Чистого JS здесь нет. Из data.js берём только данные и расчёты (без DOM).
   ========================================================================== */

const MINI_CART = { hideAfter: 5000, speed: 250 }; // мс

let miniCartTimer = null;

// Счётчик корзины в шапке (jQuery-версия — для покупок из быстрого просмотра)
function refreshBadge() {
    const count = countItems(loadCart());
    $('#cart-count')
        .text(count)
        .attr('data-count', count)
        .toggleClass('hidden', count === 0);
    return count;
}

// Панель создаётся один раз и потом только заполняется
function buildMiniCart() {
    const $toast = $('<div>')
        .addClass('toast show')
        .attr({ id: 'mini-cart', role: 'status', 'aria-live': 'polite' })
        .hide();

    $('<div>')
        .addClass('toast-header')
        .append(
            $('<strong>').addClass('me-auto text-purple').text('✓ Добавлено в корзину'),
            $('<button>').attr({ type: 'button', 'aria-label': 'Закрыть' }).addClass('btn-close js-mini-close')
        )
        .appendTo($toast);

    $('<div>')
        .addClass('toast-body')
        .append(
            $('<div>').addClass('d-flex gap-3 align-items-center mb-3').append(
                $('<img>').addClass('img-thumbnail w-25 flex-shrink-0 js-mini-img').attr('alt', ''),
                $('<div>').append(
                    $('<p>').addClass('fw-bold mb-1 js-mini-name'),
                    $('<p>').addClass('small text-muted mb-0 js-mini-line')
                )
            ),
            $('<p>').addClass('small mb-1 js-mini-total'),
            $('<progress>').addClass('w-100 js-mini-progress').attr({ max: FREE_DELIVERY_FROM, value: 0 }),
            $('<p>').addClass('small text-muted mb-3 js-mini-delivery'),
            $('<div>').addClass('d-flex gap-2').append(
                $('<a>').addClass('btn btn-purple btn-sm flex-fill').attr('href', 'order.html').text('Оформить заказ'),
                $('<button>').attr('type', 'button').addClass('btn btn-outline-purple btn-sm flex-fill js-mini-close').text('Продолжить покупки')
            )
        )
        .appendTo($toast);

    // toast-container из Bootstrap: фиксирован в углу и стоит поверх шапки
    $('<div>').addClass('toast-container position-fixed top-0 end-0 p-3').append($toast).appendTo('body');
    return $toast;
}

function hideMiniCart() {
    clearTimeout(miniCartTimer);
    $('#mini-cart').stop(true).fadeOut(MINI_CART.speed);
}

function startHideTimer() {
    clearTimeout(miniCartTimer);
    miniCartTimer = setTimeout(hideMiniCart, MINI_CART.hideAfter);
}

// Показать панель для только что добавленного товара
function showMiniCart(productId, size, imageSrc) {
    const product = findProduct(productId);
    if (product === null) {
        return;
    }
    const cart = loadCart();
    const line = cart.find((item) => item.id === productId && item.size === size);
    const qty = line ? line.qty : 0;
    const subtotal = calcSubtotal(cart);
    const left = FREE_DELIVERY_FROM - subtotal;

    let sizeText = size !== '' ? `Размер ${size}` : 'Без размера';
    if (size === '' && hasSizes(product)) {
        sizeText = 'Размер выберете в корзине';
    }
    const maxNote = qty >= MAX_QTY ? ' — это максимум' : '';

    const $panel = $('#mini-cart').length ? $('#mini-cart') : buildMiniCart();
    $panel.find('.js-mini-img').attr({ src: imageSrc, alt: product.name });
    $panel.find('.js-mini-name').text(product.name);
    $panel.find('.js-mini-line').text(`${sizeText} · ${formatPrice(product.price)} · в корзине ${qty} шт.${maxNote}`);
    $panel.find('.js-mini-total').text(`В корзине товаров на ${formatPrice(subtotal)}`);
    $panel.find('.js-mini-progress').attr('value', Math.min(subtotal, FREE_DELIVERY_FROM));
    $panel.find('.js-mini-delivery').text(left > 0
        ? `До бесплатной доставки по Астане: ${formatPrice(left)}`
        : 'Доставка по Астане будет бесплатной');

    $panel.stop(true).fadeIn(MINI_CART.speed); // плавно показать
    startHideTimer();
}

/* jQuery 3.7.1 подключён с CDN перед этим файлом.
   $(function () { … }) — короткая форма $(document).ready(). */
$(function () {
    if ($('main .add-to-cart').length === 0) {
        return; // на странице нет товаров
    }

    /* Делегирование на <main>: товар в корзину уже положил main.js (чистый JS),
       этот обработчик срабатывает следом на тот же клик и только показывает панель. */
    $('main').on('click', '.add-to-cart', function () {
        const $card = $(this).closest('.product-card');      // карточка нажатой кнопки
        const size = $card.find('.size-select').val() || ''; // размер из её списка, если он есть
        showMiniCart($(this).attr('data-product-id'), size, $card.find('.product-img').attr('src'));
    });

    // Закрыть: крестик или «Продолжить покупки» (кнопки созданы кодом → делегирование на body)
    $('body').on('click', '.js-mini-close', hideMiniCart);

    // Пока мышь на панели, она не исчезает
    $('body')
        .on('mouseenter', '#mini-cart', function () { clearTimeout(miniCartTimer); })
        .on('mouseleave', '#mini-cart', startHideTimer);
});
