'use strict';

/* ==========================================================================
   feedback.js · jQuery — форма «Задать вопрос» (colophon.html)
   jQuery-часть сайта: здесь нет document.getElementById / addEventListener,
   только jQuery. Из data.js берутся только чистые функции без DOM
   (isValidName, isValidPhone, generateDemoNumber).
   - валидация: имя (.trim()), телефон, тема (выбор), длина вопроса;
   - составное правило: для темы «Другое» вопрос подробнее (≥ 20 символов);
   - живой счётчик символов;
   - отправленные вопросы хранятся в массиве и выводятся карточками через .appendTo().
   Данные не отправляются на сервер — это демонстрация.
   ========================================================================== */

// Темы вопросов — данные на вершине файла
const FEEDBACK_TOPICS = {
    stock: 'Наличие товара',
    size: 'Подбор размера',
    delivery: 'Доставка и оплата',
    other: 'Другое'
};
const MESSAGE_MAX = 500;

// Минимальная длина вопроса зависит от темы
function minMessageLength(topic) {
    return topic === 'other' ? 20 : 10;
}

function formatDateTime(date) {
    return date.toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

// Карточка вопроса — одна функция для всех карточек. Текст пользователя только через .text()
function buildQuestionCard(question) {
    return $('<article>')
        .addClass('border rounded-3 p-3 mb-2 bg-light')
        .append(
            $('<p>').addClass('small text-muted mb-1').text(`${formatDateTime(question.date)} · ${question.topicLabel} · ${question.number}`),
            $('<p>').addClass('fw-bold mb-1').text(question.name),
            $('<p>').addClass('mb-0').text(question.message)
        );
}

/* ---------- Общие jQuery-функции этой части ---------- */

// Плавно показать блок. Если на блоке висит класс hidden (display: none !important),
// сначала прячем его через .hide() и снимаем класс — иначе эффект не будет виден.
function revealBlock($block, duration, effect) {
    if ($block.hasClass('hidden')) {
        $block.hide().removeClass('hidden');
    }
    $block.stop(true, true);
    return effect === 'slide' ? $block.slideDown(duration) : $block.fadeIn(duration);
}

// Плавно скрыть блок. В callback (выполняется ПОСЛЕ анимации) возвращаем класс hidden
// и убираем временный инлайн-стиль, который оставил эффект.
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

/* Рефакторинг №1: setFieldError() → showFieldError() (старая версия в old-js-version.js).
   getElementById / createElement / after / classList.toggle / setAttribute заменены на
   $('#id'), $('<div>').insertAfter(), .toggleClass() и .attr({...}); код стал примерно на треть короче,
   а цепочка читается как одно действие. Честно: плавное появление (slideDown) добавило пару строк. */
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
        // .text(), а не .html(): текст ошибки вставляется как обычный текст, теги не выполняются
        $box.text(message);
        revealBlock($box, 150, 'slide');
    } else {
        concealBlock($box, 150, 'slide');
    }
    return hasError;
}

