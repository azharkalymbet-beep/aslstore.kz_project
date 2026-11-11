'use strict';

/* ==========================================================================
   countdown.js · ЧИСТЫЙ JavaScript — таймер распродажи (sale.html)
   Как на страницах распродаж Nike/Adidas: живой отсчёт до конца скидок.
   Дата берётся из текста страницы: «Скидки до 50% действуют до 15 ноября 2026 года».
   Обновляется раз в секунду через setInterval; когда время вышло — таймер
   меняется на «Распродажа завершена».
   ========================================================================== */

// Данные на вершине файла: конец распродажи (время Астаны, UTC+5) и подписи ячеек
const SALE_END = '2026-11-15T23:59:59+05:00';
const TIMER_PARTS = [
    { key: 'days', label: 'дней' },
    { key: 'hours', label: 'часов' },
    { key: 'minutes', label: 'минут' },
    { key: 'seconds', label: 'секунд' }
];

// Сколько осталось: из разницы в миллисекундах считаем дни, часы, минуты, секунды
function timeLeft(endMs, nowMs) {
    const total = Math.max(0, endMs - nowMs);
    const seconds = Math.floor(total / 1000);
    return {
        total: total,
        days: Math.floor(seconds / 86400),          // 86400 секунд в сутках
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60
    };
}

// 7 → «07»
function pad2(number) {
    return String(number).padStart(2, '0');
}

function initCountdown() {
    const hero = document.querySelector('main h1');
    if (hero === null || !document.querySelector('[id$="-sale"]')) {
        return; // не страница скидок
    }
    const section = hero.closest('section');
    const endMs = Date.parse(SALE_END);

    // --- блок таймера создаётся кодом: 4 ячейки из массива TIMER_PARTS ---
    const wrap = createEl('div', 'mt-3');
    wrap.append(createEl('p', 'small text-muted mb-2', 'До конца распродажи:'));
    const row = createEl('div', 'd-flex justify-content-center gap-2');
    row.setAttribute('role', 'timer');
    const cells = {};
    TIMER_PARTS.forEach((part) => {
        const cell = createEl('div', 'bg-purple text-white rounded-3 px-3 py-2 text-center');
        const number = createEl('strong', 'd-block fs-4 lh-1', '00');
        cell.append(number, createEl('small', '', part.label));
        cells[part.key] = number;
        row.append(cell);
    });
    wrap.append(row);
    section.append(wrap);

    function tick() {
        const left = timeLeft(endMs, Date.now());
        if (left.total === 0) {
            clearInterval(timerId);
            wrap.replaceChildren(createEl('p', 'fw-bold text-danger mb-0', 'Распродажа завершена. Следите за новыми скидками!'));
            return;
        }
        TIMER_PARTS.forEach((part) => {
            cells[part.key].textContent = part.key === 'days' ? String(left.days) : pad2(left[part.key]);
        });
        row.setAttribute('aria-label', `До конца распродажи ${left.days} дн. ${left.hours} ч ${left.minutes} мин`);
    }

    const timerId = setInterval(tick, 1000);
    tick(); // сразу, не ждать первую секунду
}

initCountdown();
