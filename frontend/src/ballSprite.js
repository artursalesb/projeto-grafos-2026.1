const SPRITE_SIZE = 96;
let cachedSprite = null;

function drawPolygon(ctx, cx, cy, radius, sides, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    const px = cx + Math.cos(a) * radius;
    const py = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function createSoccerBallSprite(size = SPRITE_SIZE) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(
    cx - r * 0.35,
    cy - r * 0.35,
    r * 0.1,
    cx,
    cy,
    r
  );
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.7, "#f4f4f4");
  grad.addColorStop(1, "#c8c8c8");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#0d0d0d";
  drawPolygon(ctx, cx, cy, r * 0.32, 5, -Math.PI / 2);
  ctx.fill();
  ctx.strokeStyle = "#0d0d0d";
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(a) * r * 0.32,
      cy + Math.sin(a) * r * 0.32
    );
    ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + Math.PI / 5 + (i * 2 * Math.PI) / 5;
    const px = cx + Math.cos(a) * r * 0.78;
    const py = cy + Math.sin(a) * r * 0.78;
    ctx.fillStyle = "#0d0d0d";
    drawPolygon(ctx, px, py, r * 0.18, 5, a + Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(
    cx - r * 0.35,
    cy - r * 0.4,
    r * 0.22,
    r * 0.13,
    -Math.PI / 4,
    0,
    2 * Math.PI
  );
  ctx.fill();

  return canvas;
}

export function getBallSprite() {
  if (!cachedSprite) cachedSprite = createSoccerBallSprite();
  return cachedSprite;
}
