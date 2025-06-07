/* eslint-disable @typescript-eslint/no-unused-vars */

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

let positionsX: Float32Array;
let positionsY: Float32Array;
let velocitiesX: Float32Array;
let velocitiesY: Float32Array;
let targetsX: Float32Array;
let targetsY: Float32Array;
let states: Uint8Array;
let neighborIndexPool: Int32Array;
let neighborPoolLength = 0;

let targetPoints: { x: number; y: number }[] = [];
let targetBitmap: ImageBitmap | null = null;

// simulation params
let NEIGHBOR_RADIUS = 15;
let NEIGHBOR_RADIUS_SQ = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
let MAX_NEIGHBORS = 3;
let cellSize = NEIGHBOR_RADIUS * 2;
let mouseInfluenceRadius = 350;
const throttle = 60;
let lastFrameTime = 0;
const maxSpeed = 3;

// track external pointer
let pointer: { x: number; y: number } = { x: -1000, y: -1000 };

// hover animation state
let hoverActive = false;
let hoverX = 0;
let hoverY = 0;

// theme state
let isDarkMode = true;

// Spatial quadtree utility types
class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
  ) {}
  contains(px: number, py: number): boolean {
    return (
      px >= this.x - this.w &&
      px < this.x + this.w &&
      py >= this.y - this.h &&
      py < this.y + this.h
    );
  }
  intersects(range: Circle): boolean {
    const xDist = Math.abs(range.x - this.x);
    const yDist = Math.abs(range.y - this.y);
    const r = range.r;
    return xDist <= this.w + r && yDist <= this.h + r;
  }
}
class Circle {
  constructor(
    public x: number,
    public y: number,
    public r: number,
  ) {}
  contains(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.r * this.r;
  }
}
class Quadtree {
  private divided = false;
  private points: { x: number; y: number; idx: number }[] = [];
  private northeast!: Quadtree;
  private northwest!: Quadtree;
  private southeast!: Quadtree;
  private southwest!: Quadtree;
  constructor(
    private boundary: Rectangle,
    private capacity: number,
  ) {}
  subdivide(): void {
    const { x, y, w, h } = this.boundary;
    this.northeast = new Quadtree(
      new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2),
      this.capacity,
    );
    this.northwest = new Quadtree(
      new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2),
      this.capacity,
    );
    this.southeast = new Quadtree(
      new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2),
      this.capacity,
    );
    this.southwest = new Quadtree(
      new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2),
      this.capacity,
    );
    this.divided = true;
  }
  insert(point: { x: number; y: number; idx: number }): boolean {
    if (!this.boundary.contains(point.x, point.y)) return false;
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }
    if (!this.divided) this.subdivide();
    return (
      this.northeast.insert(point) ||
      this.northwest.insert(point) ||
      this.southeast.insert(point) ||
      this.southwest.insert(point)
    );
  }
  query(range: Circle, found: { x: number; y: number; idx: number }[]): void {
    if (!this.boundary.intersects(range)) return;
    for (const p of this.points) {
      if (range.contains(p.x, p.y)) found.push(p);
    }
    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }
  }
  clear(): void {
    this.points.length = 0;
    this.divided = false;
  }
}
// persistent quadtree for neighbor queries
let qt: Quadtree;

// reusable array for neighbor search results
const foundPoints: { x: number; y: number; idx: number }[] = [];

// animation state
let animationStartTime = 0;
const fadeInDuration = 2000; // 2 seconds fade in

