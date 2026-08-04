"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  BlockProps,
  DEFAULT_THEME,
  DEFAULT_ACCENT,
  surfaceTokens,
  resolvedAccentHex,
} from "../lib/theme";
import gsap from "gsap";

// --- DATA (real photographic archive) ---
const IMG = (file: string) => `/images/astra-archive/${file}`;

const PROJECTS = [
  { title: "Contemplative Solitude", category: "Portrait", year: "2025", client: "Atlas Studio", desc: "A quiet study in stillness — soft window light and the unhurried grace of being alone.", file: "contemplative-solitude.webp" },
  { title: "Dynamic Basketball", category: "Sports", year: "2025", client: "Court Co.", desc: "Peak athleticism frozen mid-air — explosive vertical leap and raw competitive energy.", file: "dynamic-basketball-action.webp" },
  { title: "Basketball Motion", category: "Sports", year: "2024", client: "Court Co.", desc: "Motion blur meets precision — a kinetic portrait of speed and constant movement.", file: "dynamic-basketball-motion.webp" },
  { title: "Joyful Backyard", category: "Lifestyle", year: "2025", client: "Sunhouse", desc: "Golden-hour warmth in a sun-dappled garden — candid laughter and easy summer joy.", file: "joyful-backyard-scene.webp" },
  { title: "Minimalist Interior", category: "Architecture", year: "2026", client: "Form Atelier", desc: "Restrained material palette and sculptural negative space, every line intentional.", file: "minimalist-interior-design.webp" },
  { title: "Interior II", category: "Architecture", year: "2026", client: "Form Atelier", desc: "A second study in light and emptiness — surfaces shaped purely by shadow.", file: "minimalist-interior-ii.webp" },
  { title: "Moth in Flight", category: "Nature", year: "2024", client: "Field Notes", desc: "Macro intimacy with the ephemeral — delicate wing patterns caught against darkness.", file: "moth-in-flight.webp" },
  { title: "Rustic Charm Café", category: "Editorial", year: "2023", client: "Lyon Press", desc: "Weathered wood, warm ceramics, and the slow ritual of a European morning coffee.", file: "rustic-charm-cafe.webp" },
  { title: "Autumn Whisper", category: "Editorial", year: "2024", client: "Lyon Press", desc: "Amber tones and falling light — a café caught in the hush of late autumn.", file: "autumn-whisper-cafe.webp" },
  { title: "Rustic Grandeur", category: "Interior", year: "2025", client: "Heritage", desc: "Contemporary scale meets handcrafted warmth in a sweeping open interior.", file: "contemporary-rustic-grandeur.webp" },
  { title: "Cozy Café", category: "Editorial", year: "2024", client: "Daybreak", desc: "Soft steam, worn tables, and the comfort of a familiar corner seat.", file: "cozy-cafe-scene.webp" },
  { title: "Serene Beachcomber", category: "Travel", year: "2025", client: "Tideline", desc: "Bare feet on cool sand at first light — a solitary walk along the tide.", file: "serene-beachcomber.webp" },
  { title: "Serene Countertop", category: "Still Life", year: "2024", client: "Daybreak", desc: "A calm arrangement of everyday objects bathed in diffused morning light.", file: "serene-countertop-scene.webp" },
  { title: "Grassland Portrait", category: "Portrait", year: "2025", client: "Field Notes", desc: "Wind-swept grasses frame a quiet figure under an open, endless sky.", file: "serene-grassland-portrait.webp" },
  { title: "Pilates Studio", category: "Wellness", year: "2026", client: "Form Atelier", desc: "Clean light and controlled motion inside a minimalist movement studio.", file: "serene-pilates-studio.webp" },
  { title: "Warm Glow", category: "Portrait", year: "2024", client: "Atlas Studio", desc: "A silhouette wrapped in amber light — intimacy rendered in shadow and warmth.", file: "silhouette-warm-glow.webp" },
  { title: "Silhouetted Journey", category: "Travel", year: "2025", client: "Tideline", desc: "A lone traveler outlined against a vast, luminous horizon.", file: "silhouetted-journey.webp" },
  { title: "Tennis Action", category: "Sports", year: "2025", client: "Court Co.", desc: "The split-second of contact — tension, focus, and explosive precision.", file: "tennis-action-shot.webp" },
  { title: "Tennis Victory", category: "Sports", year: "2024", client: "Court Co.", desc: "Arms raised, breath held — the pure release of a hard-won point.", file: "tennis-victory-pose.webp" },
  { title: "Terminal Traveler", category: "Documentary", year: "2025", client: "Transit", desc: "Stillness inside motion — a figure waiting amid the rhythm of departures.", file: "traveler-in-terminal.webp" },
  { title: "Crosswalk Trio", category: "Street", year: "2024", client: "Transit", desc: "Three strangers, one instant — the choreography of a city intersection.", file: "urban-crosswalk-trio.webp" },
  { title: "Fire Hydrant Pose", category: "Street", year: "2025", client: "Metro", desc: "Confident attitude against raw urban texture — style meets the sidewalk.", file: "urban-pose-fire-hydrant.webp" },
  { title: "Rustic Elegance", category: "Interior", year: "2025", client: "Heritage", desc: "Warm timber and soft fabrics compose a space that feels lived-in and refined.", file: "warm-rustic-elegance.webp" },
  { title: "Modern House", category: "Architecture", year: "2026", client: "Form Atelier", desc: "Crisp geometry and generous glass framing a contemporary minimalist home.", file: "modern-minimalist-house.webp" },
].map((p, i) => ({ ...p, id: `cra-${i}`, image: IMG(p.file) }));

