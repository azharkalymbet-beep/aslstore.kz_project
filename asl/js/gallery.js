'use strict';

/* ==========================================================================
   gallery.js · jQuery — увеличение фото товара (index, clothing, shoesandacc, sale)
   Покупатель нажимает на фото — оно плавно увеличивается, чтобы рассмотреть принт.
   Повторное нажатие (или Escape) возвращает обычный размер. Открыто только одно фото.
   Чистого JS здесь нет: только jQuery-селекторы, обход DOM, цепочки и эффекты.
   CSS не меняем: размер меняет эффект .animate(), состояние «увеличено» — класс selected
   из base.css (проверяем через .hasClass()).
   ========================================================================== */

const ZOOM = { normal: 200, large: 420, speed: 300 }; // px и мс: обычная и увеличенная высота фото

// Название товара для подписи: от фото поднимаемся к карточке и ищем внутри заголовок
function productTitle($img) {
    return $img.closest('.product-card').find('.card-title').first().text();
}

// Уменьшить фото обратно
function zoomOut($img) {
    $img.siblings('.badge').fadeIn(ZOOM.speed);   // бейдж скидки снова виден (на sale.html)
    return $img
        .removeClass('selected')                  // 1) больше не «увеличено»
        .attr('aria-label', `Увеличить фото: ${productTitle($img)}`) // 2) подсказка для экранного диктора
        .stop(true)                               // 3) остановить незаконченную анимацию
        .animate({ maxHeight: ZOOM.normal }, ZOOM.speed, function () {
            $(this).removeAttr('style');          // callback после анимации: вернуть размер из CSS
        });
}

// Увеличить фото
function zoomIn($img) {
    $img.siblings('.badge').fadeOut(ZOOM.speed);  // бейдж «−50%» не закрывает увеличенное фото
    return $img
        .addClass('selected')
        .attr('aria-label', `Уменьшить фото: ${productTitle($img)}`)
        .stop(true)
        .animate({ maxHeight: ZOOM.large }, ZOOM.speed);
}

/* jQuery 3.7.1 подключён с CDN перед этим файлом.
   $(function () { … }) — короткая форма $(document).ready(): код запустится, когда HTML загружен. */
$(function () {
    const $images = $('main .product-img');
    if ($images.length === 0) {
        return; // на странице нет фото товаров
    }

    // Фото можно открыть и с клавиатуры: Tab до фото, затем Enter или пробел.
    // role="button" ещё и даёт курсор-руку: это правило уже есть в Bootstrap (reboot), CSS не трогаем.
    $images.each(function () {
        $(this).attr({ tabindex: '0', role: 'button', 'aria-label': `Увеличить фото: ${productTitle($(this))}` });
    });

    /* Делегирование: обработчик на <main>, а не на каждом фото. Каталог (catalog.js) переставляет
       карточки при сортировке — обработчик на родителе продолжает работать для всех фото. */
    $('main').on('click', '.product-img', function () {
        const $img = $(this);                              // фото, по которому кликнули
        if ($img.hasClass('selected')) {
            zoomOut($img);
        } else {
            zoomOut($('main .product-img.selected').not($img)); // другое открытое фото закрываем
            zoomIn($img);
        }
    });

    $('main').on('keydown', '.product-img', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();          // пробел иначе прокрутил бы страницу
            $(this).trigger('click');
        }
    });

    // Escape закрывает увеличенное фото
    $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
            zoomOut($('main .product-img.selected'));
        }
    });
});
