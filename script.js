"use strict";

const navigationLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const navigationToggle = document.querySelector(".nav-toggle");
const navigationList = document.querySelector(".site-nav__list");

function setNavigationOpen(open) {
  if (!navigationToggle || !navigationList) {
    return;
  }
  navigationToggle.setAttribute("aria-expanded", String(open));
  navigationList.dataset.open = String(open);
}

if (navigationToggle) {
  navigationToggle.addEventListener("click", () => {
    setNavigationOpen(navigationToggle.getAttribute("aria-expanded") !== "true");
  });
}

for (const link of navigationLinks) {
  link.addEventListener("click", () => {
    for (const item of navigationLinks) {
      item.removeAttribute("aria-current");
    }

    link.setAttribute("aria-current", "page");
    setNavigationOpen(false);
  });
}

const gameElements = {
  canvas: document.querySelector("#game-canvas"),
  score: document.querySelector("#game-score"),
  highScore: document.querySelector("#game-high-score"),
  status: document.querySelector("#game-status"),
  start: document.querySelector("#game-start"),
  pause: document.querySelector("#game-pause"),
  restart: document.querySelector("#game-restart"),
  directions: document.querySelectorAll("[data-direction]"),
};

if (gameElements.canvas && window.SnakeGameCore) {
  const core = window.SnakeGameCore;
  const context = gameElements.canvas.getContext("2d");
  const storageKey = "professional-portfolio-snake-high-score";
  const tickMilliseconds = 135;
  let game = core.createGame({ highScore: readHighScore() });
  let intervalId = null;
  let loopStartCount = 0;
  let pointerStart = null;

  function readHighScore() {
    try {
      const value = Number.parseInt(window.localStorage.getItem(storageKey) || "0", 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      window.localStorage.setItem(storageKey, String(value));
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  function stopLoop() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startLoop() {
    if (intervalId !== null) {
      return;
    }
    loopStartCount += 1;
    intervalId = window.setInterval(() => {
      game = core.step(game);
      if (game.status === "gameover") {
        stopLoop();
        saveHighScore(game.highScore);
      }
      render();
    }, tickMilliseconds);
  }

  function statusText() {
    if (game.status === "running") return "게임 진행 중";
    if (game.status === "paused") return "일시정지됨";
    if (game.status === "gameover") return "게임 오버. 다시 시작할 수 있습니다.";
    return "시작 버튼을 눌러 게임을 시작하세요.";
  }

  function render() {
    const cellWidth = gameElements.canvas.width / game.cols;
    const cellHeight = gameElements.canvas.height / game.rows;
    context.fillStyle = "#07101f";
    context.fillRect(0, 0, gameElements.canvas.width, gameElements.canvas.height);

    if (game.food) {
      context.fillStyle = "#ff6b78";
      context.beginPath();
      context.arc(
        game.food.x * cellWidth + cellWidth / 2,
        game.food.y * cellHeight + cellHeight / 2,
        Math.min(cellWidth, cellHeight) * 0.34,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    for (const [index, segment] of game.snake.entries()) {
      context.fillStyle = index === 0 ? "#9cb5ff" : "#5c7de1";
      context.fillRect(
        segment.x * cellWidth + 1,
        segment.y * cellHeight + 1,
        cellWidth - 2,
        cellHeight - 2,
      );
    }

    gameElements.score.textContent = String(game.score);
    gameElements.highScore.textContent = String(game.highScore);
    gameElements.status.textContent = statusText();
    gameElements.pause.disabled = game.status === "idle" || game.status === "gameover";
    gameElements.pause.textContent = game.status === "paused" ? "계속" : "일시정지";
  }

  function startGame() {
    if (game.status === "gameover") {
      game = core.createGame({ highScore: game.highScore });
    }
    game = core.start(game);
    startLoop();
    gameElements.canvas.focus({ preventScroll: true });
    render();
  }

  function restartGame() {
    stopLoop();
    game = core.start(core.createGame({ highScore: game.highScore }));
    startLoop();
    gameElements.canvas.focus({ preventScroll: true });
    render();
  }

  function togglePause() {
    if (game.status === "running") {
      game = core.pause(game);
      stopLoop();
    } else if (game.status === "paused") {
      game = core.resume(game);
      startLoop();
    }
    render();
  }

  function changeDirection(direction) {
    game = core.setDirection(game, direction);
  }

  const keyDirections = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
  };

  document.addEventListener("keydown", (event) => {
    const direction = keyDirections[event.key];
    if (direction && (game.status === "running" || game.status === "paused")) {
      event.preventDefault();
      changeDirection(direction);
    } else if (event.code === "Space" && (game.status === "running" || game.status === "paused")) {
      event.preventDefault();
      togglePause();
    }
  });

  gameElements.start.addEventListener("click", startGame);
  gameElements.pause.addEventListener("click", togglePause);
  gameElements.restart.addEventListener("click", restartGame);

  for (const button of gameElements.directions) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      changeDirection(button.dataset.direction);
    });
  }

  gameElements.canvas.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  gameElements.canvas.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
    changeDirection(
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0 ? "right" : "left"
        : deltaY > 0 ? "down" : "up",
    );
  });

  window.__snakeGameDebug = Object.freeze({
    getState: () => ({ ...game, snake: game.snake.map((segment) => ({ ...segment })) }),
    getLoopStartCount: () => loopStartCount,
    hasActiveLoop: () => intervalId !== null,
    start: startGame,
    pause: togglePause,
    restart: restartGame,
    direction: changeDirection,
    stop: stopLoop,
  });

  render();
}
