'use strict';

/* ==========================================================================
   quickview.js · jQuery — «Быстрый просмотр» товара (index, clothing, shoesandacc, sale)
   Как у Nike/Adidas: на каждой карточке кнопка «Быстрый просмотр». Она открывает окно
   с большим фото, ценой (и старой ценой со скидкой), описанием и размерами-кнопками.
   Особенно полезно для обуви и скидок: там на карточке нет выбора размера, а здесь есть.
   Окно собирается кодом из классов Bootstrap (.modal, .modal-dialog …), HTML не меняем.
   Закрыть: крестик, клик по затемнению или Escape. Чистого JS здесь нет.
   ========================================================================== */

const QUICK_VIEW = { speed: 200 }; // мс

let $quickOpener = null; // кнопка, с которой открыли окно — вернём на неё фокус

// Окно создаётся один раз
function buildQuickView() {
    const $modal = $('<div>')
        .addClass('modal d-block')
        .attr({ id: 'quick-view', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'qv-title', tabindex: '-1' })
        .hide();

    const $info = $('<div>').addClass('col-12 col-md-6 d-flex flex-column').append(
        $('<p>').addClass('fs-4 fw-bold text-purple mb-1 js-qv-price'),
        $('<p>').addClass('text-muted mb-3 js-qv-desc'),
        $('<p>').addClass('small fw-bold mb-2 js-qv-size-label').text('Размер'),
        $('<div>').addClass('d-flex flex-wrap gap-2 mb-2 js-qv-sizes').attr({ role: 'group', 'aria-label': 'Размер' }),
        $('<p>').addClass('small text-danger mb-2 hidden js-qv-error').attr('role', 'alert'),
        $('<button>').attr('type', 'button').addClass('btn btn-purple btn-lg mt-auto js-qv-add').text('В корзину'),
        $('<p>').addClass('small text-muted mt-2 mb-0').text('Курьер по Астане — 1 500 ₸, от 30 000 ₸ бесплатно. Самовывоз из бутика 246.')
    );

    $('<div>')
        .addClass('modal-dialog modal-dialog-centered modal-lg')
        .append(
            $('<div>').addClass('modal-content').append(
                $('<div>').addClass('modal-header').append(
                    $('<h2>').addClass('modal-title h5 text-purple fw-bold').attr('id', 'qv-title'),
                    $('<button>').attr({ type: 'button', 'aria-label': 'Закрыть' }).addClass('btn-close js-qv-close')
                ),
                $('<div>').addClass('modal-body').append(
                    $('<div>').addClass('row g-4').append(
                        $('<div>').addClass('col-12 col-md-6 text-center').append(
                            $('<img>').addClass('img-fluid rounded-3 js-qv-img').attr('alt', '')
                        ),
                        $info
                    )
                )
            )
        )
        .appendTo($modal);

    $('body').append($('<div>').addClass('modal-backdrop show').attr('id', 'quick-view-backdrop').hide(), $modal);
    return $modal;
}

// Заполнить окно данными товара: из массива PRODUCTS (data.js) и из самой карточки
function fillQuickView($modal, product, $card) {
    $modal.attr('data-product-id', product.id);
    $modal.find('#qv-title').text(product.name);
    $modal.find('.js-qv-img').attr({ src: $card.find('.product-img').attr('src'), alt: product.name });

    const $price = $modal.find('.js-qv-price').text(formatPrice(product.price));
    if (product.oldPrice) {
        const percent = Math.round((1 - product.price / product.oldPrice) * 100);
        $price.append(' ', $('<s>').addClass('fs-6 text-danger fw-normal').text(formatPrice(product.oldPrice)),
            ' ', $('<span>').addClass('badge bg-danger fs-6').text(`−${percent}%`));
    }
    const description = $card.find('.card-body p.text-muted').first().text();
    $modal.find('.js-qv-desc').text(description).toggleClass('hidden', description === '');

    // Размеры-кнопки генерируются циклом из product.sizes
    const $sizes = $modal.find('.js-qv-sizes').empty();
    const cardSize = $card.find('.size-select').val() || '';
    $.each(product.sizes, function (index, size) {
        $('<button>')
            .attr({ type: 'button', 'aria-pressed': String(size === cardSize), 'data-size': size })
            .addClass('btn btn-outline-purple js-qv-size')
            .toggleClass('active', size === cardSize)
            .text(size)
            .appendTo($sizes);
    });
    $modal.find('.js-qv-size-label').toggleClass('hidden', product.sizes.length === 0);
    $sizes.toggleClass('hidden', product.sizes.length === 0);
    $modal.find('.js-qv-error').addClass('hidden').text('');
}

