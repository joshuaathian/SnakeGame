// ======= GAME CONSTANTS =======
const gridSize = 20;
const tileCount = 24; // 480/20
const colorChoices = [
  {name: 'Teal', color: '#3ca6a6'},
  {name: 'Orange', color: '#e94f37'},
  {name: 'Green', color: '#56e39f'},
  {name: 'Blue', color: '#1e90ff'},
  {name: 'Purple', color: '#a259f7'},
];

// ======= DOM ELEMENTS =======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const mainMenu = document.getElementById('mainMenu');
const optionsMenu = document.getElementById('optionsMenu');
const scoreboardMenu = document.getElementById('scoreboardMenu');
const colorOptionsDiv = document.getElementById('colorOptions');
const scoreboardBody = document.getElementById('scoreboardBody');
const mainMenuCard = document.getElementById('mainMenuCard');
const downloadScoresBtn = document.getElementById('downloadScoresBtn');
const uploadScoresBtn = document.getElementById('uploadScoresBtn');
const uploadScoresInput = document.getElementById('uploadScoresInput');

// ======= SOUND =======
const eatSound = new Audio('eat.mp3');

// ======= GAME STATE =======
let snake, direction, food, score, gameLoop, isGameOver, selectedColor;
let scoreboard = [];

// ======= MENU MANAGEMENT =======
function hideAllMenusAndGame() {
  mainMenuCard.style.display = 'none';
  optionsMenu.classList.remove('active');
  scoreboardMenu.classList.remove('active');
  canvas.style.display = 'none';
  scoreDiv.style.display = 'none';
  restartBtn.style.display = 'none';
}
function showMenu(menu) {
  hideAllMenusAndGame();
  mainMenuCard.style.display = 'flex';
  menu.classList.add('active');
}
function showGame() {
  hideAllMenusAndGame();
  canvas.style.display = 'block';
  scoreDiv.style.display = 'block';
  restartBtn.style.display = 'inline-block';
}

// ======= OPTIONS MENU =======
function renderColorOptions() {
  colorOptionsDiv.innerHTML = '';
  colorChoices.forEach((opt, idx) => {
    const colorBtn = document.createElement('div');
    colorBtn.className = 'color-sample' + (selectedColor === opt.color ? ' selected' : '');
    colorBtn.style.background = opt.color;
    colorBtn.title = opt.name;
    colorBtn.onclick = () => {
      selectedColor = opt.color;
      localStorage.setItem('snakeColor', selectedColor);
      renderColorOptions();
    };
    colorOptionsDiv.appendChild(colorBtn);
  });
}

// ======= SCOREBOARD =======
function updateScoreboard(newScore) {
  if (typeof newScore === "number") {
    scoreboard.push(newScore);
    scoreboard = scoreboard.sort((a,b) => b-a).slice(0, 10); // Keep top 10
    localStorage.setItem('snakeScoreboard', JSON.stringify(scoreboard));
  }
}
function renderScoreboard() {
  scoreboardBody.innerHTML = '';
  if (scoreboard.length === 0) {
    scoreboardBody.innerHTML = `<tr><td colspan="2">No scores yet</td></tr>`;
  } else {
    scoreboard.forEach((s, i) => {
      scoreboardBody.innerHTML += `<tr><td>${i+1}</td><td>${s}</td></tr>`;
    });
  }
}
function loadScoreboard() {
  scoreboard = JSON.parse(localStorage.getItem('snakeScoreboard') || '[]');
}

// ======= DOWNLOAD/UPLOAD SCOREBOARD =======
function downloadScoreboard() {
  const data = JSON.stringify(scoreboard, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'highscores.json';
  a.click();
  URL.revokeObjectURL(url);
}
downloadScoresBtn.onclick = downloadScoreboard;

uploadScoresBtn.onclick = function() {
  uploadScoresInput.click();
};
uploadScoresInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        scoreboard = JSON.parse(e.target.result);
        localStorage.setItem('snakeScoreboard', JSON.stringify(scoreboard));
        renderScoreboard();
        alert('Highscores loaded!');
      } catch {
        alert('Invalid file!');
      }
    };
    reader.readAsText(file);
  }
});

// ======= GAME LOGIC =======
function initGame() {
  snake = [
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
  ];
  direction = 'right';
  score = 0;
  isGameOver = false;
  placeFood();
  scoreDiv.textContent = "Score: 0";
  clearInterval(gameLoop);
  showGame();
  gameLoop = setInterval(gameTick, 100);
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

function gameTick() {
  if (isGameOver) return;
  const head = { ...snake[0] };
  switch (direction) {
    case 'left': head.x -= 1; break;
    case 'up': head.y -= 1; break;
    case 'right': head.x += 1; break;
    case 'down': head.y += 1; break;
  }
  // Wrap around edges
  head.x = (head.x + tileCount) % tileCount;
  head.y = (head.y + tileCount) % tileCount;

  // Check collision (self)
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreDiv.textContent = `Score: ${score}`;
    placeFood();
    eatSound.currentTime = 0;
    eatSound.play();
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw food
  ctx.fillStyle = "#e94f37";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
  // Draw snake
  ctx.fillStyle = selectedColor || "#3ca6a6";
  snake.forEach(segment => {
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
  });
  // Draw head
  ctx.fillStyle = "#fff";
  ctx.fillRect(snake[0].x * gridSize, snake[0].y * gridSize, gridSize, gridSize);

  if (isGameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "32px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "20px Segoe UI";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
  }
}

function endGame() {
  isGameOver = true;
  clearInterval(gameLoop);
  updateScoreboard(score);
  draw();
  setTimeout(() => {
    showMenu(mainMenu);
    renderScoreboard();
  }, 1000);
}

// ======= EVENT HANDLERS =======
document.addEventListener('keydown', e => {
  if (isGameOver) return;
  switch (e.key) {
    case 'ArrowLeft':
      if (direction !== 'right') direction = 'left';
      break;
    case 'ArrowUp':
      if (direction !== 'down') direction = 'up';
      break;
    case 'ArrowRight':
      if (direction !== 'left') direction = 'right';
      break;
    case 'ArrowDown':
      if (direction !== 'up') direction = 'down';
      break;
  }
});

restartBtn.addEventListener('click', () => {
  initGame();
});

// Menu navigation
document.getElementById('startGameBtn').onclick = () => {
  initGame();
};
document.getElementById('optionsBtn').onclick = () => {
  mainMenuCard.style.display = 'none';
  optionsMenu.classList.add('active');
  renderColorOptions();
};
document.getElementById('optionsBackBtn').onclick = () => {
  showMenu(mainMenu);
};
document.getElementById('scoreboardBtn').onclick = () => {
  renderScoreboard();
  mainMenuCard.style.display = 'none';
  scoreboardMenu.classList.add('active');
};
document.getElementById('scoreboardBackBtn').onclick = () => {
  showMenu(mainMenu);
};

// ======= INIT =======
selectedColor = localStorage.getItem('snakeColor') || "#3ca6a6";
loadScoreboard();
showMenu(mainMenu);