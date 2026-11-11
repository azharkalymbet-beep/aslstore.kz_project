'use strict';

/* ==========================================================================
   size-finder.js · ЧИСТЫЙ JavaScript — подбор размера (clothing.html)
   Как «Find your size» у Adidas: покупатель вводит рост и обхват груди,
   сайт советует размер по таблице и сам выбирает его во всех карточках одежды.
   Форма создаётся кодом внутри блока «Таблица размеров» (HTML не меняем).
   ========================================================================== */

// Таблица размеров — данные на вершине файла (те же цифры, что в таблице на странице)
const SIZE_CHART = [
    { size: 'S', chestMin: 88, chestMax: 94, heightMin: 160, heightMax: 170 },
    { size: 'M', chestMin: 94, chestMax: 100, heightMin: 165, heightMax: 175 },
    { size: 'L', chestMin: 100, chestMax: 106, heightMin: 170, heightMax: 180 },
    { size: 'XL', chestMin: 106, chestMax: 112, heightMin: 175, heightMax: 185 }
];
const FIT_LIMITS = { height: [140, 210], chest: [70, 140] }; // разумные значения в см

// Номер первого размера, в который помещается значение (по груди или по росту)
function sizeIndexFor(value, maxKey) {
    const index = SIZE_CHART.findIndex((row) => value <= row[maxKey]);
    return index === -1 ? SIZE_CHART.length - 1 : index;
}

// Главная функция: рост + грудь → совет. Возвращает объект { size, text }
function recommendSize(height, chest) {
    const last = SIZE_CHART[SIZE_CHART.length - 1];
    if (chest > last.chestMax || height > last.heightMax) {
        return { size: last.size, text: `Вам подойдёт ${last.size}, но он может быть тесноват. Напишите нам — подберём модель свободнее.` };
    }
    const byChest = sizeIndexFor(chest, 'chestMax');
    const byHeight = sizeIndexFor(height, 'heightMax');
    const best = SIZE_CHART[Math.max(byChest, byHeight)]; // берём больший, чтобы вещь не была мала
    if (byChest === byHeight) {
        return { size: best.size, text: `Ваш размер — ${best.size}.` };
    }
    return {
        size: best.size,
        text: `По груди подходит ${SIZE_CHART[byChest].size}, по росту — ${SIZE_CHART[byHeight].size}. ` +
              `Советуем ${best.size}: вещь не будет короткой.`
    };
}

// Проверка одного поля: пусто → ошибка, вне диапазона → ошибка, иначе ''
function checkMeasure(value, limits, name) {
    if (value.trim() === '') {
        return `Введите ${name}.`;
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < limits[0] || number > limits[1]) {
        return `${name[0].toUpperCase()}${name.slice(1)} — число от ${limits[0]} до ${limits[1]} см.`;
    }
    return '';
}

// Выбрать размер во всех карточках, где он есть. Возвращает, сколько карточек изменилось
function applySizeToCards(size) {
    let changed = 0;
    document.querySelectorAll('main .product-card .size-select').forEach((select) => {
        const hasOption = Array.from(select.options).some((option) => option.value === size);
        if (hasOption) {
            select.value = size;
            changed += 1;
        }
    });
    return changed;
}

function createMeasureField(id, labelText) {
    const col = createEl('div', 'col-6 col-md-4');
    const label = createEl('label', 'form-label small fw-bold', labelText);
    label.htmlFor = id;
    const input = createEl('input', 'form-control');
    input.type = 'number';
    input.id = id;
    input.name = id;
    input.inputMode = 'numeric';
    col.append(label, input);
    return { col, input };
}

function initSizeFinder() {
    const guide = document.getElementById('size-guide');
    if (guide === null) {
        return; // не страница одежды
    }
    const table = guide.querySelector('.table-responsive');

    // --- форма создаётся кодом ---
    const box = createEl('div', 'border-top pt-3 mt-3');
    box.append(
        createEl('h3', 'h5 text-purple fw-bold', 'Подобрать размер'),
        createEl('p', 'small text-muted mb-3', 'Введите рост и обхват груди — подскажем размер и выберем его во всех карточках.')
    );
    const form = createEl('form', 'row g-2 align-items-start');
    form.noValidate = true;
    const height = createMeasureField('fit-height', 'Рост, см');
    const chest = createMeasureField('fit-chest', 'Обхват груди, см');
    height.input.placeholder = '172';
    chest.input.placeholder = '96';
    const buttonCol = createEl('div', 'col-12 col-md-4 d-grid');
    buttonCol.append(createEl('span', 'form-label small d-none d-md-block', ' '));
    const submit = createEl('button', 'btn btn-purple', 'Подобрать');
    submit.type = 'submit';
    buttonCol.append(submit);
    form.append(height.col, chest.col, buttonCol);

    const result = createEl('div', 'alert alert-light border mt-3 mb-0 hidden');
    result.setAttribute('aria-live', 'polite');
    const resultText = createEl('p', 'mb-2');
    const applyButton = createEl('button', 'btn btn-sm btn-outline-purple');
    applyButton.type = 'button';
    const applyNote = createEl('p', 'small text-muted mt-2 mb-0 hidden');
    result.append(resultText, applyButton, applyNote);

    box.append(form, result);
    table.after(box);

    let currentSize = '';

    function validate() {
        const heightError = checkMeasure(height.input.value, FIT_LIMITS.height, 'рост');
        const chestError = checkMeasure(chest.input.value, FIT_LIMITS.chest, 'обхват груди');
        setFieldError(height.input, height.input, heightError, true);
        setFieldError(chest.input, chest.input, chestError, true);
        if (heightError !== '') {
            height.input.focus();
        } else if (chestError !== '') {
            chest.input.focus();
        }
        return heightError === '' && chestError === '';
    }

    // Подсветить строку таблицы с этим размером (класс table-active из Bootstrap)
    function highlightRow(size) {
        guide.querySelectorAll('tbody tr').forEach((row) => {
            row.classList.toggle('table-active', row.cells[0].textContent.trim() === size);
        });
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // без этого страница перезагрузилась бы
        if (!validate()) {
            result.classList.add('hidden');
            return;
        }
        const advice = recommendSize(Number(height.input.value), Number(chest.input.value));
        currentSize = advice.size;
        resultText.textContent = advice.text;
        applyButton.textContent = `Выбрать ${advice.size} во всех карточках`;
        applyNote.classList.add('hidden');
        result.classList.remove('hidden');
        highlightRow(advice.size);
    });

    // Ошибка исчезает сразу, как только поле исправили
    form.addEventListener('input', (event) => {
        const field = event.target;
        if (field.classList.contains('is-invalid')) {
            const limits = field === height.input ? FIT_LIMITS.height : FIT_LIMITS.chest;
            const name = field === height.input ? 'рост' : 'обхват груди';
            setFieldError(field, field, checkMeasure(field.value, limits, name), true);
        }
    });

    applyButton.addEventListener('click', () => {
        const changed = applySizeToCards(currentSize);
        const skipped = document.querySelectorAll('main .product-card .size-select').length - changed;
        applyNote.textContent = `Размер ${currentSize} выбран в ${changed} карточках.` +
            (skipped > 0 ? ' У широких джинсов размеры в дюймах (28–34) — там выберите сами.' : '');
        applyNote.classList.remove('hidden');
    });
}

initSizeFinder();
