// One animation loop shared by every ASCII block. It runs only while some step is active,
// at most every 40 ms (the scramble reads better slower), and never while the tab is hidden.
const steps = new Set();
let frame = 0, last = 0;

function tick(now) {
  frame = 0;
  if (document.hidden) return;
  if (now - last >= 40) {
    last = now;
    for (const step of [...steps]) if (step(now) === false) steps.delete(step);
  }
  if (steps.size) frame = requestAnimationFrame(tick);
}

// Add a step; it is called with the frame time until it returns false
export function run(step) {
  steps.add(step);
  if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && steps.size && !frame) frame = requestAnimationFrame(tick);
});