function openQuickView($opener) {
    const $card = $opener.closest('.product-card');
    const product = findProduct($card.attr('data-product-id'));
    if (product === null) {
        return;
    }
    const $modal = $('#quick-view').length ? $('#quick-view') : buildQuickView();
    fillQuickView($modal, product, $card);
    $quickOpener = $opener;

    $('body').addClass('overflow-hidden');               // страница под окном не прокручивается
    $('#quick-view-backdrop').stop(true).fadeTo(QUICK_VIEW.speed, 0.5);
    $modal.stop(true).fadeIn(QUICK_VIEW.speed, function () {
        $(this).find('.js-qv-close').trigger('focus');   // callback: фокус в окно, когда оно появилось
    });
}

function closeQuickView(afterClose) {
    $('#quick-view-backdrop').stop(true).fadeOut(QUICK_VIEW.speed);
    $('#quick-view').stop(true).fadeOut(QUICK_VIEW.speed, function () {
        $('body').removeClass('overflow-hidden');
        if ($quickOpener) {
            $quickOpener.trigger('focus');                // фокус обратно на кнопку карточки
        }
        if (afterClose) {
            afterClose();
        }
    });
}

/* jQuery 3.7.1 подключён с CDN перед этим файлом. $(function () { … }) = $(document).ready(). */
$(function () {
    const $cards = $('main .product-card');
    if ($cards.length === 0) {
        return;
    }

    // На каждую карточку — кнопка «Быстрый просмотр» сразу после «В корзину»
    $cards.each(function () {
        const $card = $(this);
        $('<button>')
            .attr({ type: 'button', 'aria-label': `Быстрый просмотр: ${$card.find('.card-title').text()}` })
            .addClass('btn btn-sm btn-outline-purple mt-2 js-quick-view')
            .text('Быстрый просмотр')
            .insertAfter($card.find('.add-to-cart'));
    });

    // Делегирование: и кнопки, и окно созданы кодом
    $('main').on('click', '.js-quick-view', function () {
        openQuickView($(this));
    });

    // Выбор размера: нажатая кнопка активна, соседние — нет
    $('body').on('click', '.js-qv-size', function () {
        $(this)
            .addClass('active')                 // 1) подсветить выбранный размер
            .attr('aria-pressed', 'true')       // 2) отметить для экранного диктора
            .siblings('.js-qv-size')            // 3) перейти к остальным размерам
            .removeClass('active')              // 4) снять с них подсветку
            .attr('aria-pressed', 'false');     // 5) и отметку
        $('#quick-view .js-qv-error').slideUp(150, function () { $(this).addClass('hidden').removeAttr('style'); });
    });

    // «В корзину» в окне
    $('body').on('click', '.js-qv-add', function () {
        const $modal = $(this).closest('#quick-view');
        const productId = $modal.attr('data-product-id');
        const product = findProduct(productId);
        const $chosen = $modal.find('.js-qv-size.active');
        const $error = $modal.find('.js-qv-error');

        if (hasSizes(product) && $chosen.length === 0) {
            $error.text('Выберите размер').hide().removeClass('hidden').slideDown(150);
            $modal.find('.js-qv-size').first().trigger('focus');
            return;
        }
        const size = $chosen.length ? $chosen.attr('data-size') : '';
        const result = addToCart(productId, size);        // расчёт из data.js
        if (!result.added) {
            $error.text(`В корзине уже ${MAX_QTY} шт. — это максимум`).hide().removeClass('hidden').slideDown(150);
            return;
        }
        refreshBadge();                                   // из minicart.js
        const $card = $('main .product-card[data-product-id="' + productId + '"]');
        $card.find('.size-select').val(size);             // размер на карточке тоже обновится
        const imageSrc = $modal.find('.js-qv-img').attr('src');
        closeQuickView(function () {
            showMiniCart(productId, size, imageSrc);       // callback: после закрытия окна — мини-корзина
        });
    });

    // Закрыть: крестик, клик по затемнению вокруг окна, Escape
    $('body').on('click', '.js-qv-close', function () { closeQuickView(); });
    $('body').on('click', '#quick-view', function (event) {
        if ($(event.target).is('#quick-view')) {
            closeQuickView();                             // кликнули по фону, а не по самому окну
        }
    });
    $(document).on('keydown', function (event) {
        if (event.key === 'Escape' && $('#quick-view').is(':visible')) {
            closeQuickView();
        }
    });
});
