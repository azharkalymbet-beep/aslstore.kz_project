'use strict';

/* ==========================================================================
   ASLSTORE.KZ — main.js
   Общий код для ВСЕХ страниц (сквозная функция команды):
   - массив товаров PRODUCTS (единый источник цен и размеров);
   - корзина в localStorage: добавление, подсчёт, счётчик в шапке;
   - общие функции: форматирование цены, расчёт сумм и доставки,
     валидация имени/телефона/email, вывод ошибок рядом с полем;
   - кнопка «← Назад».
   Файлы страниц (catalog.js, order.js, feedback.js) используют эти функции,
   поэтому main.js подключается ПЕРВЫМ.
   ========================================================================== */

const STORAGE_KEY = 'asl_cart';
const MAX_QTY = 10;               // не больше 10 шт. одного товара
const FREE_DELIVERY_FROM = 30000; // бесплатная доставка от 30 000 ₸
const COURIER_PRICE = 1500;       // курьер по Астане

const CLOTHES_SIZES = ['S', 'M', 'L', 'XL'];
const JEANS_SIZES = ['28', '30', '32', '34'];
const NO_SIZE = [];

/* Все товары магазина. Каждый объект: id, name, price, category, sizes
   (у товаров со скидкой ещё oldPrice). id совпадают с data-product-id в HTML. */
const PRODUCTS = [
    // Одежда — футболки
    { id: 'amiri-dove', name: 'Футболка AMIRI Dove Black', price: 12500, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'npc-pixel', name: 'Футболка NPC Pixel Black', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'trapstar-polo', name: 'Футболка Trapstar Polo', price: 9000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'iammusic-tee', name: 'Футболка I am music', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'keef-2012', name: 'Футболка Chief Keef 2012 White', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    // Одежда — худи и свитшоты
    { id: 'hoodie-balaclava', name: 'Худи оверсайз с балаклавой', price: 22000, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'sweat-grunge', name: 'Винтажный свитшот Grunge', price: 18500, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'amiri-hoodie', name: 'Худи Amiri Hoodie', price: 14490, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'friendly-hoodie', name: 'Винтажный худи Friendly', price: 13490, category: 'hoodies', sizes: CLOTHES_SIZES },
    // Одежда — брюки и джинсы
    { id: 'jeans-baggy', name: 'Широкие джинсы Baggy Dark', price: 20000, category: 'bottoms', sizes: JEANS_SIZES },
    { id: 'cargo-utility', name: 'Брюки-карго Utility Black', price: 19000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'regular-fit-jeans', name: 'Джинсы черные Regular Fit Jeans', price: 12000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'sakura-jeans', name: 'Sakura Jeans', price: 15000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'vescartes-jeans', name: 'Vescartes Jeans', price: 18000, category: 'bottoms', sizes: CLOTHES_SIZES },
    // Обувь и аксессуары
    { id: 'nike-af1-nocta', name: 'Кроссовки Nike AF1 x Nocta', price: 19900, category: 'sneakers', sizes: ['37', '38', '39', '40', '41'] },
    { id: 'mmy-sneaker', name: 'Кроссовки MMY', price: 21490, category: 'sneakers', sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
    { id: 'cap-corteiz', name: 'Кепка Corteiz', price: 2990, category: 'caps', sizes: NO_SIZE },
    { id: 'cap-compton', name: 'Кепка Compton', price: 3490, category: 'caps', sizes: NO_SIZE },
    { id: 'cap-la', name: 'Кепка LA', price: 5790, category: 'caps', sizes: NO_SIZE },
    { id: 'bag-trapstar', name: 'Сумка Trapstar', price: 5790, category: 'bags', sizes: NO_SIZE },
    { id: 'bag-nike', name: 'Сумка Nike', price: 4490, category: 'bags', sizes: NO_SIZE },
    { id: 'pandora-spiderman', name: 'Браслет Pandora x Spider-Man', price: 7990, category: 'jewelry', sizes: NO_SIZE },
    { id: 'charm-1', name: 'Шарм для браслета Pandora №1', price: 1990, category: 'jewelry', sizes: NO_SIZE },
    { id: 'charm-2', name: 'Шарм для браслета Pandora №2', price: 1990, category: 'jewelry', sizes: NO_SIZE },
    { id: 'charm-3', name: 'Шарм для браслета Pandora №3', price: 1990, category: 'jewelry', sizes: NO_SIZE },
    { id: 'charm-4', name: 'Шарм для браслета Pandora №4', price: 1990, category: 'jewelry', sizes: NO_SIZE },
    // Скидки
    { id: 'sale-burberry', name: 'Куртка Burberry', price: 12495, oldPrice: 24990, category: 'outerwear-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-ami', name: 'Свитшот Ami', price: 6995, oldPrice: 13990, category: 'outerwear-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-polo', name: 'Свитер Polo Ralph Lauren', price: 11900, oldPrice: 14000, category: 'outerwear-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-corteiz-zip', name: 'Зип-худи Corteiz', price: 16000, oldPrice: 20000, category: 'outerwear-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-corteiz-tee', name: 'Футболка Corteiz', price: 6375, oldPrice: 7490, category: 'tees-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-boss-tee', name: 'Футболка BOSS', price: 5990, oldPrice: 6990, category: 'tees-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-dime-jeans', name: 'Джинсы Dime', price: 10400, oldPrice: 12990, category: 'bottoms-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-corteiz-shorts', name: 'Шорты Corteiz', price: 7910, oldPrice: 9890, category: 'bottoms-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-basic-pants', name: 'Брюки Basic Pants', price: 10790, oldPrice: 11990, category: 'bottoms-sale', sizes: CLOTHES_SIZES },
    { id: 'sale-tommy-backpack', name: 'Рюкзак Tommy Hilfiger', price: 12440, oldPrice: 17770, category: 'bags-sale', sizes: NO_SIZE },
    { id: 'sale-nike-bag', name: 'Сумка Nike', price: 5400, oldPrice: 5990, category: 'bags-sale', sizes: NO_SIZE }
];

/* ---------- Товары ---------- */

// Найти товар по id. Возвращает объект или null.
function findProduct(id) {
    return PRODUCTS.find((product) => product.id === id) || null;
}

// Есть ли у товара выбор размера
function hasSizes(product) {
    return product !== null && product.sizes.length > 0;
}

// 12500 → «12 500 ₸»
function formatPrice(amount) {
    return `${Number(amount).toLocaleString('ru-RU')} ₸`;
}

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

/* ---------- Корзина ---------- */
// Строка корзины: { id: 'amiri-dove', size: 'M', qty: 2 }

// Привести корзину в порядок: убрать несуществующие товары,
// объединить одинаковые (товар + размер), ограничить количество.
function normalizeCart(items) {
    const result = [];
    items.forEach((item) => {
        const product = findProduct(item.id);
        if (product === null) {
            return;
        }
        const size = typeof item.size === 'string' && product.sizes.includes(item.size) ? item.size : '';
        const qty = Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 1;
        const same = result.find((line) => line.id === item.id && line.size === size);
        if (same) {
            same.qty = Math.min(same.qty + qty, MAX_QTY);
        } else {
            result.push({ id: item.id, size: size, qty: Math.min(qty, MAX_QTY) });
        }
    });
    return result;
}

// Прочитать корзину из localStorage (если данных нет или они битые — пустая корзина)
function loadCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? normalizeCart(parsed) : [];
    } catch (error) {
        return [];
    }
}

