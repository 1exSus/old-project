// Глобальные переменные (стиль 2002 года)
var canvas, ctx;
var nextCanvas, nextCtx;
var grid = [];
var currentPiece, nextPiece;
var score = 0, level = 1, lines = 0;
var gameSpeed = 500;
var gameInterval;
var isPaused = false;
var isGameRunning = false;

// Размеры игрового поля
var COLS = 10;
var ROWS = 20;
var BLOCK_SIZE = 30;

// Фигуры Тетриса (классические)
var SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[1,1,1],[0,1,0]], // T
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,0,1]], // J
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]]  // Z
];

// Цвета фигур
var COLORS = [
    '#00FFFF', // I - cyan
    '#FFFF00', // O - yellow
    '#FF00FF', // T - magenta
    '#FF7F00', // L - orange
    '#0000FF', // J - blue
    '#00FF00', // S - green
    '#FF0000'  // Z - red
];

// Инициализация игры
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    nextCanvas = document.getElementById('nextPieceCanvas');
    nextCtx = nextCanvas.getContext('2d');

    // Инициализация игрового поля
    initGrid();

    // Генерация первой следующей фигуры
    nextPiece = generateRandomPiece();

    // Настройка обработчиков клавиш
    document.onkeydown = handleKeyPress;
}

function initGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (var c = 0; c < COLS; c++) {
            grid[r][c] = 0;
        }
    }
}

function generateRandomPiece() {
    var shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        row: 0,
        col: Math.floor(COLS / 2) - 1
    };
}

function startGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        isPaused = false;
        score = 0;
        level = 1;
        lines = 0;
        gameSpeed = 500;

        initGrid();
        currentPiece = nextPiece;
        nextPiece = generateRandomPiece();

        updateDisplay();
        drawNextPiece();

        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);

        document.getElementById('gameStatus').innerHTML = 'Игра идет!';
        document.getElementById('gameStatus').style.color = '#00FF00';
    }
}

function resetGame() {
    clearInterval(gameInterval);
    isGameRunning = false;
    isPaused = false;
    document.getElementById('gameStatus').innerHTML = 'Нажмите СТАРТ!';
    document.getElementById('gameStatus').style.color = '#FF0000';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
}

function togglePause() {
    if (isGameRunning) {
        isPaused = !isPaused;
        if (isPaused) {
            document.getElementById('gameStatus').innerHTML = 'ПАУЗА';
            document.getElementById('gameStatus').style.color = '#FFFF00';
        } else {
            document.getElementById('gameStatus').innerHTML = 'Игра идет!';
            document.getElementById('gameStatus').style.color = '#00FF00';
        }
    }
}

function gameLoop() {
    if (!isPaused) {
        if (!movePiece(1, 0)) {
            // Фигура достигла дна
            lockPiece();
            checkLines();
            spawnNewPiece();
        }
        drawGame();
    }
}

function movePiece(dr, dc) {
    // Проверка возможности движения
    if (canMove(currentPiece, dr, dc)) {
        currentPiece.row += dr;
        currentPiece.col += dc;
        return true;
    }
    return false;
}

function rotatePiece() {
    var newShape = [];
    var rows = currentPiece.shape.length;
    var cols = currentPiece.shape[0].length;

    // Создаем транспонированную матрицу
    for (var c = 0; c < cols; c++) {
        newShape[c] = [];
        for (var r = 0; r < rows; r++) {
            newShape[c][r] = currentPiece.shape[rows - 1 - r][c];
        }
    }

    // Проверяем, можно ли повернуть
    var testPiece = {
        shape: newShape,
        color: currentPiece.color,
        row: currentPiece.row,
        col: currentPiece.col
    };

    if (canMove(testPiece, 0, 0)) {
        currentPiece.shape = newShape;
        return true;
    }
    return false;
}