// --- CONSTANTS ---
const SEGMENTS = 4; // vertical strips per tile (4 ≈ same curve, 33% fewer DOM nodes)

// Live-tunable settings (exposed in the on-screen control panel).
type Settings = {
  perRow: number; // tiles around the cylinder per row
  rows: number; // stacked rows -> band thickness
  ringSize: number; // base radius of the cylinder
  rowSpacing: number; // vertical distance between rows
  stack: number; // per-tile depth jitter (the "stacked" feel)
  tileScale: number; // overall tile size multiplier
  bend: number; // degrees each tile curves across its width
  perspective: number; // camera perspective
  tilt: number; // default vertical pitch
  zoom: number; // scene scale
  shadow: number; // tile drop-shadow intensity (0-1)
};

const DEFAULT_SETTINGS: Settings = {
  perRow: 22,
  rows: 2,
  ringSize: 850,
  rowSpacing: 168,
  stack: 260,
  tileScale: 1,
  bend: 18,
  perspective: 2200,
  tilt: -15,
  zoom: 0.55,
  shadow: 0,
};

// On-load intro: ring grows from this radius up to the configured ringSize.
const INTRO_START_RADIUS = 250;

const SETTING_FIELDS: {
  key: keyof Settings;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "ringSize", label: "Ring Size", min: 250, max: 1000, step: 10 },
  { key: "perRow", label: "Tiles / Row", min: 6, max: 30, step: 1 },
  { key: "rows", label: "Rows", min: 1, max: 6, step: 1 },
  { key: "rowSpacing", label: "Row Spacing", min: 80, max: 340, step: 4 },
  { key: "stack", label: "Stack Depth", min: 0, max: 700, step: 10 },
  { key: "tileScale", label: "Tile Size", min: 0.5, max: 2, step: 0.05 },
  { key: "bend", label: "Curve", min: 0, max: 60, step: 1 },
  { key: "perspective", label: "Perspective", min: 800, max: 4000, step: 50 },
  { key: "tilt", label: "Tilt", min: -60, max: 40, step: 1 },
  { key: "zoom", label: "Zoom", min: 0.3, max: 2, step: 0.05 },
  { key: "shadow", label: "Shadow", min: 0, max: 1, step: 0.05 },
];

// --- MATH ---
const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
// Pick the angle equivalent closest to `current` (avoids 360° spins after scroll).
const nearestRotation = (current: number, target: number) =>
  target + Math.round((current - target) / 360) * 360;

const EXPAND_CONTAINER_MAX = 1500;
const EXPAND_PANEL_W = 420;
const EXPAND_GAP = 40;

type HeroRect = { x: number; y: number; w: number; h: number };

// Hero sits in the left slot of a centered max-width row beside the detail panel.
function computeHeroRect(
  rootRect: DOMRect,
  aspect: number,
  isMobile: boolean
): HeroRect {
  const pad = isMobile ? 20 : 32;
  const containerW = Math.min(rootRect.width - pad * 2, EXPAND_CONTAINER_MAX);
  const containerX = (rootRect.width - containerW) / 2;

  if (isMobile) {
    const w = containerW;
    const h = Math.min(w / aspect, (rootRect.height - pad * 2) * 0.4);
    return { x: containerX, y: pad, w, h };
  }

  const heroMaxW = containerW - EXPAND_PANEL_W - EXPAND_GAP;
  const heroMaxH = rootRect.height - pad * 2;
  let w = heroMaxW;
  let h = w / aspect;
  if (h > heroMaxH) {
    h = heroMaxH;
    w = h * aspect;
  }
  return {
    x: containerX,
    y: (rootRect.height - h) / 2,
    w,
    h,
  };
}
const prng = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

type Tile = {
  key: string;
  project: (typeof PROJECTS)[number];
  projectIndex: number;
  angle: number; // degrees around Y
  rowY: number;
  radius: number; // per-tile depth so the band feels stacked
  width: number;
  height: number;
  bend: number;
  focalX: number;
  focalY: number;
};

