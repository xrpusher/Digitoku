document.addEventListener('DOMContentLoaded', () => {
    // Переход от экрана поздравления к игре
    const enterButton = document.getElementById('enter-button');
    const greetingScreen = document.getElementById('greeting-screen');
    const gameContainer = document.getElementById('game-container');

    enterButton.addEventListener('click', () => {
        greetingScreen.style.display = 'none';
        gameContainer.style.display = 'block';
    });

    // Запуск игры при загрузке
    resetGame();
});

const boardSize = 9;
let board = [];
let score = 0;
let currentBlocks = [];
let selectedBlock = null;

const boardElement = document.getElementById('board');
const blocksElement = document.getElementById('blocks');
const scoreElement = document.getElementById('score');

// Инициализация игрового поля
function initBoard() {
    board = [];
    boardElement.innerHTML = '';
    for (let i = 0; i < boardSize; i++) {
        let row = [];
        for (let j = 0; j < boardSize; j++) {
            row.push(0);
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

// Обновление визуального состояния игрового поля и счёта
function updateBoard() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
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

// Обработка клика по ячейке игрового поля
function cellClick(row, col) {
    if (selectedBlock === null) return;
    if (canPlaceBlock(selectedBlock, row, col)) {
        placeBlock(selectedBlock, row, col);
        selectedBlock.element.remove();
        currentBlocks = currentBlocks.filter(b => b !== selectedBlock);
        selectedBlock = null;
        clearBlockSelection();
        checkAndClear();
        updateBoard();
        if (currentBlocks.length === 0) {
            generateBlocks();
        }
    }
}

// Проверка возможности размещения блока по выбранной позиции
function canPlaceBlock(block, row, col) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j] !== 0) {
                let boardRow = row + i;
                let boardCol = col + j;
                if (boardRow >= boardSize || boardCol >= boardSize) return false;
                if (board[boardRow][boardCol] !== 0) return false;
            }
        }
    }
    return true;
}

// Размещение блока на игровом поле
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

// Сброс выделения блоков
function clearBlockSelection() {
    const blockDivs = document.querySelectorAll('.block');
    blockDivs.forEach(div => div.classList.remove('selected'));
}

// Набор предопределённых форм блоков
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

// Генерация случайного блока с подстановкой случайных чисел от 1 до 9
function generateRandomBlock() {
    const shapeTemplate = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    let shape = shapeTemplate.map(row => row.map(cell => cell ? Math.floor(Math.random() * 9) + 1 : 0));
    return { shape: shape, element: null };
}

// Генерация набора из 3 блоков
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

// Создание HTML-элемента для блока
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
                cellDiv.style.visibility = 'hidden';
            }
            gridDiv.appendChild(cellDiv);
        }
    }
    blockDiv.appendChild(gridDiv);
    blockDiv.addEventListener('click', () => {
        clearBlockSelection();
        blockDiv.classList.add('selected');
        selectedBlock = block;
    });
    return blockDiv;
}

// Проверка заполненных строк, столбцов и 3x3 областей с последующей очисткой
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
        let colFull = true;
        for (let i = 0; i < boardSize; i++) {
            if (board[i][j] === 0) {
                colFull = false;
                break;
            }
        }
        if (colFull) colsToClear.push(j);
    }
    // Проверка 3x3 областей
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            let full = true;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    let row = boxRow * 3 + i;
                    let col = boxCol * 3 + j;
                    if (board[row][col] === 0) {
                        full = false;
                        break;
                    }
                }
                if (!full) break;
            }
            if (full) {
                boxesToClear.push({ boxRow, boxCol });
            }
        }
    }
    
    // Очистка строк
    rowsToClear.forEach(row => {
        for (let j = 0; j < boardSize; j++) {
            board[row][j] = 0;
        }
        score += 10;
    });
    // Очистка столбцов
    colsToClear.forEach(col => {
        for (let i = 0; i < boardSize; i++) {
            board[i][col] = 0;
        }
        score += 10;
    });
    // Очистка 3x3 областей
    boxesToClear.forEach(box => {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let row = box.boxRow * 3 + i;
                let col = box.boxCol * 3 + j;
                board[row][col] = 0;
            }
        }
        score += 10;
    });
}

// Сброс игры: обнуление счёта, создание нового поля и генерация блоков
function resetGame() {
    score = 0;
    initBoard();
    generateBlocks();
    updateBoard();
}

document.getElementById('reset-button').addEventListener('click', resetGame);