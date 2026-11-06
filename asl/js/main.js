'use strict';



const STORAGE_KEY = 'asl_cart';
const MAX_QTY = 10;               
const FREE_DELIVERY_FROM = 30000; 
const COURIER_PRICE = 1500;       

const CLOTHES_SIZES = ['S', 'M', 'L', 'XL'];
const JEANS_SIZES = ['28', '30', '32', '34'];
const NO_SIZE = [];


const PRODUCTS = [
    { id: 'amiri-dove', name: 'Футболка AMIRI Dove Black', price: 12500, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'npc-pixel', name: 'Футболка NPC Pixel Black', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'trapstar-polo', name: 'Футболка Trapstar Polo', price: 9000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'iammusic-tee', name: 'Футболка I am music', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'keef-2012', name: 'Футболка Chief Keef 2012 White', price: 10000, category: 'tops', sizes: CLOTHES_SIZES },
    { id: 'hoodie-balaclava', name: 'Худи оверсайз с балаклавой', price: 22000, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'sweat-grunge', name: 'Винтажный свитшот Grunge', price: 18500, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'amiri-hoodie', name: 'Худи Amiri Hoodie', price: 14490, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'friendly-hoodie', name: 'Винтажный худи Friendly', price: 13490, category: 'hoodies', sizes: CLOTHES_SIZES },
    { id: 'jeans-baggy', name: 'Широкие джинсы Baggy Dark', price: 20000, category: 'bottoms', sizes: JEANS_SIZES },
    { id: 'cargo-utility', name: 'Брюки-карго Utility Black', price: 19000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'regular-fit-jeans', name: 'Джинсы черные Regular Fit Jeans', price: 12000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'sakura-jeans', name: 'Sakura Jeans', price: 15000, category: 'bottoms', sizes: CLOTHES_SIZES },
    { id: 'vescartes-jeans', name: 'Vescartes Jeans', price: 18000, category: 'bottoms', sizes: CLOTHES_SIZES },

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


function findProduct(id) {
    return PRODUCTS.find((product) => product.id === id) || null;
}


function hasSizes(product) {
    return product !== null && product.sizes.length > 0;
}

function formatPrice(amount) {
    return `${Number(amount).toLocaleString('ru-RU')} ₸`;
}


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


function loadCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? normalizeCart(parsed) : [];
    } catch (error) {
        return [];
    }
}


function saveCart(cart) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        
    }
    return cart;
}

function countItems(cart) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

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


function calcLineTotal(line) {
    const product = findProduct(line.id);
    return product === null ? 0 : product.price * line.qty;
}


function calcSubtotal(lines) {
    return lines.reduce((sum, line) => sum + calcLineTotal(line), 0);
}


function calcDelivery(subtotal, method) {
    if (method === 'pickup' || subtotal === 0) {
        return 0;
    }
    return subtotal >= FREE_DELIVERY_FROM ? 0 : COURIER_PRICE;
}


function generateDemoNumber(prefix) {
    const random = Math.floor(Math.random() * 900000) + 100000;
    return `${prefix}-${random}`;
}



function isValidName(value) {
    const name = value.trim();
    return name.length >= 2 && /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі\s-]+$/.test(name);
}


function isValidPhone(value) {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}



function revealBlock($block, duration, effect) {
    if ($block.hasClass('hidden')) {
        $block.hide().removeClass('hidden');
    }
    $block.stop(true, true);
    return effect === 'slide' ? $block.slideDown(duration) : $block.fadeIn(duration);
}


function concealBlock($block, duration, effect, onDone) {
    if ($block.hasClass('hidden')) {
        if (onDone) {
            onDone();
        }
        return $block;
    }
    const afterHide = function () {
        $(this).addClass('hidden').removeAttr('style');
        if (onDone) {
            onDone();
        }
    };
    $block.stop(true, true);
    return effect === 'slide' ? $block.slideUp(duration, afterHide) : $block.fadeOut(duration, afterHide);
}


function showFieldError($field, $anchor, message, markValid) {
    const errorId = `${$field.attr('name') || $field.attr('id')}-error`;
    let $box = $(`#${errorId}`);
    if ($box.length === 0) {
        $box = $('<div>').attr('id', errorId).addClass('invalid-feedback hidden').insertAfter($anchor);
    }
    const hasError = message !== '';

    $field
        .toggleClass('is-invalid', hasError)
        .toggleClass('is-valid', !hasError && markValid === true)
        .attr({ 'aria-invalid': String(hasError), 'aria-describedby': errorId });

    if (hasError) {

        $box.text(message);
        revealBlock($box, 150, 'slide');
    } else {
        concealBlock($box, 150, 'slide');
    }
    return hasError;
}


function updateCartBadge() {
    const count = countItems(loadCart());
    $('#cart-count')
        .text(count)
        .attr('data-count', count)
        .toggleClass('hidden', count === 0);
    $('#cart-link').attr('aria-label', `Корзина, товаров: ${count}`);
}


$(function () {
    updateCartBadge();

    $('.add-to-cart').on('click', function (event) {
        event.preventDefault();

        const $button = $(this);                        
        const product = findProduct($button.attr('data-product-id'));
        if (product === null) {
            return;
        }
        const $sizeSelect = $button.closest('.product-card').find('.size-select');
        const size = $sizeSelect.length > 0 ? $sizeSelect.val() : '';
        const result = addToCart(product.id, size);
        const sizeText = size !== '' ? `, ${size}` : '';

        $button.text(result.added ? `В корзине${sizeText}: ${result.qty} шт.` : `Максимум ${MAX_QTY} шт.`);
        updateCartBadge();

        $('#cart-count').stop(true, true).animate({ opacity: 0.3 }, 120).animate({ opacity: 1 }, 120);
    });


    $(window).on('storage', updateCartBadge);
});