// Build the static tile list. Positions never change; the whole ring spins.
// Per-tile radius / size / position jitter creates the layered, "organized
// messy" depth instead of one flat, uniform band.
function buildTiles(s: Settings): { tiles: Tile[]; anglePer: number } {
  const anglePer = 360 / s.perRow;

  const tiles: Tile[] = [];
  let n = 0;
  for (let r = 0; r < s.rows; r++) {
    for (let c = 0; c < s.perRow; c++) {
      const seed = n + 1;
      // mixed aspect ratios: some landscape, some near-square, some portrait
      const width = Math.round((160 + prng(seed * 1.7) * 150) * s.tileScale);
      const ratio = 0.6 + prng(seed * 2.3) * 0.85; // 0.6 - 1.45 (h / w)
      const height = Math.round(width * ratio);
      // stagger rows + jitter angle so tiles overlap and stack, not align
      const angle =
        c * anglePer +
        (r % 2) * (anglePer / 2) +
        (prng(seed * 3.1) - 0.5) * anglePer * 0.55;
      const rowY =
        (r - (s.rows - 1) / 2) * s.rowSpacing + (prng(seed * 4.9) - 0.5) * 120;
      // depth jitter: pull some tiles toward the camera, push others back
      const radius = s.ringSize + (prng(seed * 5.7) - 0.5) * s.stack;
      // Random image pick — not sequential, avoid repeating the neighbour.
      let projectIndex = Math.floor(prng(seed * 8.31 + r * 17.3 + c * 3.77) * PROJECTS.length);
      if (n > 0 && projectIndex === tiles[n - 1]?.projectIndex) {
        projectIndex = (projectIndex + 1 + Math.floor(prng(seed * 2.17) * (PROJECTS.length - 1))) % PROJECTS.length;
      }
      const focalX = prng(seed * 6.21);
      const focalY = prng(seed * 7.43);
      // Bend each tile to the arc it spans on the cylinder, scaled by the
      // curve slider (bend === anglePer → perfect cylinder hug).
      const arcDeg = (width / radius) * (180 / Math.PI);
      const bend = arcDeg * (s.bend / anglePer);
      tiles.push({
        key: `t-${r}-${c}`,
        project: PROJECTS[projectIndex],
        projectIndex,
        angle,
        rowY,
        radius,
        width,
        height,
        bend,
        focalX,
        focalY,
      });
      n++;
    }
  }
  return { tiles, anglePer };
}

