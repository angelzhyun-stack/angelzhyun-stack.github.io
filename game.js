"use strict";

(function exposeSnakeGameCore(global) {
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
    right: Object.freeze({ x: 1, y: 0 }),
  });

  function samePosition(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function isOpposite(first, second) {
    return first.x + second.x === 0 && first.y + second.y === 0;
  }

  function cloneSnake(snake) {
    return snake.map((segment) => ({ x: segment.x, y: segment.y }));
  }

  function spawnFood(cols, rows, snake, random = Math.random) {
    const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
    const available = [];

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length === 0) {
      return null;
    }

    const index = Math.min(available.length - 1, Math.floor(random() * available.length));
    return available[index];
  }

  function createGame(options = {}) {
    const cols = options.cols || 20;
    const rows = options.rows || 20;
    const centerX = Math.max(2, Math.floor(cols / 2));
    const centerY = Math.floor(rows / 2);
    const snake = options.snake
      ? cloneSnake(options.snake)
      : [
          { x: centerX, y: centerY },
          { x: centerX - 1, y: centerY },
          { x: centerX - 2, y: centerY },
        ];
    const direction = DIRECTIONS[options.direction] || DIRECTIONS.right;

    return {
      cols,
      rows,
      snake,
      direction,
      nextDirection: direction,
      food: options.food || spawnFood(cols, rows, snake, options.random),
      score: options.score || 0,
      highScore: options.highScore || 0,
      status: options.status || "idle",
    };
  }

  function start(game) {
    if (game.status === "running") {
      return game;
    }
    return { ...game, status: "running" };
  }

  function pause(game) {
    if (game.status !== "running") {
      return game;
    }
    return { ...game, status: "paused" };
  }

  function resume(game) {
    if (game.status !== "paused") {
      return game;
    }
    return { ...game, status: "running" };
  }

  function setDirection(game, name) {
    const requested = DIRECTIONS[name];
    if (!requested || isOpposite(game.direction, requested)) {
      return game;
    }
    return { ...game, nextDirection: requested };
  }

  function step(game, random = Math.random) {
    if (game.status !== "running") {
      return game;
    }

    const direction = game.nextDirection;
    const head = game.snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    const hitWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= game.cols ||
      nextHead.y >= game.rows;

    if (hitWall) {
      return { ...game, direction, status: "gameover" };
    }

    const ateFood = Boolean(game.food && samePosition(nextHead, game.food));
    const collisionBody = ateFood ? game.snake : game.snake.slice(0, -1);
    if (collisionBody.some((segment) => samePosition(segment, nextHead))) {
      return { ...game, direction, status: "gameover" };
    }

    const snake = [nextHead, ...cloneSnake(game.snake)];
    let score = game.score;
    let highScore = game.highScore;
    let food = game.food;

    if (ateFood) {
      score += 1;
      highScore = Math.max(highScore, score);
      food = spawnFood(game.cols, game.rows, snake, random);
    } else {
      snake.pop();
    }

    return {
      ...game,
      snake,
      direction,
      nextDirection: direction,
      food,
      score,
      highScore,
      status: food === null ? "gameover" : game.status,
    };
  }

  global.SnakeGameCore = Object.freeze({
    DIRECTIONS,
    createGame,
    pause,
    resume,
    setDirection,
    spawnFood,
    start,
    step,
  });
})(window);