function initBuffers() {
  const N = targetPoints.length;
  positionsX = new Float32Array(N);
  positionsY = new Float32Array(N);
  velocitiesX = new Float32Array(N);
  velocitiesY = new Float32Array(N);
  targetsX = new Float32Array(N);
  targetsY = new Float32Array(N);
  states = new Uint8Array(N);
  neighborIndexPool = new Int32Array(N * 9);
  neighborPoolLength = 0;

  // draw targetPoints to an offscreen canvas and capture as bitmap
  const tgtCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const tgtCtx = tgtCanvas.getContext("2d")!;
  tgtCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
  for (const pt of targetPoints) {
    tgtCtx.fillRect(pt.x, pt.y, 1, 1);
  }
  targetBitmap = tgtCanvas.transferToImageBitmap();

  // Start boids from center with aesthetic burst pattern
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const burstRadius = 20; // tighter starting cluster

  for (let i = 0; i < N; i++) {
    // Create a spiral/flower pattern using golden angle
    const t = i / N;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // golden ratio angle
    const angle = i * goldenAngle;
    const spiralRadius = Math.sqrt(i / N) * burstRadius;

    // Start position with slight spiral
    positionsX[i] = centerX + Math.cos(angle) * spiralRadius;
    positionsY[i] = centerY + Math.sin(angle) * spiralRadius;

    // Create wave-like burst with varying speeds - more controlled
    const wavePhase = t * Math.PI * 4; // creates 2 full waves
    const waveFactor = 0.5 + 0.5 * Math.sin(wavePhase);
    const burstSpeed = (4 + waveFactor * 6) * (0.7 + 0.3 * Math.random());

    // Add slight perpendicular component for spiral motion
    const perpAngle = angle + Math.PI / 2;
    const spiralFactor = 0.2;

    velocitiesX[i] =
      Math.cos(angle) * burstSpeed +
      Math.cos(perpAngle) * burstSpeed * spiralFactor;
    velocitiesY[i] =
      Math.sin(angle) * burstSpeed +
      Math.sin(perpAngle) * burstSpeed * spiralFactor;

    targetsX[i] = targetPoints[i].x;
    targetsY[i] = targetPoints[i].y;
    states[i] = i % 4; // more varied states for visual groups
  }
}