// --- CURVED SURFACE (vertical strips that hug the cylinder) ---
// Each strip is a viewport into one shared <img object-fit:cover> — true cover,
// no stretch. Segments are only mounted after the lightweight flat intro.
function CurvedSurface({
  width,
  height,
  image,
  bend,
  focalX,
  focalY,
  lit,
}: {
  width: number;
  height: number;
  image: string;
  bend: number;
  focalX: number;
  focalY: number;
  lit: boolean;
}) {
  const segAngle = bend / SEGMENTS;
  const segW = width / SEGMENTS;
  const radius = segW / 2 / Math.tan((segAngle * Math.PI) / 180 / 2);
  const mid = (SEGMENTS - 1) / 2;
  const objPos = `${Math.round(focalX * 100)}% ${Math.round(focalY * 100)}%`;

  return (
    <div
      className="absolute inset-0"
      style={{ transformStyle: "preserve-3d", transform: `translateZ(${-radius}px)` }}
    >
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const angle = (i - mid) * segAngle;
        return (
          <div
            key={i}
            className="absolute top-0 overflow-hidden"
            style={{
              left: "50%",
              width: segW + 0.5,
              height,
              marginLeft: -(segW + 0.5) / 2,
              transformOrigin: "center center",
              transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
              backfaceVisibility: "visible",
            }}
          >
            <img
              data-curve-seg
              src={image}
              alt=""
              draggable={false}
              decoding="async"
              style={{
                width,
                height,
                maxWidth: "none",
                objectFit: "cover",
                objectPosition: objPos,
                marginLeft: -i * segW,
                display: "block",
                ...(lit ? { opacity: 1 } : {}),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

type Phase = "loader" | "intro" | "ready";

// Themed 3D wireframe cylinder — thick stroke → thin while spinning.
function RingLoader({
  onComplete,
  stroke,
  bg,
}: {
  onComplete: () => void;
  stroke: string;
  bg: string;
}) {
  const cylRef = useRef<HTMLDivElement>(null);
  const PANELS = 18;
  const RADIUS = 74;

  useLayoutEffect(() => {
    let finished = false;
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-loader-stroke]");
      gsap.set(cylRef.current, { rotationY: 0, scaleX: 1.45, scaleZ: 1.45 });
      gsap.to(cylRef.current, {
        rotationY: 360,
        scaleX: 1,
        scaleZ: 1,
        duration: 2.4,
        ease: "power2.inOut",
      });
      gsap.fromTo(
        panels,
        { borderWidth: 7, opacity: 1 },
        {
          borderWidth: 0,
          opacity: 0.12,
          duration: 2.4,
          ease: "power2.inOut",
          stagger: { each: 0.035, from: "center" },
        }
      );
      gsap.delayedCall(2.55, () => {
        if (finished) return;
        finished = true;
        onComplete();
      });
    });
    return () => {
      finished = true;
      ctx.revert();
    };
  }, [onComplete]);

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      <div
        className="flex items-center justify-center"
        style={{ perspective: 720, width: 220, height: 220 }}
      >
        <div
          ref={cylRef}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(-14deg)" }}
        >
          {Array.from({ length: PANELS }).map((_, i) => {
            const angle = (360 / PANELS) * i;
            return (
              <div
                key={i}
                data-loader-stroke
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 50,
                  height: 104,
                  marginLeft: -25,
                  marginTop: -52,
                  border: `7px solid ${stroke}`,
                  borderRadius: 3,
                  boxSizing: "border-box",
                  background: "transparent",
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                  transformStyle: "preserve-3d",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT ---
export default function CurvedRingArchive({
  theme = DEFAULT_THEME,
  accent = DEFAULT_ACCENT,
  embedded = false,
}: BlockProps) {
  const t = surfaceTokens(theme);
  const ac = resolvedAccentHex(accent, theme);
  const isDark = theme === "dark";

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const { tiles } = useMemo(
    () => buildTiles(settings),
    [
      settings.perRow,
      settings.rows,
      settings.ringSize,
      settings.rowSpacing,
      settings.stack,
      settings.tileScale,
      settings.bend,
    ]
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<{
    project: (typeof PROJECTS)[number];
    tileIndex: number;
  } | null>(null);
  const [phase, setPhase] = useState<Phase>("loader");
  const [introLit, setIntroLit] = useState(false);
  const zoom = settings.zoom;
  const loaderStroke = isDark ? "#F2F2F2" : "#1C1C1C";

  const physics = useRef({
    rotation: -360,
    targetRotation: -360,
    velocity: 0,
    tilt: DEFAULT_SETTINGS.tilt,
    targetTilt: DEFAULT_SETTINGS.tilt,
    velocityTilt: 0,
    isDown: false,
    lastX: 0,
    lastY: 0,
    dim: 0,
    introRadiusMul: INTRO_START_RADIUS / DEFAULT_SETTINGS.ringSize,
    introRadiusBaked: false,
  });

  const expandTl = useRef<gsap.core.Timeline | null>(null);
  const expandMetaRef = useRef<{
    card: HTMLButtonElement;
    hero: HTMLDivElement;
  } | null>(null);
  const closingRef = useRef(false);
  const introTweens = useRef<{ rot?: gsap.core.Tween }>({});
  const introFinishedRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const resetExpandCard = () => {
    const meta = expandMetaRef.current;
    if (!meta) return;
    gsap.set(meta.hero, { clearProps: "all" });
    meta.hero.style.opacity = "0";
    meta.card.style.zIndex = "";
    meta.card.style.opacity = "1";
    meta.card.style.filter = "none";
    expandMetaRef.current = null;
  };

  // Stop only the intro rotation when the user grabs the ring.
  const interruptIntroRotation = () => {
    introTweens.current.rot?.kill();
    introTweens.current.rot = undefined;
  };

  // Push the panel's tilt value into the physics target live.
  useEffect(() => {
    physics.current.targetTilt = settings.tilt;
  }, [settings.tilt]);

  // Drop stale tile refs when the tile count shrinks via the panel.
  useEffect(() => {
    cardsRef.current.length = tiles.length;
  }, [tiles]);

  // After intro (or settings rebuild), bake static tile transforms once.
  useEffect(() => {
    if (!physics.current.introRadiusBaked) return;
    cardsRef.current.forEach((card, i) => {
      const tile = tiles[i];
      if (!card || !tile) return;
      card.style.transform = `rotateY(${tile.angle}deg) translateZ(${tile.radius}px) translateY(${tile.rowY}px)`;
    });
  }, [tiles]);

  // Gallery intro — curved tiles from frame one; opacity fades per tile (grouped
  // segments). No flat→curved swap at the end.
  useLayoutEffect(() => {
    if (phase !== "intro") return;

    introFinishedRef.current = false;
    setIntroLit(false);
    const p = physics.current;
    p.rotation = -360;
    p.targetRotation = -360;
    p.velocity = 0;
    p.introRadiusMul = INTRO_START_RADIUS / settings.ringSize;
    p.introRadiusBaked = false;

    // Hide segments immediately — GSAP owns opacity until intro finishes.
    cardsRef.current.forEach((card) => {
      card?.querySelectorAll<HTMLElement>("[data-curve-seg]").forEach((seg) => {
        seg.style.opacity = "0";
      });
    });

    let ctx: gsap.Context | undefined;
    let frame = 0;
    const ROT_DURATION = 2.8;

    const runIntro = () => {
      const cards = cardsRef.current.filter(Boolean) as HTMLButtonElement[];
      const segCount = cards.reduce(
        (n, c) => n + c.querySelectorAll("[data-curve-seg]").length,
        0
      );

      if (segCount < cards.length * SEGMENTS && cards.length > 0) {
        frame = requestAnimationFrame(runIntro);
        return;
      }

      const finishIntro = () => {
        if (introFinishedRef.current) return;
        introFinishedRef.current = true;

        introTweens.current.rot?.kill();
        introTweens.current.rot = undefined;
        gsap.killTweensOf(p);

        p.rotation = 0;
        p.targetRotation = 0;
        p.velocity = 0;
        p.introRadiusMul = 1;
        p.introRadiusBaked = true;

        cards.forEach((card, i) => {
          const tile = tiles[i];
          if (!card || !tile) return;
          card.style.transform = `rotateY(${tile.angle}deg) translateZ(${tile.radius}px) translateY(${tile.rowY}px)`;
        });
        setIntroLit(true);
        setPhase("ready");
      };

      ctx = gsap.context(() => {
        const introTl = gsap.timeline({ delay: 0.1 });
        cards.forEach((card, tileIndex) => {
          const segs = card.querySelectorAll("[data-curve-seg]");
          introTl.to(
            segs,
            { opacity: 1, duration: 0.42, ease: "power2.out" },
            tileIndex * 0.028
          );
        });
        introTweens.current.rot = gsap.to(p, {
          targetRotation: 0,
          duration: ROT_DURATION,
          ease: "power3.out",
        });
        gsap.to(p, {
          introRadiusMul: 1,
          duration: 2.4,
          ease: "power2.out",
        });
        const photoEnd = 0.1 + Math.max(0, (cards.length - 1) * 0.028) + 0.42;
        gsap.delayedCall(Math.max(photoEnd, ROT_DURATION), finishIntro);
      });
    };

    frame = requestAnimationFrame(runIntro);

    return () => {
      cancelAnimationFrame(frame);
      if (!introFinishedRef.current) ctx?.revert();
    };
  }, [phase, tiles, settings.ringSize]);

  // Capture wheel so the page never scrolls — the ring rotates instead.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (activeRef.current) return;
      e.preventDefault();
      interruptIntroRotation();
      const d = (e.deltaY + e.deltaX) * 0.05;
      physics.current.targetRotation += d;
      physics.current.velocity = d * 0.12;
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  // Render loop — ring + parallax only. Tile Z is baked after intro.
  useEffect(() => {
    if (phase === "loader") return;

    let frame: number;
    let peTick = 0;
    const loop = () => {
      const p = physics.current;

      const activeTile = active?.tileIndex ?? -1;

      const dimming = active && !closingRef.current;

      if (!active || closingRef.current) {
        if (!p.isDown && !active) {
          p.targetRotation += p.velocity;
          p.targetTilt += p.velocityTilt;
          p.velocity *= 0.95;
          p.velocityTilt *= 0.9;
        }
        const dimRate = closingRef.current ? 0.2 : 0.1;
        p.dim += (0 - p.dim) * dimRate;
      } else {
        p.velocity = 0;
        p.velocityTilt = 0;
        p.dim += (1 - p.dim) * 0.12;
      }

      p.targetTilt = clamp(p.targetTilt, -44, 26);
      // While a project is open, rotation/tilt are frozen — no camera jump fighting GSAP.
      if (!active || closingRef.current) {
        p.rotation += (p.targetRotation - p.rotation) * 0.09;
        p.tilt += (p.targetTilt - p.tilt) * 0.09;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `rotateX(${p.tilt}deg) rotateY(${p.rotation}deg)`;
      }
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `scale(${zoom})`;
        wrapperRef.current.style.opacity = "1";
      }

      // Parallax blobs — update every other frame.
      if (peTick % 2 === 0) {
        bgRefs.current.forEach((bg, i) => {
          if (!bg) return;
          const speed = (i + 1) * 0.25;
          const bx = Math.sin((p.rotation * Math.PI) / 180) * 90 * speed;
          const by = (p.tilt + 15) * 4 * speed;
          bg.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
        });
      }

      // During intro only: animate each tile's Z radius. After intro, baked once.
      if (!p.introRadiusBaked) {
        const mul = p.introRadiusMul;
        cardsRef.current.forEach((card, i) => {
          const tile = tiles[i];
          if (!card || !tile) return;
          card.style.transform = `rotateY(${tile.angle}deg) translateZ(${tile.radius * mul}px) translateY(${tile.rowY}px)`;
        });
      }

      // Depth styling + clickable front-face — every 4th frame is plenty.
      if (peTick % 4 === 0) {
        const rot = p.rotation;
        const canClick = !active;
        cardsRef.current.forEach((card, i) => {
          const tile = tiles[i];
          if (!card || !tile) return;

          if (i === activeTile) {
            card.style.pointerEvents = "none";
            return;
          }

          const world = ((rot + tile.angle) * Math.PI) / 180;
          const front = Math.cos(world);
          card.style.pointerEvents = front > 0.3 && canClick ? "auto" : "none";

          if (dimming) {
            const fade = 1 - p.dim * 0.9;
            card.style.opacity = (fade * mapRange(front, -1, 1, 0.12, 1)).toString();
            card.style.filter = p.dim > 0.02 ? `blur(${p.dim * 8}px)` : "none";
          } else {
            card.style.opacity = "1";
            card.style.filter = "none";
          }
        });
      }
      peTick++;

      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [tiles, zoom, active, phase]);

  // --- interactions ---
  const onDown = (e: React.PointerEvent) => {
    if (active) return;
    interruptIntroRotation();
    physics.current.isDown = true;
    physics.current.lastX = e.clientX;
    physics.current.lastY = e.clientY;
    physics.current.velocity = 0;
    physics.current.velocityTilt = 0;
  };

  const onMove = (e: React.PointerEvent) => {
    const p = physics.current;
    if (!p.isDown || active) return;
    const dx = e.clientX - p.lastX;
    const dy = e.clientY - p.lastY;
    p.velocity = dx * 0.18;
    p.velocityTilt = -dy * 0.06;
    p.targetRotation += p.velocity;
    p.targetTilt += p.velocityTilt;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
  };

  const onUp = () => {
    physics.current.isDown = false;
  };

  const handleZoom = (dir: 1 | -1) => {
    if (active) return;
    setSettings((s) => ({ ...s, zoom: clamp(s.zoom + dir * 0.15, 0.3, 2) }));
  };

  const openProject = (project: (typeof PROJECTS)[number], tileIndex: number) => {
    if (active) return;
    setActive({ project, tileIndex });
  };

  const closeProject = () => {
    const meta = expandMetaRef.current;
    if (!active || !meta) {
      setActive(null);
      return;
    }

    closingRef.current = true;
    gsap.to(physics.current, { dim: 0, duration: 0.75, ease: "power2.out" });
    expandTl.current?.kill();

    const isMobile = (rootRef.current?.clientWidth ?? 1000) < 768;
    expandTl.current = gsap.timeline({
      onComplete: () => {
        resetExpandCard();
        expandTl.current = null;
        closingRef.current = false;
        setActive(null);
      },
    });

    const rootRect = rootRef.current!.getBoundingClientRect();
    const cardRect = meta.card.getBoundingClientRect();
    const toX = cardRect.left - rootRect.left;
    const toY = cardRect.top - rootRect.top;
    const toW = cardRect.width;
    const toH = cardRect.height;

    expandTl.current
      .to(
        [contentRef.current, detailPanelRef.current],
        { opacity: 0, y: isMobile ? 16 : 0, x: isMobile ? 0 : 20, duration: 0.28, ease: "power2.in" },
        0
      )
      .to(
        meta.hero,
        {
          left: toX,
          top: toY,
          width: toW,
          height: toH,
          opacity: 0,
          duration: 0.85,
          ease: "power3.inOut",
        },
        0
      )
      .to(meta.card, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0.55);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && active) closeProject();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Expand: screen-space hero FLIP + ring rotation (tilt untouched).
  useLayoutEffect(() => {
    if (!active || !rootRef.current || !heroRef.current) return;
    const card = cardsRef.current[active.tileIndex];
    const tile = tiles[active.tileIndex];
    if (!card || !tile) return;

    closingRef.current = false;
    const p = physics.current;
    const hero = heroRef.current;
    const rootRect = rootRef.current.getBoundingClientRect();
    const isMobile = rootRect.width < 768;
    const cardRect = card.getBoundingClientRect();
    const startX = cardRect.left - rootRect.left;
    const startY = cardRect.top - rootRect.top;
    const startW = cardRect.width;
    const startH = cardRect.height;
    const end = computeHeroRect(rootRect, tile.width / tile.height, isMobile);
    const faceRot = nearestRotation(p.rotation, -tile.angle);

    expandMetaRef.current = { card, hero };

    gsap.set(hero, {
      left: startX,
      top: startY,
      width: startW,
      height: startH,
      opacity: 0,
    });
    card.style.opacity = "1";
    card.style.zIndex = "120";

    expandTl.current?.kill();
    expandTl.current = gsap.timeline();

    expandTl.current.to(
      p,
      {
        targetRotation: faceRot,
        rotation: faceRot,
        duration: 0.85,
        ease: "power3.inOut",
      },
      0
    );

    // Crossfade curved tile → flat hero at the same screen position.
    expandTl.current.to(
      hero,
      { opacity: 1, duration: 0.38, ease: "power2.inOut" },
      0
    );
    expandTl.current.to(
      card,
      { opacity: 0, duration: 0.38, ease: "power2.inOut" },
      0
    );

    expandTl.current.to(
      hero,
      {
        left: end.x,
        top: end.y,
        width: end.w,
        height: end.h,
        duration: 0.92,
        ease: "power3.inOut",
      },
      0.2
    );

    expandTl.current.fromTo(
      contentRef.current,
      { opacity: 0, y: isMobile ? 20 : 0 },
      { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" },
      0.42
    );

    expandTl.current.fromTo(
      detailPanelRef.current,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" },
      0.48
    );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={`relative w-full overflow-hidden select-none font-sans ${
        embedded ? "h-[700px]" : "h-screen min-h-[700px]"
      }`}
      style={{ backgroundColor: t.bg, color: t.text, touchAction: "none" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* Colorful ambient gradient (works in both themes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? `linear-gradient(160deg, #11131a 0%, #1a1f2e 45%, #161a22 100%)`
              : `linear-gradient(160deg, #e9f0f7 0%, #eef3f0 45%, #f4eef2 100%)`,
          }}
        />
        <div
          ref={(el) => { bgRefs.current[0] = el; }}
          className="absolute -top-[10%] left-[8%] w-[55vw] h-[55vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${ac}${isDark ? "55" : "44"} 0%, transparent 62%)`,
            filter: "blur(90px)",
          }}
        />
        <div
          ref={(el) => { bgRefs.current[1] = el; }}
          className="absolute top-[15%] right-[2%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? "#43e97b55" : "#7fe3b340"} 0%, transparent 60%)`,
            filter: "blur(100px)",
          }}
        />
        <div
          ref={(el) => { bgRefs.current[2] = el; }}
          className="absolute bottom-[-15%] left-[20%] w-[60vw] h-[60vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? "#a18cd155" : "#c4b5f540"} 0%, transparent 60%)`,
            filter: "blur(110px)",
          }}
        />
        <div
          ref={(el) => { bgRefs.current[3] = el; }}
          className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] rounded-full"
          style={{
            background: `radial-gradient(circle, ${isDark ? "#fbc2eb44" : "#fdd0b540"} 0%, transparent 60%)`,
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Top-left title */}
      <div
        className={`absolute top-6 left-6 z-30 pointer-events-none transition-opacity duration-500 ${
          active || phase === "loader" ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-sm font-bold tracking-widest uppercase" style={{ color: t.text }}>
          Curved Ring Archive
        </h1>
        <p className="text-xs mt-1" style={{ color: t.textMuted }}>
          Scroll, drag, and explore
        </p>
      </div>

      {/* Bottom hint pill */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md transition-all duration-500 ${
          active || phase === "loader" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
        style={{ backgroundColor: `${t.surface}CC`, borderColor: t.border }}
      >
        <p className="text-xs font-medium" style={{ color: t.textSecondary }}>
          Scroll to rotate
          <span className="opacity-40 mx-2">·</span>Drag to tilt
          <span className="opacity-40 mx-2">·</span>Click to inspect
        </p>
      </div>

      {/* Zoom controls */}
      <div
        className={`absolute bottom-6 right-6 z-30 flex gap-2 transition-opacity duration-500 ${
          active || phase === "loader" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleZoom(-1); }}
          className="w-10 h-10 flex items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: `${t.surface}AA`, borderColor: t.border, color: t.text }}
          aria-label="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleZoom(1); }}
          className="w-10 h-10 flex items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: `${t.surface}AA`, borderColor: t.border, color: t.text }}
          aria-label="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
        </button>
      </div>

      {/* Settings toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowSettings((v) => !v); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`absolute top-6 right-6 z-40 w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-500 hover:scale-105 active:scale-95 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 ${
          active || phase === "loader" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          backgroundColor: showSettings ? ac : `${t.surface}AA`,
          borderColor: t.border,
          color: showSettings ? t.bg : t.text,
        }}
        aria-label="Toggle settings"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
      </button>

      {/* Settings panel */}
      {showSettings && !active && (
        <div
          className="absolute top-20 right-6 z-40 w-64 max-h-[calc(100%-7rem)] overflow-y-auto rounded-2xl border backdrop-blur-xl p-4 shadow-2xl"
          style={{ backgroundColor: `${t.surface}F2`, borderColor: t.border }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: t.text }}>
              Controls
            </span>
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md transition-colors"
              style={{ color: t.textSecondary, backgroundColor: `${t.border}` }}
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {SETTING_FIELDS.map((f) => {
              const val = settings[f.key];
              const display =
                f.step < 1 ? val.toFixed(2) : Math.round(val).toString();
              return (
                <label key={f.key} className="block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
                      {f.label}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: t.text }}>
                      {display}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={val}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, [f.key]: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: ac, backgroundColor: t.border }}
                  />
                </label>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] leading-relaxed" style={{ color: t.textMuted }}>
            Tune freely, then share the values and I&apos;ll bake them in as the defaults.
          </p>
        </div>
      )}

      {phase === "loader" && (
        <RingLoader
          stroke={loaderStroke}
          bg={t.bg}
          onComplete={() => setPhase("intro")}
        />
      )}

      {/* 3D stage — hidden during loader */}
      {phase !== "loader" && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            active ? "z-30" : "z-10"
          }`}
          style={{ perspective: `${settings.perspective}px` }}
        >
          <div ref={wrapperRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
            <div
              ref={ringRef}
              className="relative"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
                transform: `rotateX(${settings.tilt}deg) rotateY(-360deg)`,
              }}
            >
              {tiles.map((tile, i) => (
                <button
                  key={tile.key}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  onClick={(e) => { e.stopPropagation(); openProject(tile.project, i); }}
                  className="absolute top-1/2 left-1/2 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    width: tile.width,
                    height: tile.height,
                    marginLeft: -tile.width / 2,
                    marginTop: -tile.height / 2,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    transform: `rotateY(${tile.angle}deg) translateZ(${tile.radius * (INTRO_START_RADIUS / settings.ringSize)}px) translateY(${tile.rowY}px)`,
                  }}
                  aria-label={`View ${tile.project.title}`}
                >
                  <div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <CurvedSurface
                      width={tile.width}
                      height={tile.height}
                      image={tile.project.image}
                      bend={tile.bend}
                      focalX={tile.focalX}
                      focalY={tile.focalY}
                      lit={introLit}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {active && (
        <>
          <div
            className="absolute inset-0 z-20 pointer-events-auto"
            onClick={closeProject}
            aria-hidden
          />

          {/* Screen-space hero — not inside the 3D ring */}
          <div
            ref={heroRef}
            className="absolute z-[35] overflow-hidden pointer-events-none"
            style={{ opacity: 0 }}
          >
            <img
              src={active.project.image}
              alt=""
              draggable={false}
              decoding="async"
              className="w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: `${Math.round((tiles[active.tileIndex]?.focalX ?? 0.5) * 100)}% ${Math.round((tiles[active.tileIndex]?.focalY ?? 0.5) * 100)}%`,
              }}
            />
          </div>

          <div
            ref={contentRef}
            className="absolute inset-0 z-40 flex items-end md:items-center justify-center pointer-events-none p-5 md:p-8"
          >
            <div className="w-full max-w-[1500px] mx-auto min-h-full flex flex-col justify-end md:min-h-0 md:flex-row md:items-center md:justify-end gap-6 md:gap-10 pointer-events-none">
            <div
              ref={detailPanelRef}
              className="relative w-full md:w-[420px] md:shrink-0 pointer-events-auto rounded-3xl border overflow-hidden md:ml-auto"
              style={{
                backgroundColor: isDark ? "rgba(12,14,20,0.72)" : "rgba(255,255,255,0.82)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                backdropFilter: "blur(24px)",
                boxShadow: isDark
                  ? "0 32px 80px rgba(0,0,0,0.45)"
                  : "0 32px 80px rgba(0,0,0,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ac}, transparent)`,
                }}
              />
              <div
                className="absolute -right-6 -top-10 text-[7rem] font-bold leading-none select-none pointer-events-none"
                style={{
                  color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                }}
              >
                {(PROJECTS.findIndex((p) => p.id === active.project.id) + 1)
                  .toString()
                  .padStart(2, "0")}
              </div>

              <div className="relative p-7 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full"
                    style={{ backgroundColor: `${ac}22`, color: ac, border: `1px solid ${ac}44` }}
                  >
                    {active.project.category}
                  </span>
                  <span
                    className="text-xs font-mono tracking-widest"
                    style={{ color: t.textMuted }}
                  >
                    {active.project.year}
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-[2.6rem] font-bold mb-4 tracking-tight leading-[1.05]"
                  style={{ color: t.text }}
                >
                  {active.project.title}
                </h2>

                <p
                  className="text-[15px] mb-8 leading-relaxed max-w-sm"
                  style={{ color: t.textSecondary }}
                >
                  {active.project.desc}
                </p>

                <div
                  className="grid grid-cols-2 gap-6 mb-8 pb-7 border-b"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
                >
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.18em] mb-1.5"
                      style={{ color: t.textMuted }}
                    >
                      Client
                    </p>
                    <p className="text-sm font-medium" style={{ color: t.text }}>
                      {active.project.client}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.18em] mb-1.5"
                      style={{ color: t.textMuted }}
                    >
                      Archive
                    </p>
                    <p className="text-sm font-mono font-medium" style={{ color: t.text }}>
                      {(PROJECTS.findIndex((p) => p.id === active.project.id) + 1)
                        .toString()
                        .padStart(3, "0")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    style={{ backgroundColor: ac, color: t.bg }}
                  >
                    View Case Study
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </button>
                  <button
                    onClick={closeProject}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
                    style={{ color: t.textMuted }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>

          <button
            onClick={closeProject}
            className="absolute top-6 right-6 z-50 w-11 h-11 flex items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
              color: t.text,
              backdropFilter: "blur(12px)",
            }}
            aria-label="Close project"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </>
      )}
    </div>
  );
}

