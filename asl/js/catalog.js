'use strict';

/* ==========================================================================
   catalog.js — каталог (clothing.html, shoesandacc.html), Assignment 6: jQuery
   Поиск по названию, фильтр по разделам, сортировка, счётчик результатов,
   состояние «ничего не найдено» и кнопка сброса. Данные — массив PRODUCTS (main.js).
   ========================================================================== */

/* --- Чистая логика (без DOM) --- */

// Отобрать товары по разделу и поисковому запросу
function filterProducts(products, state) {
    const query = state.query.trim().toLowerCase();
    return products.filter((product) => {
        const categoryOk = state.category === 'all' || product.category === state.category;
        const queryOk = query === '' || product.name.toLowerCase().includes(query);
        return categoryOk && queryOk;
    });
}

// Отсортировать копию массива (исходный порядок не меняем)
function sortProducts(products, sortMode) {
    const copy = products.slice();
    switch (sortMode) {
        case 'price-asc':
            copy.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            copy.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            break;
        default:
            break; // «как в каталоге»
    }
    return copy;
}

// 1 товар, 2 товара, 5 товаров
function pluralGoods(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
        return 'товар';
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return 'товара';
    }
    return 'товаров';
}

const SORT_OPTIONS = [
    { value: 'default', label: 'Как в каталоге' },
    { value: 'price-asc', label: 'Сначала дешевле' },
    { value: 'price-desc', label: 'Сначала дороже' },
    { value: 'name', label: 'По названию (А–Я)' }
];

/* --- jQuery: панель поиска создаётся кодом (в HTML её нет) --- */
function buildCatalogToolbar() {
    const $search = $('<input>', {
        type: 'search',
        id: 'catalog-search',
        class: 'form-control',
        placeholder: 'Например: худи, Corteiz, джинсы',
        autocomplete: 'off'
    });

    const $sort = $('<select>', { id: 'catalog-sort', class: 'form-select' });
    // Список вариантов сортировки генерируется из массива через .append()
    $.each(SORT_OPTIONS, function (index, option) {
        $sort.append($('<option>').val(option.value).text(option.label));
    });

    const $reset = $('<button>', { type: 'button', class: 'btn btn-outline-purple' }).text('Сбросить');

    const $row = $('<div>').addClass('row g-2 align-items-end').append(
        $('<div>').addClass('col-12 col-md-6').append(
            $('<label>').addClass('form-label small fw-bold mb-1').attr('for', 'catalog-search').text('Поиск по названию'),
            $search
        ),
        $('<div>').addClass('col-8 col-md-4').append(
            $('<label>').addClass('form-label small fw-bold mb-1').attr('for', 'catalog-sort').text('Сортировка'),
            $sort
        ),
        $('<div>').addClass('col-4 col-md-2 d-grid').append($reset)
    );

    const $count = $('<p>').addClass('small text-muted mt-3 mb-0').attr('aria-live', 'polite');
    const $toolbar = $('<div>').addClass('bg-white p-3 rounded shadow-sm mb-4').append($row, $count);

    const $emptyReset = $('<button>', { type: 'button', class: 'btn btn-sm btn-purple' }).text('Показать все товары');
    const $empty = $('<div>')
        .addClass('bg-white border rounded-3 shadow-sm p-4 text-center text-muted mb-4 hidden')
        .append($('<p>').addClass('mb-2').text('Ничего не найдено. Попробуйте другой запрос или раздел.'), $emptyReset);

    return { $toolbar, $search, $sort, $reset, $count, $empty, $emptyReset };
}

