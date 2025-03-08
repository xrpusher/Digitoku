document.addEventListener('DOMContentLoaded', () => {
    // Greeting screen to game
    const enterButton = document.getElementById('enter-button');
    const greetingScreen = document.getElementById('greeting-screen');
    const gameContainer = document.getElementById('game-container');
  
    // Load stats from localStorage at startup
    loadStats();
  
    enterButton.addEventListener('click', () => {
      // Hide greeting, show game
      greetingScreen.style.display = 'none';
      gameContainer.style.display = 'flex';
  
      // Increment total games played
      incrementGamesPlayed();
      updateStatsDisplay();
    });
  
    // Switch mode
    modeSelect.addEventListener('change', () => {
      resetGame();
    });
  
    // Start default game
    resetGame();
  });
  
  /* ================ */
  /* Game Parameters  */
  /* ================ */
  const boardSize = 9;
  let board = [];
  let score = 0;
  let currentBlocks = [];
  let selectedBlock = null;
  
  // Hearts Mode
  let heartsGoal = 6;
  let heartsCount = 6;
  let heartsCleared = 0;
  
  // LocalStorage stats
  let gamesPlayed = 0;
  let bestScore = 0;
  
  /* DOM References */
  const boardElement = document.getElementById('board');
  const blocksElement = document.getElementById('blocks');
  const scoreElement = document.getElementById('score');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreElement = document.getElementById('final-score');
  const playAgainButton = document.getElementById('play-again-button');
  const resetButton = document.getElementById('reset-button');
  const modeSelect = document.getElementById('mode-select');
  const heartsGoalElement = document.getElementById('hearts-goal');
  const gameOverTitle = document.getElementById('game-over-title');
  
  /* Currently dragging block */
  let draggedBlock = null;
  
  /* ======================= */
  /* Initialize the Board    */
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
  
        // Click-to-place
        cell.addEventListener('click', () => cellClick(i, j));
  
        // Drag & Drop highlight + drop
        cell.addEventListener('dragover', (e) => handleDragOver(e, i, j));
        cell.addEventListener('drop', (e) => handleDrop(e, i, j));
  
        boardElement.appendChild(cell);
      }
      board.push(row);
    }
  }
  
  /* ======================= */
  /* Hearts Mode Placement   */
  /* ======================= */
  function placeHearts() {
    let placed = 0;
    while (placed < heartsCount) {
      let r = Math.floor(Math.random() * boardSize);
      let c = Math.floor(Math.random() * boardSize);
      if (board[r][c] === 0) {
        board[r][c] = 'H'; // 'H' for Heart
        placed++;
      }
    }
  }
  
  /* ======================= */
  /* Update Board Rendering  */
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
        // Digit
        cell.classList.add('filled');
        let numberDiv = document.createElement('div');
        numberDiv.classList.add('cell-number');
        numberDiv.textContent = value;
        cell.appendChild(numberDiv);
      } else if (value === 'H') {
        // Heart
        cell.classList.add('heart');
      }
    });
  
    scoreElement.textContent = 'Score: ' + score;
  
    // Hearts Mode => display hearts goal
    if (modeSelect.value === 'hearts') {
      heartsGoalElement.style.display = 'block';
      heartsGoalElement.textContent = `Goal: clear ${heartsGoal} hearts (cleared: ${heartsCleared})`;
    } else {
      heartsGoalElement.style.display = 'none';
    }
  }
  
  /* ======================= */
  /* DRAG & DROP Handlers    */
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
  
      // If no blocks left, generate new set
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
  /* Click Mechanics         */
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
  /* Checking Fit & Placing  */
  /* ======================= */
  function canPlaceBlock(block, row, col) {
    const shape = block.shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] !== 0) {
          let rr = row + i;
          let cc = col + j;
          // Out of bounds
          if (rr >= boardSize || cc >= boardSize) return false;
          // Can't overlap digits or hearts
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
  /* Check & Clear Lines     */
  /* ======================= */
  function checkAndClear() {
    let rowsToClear = [];
    let colsToClear = [];
    let boxesToClear = [];
  
    // For hearts mode, hearts do NOT prevent clearing. Only zeros do.
    // So we check for zero only (not hearts).
    // If there's no zero in the row/col/box => it's full => remove hearts & digits.
    
    // Full rows
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
  
    // Full columns
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
  
    // Full 3×3 boxes
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
  
    // Clear rows
    rowsToClear.forEach(r => {
      for (let j = 0; j < boardSize; j++) {
        if (board[r][j] === 'H') heartsCleared++;
        board[r][j] = 0;
      }
      score += 10;
    });
  
    // Clear columns
    colsToClear.forEach(c => {
      for (let i = 0; i < boardSize; i++) {
        if (board[i][c] === 'H') heartsCleared++;
        board[i][c] = 0;
      }
      score += 10;
    });
  
    // Clear boxes
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
  /* Check Game Over         */
  /* ======================= */
  function checkGameOver() {
    // If hearts mode => check if we cleared enough
    if (modeSelect.value === 'hearts' && heartsCleared >= heartsGoal) {
      showGameResult(true);
      return;
    }
    // Otherwise, see if there's any valid move
    for (let b = 0; b < currentBlocks.length; b++) {
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          if (canPlaceBlock(currentBlocks[b], i, j)) {
            return; // still a move
          }
        }
      }
    }
    // No moves
    showGameResult(false);
  }
  
  /* ======================= */
  /* Show Game Over/Win      */
  /* ======================= */
  function showGameResult(victory) {
    gameOverScreen.style.display = 'flex';
    if (victory) {
      gameOverTitle.textContent = 'You Win!';
    } else {
      gameOverTitle.textContent = 'Game Over!';
    }
    finalScoreElement.textContent = `Final score: ${score}`;
  
    // Update best score if needed
    if (score > bestScore) {
      bestScore = score;
      saveStats();
    }
  }
  
  /* =============== */
  /* Block Creation  */
  /* =============== */
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
  
    // bounding box
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
  
    // Click select
    blockDiv.addEventListener('click', () => {
      clearBlockSelection();
      blockDiv.classList.add('selected');
      selectedBlock = block;
    });
  
    blockDiv.addEventListener('dragstart', (e) => {
      // Ensure drag works in all browsers
      e.dataTransfer.setData('text/plain', '');
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
  /* Reset the Game          */
  /* ======================= */
  function resetGame() {
    gameOverScreen.style.display = 'none';
    score = 0;
    heartsCleared = 0;
  
    initBoard();
    if (modeSelect.value === 'hearts') {
      placeHearts();
    }
    generateBlocks();
    updateBoard();
  }
  
  /* ======================= */
  /* Stats in localStorage   */
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
  /* Control Buttons         */
  /* ======================= */
  playAgainButton.addEventListener('click', () => {
    incrementGamesPlayed();
    resetGame();
  });
  
  resetButton.addEventListener('click', () => {
    incrementGamesPlayed();
    resetGame();
  });
  
  /* Clear any highlight from previously selected block */
  function clearBlockSelection() {
    const blockDivs = document.querySelectorAll('.block');
    blockDivs.forEach(div => div.classList.remove('selected'));
    selectedBlock = null;
  }
  