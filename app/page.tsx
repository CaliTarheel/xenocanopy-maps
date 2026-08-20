"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MAP_WIDTH = 24;
const MAP_HEIGHT = 18;
const CELL_PX = 70;

type Tile = "ground" | "tangle" | "acid" | "trench" | "root" | "ruin" | "canopy";
type SiteKey = "bloom" | "ravine" | "station";
type DangerKey = "forgiving" | "tense" | "perilous";
type ViewKey = "player" | "gm";

type Marker = {
  x: number;
  y: number;
  label: string;
  kind: "spore" | "pod" | "objective";
};

type MapData = {
  tiles: Tile[];
  markers: Marker[];
  rootFormation: string;
};

type RootFormation = {
  name: string;
  cells: Array<[number, number]>;
};

const rootFormations: RootFormation[] = [
  {
    name: "Meandering spine",
    cells: [[-4, 0], [-3, 0], [-2, -1], [-1, -1], [0, 0], [1, 0], [2, 1], [3, 1], [4, 0]],
  },
  {
    name: "Forked crown",
    cells: [[-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [-1, -1], [0, -2], [1, -2], [2, -1]],
  },
  {
    name: "Crescent bridge",
    cells: [[-4, 2], [-3, 1], [-2, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [3, 1], [4, 2]],
  },
  {
    name: "Twin tendrils",
    cells: [[-4, 0], [-3, -1], [-2, -1], [-1, 0], [0, 0], [1, 0], [2, 1], [3, 1], [4, 0], [-2, 1], [-1, 2], [0, 2], [1, 1]],
  },
  {
    name: "Root island chain",
    cells: [[-4, -1], [-3, -1], [-2, 0], [-1, 0], [-1, 1], [0, 0], [0, 1], [1, 1], [2, 1], [3, 0], [4, 0]],
  },
];

const sites: Record<SiteKey, { name: string; note: string }> = {
  bloom: {
    name: "Bloomfall Basin",
    note: "Bioluminescent pools, spore chimneys, and a raised root crossing.",
  },
  ravine: {
    name: "Glassroot Ravine",
    note: "Recoverable drops, narrow attack vectors, and tangled escape routes.",
  },
  station: {
    name: "Overgrown Waystation",
    note: "Alien growth swallowing old cover, pylons, and a dormant field relay.",
  },
};

const dangerLabels: Record<DangerKey, string> = {
  forgiving: "Forgiving",
  tense: "Tense",
  perilous: "Perilous",
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function tileIndex(x: number, y: number) {
  return y * MAP_WIDTH + x;
}

function buildMap(seed: number, site: SiteKey): MapData {
  const random = seededRandom(seed + site.charCodeAt(0) * 997);
  const formationRandom = seededRandom(seed * 7919 + site.charCodeAt(1) * 104729);
  const tiles = Array<Tile>(MAP_WIDTH * MAP_HEIGHT).fill("ground");

  const setTile = (x: number, y: number, tile: Tile) => {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      tiles[tileIndex(x, y)] = tile;
    }
  };

  const paintEllipse = (tile: Tile, cx: number, cy: number, rx: number, ry: number) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const wobble = 0.78 + random() * 0.42;
        const distance = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
        if (distance <= wobble) setTile(x, y, tile);
      }
    }
  };

  // Dense alien vegetation shapes the perimeter without turning the map into a corridor.
  for (let i = 0; i < 8; i += 1) {
    const edgeX = i % 2 === 0 ? Math.floor(random() * 5) : MAP_WIDTH - 1 - Math.floor(random() * 5);
    paintEllipse("canopy", edgeX, 1 + Math.floor(random() * 16), 2 + random() * 2, 1 + random() * 2);
  }

  const tangleCount = site === "station" ? 5 : 7;
  for (let i = 0; i < tangleCount; i += 1) {
    paintEllipse(
      "tangle",
      4 + Math.floor(random() * 16),
      2 + Math.floor(random() * 14),
      1.2 + random() * 1.8,
      0.9 + random() * 1.5,
    );
  }

  // Two connected routes are deliberately cleared across every generated map.
  for (let x = 1; x < MAP_WIDTH - 1; x += 1) {
    const upper = 5 + Math.round(Math.sin((x + seed % 7) / 3));
    const lower = 12 + Math.round(Math.cos((x + seed % 5) / 4));
    setTile(x, upper, "ground");
    setTile(x, upper + 1, "ground");
    setTile(x, lower, "ground");
  }

  if (site === "ravine") {
    for (let y = 2; y <= 7; y += 1) setTile(8 + (y % 2), y, "trench");
    for (let y = 10; y <= 15; y += 1) setTile(16 - (y % 2), y, "trench");
  } else if (site === "station") {
    for (let y = 3; y <= 6; y += 1) for (let x = 9; x <= 12; x += 1) setTile(x, y, "ruin");
    for (let y = 11; y <= 14; y += 1) for (let x = 15; x <= 18; x += 1) setTile(x, y, "ruin");
  } else {
    paintEllipse("acid", 8, 4, 1.7, 1.4);
    paintEllipse("acid", 17, 13, 2.1, 1.5);
    for (let y = 11; y <= 14; y += 1) setTile(11, y, "trench");
  }

  // The central tactical feature varies independently from the foliage seed.
  // Every formation remains connected, but its attack vectors and safe edges change.
  const formation = rootFormations[Math.floor(formationRandom() * rootFormations.length)];
  const mirrorX = formationRandom() > 0.5 ? -1 : 1;
  const mirrorY = formationRandom() > 0.5 ? -1 : 1;
  const centerX = 12 + Math.floor(formationRandom() * 3) - 1;
  const centerY = 8 + Math.floor(formationRandom() * 3);
  for (const [offsetX, offsetY] of formation.cells) {
    setTile(centerX + offsetX * mirrorX, centerY + offsetY * mirrorY, "root");
  }

  // Spawn areas remain neutral and cannot produce a first-turn ring-out.
  for (let y = 7; y <= 10; y += 1) {
    for (let x = 1; x <= 3; x += 1) setTile(x, y, "ground");
    for (let x = 20; x <= 22; x += 1) setTile(x, y, "ground");
  }

  const markers: Marker[] = [
    { x: 6 + Math.floor(random() * 3), y: 8 + Math.floor(random() * 3), label: "P1", kind: "pod" },
    { x: 15 + Math.floor(random() * 3), y: 6 + Math.floor(random() * 3), label: "P2", kind: "pod" },
    { x: 12, y: 4, label: "S1", kind: "spore" },
    { x: 18, y: 10, label: "S2", kind: "spore" },
    { x: 21, y: 8, label: "X", kind: "objective" },
  ];

  return { tiles, markers, rootFormation: formation.name };
}

