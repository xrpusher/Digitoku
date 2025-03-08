document.addEventListener('DOMContentLoaded', () => {
    // Переключение между Greeting Screen и Game Container
    const enterButton = document.getElementById('enter-button');
    const greetingScreen = document.getElementById('greeting-screen');
    const gameContainer = document.getElementById('game-container');

    enterButton.addEventListener('click', () => {
        greetingScreen.style.display = 'none';
        gameContainer.style.display = 'block';
    });

    // Запуск игры (подгрузка поля, блоков и т.д.)
    resetGame();
});

/* Параметры игры */
const boardSize = 9;
let board = [];
let score = 0;
let currentBlocks = [];    // Текущий набор из 3 блоков
let selectedBlock = null;  // Какой блок выбран

/* Ссылки на элементы DOM */
const boardElement = document.getElementById('board');
const blocksElement = document.getElementById('blocks');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const playAgainButton = document.getElementById('play-again-button');

/* =============== */
/* ИНИЦИАЛИЗАЦИЯ   */
/* =============== */

/**
 * Создаёт пустую доску 9×9 и привязывает события клика на каждую ячейку.
 */
function initBoard() {
    board = [];
    boardElement.innerHTML = '';
    for (let i = 0; i < boardSize; i++) {
        let row = [];
        for (let j = 0; j < boardSize; j++) {
            row.push(0);  // 0 означает пустая клетка
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => cellClick(i, j));
            boardElement.appendChild(cell);
        }
        board.push(row);
    }
}

/**
 * Обновляет визуальное отображение доски и счёта.
 */
function updateBoard() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        // Если в board есть число (не 0), значит ячейка заполнена
        if (board[row][col] !== 0) {
            cell.classList.add('filled');
            let numberDiv = cell.querySelector('.cell-number');
            if (!numberDiv) {
                numberDiv = document.createElement('div');
                numberDiv.classList.add('cell-number');
                cell.appendChild(numberDiv);
            }
            numberDiv.textContent = board[row][col];
        } else {
            cell.classList.remove('filled');
            cell.innerHTML = '';
        }
    });
    scoreElement.textContent = 'Score: ' + score;
}

/* =============== */
/* ЛОГИКА ИГРЫ     */
/* =============== */

/**
 * Обработчик клика по ячейке игрового поля.
 * Если выбран блок, пытаемся его разместить.
 */
function cellClick(row, col) {
    if (!selectedBlock) return; // Ничего не выбрано
    if (canPlaceBlock(selectedBlock, row, col)) {
        placeBlock(selectedBlock, row, col);
        // Удаляем отображение блока
        selectedBlock.element.remove();
        // Удаляем блок из списка текущих
        currentBlocks = currentBlocks.filter(b => b !== selectedBlock);
        selectedBlock = null;
        clearBlockSelection();
        // Проверяем заполненные линии и очищаем
        checkAndClear();
        updateBoard();
        // Если все три блока размещены – генерируем новые
        if (currentBlocks.length === 0) {
            generateBlocks();
        }
        // После размещения блока проверяем, есть ли ещё доступные ходы
        setTimeout(checkGameOver, 100);
    }
}

/**
 * Проверяет, можно ли разместить данный блок в заданной позиции (row, col).
 */
function canPlaceBlock(block, row, col) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j] !== 0) {
                let boardRow = row + i;
                let boardCol = col + j;
                // Выходим за границы или клетка уже занята?
                if (boardRow >= boardSize || boardCol >= boardSize) return false;
                if (board[boardRow][boardCol] !== 0) return false;
            }
        }
    }
    return true;
}

/**
 * Размещает блок на поле, проставляя его цифры.
 */
function placeBlock(block, row, col) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j] !== 0) {
                board[row + i][col + j] = shape[i][j];
            }
        }
    }
}

/**
 * Сбрасывает визуальное выделение всех блоков.
 */
function clearBlockSelection() {
    const blockDivs = document.querySelectorAll('.block');
    blockDivs.forEach(div => div.classList.remove('selected'));
}

/**
 * Проверяет заполненные строки, столбцы и 3×3 области, очищает их и начисляет очки.
 */