function animate() {
  // fixed-timestep at approx throttle FPS
  // no need for delta logic; schedule next at end

  // start frame timer
  const frameStart = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // calculate fade-in alpha
  const elapsed = frameStart - animationStartTime;
  const fadeAlpha = Math.min(1, elapsed / fadeInDuration);

  // prepare path for all boids to batch draw using precomputed shape
  const boidPath = new Path2D();

  // update quadtree for neighbor queries
  qt.clear();
  const N = positionsX.length;
  for (let i = 0; i < N; i++) {
    qt.insert({ x: positionsX[i], y: positionsY[i], idx: i });
  }

  for (let index = 0; index < N; index++) {
    const boidX = positionsX[index];
    const boidY = positionsY[index];
    const boidS = states[index];
    // query quadtree for neighbors within radius
    foundPoints.length = 0;
    qt.query(new Circle(boidX, boidY, NEIGHBOR_RADIUS), foundPoints);

    // inline separation, alignment, cohesion using quadtree results
    let sepX = 0,
      sepY = 0,
      aliX = 0,
      aliY = 0,
      cohX = 0,
      cohY = 0;
    let nc = 0;
    for (const p of foundPoints) {
      const idx = p.idx;
      if (idx !== index && states[idx] === boidS) {
        const dxN = p.x - boidX;
        const dyN = p.y - boidY;
        sepX += boidX - p.x;
        sepY += boidY - p.y;
        aliX += velocitiesX[idx];
        aliY += velocitiesY[idx];
        cohX += p.x;
        cohY += p.y;
        nc++;
        if (nc >= MAX_NEIGHBORS) break;
      }
    }
    let normSepX = 0,
      normSepY = 0,
      normAliX = 0,
      normAliY = 0,
      normCohX = 0,
      normCohY = 0;
    if (nc > 0) {
      sepX /= nc;
      sepY /= nc;
      aliX /= nc;
      aliY /= nc;
      cohX /= nc;
      cohY /= nc;
      const magSep = Math.hypot(sepX, sepY);
      if (magSep > 0) {
        normSepX = sepX / magSep;
        normSepY = sepY / magSep;
      }
      const magAli = Math.hypot(aliX, aliY);
      if (magAli > 0) {
        normAliX = aliX / magAli;
        normAliY = aliY / magAli;
      }
      const magCoh = Math.hypot(cohX, cohY);
      if (magCoh > 0) {
        normCohX = cohX / magCoh;
        normCohY = cohY / magCoh;
      }
    }
    // random jitter towards hover or shape target
    let targetForceX = 0,
      targetForceY = 0;
    if (hoverActive) {
      // biased random direction towards hover point
      const dxH = hoverX - boidX + (Math.random() - 1) * NEIGHBOR_RADIUS_SQ;
      const dyH = hoverY - boidY + (Math.random() - 1) * NEIGHBOR_RADIUS_SQ;
      const distH = Math.hypot(dxH, dyH);
      if (distH > 0) {
        const baseAngle = Math.atan2(dyH, dxH);
        // add randomness
        const jitter = (Math.random() * 2 - 1) * (Math.PI / 4);
        const angle = baseAngle + jitter;
        targetForceX = Math.cos(angle);
        targetForceY = Math.sin(angle);
      }
    } else {
      // Enhanced attraction towards shape with easing
      const tx = targetsX[index];
      const ty = targetsY[index];
      const toTargetX = tx - boidX;
      const toTargetY = ty - boidY;
      const distSq = toTargetX * toTargetX + toTargetY * toTargetY;
      const epsSq = 0.25;
      if (distSq > epsSq) {
        const distToTarget = Math.sqrt(distSq);
        if (Number.isFinite(distToTarget) && distToTarget > 0) {
          // Dynamic attraction based on distance and time
          const timeElapsed = (performance.now() - animationStartTime) / 1000; // in seconds
          const timeFactor = Math.min(1, timeElapsed / 8); // slow ramp up over 8 seconds

          // Gentle pull that preserves boid behavior
          const distanceFactor = Math.min(2, distToTarget / 100);
          const easedPull = distanceFactor * (1.5 - distanceFactor * 0.25); // gentler curve

          const invDist = ((0.8 + timeFactor * 1.2) * easedPull) / distToTarget;
          targetForceX = toTargetX * invDist;
          targetForceY = toTargetY * invDist;
        }
      }
    }
    // mouse repulsion force based on pointer
    let mouseForceX = 0,
      mouseForceY = 0;
    const dxM = boidX - pointer.x;
    const dyM = boidY - pointer.y;
    const distMSq = dxM * dxM + dyM * dyM;
    if (distMSq > 0 && distMSq < mouseInfluenceRadius * mouseInfluenceRadius) {
      const distM = Math.sqrt(distMSq);
      const strength = (mouseInfluenceRadius - distM) / mouseInfluenceRadius;
      mouseForceX = (dxM / distM) * strength;
      mouseForceY = (dyM / distM) * strength;
    }
    const separationWeight = 0.5;
    const alignmentWeight = 0.1;
    const cohesionWeight = 0.2;
    const targetWeight = 0.6; // slightly increased from 0.5
    const mouseWeight = 2;
    // apply stronger attraction if hovering
    const tw = hoverActive ? 1.0 : targetWeight;
    const forceX =
      normSepX * separationWeight +
      normAliX * alignmentWeight +
      normCohX * cohesionWeight +
      targetForceX * tw +
      mouseForceX * mouseWeight;
    const forceY =
      normSepY * separationWeight +
      normAliY * alignmentWeight +
      normCohY * cohesionWeight +
      targetForceY * tw +
      mouseForceY * mouseWeight;
    const forceMultiplier = 0.2;
    const damping = 0.95;
    velocitiesX[index] += forceX * forceMultiplier;
    velocitiesY[index] += forceY * forceMultiplier;
    velocitiesX[index] *= damping;
    velocitiesY[index] *= damping;
    const speed = Math.hypot(velocitiesX[index], velocitiesY[index]);
    if (speed > maxSpeed) {
      velocitiesX[index] = (velocitiesX[index] / speed) * maxSpeed;
      velocitiesY[index] = (velocitiesY[index] / speed) * maxSpeed;
    }
    positionsX[index] += velocitiesX[index];
    positionsY[index] += velocitiesY[index];

    // Normal wrapping behavior
    const buffer = 10;
    if (positionsX[index] > canvas.width + buffer) positionsX[index] = -buffer;
    if (positionsX[index] < -buffer) positionsX[index] = canvas.width + buffer;
    if (positionsY[index] > canvas.height + buffer) positionsY[index] = -buffer;
    if (positionsY[index] < -buffer) positionsY[index] = canvas.height + buffer;
    // add transformed base triangle shape with size variation
    const x = positionsX[index],
      y = positionsY[index];
    const angle = Math.atan2(velocitiesY[index], velocitiesX[index]);

    // Size variation based on state and slight randomness
    const sizeVar = 0.8 + states[index] * 0.1 + Math.sin(index * 0.5) * 0.2;

    const c = Math.cos(angle),
      s = Math.sin(angle);
    const matrix = new DOMMatrix([
      c * sizeVar,
      s * sizeVar,
      -s * sizeVar,
      c * sizeVar,
      x,
      y,
    ]);
    boidPath.addPath(baseBoidPath, matrix);
  }
  // batch fill all boids once with fade-in
  // Use reddish-brown color for light mode, lighter/whiter for dark mode
  const baseAlpha = 0.8 * fadeAlpha;
  ctx.fillStyle = isDarkMode
    ? `rgba(255, 255, 255, ${baseAlpha})`
    : `rgba(150, 75, 60, ${baseAlpha})`;
  ctx.fill(boidPath);

  // end frame timer and notify main thread
  const frameEnd = performance.now();
  self.postMessage({ type: "frameTime", duration: frameEnd - frameStart });
  // schedule next frame at target throttle
  setTimeout(animate, 1000 / throttle);
}

