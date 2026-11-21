// input.js — keyboard and mouse: held keys, aim point, and one-shot action flags.
export const input = {
  keys: new Set(),
  mouse: { x: 0, y: 0, clicked: false },
  pressed: new Set(),
};

export function bindInput(canvas, toWorld) {
  addEventListener('keydown', (e) => {
    if (!input.keys.has(e.code)) input.pressed.add(e.code);
    input.keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => input.keys.delete(e.code));
  canvas.addEventListener('pointermove', (e) => {
    const p = toWorld(e.clientX, e.clientY);
    input.mouse.x = p.x; input.mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toWorld(e.clientX, e.clientY);
    input.mouse.x = p.x; input.mouse.y = p.y;
    input.mouse.clicked = true;
  });
}

/** Movement vector from the held keys, normalised. */
export function moveVector() {
  let x = 0, y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  const d = Math.hypot(x, y) || 1;
  return { x: x / d, y: y / d, active: x !== 0 || y !== 0 };
}

export function endFrame() {
  input.mouse.clicked = false;
  input.pressed.clear();
}