function checkAndClear() {
    let rowsToClear = [];
    let colsToClear = [];
    let boxesToClear = [];

    // Проверка строк
    for (let i = 0; i < boardSize; i++) {
        if (board[i].every(val => val !== 0)) {
            rowsToClear.push(i);
        }
    }
    // Проверка столбцов
    for (let j = 0; j < boardSize; j++) {
        let full = true;
        for (let i = 0; i < boardSize; i++) {
            if (board[i][j] === 0) {
                full = false;
                break;
            }
        }
        if (full) colsToClear.push(j);
    }
    // Проверка 3×3 областей
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            let full = true;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const r = boxRow * 3 + i;
                    const c = boxCol * 3 + j;
                    if (board[r][c] === 0) {
                        full = false;
                        break;
                    }
                }
                if (!full) break;
            }
            if (full) {
                boxesToClear.push({boxRow, boxCol});
            }
        }
    }

    // Очищаем строки
    rowsToClear.forEach(row => {
        for (let col = 0; col < boardSize; col++) {
            board[row][col] = 0;
        }
        score += 10;
    });
    // Очищаем столбцы
    colsToClear.forEach(col => {
        for (let row = 0; row < boardSize; row++) {
            board[row][col] = 0;
        }
        score += 10;
    });
    // Очищаем 3×3 области
    boxesToClear.forEach(box => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const r = box.boxRow * 3 + i;
                const c = box.boxCol * 3 + j;
                board[r][c] = 0;
            }
        }
        score += 10;
    });
}

/**
 * Проверяет, возможен ли ещё ход (есть ли позиция на доске, куда можно поставить хотя бы один блок).
 * Если ходы невозможны, завершаем игру (Game Over).
 */
function checkGameOver() {
    // Для каждого блока из currentBlocks и для каждой клетки проверяем возможность размещения
    for (let b = 0; b < currentBlocks.length; b++) {
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (canPlaceBlock(currentBlocks[b], i, j)) {
                    return; // Нашли хотя бы одну позицию для блока – игра продолжается
                }
            }
        }
    }
    // Если мы здесь – значит ни один блок нигде не помещается
    showGameOver();
}

/**
 * Показывает экран Game Over.
 */
function showGameOver() {
    finalScoreElement.textContent = 'Your final score: ' + score;
    gameOverScreen.style.display = 'flex';
}

/* =============== */
/* ГЕНЕРАЦИЯ БЛОКОВ */
/* =============== */

// Набор возможных форм (каждая ячейка 1 заменится на случайную цифру от 1 до 9)
const blockShapes = [
    [[1]],
    [[1, 1]],
    [[1], [1]],
    [[1, 1, 1]],
    [[1], [1], [1]],
    [[1, 1], [1, 1]],
    [[1, 0],
     [1, 0],
     [1, 1]],
    [[0, 1, 0],
     [1, 1, 1]],
    [[1, 1, 0],
     [0, 1, 1]],
    [[0, 1, 1],
     [1, 1, 0]]
];

/**
 * Генерация одного случайного блока (заполнение цифрами от 1 до 9 вместо единиц).
 */
function generateRandomBlock() {
    const shapeTemplate = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    let shape = shapeTemplate.map(row => row.map(cell => cell ? Math.floor(Math.random() * 9) + 1 : 0));
    return { shape: shape, element: null };
}

/**
 * Генерация набора из 3 блоков и их рендер в блок #blocks.
 */
function generateBlocks() {
    currentBlocks = [];
    blocksElement.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        let block = generateRandomBlock();
        currentBlocks.push(block);
        let blockDiv = createBlockElement(block);
        block.element = blockDiv;
        blocksElement.appendChild(blockDiv);
    }
}

/**
 * Создание HTML-элемента для отображения блока.
 */
function createBlockElement(block) {
    let blockDiv = document.createElement('div');
    blockDiv.classList.add('block');

    let rows = block.shape.length;
    let cols = block.shape[0].length;

    let gridDiv = document.createElement('div');
    gridDiv.classList.add('block-grid');
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    gridDiv.style.gridTemplateRows = `repeat(${rows}, 30px)`;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let cellDiv = document.createElement('div');
            cellDiv.classList.add('block-cell');

            if (block.shape[i][j] !== 0) {
                let numDiv = document.createElement('div');
                numDiv.classList.add('cell-number');
                numDiv.textContent = block.shape[i][j];
                cellDiv.appendChild(numDiv);
            } else {
                // Скрываем пустые ячейки, чтобы сохранить форму
                cellDiv.style.visibility = 'hidden';
            }
            gridDiv.appendChild(cellDiv);
        }
    }

    blockDiv.appendChild(gridDiv);

    // При клике выделяем блок и делаем его выбранным
    blockDiv.addEventListener('click', () => {
        clearBlockSelection();
        blockDiv.classList.add('selected');
        selectedBlock = block;
    });

    return blockDiv;
}

/* =============== */
/* СБРОС/РЕСТАРТ    */
/* =============== */

/**
 * Запускает игру заново: обнуляет счёт, создаёт новое поле, генерирует блоки.
 */
function resetGame() {
    // Прячем экран Game Over (если он был показан)
    gameOverScreen.style.display = 'none';

    score = 0;
    initBoard();
    generateBlocks();
    updateBoard();
}

/* Кнопка "Play Again" на экране Game Over */
playAgainButton.addEventListener('click', resetGame);

/* Кнопка "New Game" в самом интерфейсе */
document.getElementById('reset-button').addEventListener('click', resetGame);