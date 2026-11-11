'use strict';

/* ==========================================================================
   catalog.js · ЧИСТЫЙ JavaScript — каталог (clothing.html, shoesandacc.html)
   Поиск по названию + фильтр по разделам + сортировка.
   Показывает количество найденных товаров, состояние «ничего не найдено»
   и кнопку сброса. Данные берутся из массива PRODUCTS (data.js).
   ========================================================================== */

// Варианты сортировки — данные на вершине файла, список <option> строится циклом
const SORT_OPTIONS = [
    { value: 'default', label: 'Как в каталоге' },
    { value: 'price-asc', label: 'Сначала дешевле' },
    { value: 'price-desc', label: 'Сначала дороже' },
    { value: 'name', label: 'По названию (А–Я)' }
];

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

// Панель поиска создаётся через DOM (HTML не меняем)
function createCatalogToolbar() {
    const toolbar = createEl('div', 'bg-white p-3 rounded shadow-sm mb-4');
    const row = createEl('div', 'row g-2 align-items-end');

    const searchCol = createEl('div', 'col-12 col-md-6');
    const searchLabel = createEl('label', 'form-label small fw-bold mb-1', 'Поиск по названию');
    searchLabel.htmlFor = 'catalog-search';
    const searchInput = createEl('input', 'form-control');
    searchInput.type = 'search';
    searchInput.id = 'catalog-search';
    searchInput.placeholder = 'Например: худи, Corteiz, джинсы';
    searchInput.autocomplete = 'off';
    searchCol.append(searchLabel, searchInput);

    const sortCol = createEl('div', 'col-8 col-md-4');
    const sortLabel = createEl('label', 'form-label small fw-bold mb-1', 'Сортировка');
    sortLabel.htmlFor = 'catalog-sort';
    const sortSelect = createEl('select', 'form-select');
    sortSelect.id = 'catalog-sort';
    SORT_OPTIONS.forEach((option) => sortSelect.append(new Option(option.label, option.value)));
    sortCol.append(sortLabel, sortSelect);

    const resetCol = createEl('div', 'col-4 col-md-2 d-grid');
    const resetButton = createEl('button', 'btn btn-outline-purple', 'Сбросить');
    resetButton.type = 'button';
    resetCol.append(resetButton);

    row.append(searchCol, sortCol, resetCol);

    const countText = createEl('p', 'small text-muted mt-3 mb-0');
    countText.setAttribute('aria-live', 'polite');
    toolbar.append(row, countText);

    const emptyBox = createEl('div', 'bg-white border rounded-3 shadow-sm p-4 text-center text-muted mb-4 hidden');
    emptyBox.append(createEl('p', 'mb-2', 'Ничего не найдено. Попробуйте другой запрос или раздел.'));
    const emptyReset = createEl('button', 'btn btn-sm btn-purple', 'Показать все товары');
    emptyReset.type = 'button';
    emptyBox.append(emptyReset);

    return { toolbar, searchInput, sortSelect, resetButton, countText, emptyBox, emptyReset };
}

function initCatalog() {
    const filterNav = document.querySelector('nav[aria-label="Разделы каталога"]');
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    if (filterNav === null || filterButtons.length === 0) {
        return; // не страница каталога
    }

    const categories = filterButtons.map((button) => button.dataset.filter);
    const cardById = new Map();
    document.querySelectorAll('main .product-card').forEach((card) => {
        cardById.set(card.dataset.productId, card);
    });
    const pageProducts = PRODUCTS.filter((product) => cardById.has(product.id));
    const state = { query: '', category: 'all', sort: 'default' };

    const ui = createCatalogToolbar();
    filterNav.after(ui.toolbar);
    ui.toolbar.after(ui.emptyBox);

    function render() {
        const found = sortProducts(filterProducts(pageProducts, state), state.sort);
        const foundIds = new Set(found.map((product) => product.id));

        // Скрываем колонку карточки, если товар не подходит
        pageProducts.forEach((product) => {
            const column = cardById.get(product.id).parentElement;
            column.classList.toggle('hidden', !foundIds.has(product.id));
        });
        // Переставляем найденные карточки в нужном порядке (appendChild перемещает элемент)
        found.forEach((product) => {
            const column = cardById.get(product.id).parentElement;
            column.parentElement.appendChild(column);
        });
        // Прячем разделы, где ничего не осталось
        categories.forEach((category) => {
            const section = document.getElementById(category);
            if (section !== null) {
                section.classList.toggle('hidden', !found.some((product) => product.category === category));
            }
        });
        // Активная кнопка раздела
        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === state.category;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        const total = pageProducts.length;
        ui.countText.textContent = found.length === total
            ? `Показаны все ${total} ${pluralGoods(total)}`
            : `Найдено: ${found.length} ${pluralGoods(found.length)} из ${total}`;
        ui.emptyBox.classList.toggle('hidden', found.length > 0);
        ui.resetButton.disabled = state.query === '' && state.category === 'all' && state.sort === 'default';
    }

    function resetFilters() {
        state.query = '';
        state.category = 'all';
        state.sort = 'default';
        ui.searchInput.value = '';
        ui.sortSelect.value = 'default';
        render();
        ui.searchInput.focus();
    }

    // Делегирование: один обработчик на панели разделов для всех кнопок
    filterButtons.forEach((button) => button.setAttribute('role', 'button'));
    filterNav.addEventListener('click', (event) => {
        const button = event.target.closest('.filter-btn');
        if (button === null) {
            return; // «Таблица размеров» — обычная ссылка-якорь, её не трогаем
        }
        // Кнопки разделов — ссылки <a href="#tops">; без preventDefault страница прыгнула бы к якорю
        event.preventDefault();
        const category = button.dataset.filter;
        state.category = state.category === category ? 'all' : category; // повторный клик снимает фильтр
        render();
    });

    ui.searchInput.addEventListener('input', () => {
        state.query = ui.searchInput.value;
        render();
    });
    ui.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            ui.searchInput.value = '';
            state.query = '';
            render();
        }
    });
    ui.sortSelect.addEventListener('change', () => {
        state.sort = ui.sortSelect.value;
        render();
    });
    ui.resetButton.addEventListener('click', resetFilters);
    ui.emptyReset.addEventListener('click', resetFilters);

    // Пришли по ссылке вида clothing.html#hoodies — сразу включаем этот раздел
    const hashCategory = window.location.hash.slice(1);
    if (categories.includes(hashCategory)) {
        state.category = hashCategory;
    }
    render();
}

initCatalog();