function drawMap(
  canvas: HTMLCanvasElement,
  map: MapData,
  seed: number,
  gmView: boolean,
  showGrid: boolean,
) {
  const width = MAP_WIDTH * CELL_PX;
  const height = MAP_HEIGHT * CELL_PX;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  const random = seededRandom(seed * 31 + 11);
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#1a463a");
  background.addColorStop(0.5, "#123a35");
  background.addColorStop(1, "#0a292b");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  // Quiet mottling gives the ground depth without competing with rules information.
  for (let i = 0; i < 620; i += 1) {
    const radius = 1 + random() * 7;
    context.fillStyle = random() > 0.5 ? "rgba(111, 177, 111, 0.1)" : "rgba(0, 18, 20, 0.12)";
    context.beginPath();
    context.arc(random() * width, random() * height, radius, 0, Math.PI * 2);
    context.fill();
  }

  const sameTile = (x: number, y: number, tile: Tile) =>
    x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && map.tiles[tileIndex(x, y)] === tile;

  const fillConnectedCell = (x: number, y: number, tile: Tile, fill: string | CanvasGradient, stroke: string) => {
    const left = x * CELL_PX;
    const top = y * CELL_PX;
    context.fillStyle = fill;
    context.beginPath();
    context.roundRect(left + 4, top + 4, CELL_PX - 8, CELL_PX - 8, 15);
    context.fill();
    if (sameTile(x + 1, y, tile)) context.fillRect(left + CELL_PX / 2, top + 4, CELL_PX, CELL_PX - 8);
    if (sameTile(x, y + 1, tile)) context.fillRect(left + 4, top + CELL_PX / 2, CELL_PX - 8, CELL_PX);
    context.strokeStyle = stroke;
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(left + 4, top + 4, CELL_PX - 8, CELL_PX - 8, 15);
    context.stroke();
  };

  const rootCells: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const tile = map.tiles[tileIndex(x, y)];
      const left = x * CELL_PX;
      const top = y * CELL_PX;
      if (tile === "ground" && random() > 0.43) {
        const px = left + 8 + random() * (CELL_PX - 16);
        const py = top + 8 + random() * (CELL_PX - 16);
        context.strokeStyle = "rgba(93, 151, 105, 0.42)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(px, py + 7);
        context.quadraticCurveTo(px + 7, py - 8, px + 14, py + 1);
        context.stroke();
      }

      if (tile === "tangle") {
        const tangleFill = context.createRadialGradient(left + 24, top + 20, 4, left + 35, top + 35, 48);
        tangleFill.addColorStop(0, "#548756");
        tangleFill.addColorStop(1, "#285641");
        fillConnectedCell(x, y, tile, tangleFill, "rgba(146, 208, 105, 0.72)");
        for (let i = 0; i < 7; i += 1) {
          const px = left + 8 + random() * (CELL_PX - 16);
          const py = top + 8 + random() * (CELL_PX - 16);
          context.strokeStyle = i % 2 ? "#a2d565" : "#5d9e58";
          context.lineWidth = 3 + random() * 3;
          context.beginPath();
          context.moveTo(px, py + 8);
          context.bezierCurveTo(px - 10, py - 3, px + 11, py - 13, px + 15, py + 1);
          context.stroke();
        }
      }

      if (tile === "acid") {
        const poolFill = context.createRadialGradient(left + 28, top + 26, 3, left + 35, top + 35, 48);
        poolFill.addColorStop(0, "#ff95df");
        poolFill.addColorStop(0.35, "#ce52ba");
        poolFill.addColorStop(1, "#6c2a83");
        context.save();
        context.shadowColor = "rgba(255, 104, 213, 0.65)";
        context.shadowBlur = 18;
        fillConnectedCell(x, y, tile, poolFill, "rgba(255, 177, 231, 0.95)");
        context.restore();
        for (let i = 0; i < 5; i += 1) {
          const bubbleX = left + 10 + random() * 50;
          const bubbleY = top + 10 + random() * 50;
          const bubbleRadius = 2 + random() * 7;
          context.strokeStyle = "rgba(255, 221, 244, 0.72)";
          context.lineWidth = 2;
          context.beginPath();
          context.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
          context.stroke();
        }
      }

      if (tile === "trench") {
        const trenchFill = context.createLinearGradient(left, top, left + CELL_PX, top + CELL_PX);
        trenchFill.addColorStop(0, "#342743");
        trenchFill.addColorStop(0.45, "#121926");
        trenchFill.addColorStop(1, "#080e18");
        context.save();
        context.shadowColor = "rgba(0, 0, 0, 0.72)";
        context.shadowBlur = 15;
        fillConnectedCell(x, y, tile, trenchFill, "#8c72a1");
        context.restore();
        context.strokeStyle = "rgba(190, 154, 205, 0.3)";
        context.lineWidth = 2;
        for (let i = -20; i < 85; i += 18) {
          context.beginPath();
          context.moveTo(left + i, top + CELL_PX - 7);
          context.lineTo(left + i + 26, top + 7);
          context.stroke();
        }
      }

      if (tile === "root") {
        rootCells.push({ x, y });
      }

      if (tile === "ruin") {
        const ruinFill = context.createLinearGradient(left, top, left + CELL_PX, top + CELL_PX);
        ruinFill.addColorStop(0, "#8ba5a9");
        ruinFill.addColorStop(1, "#405d64");
        fillConnectedCell(x, y, tile, ruinFill, "#b4d2d0");
        context.strokeStyle = "#233a41";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(left + 14, top + 8);
        context.lineTo(left + 31, top + 34);
        context.lineTo(left + 20, top + 62);
        context.moveTo(left + 46, top + 9);
        context.lineTo(left + 38, top + 28);
        context.lineTo(left + 61, top + 49);
        context.stroke();
      }

      if (tile === "canopy") {
        fillConnectedCell(x, y, tile, "rgba(5, 37, 34, 0.88)", "rgba(34, 94, 73, 0.8)");
        for (let i = 0; i < 7; i += 1) {
          const leafX = left - 5 + random() * (CELL_PX + 10);
          const leafY = top - 5 + random() * (CELL_PX + 10);
          const leafRotation = random() * Math.PI;
          context.fillStyle = i % 3 === 0 ? "#318059" : i % 2 ? "#16483c" : "#235f47";
          context.beginPath();
          context.ellipse(
            leafX,
            leafY,
            17 + random() * 20,
            7 + random() * 10,
            leafRotation,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.strokeStyle = "rgba(118, 233, 164, 0.25)";
          context.lineWidth = 1.5;
          context.beginPath();
          context.moveTo(leafX - Math.cos(leafRotation) * 16, leafY - Math.sin(leafRotation) * 16);
          context.lineTo(leafX + Math.cos(leafRotation) * 16, leafY + Math.sin(leafRotation) * 16);
          context.stroke();
        }
      }
    }
  }

  // Glassroots read as one raised organic structure while their occupied squares stay clear.
  const rootCenter = (cell: { x: number; y: number }) => ({
    x: cell.x * CELL_PX + CELL_PX / 2,
    y: cell.y * CELL_PX + CELL_PX / 2,
  });
  const neighborOffsets = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const rootEdges: Array<{ start: { x: number; y: number }; end: { x: number; y: number }; bend: number }> = [];
  for (const cell of rootCells) {
    for (const [dx, dy] of neighborOffsets) {
      if (!sameTile(cell.x + dx, cell.y + dy, "root")) continue;
      rootEdges.push({
        start: rootCenter(cell),
        end: rootCenter({ x: cell.x + dx, y: cell.y + dy }),
        bend: (random() - 0.5) * 20,
      });
    }
  }
  for (const pass of ["shadow", "bark", "heart"] as const) {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = pass === "shadow" ? "rgba(1, 10, 12, 0.7)" : pass === "bark" ? "#c3a34e" : "#f1d779";
    context.lineWidth = pass === "shadow" ? 38 : pass === "bark" ? 28 : 7;
    if (pass === "shadow") {
      context.shadowColor = "rgba(0, 0, 0, 0.72)";
      context.shadowBlur = 13;
      context.shadowOffsetY = 10;
    } else {
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
    }
    for (const edge of rootEdges) {
      context.beginPath();
      context.moveTo(edge.start.x, edge.start.y);
      context.quadraticCurveTo(
        (edge.start.x + edge.end.x) / 2 - edge.bend,
        (edge.start.y + edge.end.y) / 2 + edge.bend,
        edge.end.x,
        edge.end.y,
      );
      context.stroke();
    }
  }
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  for (const cell of rootCells) {
    const center = rootCenter(cell);
    const nodeFill = context.createRadialGradient(center.x - 7, center.y - 9, 2, center.x, center.y, 25);
    nodeFill.addColorStop(0, "#ffe69a");
    nodeFill.addColorStop(0.35, "#c5a34e");
    nodeFill.addColorStop(1, "#725b2c");
    context.fillStyle = nodeFill;
    context.beginPath();
    context.arc(center.x, center.y, 22, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255, 239, 174, 0.75)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(center.x, center.y, 13, 0, Math.PI * 1.55);
    context.stroke();
  }

  for (const marker of map.markers) {
    const centerX = marker.x * CELL_PX + CELL_PX / 2;
    const centerY = marker.y * CELL_PX + CELL_PX / 2;
    context.save();
    if (marker.kind === "spore") {
      const sporeGlow = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, 38);
      sporeGlow.addColorStop(0, "rgba(239, 255, 178, 0.95)");
      sporeGlow.addColorStop(0.35, "rgba(217, 255, 131, 0.45)");
      sporeGlow.addColorStop(1, "rgba(217, 255, 131, 0)");
      context.fillStyle = sporeGlow;
      context.beginPath();
      context.arc(centerX, centerY, 38, 0, Math.PI * 2);
      context.fill();
      context.shadowColor = "#d9ff83";
      context.shadowBlur = 15;
      context.fillStyle = "#304d35";
      context.fillRect(centerX - 6, centerY, 12, 22);
      context.fillStyle = "#d9ff83";
      context.beginPath();
      context.ellipse(centerX, centerY - 2, 21, 13, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#16372e";
      for (let i = 0; i < 5; i += 1) {
        context.beginPath();
        context.arc(centerX - 12 + i * 6, centerY - 3 + (i % 2) * 5, 2, 0, Math.PI * 2);
        context.fill();
      }
    } else if (marker.kind === "pod") {
      context.shadowColor = "#ff69ba";
      context.shadowBlur = 16;
      context.fillStyle = "#ff8acb";
      context.beginPath();
      context.ellipse(centerX, centerY, 21, 14, -0.4, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#ffd2eb";
      context.lineWidth = 3;
      context.stroke();
      context.strokeStyle = "rgba(92, 32, 78, 0.85)";
      context.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        context.beginPath();
        context.moveTo(centerX - 15, centerY + i * 5);
        context.quadraticCurveTo(centerX, centerY - i * 8, centerX + 16, centerY + i * 4);
        context.stroke();
      }
    } else {
      context.shadowColor = "#80f3ff";
      context.shadowBlur = 19;
      context.translate(centerX, centerY);
      context.rotate(Math.PI / 4);
      context.fillStyle = "rgba(17, 66, 69, 0.95)";
      context.fillRect(-20, -20, 40, 40);
      context.strokeStyle = "#d9feff";
      context.lineWidth = 4;
      context.strokeRect(-20, -20, 40, 40);
      context.strokeStyle = "#80f3ff";
      context.lineWidth = 3;
      context.strokeRect(-10, -10, 20, 20);
      context.rotate(-Math.PI / 4);
      context.translate(-centerX, -centerY);
    }
    context.restore();

    if (gmView) {
      context.fillStyle = "#071b1c";
      context.font = "700 24px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(marker.label, centerX, centerY);
    }
  }

  if (gmView) {
    context.fillStyle = "rgba(87, 255, 204, 0.16)";
    context.fillRect(CELL_PX, CELL_PX * 7, CELL_PX * 3, CELL_PX * 4);
    context.strokeStyle = "#73ffd1";
    context.lineWidth = 5;
    context.strokeRect(CELL_PX, CELL_PX * 7, CELL_PX * 3, CELL_PX * 4);
    context.fillStyle = "#d6fff2";
    context.font = "700 26px Arial";
    context.textAlign = "center";
    context.fillText("PARTY", CELL_PX * 2.5, CELL_PX * 9.1);

    context.fillStyle = "rgba(255, 123, 181, 0.16)";
    context.fillRect(CELL_PX * 20, CELL_PX * 7, CELL_PX * 3, CELL_PX * 4);
    context.strokeStyle = "#ff7bb5";
    context.strokeRect(CELL_PX * 20, CELL_PX * 7, CELL_PX * 3, CELL_PX * 4);
    context.fillStyle = "#ffe0ed";
    context.fillText("THREATS", CELL_PX * 21.5, CELL_PX * 9.1);
  }

  if (showGrid) {
    context.strokeStyle = "rgba(202, 255, 235, 0.25)";
    context.lineWidth = 2;
    for (let x = 0; x <= MAP_WIDTH; x += 1) {
      context.beginPath();
      context.moveTo(x * CELL_PX, 0);
      context.lineTo(x * CELL_PX, height);
      context.stroke();
    }
    for (let y = 0; y <= MAP_HEIGHT; y += 1) {
      context.beginPath();
      context.moveTo(0, y * CELL_PX);
      context.lineTo(width, y * CELL_PX);
      context.stroke();
    }
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function Home() {
  const [site, setSite] = useState<SiteKey>("bloom");
  const [danger, setDanger] = useState<DangerKey>("forgiving");
  const [partyLevel, setPartyLevel] = useState(3);
  const [partySize, setPartySize] = useState(4);
  const [seed, setSeed] = useState(417);
  const [view, setView] = useState<ViewKey>("player");
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const map = useMemo(() => buildMap(seed, site), [seed, site]);
  const saveDC = 9 + Math.ceil(partyLevel / 2) + (danger === "tense" ? 1 : danger === "perilous" ? 2 : 0);
  const hazardDamage = danger === "forgiving" ? "1d4" : danger === "tense" ? "1d6" : "2d4";
  const threatCount = partySize + Math.max(0, partyLevel - 2);

  useEffect(() => {
    if (canvasRef.current) drawMap(canvasRef.current, map, seed, view === "gm", showGrid);
  }, [map, seed, showGrid, view]);

  const regenerate = () => {
    setSeed((current) => ((current * 1664525 + 1013904223) >>> 0) % 10000);
  };

  const exportMap = (gm: boolean) => {
    const canvas = document.createElement("canvas");
    drawMap(canvas, map, seed, gm, showGrid);
    const mode = gm ? "gm" : "player";
    downloadCanvas(canvas, `xenocanopy-${site}-${seed}-${mode}.png`);
  };

  const copySetup = async () => {
    const text = `${sites[site].name} — expedition ${seed}\nCentral formation: ${map.rootFormation}.\nRoll20 page: 24 × 18 squares; 1680 × 1260 pixels; square grid; 5 ft per cell.\nParty: ${partySize} adventurers, level ${partyLevel}. Danger: ${dangerLabels[danger]}.\nHazard save DC ${saveDC}; hazard damage ${hazardDamage}.\nSuggested opposition: ${threatCount} vine scouts (use a low-CR plant stat block) plus 1 territorial beast.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Xenocanopy home">
          <span className="brand-mark" aria-hidden="true">XC</span>
          <span>Xenocanopy</span>
        </a>
        <span className="edition-pill">5.5 tactical field maps</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">Expedition map generator / low-level field test</div>
        <h1>Make the jungle<br /><em>fight back.</em></h1>
        <p className="hero-copy">
          Build an alien-wilderness encounter where every shove, ledge, spore cloud,
          and patch of hungry ground changes the fight.
        </p>
        <div className="hero-facts" aria-label="Map specifications">
          <span><strong>24 × 18</strong> squares</span>
          <span><strong>70 px</strong> per cell</span>
          <span><strong>5 ft</strong> scale</span>
          <span><strong>Level 1–4</strong> tuned</span>
        </div>
      </section>

      <section className="builder" aria-label="Encounter builder">
        <aside className="control-panel">
          <div className="panel-heading">
            <span className="step-number">01</span>
            <div>
              <p className="overline">Field parameters</p>
              <h2>Shape the expedition</h2>
            </div>
          </div>

          <label className="field-label" htmlFor="site-select">Region</label>
          <select id="site-select" value={site} onChange={(event) => setSite(event.target.value as SiteKey)}>
            {Object.entries(sites).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
          <p className="field-help">{sites[site].note}</p>

          <div className="split-fields">
            <label>
              <span className="field-label">Party level</span>
              <select value={partyLevel} onChange={(event) => setPartyLevel(Number(event.target.value))}>
                {[1, 2, 3, 4].map((level) => <option key={level} value={level}>Level {level}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Adventurers</span>
              <select value={partySize} onChange={(event) => setPartySize(Number(event.target.value))}>
                {[3, 4, 5, 6].map((size) => <option key={size} value={size}>{size} players</option>)}
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Terrain danger</legend>
            <div className="segmented">
              {(Object.keys(dangerLabels) as DangerKey[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  className={danger === key ? "active" : ""}
                  onClick={() => setDanger(key)}
                >
                  {dangerLabels[key]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="danger-readout">
            <div><span>Terrain save</span><strong>DC {saveDC}</strong></div>
            <div><span>Hazard hit</span><strong>{hazardDamage}</strong></div>
            <div><span>Maximum fall</span><strong>10 ft / 1d6</strong></div>
          </div>

          <button className="generate-button" type="button" onClick={regenerate}>
            <span>Generate new terrain</span>
            <span aria-hidden="true">↗</span>
          </button>
          <p className="seed">{map.rootFormation} · XC-{String(seed).padStart(4, "0")}</p>
        </aside>

        <div className="map-workspace">
          <div className="map-toolbar">
            <div className="view-toggle" role="group" aria-label="Map view">
              <button type="button" className={view === "player" ? "active" : ""} onClick={() => setView("player")}>Player map</button>
              <button type="button" className={view === "gm" ? "active" : ""} onClick={() => setView("gm")}>GM overlay</button>
            </div>
            <label className="grid-toggle">
              <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
              Include grid
            </label>
          </div>

          <div className="map-frame">
            <canvas ref={canvasRef} aria-label={`${sites[site].name} tactical battlemap, ${view} view`} />
            <div className="map-corner-label">
              <span>{sites[site].name}</span>
              <strong>XC-{String(seed).padStart(4, "0")}</strong>
            </div>
          </div>

          <div className="export-row">
            <div>
              <p className="overline">Roll20-ready export</p>
              <p>1680 × 1260 PNG · {showGrid ? "gridded" : "gridless"} · no creature tokens</p>
            </div>
            <div className="export-buttons">
              <button type="button" onClick={() => exportMap(false)}>↓ Player PNG</button>
              <button type="button" className="secondary" onClick={() => exportMap(true)}>↓ GM PNG</button>
            </div>
          </div>
        </div>
      </section>

      <section className="field-guide">
        <div className="guide-intro">
          <span className="step-number">02</span>
          <p className="overline">Run the encounter</p>
          <h2>Every strange shape has a job.</h2>
          <p>
            The map uses recoverable threats: enough consequence to reward forced movement,
            never a first-round death pit for a low-level character.
          </p>
        </div>

        <div className="rules-grid">
          <article>
            <span className="swatch tangle" />
            <div><h3>Tangle moss</h3><p>Difficult Terrain. It slows recovery but does not reduce a discrete push distance.</p></div>
          </article>
          <article>
            <span className="swatch acid" />
            <div><h3>Digestive pools</h3><p>First entry on a turn or start there: Dexterity save DC {saveDC}; {hazardDamage} Acid damage on a failure.</p></div>
          </article>
          <article>
            <span className="swatch trench" />
            <div><h3>Root ravines</h3><p>10-foot drop for 1d6 Bludgeoning. The floor is Difficult Terrain; climbing out costs 20 feet.</p></div>
          </article>
          <article>
            <span className="swatch root" />
            <div><h3>Raised glassroots</h3><p>10 feet high. Their edges provide aiming lanes, cover breaks, and nonlethal fall threats.</p></div>
          </article>
          <article>
            <span className="swatch spore" />
            <div><h3>Spore chimneys · S</h3><p>At initiative 20, creatures within 10 feet make a Constitution save DC {saveDC} or are Poisoned until their next turn ends.</p></div>
          </article>
          <article>
            <span className="swatch pod" />
            <div><h3>Recoil pods · P</h3><p>Action to rupture: one adjacent creature makes a Strength save DC {saveDC} or is pushed 10 feet directly away.</p></div>
          </article>
        </div>
      </section>

      <section className="encounter-card">
        <div>
          <p className="overline">Suggested field situation</p>
          <h2>Recover the dormant relay.</h2>
          <p>
            Reach <strong>X</strong> and spend two total actions stabilizing it before the end of round 4.
            Begin with {threatCount} vine scouts using an appropriate low-CR plant stat block and one territorial beast.
            This is a starting point, not an encounter-balance guarantee.
          </p>
        </div>
        <div className="round-track" aria-label="Encounter beats">
          <span><strong>R1</strong> spores wake</span>
          <span><strong>R2</strong> scouts flank</span>
          <span><strong>R3</strong> roots shift</span>
          <span><strong>R4</strong> relay overloads</span>
        </div>
      </section>

      <section className="roll20-section">
        <div className="roll20-copy">
          <span className="step-number">03</span>
          <p className="overline">Deploy to Roll20</p>
          <h2>From jungle to tabletop in one minute.</h2>
        </div>
        <ol className="setup-steps">
          <li><span>1</span><p>Download the <strong>Player PNG</strong>. Turn off “Include grid” if you want Roll20 to draw the only visible grid.</p></li>
          <li><span>2</span><p>Create a <strong>24 × 18</strong> page with a square grid and <strong>5 ft</strong> scale.</p></li>
          <li><span>3</span><p>Drop the 1680 × 1260 image on the Map layer and choose <strong>Adjust Page Size</strong> when prompted.</p></li>
          <li><span>4</span><p>Keep the GM PNG and this terrain key beside you; place creature tokens only after players join.</p></li>
        </ol>
        <button className="copy-button" type="button" onClick={copySetup}>{copied ? "Copied expedition brief" : "Copy GM setup brief"}</button>
      </section>

      <footer>
        <p><strong>Xenocanopy</strong> · tactical wilderness maps for revised fifth-edition play</p>
        <p>Original setting and procedural map art. Roll20 is a trademark of its respective owner.</p>
        <p>Created by <strong>Stephen G. Rider</strong> · <a href="mailto:rider.sg@gmail.com">rider.sg@gmail.com</a> · <a href="https://github.com/CaliTarheel/xenocanopy-maps" target="_blank" rel="noreferrer">source on GitHub</a> · MIT licensed—retain attribution.</p>
      </footer>
    </main>
  );
}