// Сохранить корзину
function saveCart(cart) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        // localStorage недоступен (приватный режим) — корзина работает до перезагрузки
    }
    return cart;
}

// Общее количество штук в корзине
function countItems(cart) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

// Добавить товар: если такой же товар с тем же размером уже есть — увеличиваем количество
function addToCart(productId, size) {
    const cart = loadCart();
    const existing = cart.find((item) => item.id === productId && item.size === size);
    if (existing && existing.qty >= MAX_QTY) {
        return { added: false, qty: existing.qty };
    }
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: productId, size: size, qty: 1 });
    }
    saveCart(cart);
    const line = existing || cart[cart.length - 1];
    return { added: true, qty: line.qty };
}

/* ---------- Расчёты ---------- */

// Сумма одной строки: цена × количество (вызывает findProduct)
function calcLineTotal(line) {
    const product = findProduct(line.id);
    return product === null ? 0 : product.price * line.qty;
}

// Сумма всех строк (вызывает calcLineTotal)
function calcSubtotal(lines) {
    return lines.reduce((sum, line) => sum + calcLineTotal(line), 0);
}

// Стоимость доставки: самовывоз бесплатно, курьер 1 500 ₸, от 30 000 ₸ бесплатно
function calcDelivery(subtotal, method) {
    if (method === 'pickup' || subtotal === 0) {
        return 0;
    }
    return subtotal >= FREE_DELIVERY_FROM ? 0 : COURIER_PRICE;
}

// Демонстрационный номер заказа/обращения: префикс + 6 случайных цифр
function generateDemoNumber(prefix) {
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}-${random}`;
}

/* ---------- Валидация (общая для форм заказа и вопроса) ---------- */

function isValidName(value) {
    const name = value.trim();
    return name.length >= 2 && /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\s-]+$/.test(name);
}

// Казахстанский номер: 11 цифр, начинается с 7 или 8 (+7 700 000 00 00)
function isValidPhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
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

/* ---------- Сквозное поведение на всех страницах ---------- */

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

// Кнопки «В корзину» / «Заказать» на карточках товаров
function initAddToCart() {
    document.querySelectorAll('.add-to-cart').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // у ссылок «Заказать» не уходим со страницы
            const product = findProduct(button.dataset.productId);
            if (product === null) {
                return;
            }
            const card = button.closest('.product-card');
            const sizeSelect = card !== null ? card.querySelector('.size-select') : null;
            const size = sizeSelect !== null ? sizeSelect.value : '';
            const result = addToCart(product.id, size);
            const sizeText = size !== '' ? `, ${size}` : '';
            button.textContent = result.added
                ? `В корзине${sizeText}: ${result.qty} шт.`
                : `Максимум ${MAX_QTY} шт.`;
            updateCartBadge();
        });
    });
}

// Кнопка «← Назад»: возвращает на предыдущую страницу, если она есть
function initBackLinks() {
    document.querySelectorAll('.js-back').forEach((link) => {
        link.addEventListener('click', (event) => {
            if (history.length > 1 && document.referrer !== '') {
                event.preventDefault();
                history.back();
            }
        });
    });
}

initAddToCart();
initBackLinks();
updateCartBadge();
window.addEventListener('storage', updateCartBadge); // корзина изменилась в другой вкладке