/* Документ готов — запускаем каталог (jQuery 3.7.1, см. комментарий в main.js) */
$(function () {
    const $filterNav = $('nav[aria-label="Разделы каталога"]'); // селектор по тегу и атрибуту
    const $filterButtons = $filterNav.find('.filter-btn');       // селектор по классу внутри nav
    if ($filterNav.length === 0 || $filterButtons.length === 0) {
        return; // не страница каталога
    }

    const categories = $filterButtons.map(function () {
        return $(this).attr('data-filter');
    }).get();

    const $cards = $('main .product-card');
    const cardById = {};
    $cards.each(function () {
        cardById[$(this).attr('data-product-id')] = $(this);
    });
    const pageProducts = PRODUCTS.filter((product) => cardById[product.id] !== undefined);
    const state = { query: '', category: 'all', sort: 'default' };

    const ui = buildCatalogToolbar();
    ui.$toolbar.insertAfter($filterNav);
    ui.$empty.insertAfter(ui.$toolbar);

    function render() {
        const found = sortProducts(filterProducts(pageProducts, state), state.sort);
        const foundIds = found.map((product) => product.id);

        // .parent() — колонка Bootstrap вокруг карточки: прячем/показываем её целиком
        $.each(pageProducts, function (index, product) {
            cardById[product.id].parent().toggleClass('hidden', !foundIds.includes(product.id));
        });
        // Переставляем найденные карточки в порядке сортировки (.append перемещает существующий элемент)
        $.each(found, function (index, product) {
            const $column = cardById[product.id].parent();
            $column.parent().append($column);
        });
        // Прячем разделы, в которых ничего не осталось
        $.each(categories, function (index, category) {
            $(`#${category}`).toggleClass('hidden', !found.some((product) => product.category === category));
        });

        // Подсветка активной кнопки раздела
        $filterButtons.removeClass('active').attr('aria-pressed', 'false');
        if (state.category !== 'all') {
            $filterButtons
                .filter(`[data-filter="${state.category}"]`) // 1) из всех кнопок оставляем одну — нужного раздела
                .addClass('active')                          // 2) подсвечиваем её (класс active из Bootstrap)
                .attr('aria-pressed', 'true')                // 3) сообщаем экранному диктору, что кнопка нажата
                .siblings('.filter-btn')                     // 4) переходим к соседним кнопкам в том же nav
                .attr('aria-pressed', 'false');              // 5) у них состояние «не нажата»
        }

        // Фильтр :not(.hidden) — считаем только видимые колонки с карточками
        const visibleCount = $cards.parent(':not(.hidden)').length;
        const total = pageProducts.length;
        ui.$count.text(visibleCount === total
            ? `Показаны все ${total} ${pluralGoods(total)}`
            : `Найдено: ${visibleCount} ${pluralGoods(visibleCount)} из ${total}`);

        if (visibleCount === 0) {
            revealBlock(ui.$empty, 300, 'fade'); // fadeIn: мягко показываем «ничего не найдено»
        } else {
            concealBlock(ui.$empty, 150, 'fade');
        }
        ui.$reset.prop('disabled', state.query === '' && state.category === 'all' && state.sort === 'default');
    }

    function resetFilters() {
        state.query = '';
        state.category = 'all';
        state.sort = 'default';
        ui.$search.val('');
        ui.$sort.val('default');
        render();
        ui.$search.trigger('focus');
    }

    $filterButtons.attr('role', 'button').on('click', function (event) {
        // preventDefault: кнопки разделов — это ссылки <a href="#tops">. Без него страница
        // прыгала бы к якорю, а мы хотим отфильтровать товары на месте.
        event.preventDefault();
        const category = $(this).attr('data-filter');               // $(this) — нажатая кнопка
        state.category = state.category === category ? 'all' : category; // повторный клик снимает фильтр
        render();
    });

    ui.$search.on('input', function () {
        state.query = $(this).val();
        render();
    });

    ui.$search.on('keyup', function (event) {
        if (event.key === 'Escape') {
            $(this).val('');
            state.query = '';
            render();
        }
    });

    ui.$sort.on('change', function () {
        state.sort = $(this).val();
        render();
    });

    ui.$reset.on('click', resetFilters);
    ui.$emptyReset.on('click', resetFilters);

    // Пришли по ссылке вида clothing.html#hoodies — сразу включаем этот раздел
    const hashCategory = window.location.hash.slice(1);
    if (categories.includes(hashCategory)) {
        state.category = hashCategory;
    }
    render();
});