/* Документ готов (jQuery 3.7.1 с CDN). $(function () { … }) = $(document).ready: код запустится, когда HTML загружен */
$(function () {
    const $form = $('#feedback-form');
    if ($form.length === 0) {
        return;
    }

    /* required и maxlength в HTML оставляем — это правила, которые сработают и без JS.
       novalidate выключает только всплывающие подсказки браузера, чтобы показать наши сообщения.
       Клиентская проверка не заменяет серверную: её можно обойти (отключить JS, DevTools,
       прямой запрос), поэтому сервер обязан проверять данные ещё раз. */
    $form.attr('novalidate', 'novalidate');

    const $name = $('#fb-name');
    const $phone = $('#fb-phone');
    const $topic = $('#fb-topic');
    const $message = $('#fb-message');
    const $errorBox = $('#feedback-error');
    const $done = $('#feedback-done');

    const questions = []; // вопросы этой сессии (только в памяти страницы)
    const touched = new Set();
    let submitted = false;

    // Счётчик символов под полем вопроса
    const $counter = $('<p>')
        .addClass('small text-muted text-end mt-1 mb-0')
        .attr('aria-live', 'polite')
        .insertAfter($message);

    // Блок «Ваши вопросы» после формы
    const $list = $('<div>');
    const $listWrap = $('<div>')
        .addClass('mt-4 hidden')
        .append($('<h3>').addClass('h6 fw-bold mb-2').text('Ваши вопросы (демо, видны только на этой странице)'), $list)
        .insertAfter($form);

    function renderCounter() {
        const length = $message.val().trim().length;
        const min = minMessageLength($topic.val());
        $counter
            .text(`${$message.val().length} / ${MESSAGE_MAX} символов (минимум ${min})`)
            .toggleClass('text-danger', length > 0 && length < min);
    }

    // Карточки генерируются из массива questions и добавляются через .appendTo()
    function renderQuestions() {
        $list.empty();
        $.each(questions, function (index, question) {
            buildQuestionCard(question).appendTo($list);
        });
        if (questions.length > 0) {
            revealBlock($listWrap, 300, 'slide');
        }
    }

    function collectChecks() {
        const name = $name.val().trim();
        let nameMessage = '';
        if (name === '') {
            nameMessage = 'Введите имя.';
        } else if (!isValidName(name)) {
            nameMessage = 'Только буквы, пробел или дефис, минимум 2 символа.';
        }

        let phoneMessage = '';
        if ($phone.val().trim() === '') {
            phoneMessage = 'Введите телефон, чтобы мы могли перезвонить.';
        } else if (!isValidPhone($phone.val())) {
            phoneMessage = 'Формат: +7 700 000 00 00 (11 цифр).';
        }

        const topicMessage = Object.hasOwn(FEEDBACK_TOPICS, $topic.val()) ? '' : 'Выберите тему.';

        const length = $message.val().trim().length;
        const min = minMessageLength($topic.val());
        let messageText = '';
        if (length === 0) {
            messageText = 'Напишите вопрос.';
        } else if (length < min) {
            messageText = $topic.val() === 'other'
                ? `Для темы «Другое» опишите вопрос подробнее — минимум ${min} символов.`
                : `Минимум ${min} символов, сейчас ${length}.`;
        } else if (length > MESSAGE_MAX) {
            messageText = `Максимум ${MESSAGE_MAX} символов.`;
        }

        return [
            { key: 'fb-name', $field: $name, message: nameMessage },
            { key: 'fb-phone', $field: $phone, message: phoneMessage },
            { key: 'fb-topic', $field: $topic, message: topicMessage },
            { key: 'fb-message', $field: $message, message: messageText }
        ];
    }

    function applyChecks(checks) {
        $.each(checks, function (index, check) {
            if (submitted || touched.has(check.key)) {
                const $anchor = check.$field.is($message) ? $counter : check.$field;
                showFieldError(check.$field, $anchor, check.message, true);
            }
        });
        return checks.filter((check) => check.message !== '');
    }

    function clearValidation() {
        submitted = false;
        touched.clear();
        $form.find('.is-invalid, .is-valid').removeClass('is-invalid is-valid').attr('aria-invalid', 'false');
        $form.find('.invalid-feedback').addClass('hidden').removeAttr('style');
    }

    // Ввод: обновляем счётчик и сразу убираем ошибку, если поле исправили
    $form.on('input', 'input, select, textarea', function () {
        renderCounter();
        concealBlock($done, 200, 'fade'); // начали новый вопрос — прячем старое подтверждение
        if (submitted || touched.has($(this).attr('id'))) {
            applyChecks(collectChecks());
        }
    });

    $form.on('change', 'select', function () {
        touched.add($(this).attr('id'));
        renderCounter();
        applyChecks(collectChecks());
    });

    $form.on('focusout', 'input, select, textarea', function () {
        touched.add($(this).attr('id'));
        applyChecks(collectChecks());
    });

    $form.on('submit', function (event) {
        /* preventDefault: без него браузер перешёл бы по action="colophon.html#feedback-done",
           страница перезагрузилась бы, имя и телефон попали бы в адресную строку (method="get"),
           а сообщение об успехе показалось бы даже при пустых полях. */
        event.preventDefault();
        submitted = true;

        const errors = applyChecks(collectChecks());
        if (errors.length > 0) {
            revealBlock($errorBox, 200, 'fade');
            concealBlock($done, 150, 'fade');
            errors[0].$field.trigger('focus');
            return;
        }
        concealBlock($errorBox, 150, 'fade');

        const question = {
            number: generateDemoNumber('Q'),
            name: $name.val().trim(),
            topicLabel: FEEDBACK_TOPICS[$topic.val()],
            message: $message.val().trim(),
            date: new Date()
        };
        questions.unshift(question);
        renderQuestions();

        // Успех показываем только после всех проверок; fadeIn 400 мс — чтобы подтверждение заметили
        $done.text(`Вопрос ${question.number} принят (демо). Данные не отправляются на сервер — ` +
            'вопрос показан ниже только на этой странице, звонка не будет.');
        revealBlock($done, 400, 'fade');
        $done.trigger('focus');

        $form.trigger('reset'); // сброс формы
        clearValidation();
        renderCounter();
    });

    renderCounter();
});
