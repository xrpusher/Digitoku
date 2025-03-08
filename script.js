document.addEventListener('DOMContentLoaded', () => {
    // Элементы для приветственного экрана и игры
    const enterButton = document.getElementById('enter-button');
    const greetingScreen = document.getElementById('greeting-screen');
    const gameContainer = document.getElementById('game-container');
    const modeSelect = document.getElementById('mode-select');
  
    // Загрузка статистики из localStorage
    loadStats();
  
    enterButton.addEventListener('click', () => {
      greetingScreen.style.display = 'none';
      gameContainer.style.display = 'flex';
      incrementGamesPlayed();
      updateStatsDisplay();
    });
  
    modeSelect.addEventListener('change', () => {
      resetGame();
    });
  
    // Запуск игры по умолчанию
    resetGame();
  });
  
  /* ================= */
  /* Game Parameters  */
  /* ================= */
  const boardSize = 9;
  let board = [];
  let score = 0;
  let currentBlocks = [];
  let selectedBlock = null;
  
  // Hearts Mode
  let heartsGoal = 6;
  let heartsCount = 6;
  let heartsCleared = 0;
  
  // Статистика в localStorage
  let gamesPlayed = 0;
  let bestScore = 0;
  
  /* DOM Элементы */
  const boardElement = document.getElementById('board');
  const blocksElement = document.getElementById('blocks');
  const scoreElement = document.getElementById('score');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreElement = document.getElementById('final-score');
  const playAgainButton = document.getElementById('play-again-button');
  const resetButton = document.getElementById('reset-button');
  const heartsGoalElement = document.getElementById('hearts-goal');
  const gameOverTitle = document.getElementById('game-over-title');
  
  /* Перетаскиваемый блок */
  let draggedBlock = null;
  
  /* ======================= */
  /* Инициализация поля     */
  /* ======================= */
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
        cell.addEventListener('dragover', (e) => handleDragOver(e, i, j));
        cell.addEventListener('drop', (e) => handleDrop(e, i, j));
  
        boardElement.appendChild(cell);
      }
      board.push(row);
    }
  }
  
  /* ======================= */
  /* Размещение Hearts Mode  */
  /* ======================= */
  function placeHearts() {
    let placed = 0;
    while (placed < heartsCount) {
      let r = Math.floor(Math.random() * boardSize);
      let c = Math.floor(Math.random() * boardSize);
      if (board[r][c] === 0) {
        board[r][c] = 'H';
        placed++;
      }
    }
  }
  
  /* ======================= */
  /* Обновление поля        */
  /* ======================= */
  function updateBoard() {
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);
      const value = board[row][col];
  
      cell.classList.remove('filled', 'heart', 'highlight-can');
      cell.innerHTML = '';
  
      if (typeof value === 'number' && value > 0) {
        cell.classList.add('filled');
        let numberDiv = document.createElement('div');
        numberDiv.classList.add('cell-number');
        numberDiv.textContent = value;
        cell.appendChild(numberDiv);
      } else if (value === 'H') {
        cell.classList.add('heart');
      }
    });
  
    scoreElement.textContent = 'Score: ' + score;
  
    if (document.getElementById('mode-select').value === 'hearts') {
      heartsGoalElement.style.display = 'block';
      heartsGoalElement.textContent = `Goal: clear ${heartsGoal} hearts (cleared: ${heartsCleared})`;
    } else {
      heartsGoalElement.style.display = 'none';
    }
  }
  
  /* ======================= */
  /* Drag & Drop обработчики */
  /* ======================= */
  function handleDragOver(e, row, col) {
    e.preventDefault();
    if (!draggedBlock) return;
  
    removeAllHighlights();
  
    if (canPlaceBlock(draggedBlock, row, col)) {
      highlightBlockCells(row, col, draggedBlock, true);
    }
  }
  
  function handleDrop(e, row, col) {
    e.preventDefault();
    if (!draggedBlock) return;
  
    removeAllHighlights();
  
    if (canPlaceBlock(draggedBlock, row, col)) {
      placeBlock(draggedBlock, row, col);
      if (draggedBlock.element) {
        draggedBlock.element.remove();
      }
      currentBlocks = currentBlocks.filter(b => b !== draggedBlock);
      draggedBlock = null;
      selectedBlock = null;
      clearBlockSelection();
  
      checkAndClear();
      updateBoard();
  
      if (currentBlocks.length === 0) {
        generateBlocks();
      }
      setTimeout(checkGameOver, 100);
    } else {
      draggedBlock = null;
    }
  }
  
  function removeAllHighlights() {
    boardElement.querySelectorAll('.cell.highlight-can').forEach(cell => {
      cell.classList.remove('highlight-can');
    });
  }
  
  function highlightBlockCells(row, col, block, allow) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] !== 0) {
          let rr = row + i;
          let cc = col + j;
          if (rr >= boardSize || cc >= boardSize) continue;
  
          let cell = boardElement.querySelector(`.cell[data-row='${rr}'][data-col='${cc}']`);
          if (!cell) continue;
  
          if (allow) {
            cell.classList.add('highlight-can');
          }
        }
      }
    }
  }
  
  /* ======================= */
  /* Логика клика по ячейке  */
  /* ======================= */
  function cellClick(row, col) {
    if (!selectedBlock) return;
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
      setTimeout(checkGameOver, 100);
    }
  }
  
  /* ======================= */
  /* Проверка возможности установки */
  /* ======================= */
  function canPlaceBlock(block, row, col) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] !== 0) {
          let rr = row + i;
          let cc = col + j;
          if (rr >= boardSize || cc >= boardSize) return false;
          if (typeof board[rr][cc] === 'number' && board[rr][cc] !== 0) return false;
          if (board[rr][cc] === 'H') return false;
        }
      }
    }
    return true;
  }
  
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
  
  /* ======================= */
  /* Проверка и очистка линий */
  /* ======================= */
  function checkAndClear() {
    let rowsToClear = [];
    let colsToClear = [];
    let boxesToClear = [];
  
    for (let i = 0; i < boardSize; i++) {
      let noZeros = true;
      for (let j = 0; j < boardSize; j++) {
        if (board[i][j] === 0) {
          noZeros = false;
          break;
        }
      }
      if (noZeros) rowsToClear.push(i);
    }
  
    for (let j = 0; j < boardSize; j++) {
      let noZeros = true;
      for (let i = 0; i < boardSize; i++) {
        if (board[i][j] === 0) {
          noZeros = false;
          break;
        }
      }
      if (noZeros) colsToClear.push(j);
    }
  
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        let noZeros = true;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxRow * 3 + i;
            const c = boxCol * 3 + j;
            if (board[r][c] === 0) {
              noZeros = false;
              break;
            }
          }
          if (!noZeros) break;
        }
        if (noZeros) {
          boxesToClear.push({ row: boxRow, col: boxCol });
        }
      }
    }
  
    rowsToClear.forEach(r => {
      for (let j = 0; j < boardSize; j++) {
        if (board[r][j] === 'H') heartsCleared++;
        board[r][j] = 0;
      }
      score += 10;
    });
  
    colsToClear.forEach(c => {
      for (let i = 0; i < boardSize; i++) {
        if (board[i][c] === 'H') heartsCleared++;
        board[i][c] = 0;
      }
      score += 10;
    });
  
    boxesToClear.forEach(box => {
      const startRow = box.row * 3;
      const startCol = box.col * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let rr = startRow + i;
          let cc = startCol + j;
          if (board[rr][cc] === 'H') heartsCleared++;
          board[rr][cc] = 0;
        }
      }
      score += 10;
    });
  }
  
  /* ======================= */
  /* Проверка окончания игры */
  /* ======================= */
  function checkGameOver() {
    if (document.getElementById('mode-select').value === 'hearts' && heartsCleared >= heartsGoal) {
      showGameResult(true);
      return;
    }
    for (let b = 0; b < currentBlocks.length; b++) {
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          if (canPlaceBlock(currentBlocks[b], i, j)) {
            return;
          }
        }
      }
    }
    showGameResult(false);
  }
  
  function showGameResult(victory) {
    gameOverScreen.style.display = 'flex';
    gameOverTitle.textContent = victory ? 'You Win!' : 'Game Over!';
    finalScoreElement.textContent = `Final score: ${score}`;
  
    if (score > bestScore) {
      bestScore = score;
      saveStats();
    }
  }
  
  /* ================= */
  /* Создание блоков  */
  /* ================= */
  const blockShapes = [
    [[1]], [[1,1]], [[1],[1]],
    [[1,1,1]],
    [[1],[1],[1]],
    [[1,1],[1,1]],
    [[1,0],[1,0],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
  ];
  
  function generateRandomBlock() {
    const shapeTemplate = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    let shape = shapeTemplate.map(row =>
      row.map(cell => (cell ? Math.floor(Math.random() * 9) + 1 : 0))
    );
    return { shape: shape, element: null };
  }
  
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
  
  function createBlockElement(block) {
    let blockDiv = document.createElement('div');
    blockDiv.classList.add('block');
    blockDiv.draggable = true;
  
    const cellSize = 40;
    let minRow = block.shape.length, maxRow = -1;
    let minCol = block.shape[0].length, maxCol = -1;
    for (let i = 0; i < block.shape.length; i++) {
      for (let j = 0; j < block.shape[i].length; j++) {
        if (block.shape[i][j] !== 0) {
          if (i < minRow) minRow = i;
          if (i > maxRow) maxRow = i;
          if (j < minCol) minCol = j;
          if (j > maxCol) maxCol = j;
        }
      }
    }
  
    let rows = maxRow - minRow + 1;
    let cols = maxCol - minCol + 1;
  
    let gridDiv = document.createElement('div');
    gridDiv.classList.add('block-grid');
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    gridDiv.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  
    blockDiv.style.width = `${cols * (cellSize + 2)}px`;
    blockDiv.style.height = `${rows * (cellSize + 2)}px`;
  
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
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
  
    blockDiv.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', '');
      // Прозрачное изображение для предотвращения создания черного ghost image на iOS
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODdhAQABAAAAACw=';
      e.dataTransfer.setDragImage(img, 0, 0);
  
      clearBlockSelection();
      blockDiv.classList.add('selected');
      selectedBlock = block;
      draggedBlock = block;
    });
  
    blockDiv.addEventListener('dragend', () => {
      draggedBlock = null;
      blockDiv.classList.remove('selected');
      selectedBlock = null;
    });
  
    return blockDiv;
  }
  
  /* ======================= */
  /* Сброс игры             */
  /* ======================= */
  function resetGame() {
    gameOverScreen.style.display = 'none';
    score = 0;
    heartsCleared = 0;
  
    initBoard();
    if (document.getElementById('mode-select').value === 'hearts') {
      placeHearts();
    }
    generateBlocks();
    updateBoard();
  }
  
  /* ======================= */
  /* Статистика (localStorage) */
  /* ======================= */
  function loadStats() {
    const savedGames = localStorage.getItem('gamesPlayed');
    const savedBest = localStorage.getItem('bestScore');
  
    gamesPlayed = savedGames ? parseInt(savedGames, 10) : 0;
    bestScore = savedBest ? parseInt(savedBest, 10) : 0;
  
    updateStatsDisplay();
  }
  
  function saveStats() {
    localStorage.setItem('gamesPlayed', gamesPlayed.toString());
    localStorage.setItem('bestScore', bestScore.toString());
  }
  
  function incrementGamesPlayed() {
    gamesPlayed++;
    saveStats();
  }
  
  function updateStatsDisplay() {
    const gamesPlayedElement = document.getElementById('games-played');
    const bestScoreElement = document.getElementById('best-score');
    if (!gamesPlayedElement || !bestScoreElement) return;
  
    gamesPlayedElement.textContent = `Games played: ${gamesPlayed}`;
    bestScoreElement.textContent = `Best score: ${bestScore}`;
  }
  
  /* ======================= */
  /* Кнопки управления      */
  /* ======================= */
  playAgainButton.addEventListener('click', () => {
    incrementGamesPlayed();
    resetGame();
  });
  
  resetButton.addEventListener('click', () => {
    incrementGamesPlayed();
    resetGame();
  });
  
  function clearBlockSelection() {
    document.querySelectorAll('.block').forEach(div => div.classList.remove('selected'));
    selectedBlock = null;
  }
  