self.onmessage = (e) => {
  const data = e.data;
  switch (data.type) {
    case "init":
      canvas = data.canvas;
      mouseInfluenceRadius = data.mouseInfluenceRadius;
      NEIGHBOR_RADIUS = data.neighborRadius;
      NEIGHBOR_RADIUS_SQ = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
      MAX_NEIGHBORS = data.maxNeighbors;
      cellSize = data.cellSize;
      targetPoints = data.targetPoints;
      canvas.width = data.width;
      canvas.height = data.height;
      ctx = canvas.getContext("2d")!;
      initBuffers();
      // initialize quadtree boundary and capacity
      qt = new Quadtree(
        new Rectangle(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2,
          canvas.height / 2,
        ),
        16,
      );
      lastFrameTime = performance.now();
      animationStartTime = performance.now();
      animate();
      break;
    case "resize":
      canvas.width = data.width;
      canvas.height = data.height;
      targetPoints = data.targetPoints;
      initBuffers();
      // reinitialize quadtree on resize
      qt = new Quadtree(
        new Rectangle(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2,
          canvas.height / 2,
        ),
        16,
      );
      break;
    case "pointer":
      pointer = { x: data.x, y: data.y };
      break;
    case "hover":
      if (data.subtype === "start") {
        hoverActive = true;
        hoverX = data.x;
        hoverY = data.y;
      } else {
        hoverActive = false;
      }
      break;
    case "theme":
      isDarkMode = data.isDark;
      break;
  }
};

// precompute a unit boid triangle shape (larger)
const baseBoidPath = new Path2D();
baseBoidPath.moveTo(3, 0);
baseBoidPath.lineTo(-1.5, 1.5);
baseBoidPath.lineTo(-1.5, -1.5);
baseBoidPath.closePath();

export {};