function canMove(piece, dr, dc) {
    for (var r = 0; r < piece.shape.length; r++) {
        for (var c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                var newRow = piece.row + r + dr;
                var newCol = piece.col + c + dc;

                if (newRow >= ROWS || newCol < 0 || newCol >= COLS ||
                    (newRow >= 0 && grid[newRow][newCol])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function lockPiece() {
    for (var r = 0; r < currentPiece.shape.length; r++) {
        for (var c = 0; c < currentPiece.shape[r].length; c++) {
            if (currentPiece.shape[r][c]) {
                var gridRow = currentPiece.row + r;
                var gridCol = currentPiece.col + c;
                if (gridRow >= 0) {
                    grid[gridRow][gridCol] = currentPiece.color;
                }
            }
        }
    }
}

function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = generateRandomPiece();
    drawNextPiece();

    // Проверка на Game Over
    if (!canMove(currentPiece, 0, 0)) {
        clearInterval(gameInterval);
        isGameRunning = false;
        document.getElementById('gameStatus').innerHTML = 'GAME OVER!';
        document.getElementById('gameStatus').style.color = '#FF0000';
        alert('ИГРА ОКОНЧЕНА!\nВаш счет: ' + score);
    }
}

function checkLines() {
    var linesCleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
        var lineComplete = true;
        for (var c = 0; c < COLS; c++) {
            if (!grid[r][c]) {
                lineComplete = false;
                break;
            }
        }

        if (lineComplete) {
            // Удаляем линию
            for (var y = r; y > 0; y--) {
                for (var c = 0; c < COLS; c++) {
                    grid[y][c] = grid[y-1][c];
                }
            }
            // Очищаем верхнюю линию
            for (var c = 0; c < COLS; c++) {
                grid[0][c] = 0;
            }
            linesCleared++;
            r++; // Проверяем эту же позицию снова
        }
    }

    if (linesCleared > 0) {
        // Обновляем статистику
        lines += linesCleared;
        score += linesCleared * linesCleared * 100 * level;

        // Повышаем уровень каждые 10 линий
        level = Math.floor(lines / 10) + 1;
        gameSpeed = Math.max(100, 500 - (level - 1) * 50);

        // Обновляем интервал игры
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);

        updateDisplay();
    }
}

function drawGame() {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем сетку
    ctx.strokeStyle = '#333333';
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // Рисуем установленные блоки
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                drawBlock(ctx, c, r, grid[r][c]);
            }
        }
    }

    // Рисуем текущую фигуру
    if (currentPiece) {
        for (var r = 0; r < currentPiece.shape.length; r++) {
            for (var c = 0; c < currentPiece.shape[r].length; c++) {
                if (currentPiece.shape[r][c]) {
                    var x = (currentPiece.col + c) * BLOCK_SIZE;
                    var y = (currentPiece.row + r) * BLOCK_SIZE;
                    if (y >= 0) {
                        drawBlock(ctx, currentPiece.col + c, currentPiece.row + r, currentPiece.color);
                    }
                }
            }
        }
    }
}

function drawBlock(context, col, row, color) {
    var x = col * BLOCK_SIZE;
    var y = row * BLOCK_SIZE;

    context.fillStyle = color;
    context.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

    context.strokeStyle = '#FFFFFF';
    context.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);

    // 3D эффект (стиль 2002)
    context.fillStyle = 'rgba(255,255,255,0.3)';
    context.fillRect(x, y, BLOCK_SIZE, 2);
    context.fillRect(x, y, 2, BLOCK_SIZE);

    context.fillStyle = 'rgba(0,0,0,0.3)';
    context.fillRect(x + BLOCK_SIZE - 2, y, 2, BLOCK_SIZE);
    context.fillRect(x, y + BLOCK_SIZE - 2, BLOCK_SIZE, 2);
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    var blockSize = 20;
    var offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
    var offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;

    for (var r = 0; r < nextPiece.shape.length; r++) {
        for (var c = 0; c < nextPiece.shape[r].length; c++) {
            if (nextPiece.shape[r][c]) {
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(offsetX + c * blockSize, offsetY + r * blockSize, blockSize, blockSize);

                nextCtx.strokeStyle = '#FFFFFF';
                nextCtx.strokeRect(offsetX + c * blockSize, offsetY + r * blockSize, blockSize, blockSize);
            }
        }
    }
}

function handleKeyPress(e) {
    if (!isGameRunning || isPaused) return;

    e = e || window.event;
    var keyCode = e.keyCode;

    switch(keyCode) {
        case 37: // ←
            movePiece(0, -1);
            break;
        case 39: // →
            movePiece(0, 1);
            break;
        case 40: // ↓
            movePiece(1, 0);
            break;
        case 38: // ↑
            rotatePiece();
            break;
        case 32: // Space
            // Жесткое падение
            while (movePiece(1, 0)) {}
            lockPiece();
            checkLines();
            spawnNewPiece();
            break;
    }

    drawGame();
}

function updateDisplay() {
    document.getElementById('score').innerHTML = score;
    document.getElementById('level').innerHTML = level;
    document.getElementById('lines').innerHTML = lines;
}