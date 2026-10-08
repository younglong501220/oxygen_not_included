import {
  MATERIALS,
  ViewOverlay,
  CellData,
  PipeCellData,
  AutomationCellData,
  Duplicant
} from '../types/simulation';
import { SimulationWorld } from './physicsEngine';

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: SimulationWorld,
  viewMode: ViewOverlay,
  cellSize: number,
  hoverPos: { x: number; y: number } | null,
  brushSize: number
) {
  const { width, height, grid, pipeGrid, duplicants, tickCount } = world;
  const canvasWidth = width * cellSize;
  const canvasHeight = height * cellSize;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = viewMode === 'pipe' ? '#0f141c' : '#0a0d14';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 1. Grid Cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (viewMode === 'normal') {
        renderNormalCell(ctx, cell, pipeGrid[y][x], px, py, cellSize, x, y);
      } else if (viewMode === 'thermal') {
        renderThermalCell(ctx, cell, px, py, cellSize, tickCount);
      } else if (viewMode === 'pipe') {
        renderPipeOverlayCell(ctx, cell, pipeGrid[y][x], px, py, cellSize, pipeGrid, x, y, tickCount);
      } else if (viewMode === 'automation') {
        renderAutomationCell(ctx, cell, world.automationGrid[y][x], px, py, cellSize, world.automationGrid, x, y, pipeGrid[y][x]);
      } else if (viewMode === 'breath') {
        renderBreathCell(ctx, cell, px, py, cellSize);
      } else if (viewMode === 'pressure') {
        renderPressureCell(ctx, cell, px, py, cellSize);
      } else if (viewMode === 'gas') {
        renderGasOverlayCell(ctx, cell, pipeGrid[y][x], px, py, cellSize, x, y, tickCount);
      }
    }
  }

  // 2. Pipes & Machines overlay in Normal View (drawn on top of cells)
  if (viewMode === 'normal') {
    renderPipesAndMachines(ctx, world, cellSize, tickCount);
  }

  // 2.1 Automation overlay extra pass (sensors in normal view)
  if (viewMode === 'normal') {
    renderSensorsInNormalView(ctx, world, cellSize);
  }

  // 3. Duplicants (Rendered in normal, thermal, and atmospheric gas views)
  if (viewMode === 'normal' || viewMode === 'thermal' || viewMode === 'gas') {
    for (const dupe of duplicants) {
      renderDuplicant(ctx, dupe, cellSize, tickCount, viewMode);
    }
  }

  // 4. Hover & Brush indicator
  if (hoverPos) {
    const { x: gx, y: gy } = hoverPos;
    const r = brushSize - 1;
    const minX = Math.max(1, gx - r);
    const maxX = Math.min(width - 2, gx + r);
    const minY = Math.max(1, gy - r);
    const maxY = Math.min(height - 2, gy + r);

    const bpx = minX * cellSize;
    const bpy = minY * cellSize;
    const bw = (maxX - minX + 1) * cellSize;
    const bh = (maxY - minY + 1) * cellSize;

    ctx.save();
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(bpx + 0.5, bpy + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = 'rgba(79, 209, 197, 0.15)';
    ctx.fillRect(bpx, bpy, bw, bh);
    ctx.restore();
  }
}

function renderNormalCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  pCell: PipeCellData,
  px: number,
  py: number,
  s: number,
  gx: number,
  gy: number
) {
  const mat = MATERIALS[cell.mat];

  if (mat.state === 'vacuum') {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(px, py, s, s);
    return;
  }

  if (mat.state === 'solid') {
    ctx.fillStyle = `rgb(${mat.color[0]}, ${mat.color[1]}, ${mat.color[2]})`;
    ctx.fillRect(px, py, s, s);

    // Bevel highlights & textures for solids
    if (cell.mat === 'insulated_tile') {
      // Cross pattern for insulated tiles
      ctx.fillStyle = 'rgba(230, 200, 160, 0.25)';
      ctx.fillRect(px + 2, py + 2, s - 4, 1);
      ctx.fillRect(px + 2, py + s - 3, s - 4, 1);
      ctx.fillRect(px + 2, py + 2, 1, s - 4);
      ctx.fillRect(px + s - 3, py + 2, 1, s - 4);
    } else if (cell.mat === 'metal_tile') {
      // Golden metallic luster line
      ctx.fillStyle = 'rgba(255, 235, 170, 0.45)';
      ctx.fillRect(px + 1, py + 1, s - 2, 2);
    } else if (cell.mat === 'ice') {
      // Ice crystal sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(px + 2, py + 2, s - 4, 1);
      ctx.fillRect(px + s - 3, py + 3, 1, s - 5);
    } else {
      // Regular tile border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(px, py, s, 1);
      ctx.fillRect(px, py, 1, s);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(px, py + s - 1, s, 1);
      ctx.fillRect(px + s - 1, py, 1, s);
    }
  } else if (mat.state === 'liquid') {
    // Liquid background (translucent dark)
    ctx.fillStyle = '#0c121e';
    ctx.fillRect(px, py, s, s);

    // Liquid fill level based on mass (up to 1000 kg)
    const ratio = Math.min(Math.max(cell.mass / 1000, 0.1), 1.0);
    const lh = ratio * s;
    const ly = py + (s - lh);

    ctx.fillStyle = `rgb(${mat.color[0]}, ${mat.color[1]}, ${mat.color[2]})`;
    ctx.fillRect(px, ly, s, lh);

    // Liquid surface meniscus highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(px, ly, s, 1);

    // Cryogenic boiling mist & cold sheen for liquified gases
    if (
      cell.mat === 'liquid_oxygen' ||
      cell.mat === 'liquid_hydrogen' ||
      cell.mat === 'liquid_methane' ||
      cell.mat === 'liquid_co2'
    ) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(px, ly, s, 1.5);
      if (s >= 10 && (gx + gy) % 3 === 0) {
        ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
        ctx.fillRect(px + s * 0.35, ly - 2, 2, 2);
      }
    }
  } else if (mat.state === 'gas') {
    // Gas atmospheric rendering with density alpha
    const [r, g, b] = mat.color;
    // Higher mass = more dense gas cloud
    const baseAlpha = mat.opacity || 0.4;
    const densityFactor = Math.min(Math.max(cell.mass / 2.0, 0.15), 1.0);
    const alpha = baseAlpha * densityFactor;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    ctx.fillRect(px, py, s, s);

    // Steam misty particle effect
    if (cell.mat === 'steam' && (gx + gy) % 3 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    }
  }
}

function renderThermalCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  px: number,
  py: number,
  s: number,
  tickCount?: number
) {
  if (cell.mat === 'vacuum') {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(px, py, s, s);
    return;
  }

  // Temperature color scale (-270°C to 150°C+)
  const t = cell.temp;
  const color = getTemperatureColor(t);
  ctx.fillStyle = color;
  ctx.fillRect(px, py, s, s);

  // Subtle grid border
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.strokeRect(px, py, s, s);

  // Visual Diagnostic Indicator: Heat-glow / Frost-glow for cells losing or gaining heat rapidly
  const dt = cell.tempDelta ?? 0;
  if (Math.abs(dt) > 0.035) {
    const pulse = Math.sin((tickCount || 0) * 0.28) * 0.5 + 0.5;

    if (dt > 0.035) {
      // RAPID HEAT GAIN: Thermal leak / heat influx (radiant pulsing amber-red heat glow)
      const intensity = Math.min(1.0, (dt - 0.035) / 0.15);
      const alpha = (0.45 + pulse * 0.5 * intensity).toFixed(2);
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

      // Radial heat shimmer dot / core
      ctx.fillStyle = `rgba(251, 146, 60, ${(0.3 + pulse * 0.4 * intensity).toFixed(2)})`;
      ctx.fillRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);

      // Thermal leak glyph if zoomed in
      if (s >= 12 && pulse > 0.35) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲', px + s / 2, py + s / 2);
      }
      ctx.restore();
    } else {
      // RAPID HEAT LOSS: Cryogenic chilling / cold leak (radiant pulsing electric cyan frost bloom)
      const intensity = Math.min(1.0, (-dt - 0.035) / 0.15);
      const alpha = (0.45 + pulse * 0.5 * intensity).toFixed(2);
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

      // Frost core sparkle
      ctx.fillStyle = `rgba(186, 230, 253, ${(0.3 + pulse * 0.4 * intensity).toFixed(2)})`;
      ctx.fillRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);

      if (s >= 12 && pulse > 0.35) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', px + s / 2, py + s / 2);
      }
      ctx.restore();
    }
  }
}

function getTemperatureColor(t: number): string {
  // Extreme cryogenic to incandescent scale:
  // < -200°C: deep radiant violet-neon indigo (#1e1b4b to #4c1d95)
  // -200°C ~ -100°C: deep subzero cobalt-cyan (#1e3a8a to #0369a1)
  // -100°C ~ -20°C: vivid cold ice-blue (#0284c7 to #38bdf8)
  // -20°C ~ 0°C: ice cyan (#06b6d4 to #22d3ee)
  // 0°C ~ 25°C: comfortable green (#10b981)
  // 25°C ~ 60°C: warm lime to yellow (#eab308)
  // 60°C ~ 110°C: hot orange (#f97316)
  // > 110°C: fierce red to white-hot incandescent
  if (t < -200) {
    const ratio = Math.max(0, (t + 273.15) / 73.15);
    return `hsl(${270 - ratio * 30}, 90%, ${25 + (1 - ratio) * 20}%)`;
  } else if (t < -100) {
    const ratio = (t + 200) / 100;
    return `hsl(${240 - ratio * 25}, 85%, ${35 + ratio * 10}%)`;
  } else if (t < -20) {
    const ratio = (t + 100) / 80;
    return `hsl(${215 - ratio * 15}, 85%, 45%)`;
  } else if (t < 0) {
    const ratio = (t + 20) / 20;
    return `hsl(${200 - ratio * 20}, 85%, 45%)`;
  } else if (t < 25) {
    const ratio = t / 25;
    return `hsl(${180 - ratio * 45}, 80%, 42%)`;
  } else if (t < 60) {
    const ratio = (t - 25) / 35;
    return `hsl(${135 - ratio * 80}, 85%, 45%)`;
  } else if (t < 110) {
    const ratio = (t - 60) / 50;
    return `hsl(${55 - ratio * 40}, 90%, 48%)`;
  } else {
    const ratio = Math.min((t - 110) / 70, 1);
    return `hsl(${15 - ratio * 15}, 95%, ${48 + ratio * 20}%)`;
  }
}

function renderBreathCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  px: number,
  py: number,
  s: number
) {
  const mat = MATERIALS[cell.mat];
  if (mat.state === 'solid') {
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(px, py, s, s);
    return;
  }

  if (cell.mat === 'oxygen') {
    // Breathable!
    const breathQuality = Math.min(cell.mass / 1.5, 1.0);
    ctx.fillStyle = `rgba(72, 187, 120, ${(0.3 + breathQuality * 0.6).toFixed(2)})`;
    ctx.fillRect(px, py, s, s);
  } else if (cell.mat === 'vacuum') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(px, py, s, s);
  } else if (cell.mat === 'co2') {
    // Unbreathable heavy CO2
    ctx.fillStyle = 'rgba(229, 62, 62, 0.65)';
    ctx.fillRect(px, py, s, s);
  } else {
    // Other gas/liquid (unbreathable)
    ctx.fillStyle = 'rgba(221, 107, 32, 0.55)';
    ctx.fillRect(px, py, s, s);
  }
}

function renderPressureCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  px: number,
  py: number,
  s: number
) {
  const mat = MATERIALS[cell.mat];
  if (mat.state === 'solid') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    return;
  }

  if (mat.state === 'vacuum' || cell.mass <= 0.001) {
    ctx.fillStyle = '#030712';
    ctx.fillRect(px, py, s, s);
    return;
  }

  const p = cell.pressure ?? 101.3;
  // Pressure gradient:
  // < 30 kPa: Deep indigo / vacuum
  // 30 - 80 kPa: Sky blue / low pressure
  // 80 - 125 kPa: Emerald green / nominal standard 101.3 kPa
  // 125 - 220 kPa: Amber / elevated pressure
  // 220 - 350 kPa: Bright orange-red / high pressure
  // > 350 kPa: Fierce crimson-magenta / popped eardrums hyper-pressure
  let col: string;
  if (p < 30) {
    col = 'rgba(79, 70, 229, 0.7)';
  } else if (p < 80) {
    const r = (p - 30) / 50;
    col = `rgba(14, 165, 233, ${(0.5 + r * 0.3).toFixed(2)})`;
  } else if (p <= 125) {
    col = 'rgba(16, 185, 129, 0.75)';
  } else if (p <= 220) {
    const r = (p - 125) / 95;
    col = `rgba(245, 158, 11, ${(0.6 + r * 0.3).toFixed(2)})`;
  } else if (p <= 350) {
    const r = (p - 220) / 130;
    col = `rgba(239, 68, 68, ${(0.7 + r * 0.25).toFixed(2)})`;
  } else {
    col = 'rgba(217, 70, 239, 0.9)';
  }

  ctx.fillStyle = col;
  ctx.fillRect(px, py, s, s);

  // Subtle isobaric contour dots for elevated pressure
  if (s >= 10 && (Math.floor(p) % 40 < 4 || p > 250)) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(px + s / 2 - 0.5, py + s / 2 - 0.5, 1, 1);
  }
}

function renderGasOverlayCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  pCell: PipeCellData,
  px: number,
  py: number,
  s: number,
  gx: number,
  gy: number,
  tickCount?: number
) {
  const mat = MATERIALS[cell.mat];

  if (mat.state === 'solid') {
    // Structural architectural silhouette (dark graphite with clean subtle boundary)
    ctx.fillStyle = '#111827';
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    return;
  }

  if (mat.state === 'vacuum' || cell.mass <= 0.001) {
    // Deep obsidian vacuum void
    ctx.fillStyle = '#030712';
    ctx.fillRect(px, py, s, s);
    // Subtle starry twinkle point
    if (s >= 10 && (gx + gy) % 9 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(px + s / 2, py + s / 2, 1, 1);
    }
    return;
  }

  if (mat.state === 'liquid') {
    // Cryogenic Liquid Gases: Distinct color coding matching their atmospheric elements
    if (cell.mat === 'liquid_oxygen') {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.8)'; // Electric cyan LOX
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px, py, s, 2); // Meniscus
      if (s >= 11 && (gx % 3 === 0 && gy % 3 === 0)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LOX', px + s / 2, py + s / 2);
      }
      return;
    } else if (cell.mat === 'liquid_hydrogen') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.8)'; // Neon pink LH2
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#fecdd3';
      ctx.fillRect(px, py, s, 2);
      if (s >= 11 && (gx % 3 === 0 && gy % 3 === 0)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LH₂', px + s / 2, py + s / 2);
      }
      return;
    } else if (cell.mat === 'liquid_methane') {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.8)'; // Neon lime LNG
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#d9f99d';
      ctx.fillRect(px, py, s, 2);
      if (s >= 11 && (gx % 3 === 0 && gy % 3 === 0)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LNG', px + s / 2, py + s / 2);
      }
      return;
    } else if (cell.mat === 'liquid_co2') {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.8)'; // Violet liquid CO2
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(px, py, s, 2);
      return;
    }

    // Standard liquids (water, petroleum, etc.)
    if (cell.mat === 'water' || cell.mat === 'hot_water') {
      ctx.fillStyle = 'rgba(14, 116, 144, 0.45)';
    } else if (cell.mat === 'polluted_water') {
      ctx.fillStyle = 'rgba(101, 163, 13, 0.45)';
    } else {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.5)';
    }
    ctx.fillRect(px, py, s, s);
    // Liquid surface meniscus line
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(px, py, s, 1.5);
    return;
  }

  // GAS CELL: Vivid, distinct color coding per gas element (O2, CO2, H2, CH4, Steam)
  const mass = cell.mass;
  const p = cell.pressure ?? 101.3;
  const stdDensity = Math.max(mat.density, 0.05);
  const densityRatio = mass / stdDensity;
  // Dynamic opacity scaling: thin gas is translucent, dense/compressed gas is rich & saturated
  const baseAlpha = Math.min(0.95, Math.max(0.38, 0.48 + Math.min(densityRatio, 2.5) * 0.18));

  let fillStyle = '';
  let borderGlow = '';
  let label = '';
  let labelColor = '';

  switch (cell.mat) {
    case 'oxygen': // Oxygen (O2)
      // Electric azure / bright sky cyan (#0ea5e9 to #38bdf8)
      fillStyle = `rgba(14, 165, 233, ${baseAlpha.toFixed(2)})`;
      borderGlow = 'rgba(56, 189, 248, 0.8)';
      label = 'O₂';
      labelColor = '#e0f2fe';
      break;

    case 'co2': // Carbon Dioxide (CO2)
      // Deep carbon violet / smoky purple (#a855f7 to #9333ea)
      fillStyle = `rgba(168, 85, 247, ${baseAlpha.toFixed(2)})`;
      borderGlow = 'rgba(192, 132, 252, 0.8)';
      label = 'CO₂';
      labelColor = '#f3e8ff';
      break;

    case 'hydrogen': // Hydrogen (H2)
      // Radiant neon rose / hot pink / energetic magenta (#f43f5e to #ec4899)
      fillStyle = `rgba(244, 63, 94, ${baseAlpha.toFixed(2)})`;
      borderGlow = 'rgba(251, 113, 133, 0.85)';
      label = 'H₂';
      labelColor = '#ffe4e6';
      break;

    case 'methane': // Methane (CH4)
      // Luminous neon lime / chartreuse (#84cc16 to #a3e635)
      fillStyle = `rgba(132, 204, 22, ${baseAlpha.toFixed(2)})`;
      borderGlow = 'rgba(163, 230, 53, 0.85)';
      label = 'CH₄';
      labelColor = '#ecfccb';
      break;

    case 'steam': // Steam (H2O gas)
      // Pearly silver-white vapor (#e2e8f0)
      fillStyle = `rgba(226, 232, 240, ${baseAlpha.toFixed(2)})`;
      borderGlow = 'rgba(248, 250, 252, 0.7)';
      label = 'H₂O';
      labelColor = '#ffffff';
      break;

    default:
      fillStyle = `rgba(100, 116, 139, ${baseAlpha.toFixed(2)})`;
      break;
  }

  ctx.fillStyle = fillStyle;
  ctx.fillRect(px, py, s, s);

  // High-Pressure Pocket Visual Indicator:
  // When pressure exceeds 140 kPa (or vacuum decompression burst), highlight with glowing border!
  if (p > 135) {
    ctx.strokeStyle = borderGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

    // Hyper-pressure center sparkle glint (> 220 kPa)
    if (s >= 10 && p > 220) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(px + s / 2 - 0.5, py + s / 2 - 0.5, 1.5, 1.5);
    }
  }

  // Micro chemical symbol badge when cellSize >= 11 (spaced cleanly every 3x3 cells or on significant density)
  if (s >= 11 && label && (gx % 3 === 0 && gy % 3 === 0)) {
    ctx.save();
    ctx.font = '600 7px monospace';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.9;
    ctx.fillText(label, px + s / 2, py + s / 2);
    ctx.restore();
  }
}

function renderPipeOverlayCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  pCell: PipeCellData,
  px: number,
  py: number,
  s: number,
  pipeGrid: PipeCellData[][],
  gx: number,
  gy: number,
  tickCount?: number
) {
  // Blueprint background with cell outline
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(px, py, s, s);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

  if (!pCell.hasPipe && pCell.building === 'none') return;

  const cx = px + s / 2;
  const cy = py + s / 2;
  const pipeRadius = Math.max(2, Math.floor(s / 4));

  // If building
  if (pCell.building !== 'none') {
    renderBuildingSprite(ctx, pCell.building, px, py, s, pCell.powered, pCell, tickCount);
  }

  // Render pipe connections to 4 neighbors
  if (pCell.hasPipe) {
    ctx.fillStyle = pCell.content ? '#38b2ac' : '#475569';
    ctx.fillRect(cx - pipeRadius, cy - pipeRadius, pipeRadius * 2, pipeRadius * 2);

    const checkNeighbor = (nx: number, ny: number, ox: number, oy: number, w: number, h: number) => {
      if (pipeGrid[ny]?.[nx]?.hasPipe || pipeGrid[ny]?.[nx]?.building !== 'none') {
        ctx.fillRect(ox, oy, w, h);
      }
    };

    // Right
    checkNeighbor(gx + 1, gy, cx, cy - pipeRadius, s / 2, pipeRadius * 2);
    // Left
    checkNeighbor(gx - 1, gy, px, cy - pipeRadius, s / 2, pipeRadius * 2);
    // Down
    checkNeighbor(gx, gy + 1, cx - pipeRadius, cy, pipeRadius * 2, s / 2);
    // Up
    checkNeighbor(gx, gy - 1, cx - pipeRadius, py, pipeRadius * 2, s / 2);

    // Liquid packet inside pipe
    if (pCell.content) {
      const mat = MATERIALS[pCell.content.mat];
      ctx.fillStyle = `rgb(${mat.color[0]}, ${mat.color[1]}, ${mat.color[2]})`;
      ctx.beginPath();
      ctx.arc(cx, cy, pipeRadius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function renderPipesAndMachines(
  ctx: CanvasRenderingContext2D,
  world: SimulationWorld,
  s: number,
  tickCount: number
) {
  const { width, height, pipeGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = pipeGrid[y][x];
      const px = x * s;
      const py = y * s;

      // Machinery overlay
      if (p.building !== 'none') {
        renderBuildingSprite(ctx, p.building, px, py, s, p.powered, p, tickCount);
      }

      // Small subtle pipe trace in normal view
      if (p.hasPipe) {
        ctx.fillStyle = p.content ? '#38b2ac' : 'rgba(100, 116, 139, 0.65)';
        ctx.fillRect(px + s / 2 - 1.5, py + s / 2 - 1.5, 3, 3);
        if (p.content) {
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(px + s / 2 - 2, py + s / 2 - 2, 4, 4);
        }
      }
    }
  }
}

function renderBuildingSprite(
  ctx: CanvasRenderingContext2D,
  building: string,
  px: number,
  py: number,
  s: number,
  powered: boolean,
  pCell?: PipeCellData,
  tickCount?: number
) {
  const cx = px + s / 2;
  const cy = py + s / 2;

  if (building === 'pump') {
    // Liquid Pump
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

    // Impeller symbol
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, s / 4), 0, Math.PI * 2);
    ctx.fill();
  } else if (building === 'vent') {
    // Liquid Vent (Green spout)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + 3, cy + 3);
    ctx.lineTo(cx - 3, cy + 3);
    ctx.fill();
  } else if (building === 'heater') {
    // Space Heater (Red coil)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + 3, cy);
    ctx.lineTo(px + s - 3, cy);
    ctx.stroke();
  } else if (building === 'cooler') {
    // Pipe Aquatuner / Cooler (Ice blue)
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);
  } else if (building === 'cryo_cooler') {
    // Cryo-Cooler (低溫深冷機: High-tech cryogenic refrigerator with frost condensation coils)
    ctx.fillStyle = '#0f172a'; // Deep slate chassis
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = powered ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);

    // Cryogenic Stirling chamber / frost coil
    ctx.fillStyle = powered ? '#0369a1' : '#1e293b';
    ctx.fillRect(px + 3, py + 3, s - 6, s - 6);

    // Frost crosshairs / cryo core
    ctx.strokeStyle = powered ? '#e0f2fe' : '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, py + 2);
    ctx.lineTo(cx, py + s - 2);
    ctx.moveTo(px + 2, cy);
    ctx.lineTo(px + s - 2, cy);
    ctx.stroke();

    // Center cryo cold sparkle LED
    if (powered) {
      const pulse = Math.sin((tickCount || 0) * 0.3) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(56, 189, 248, ${(0.7 + pulse * 0.3).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, s / 4), 0, Math.PI * 2);
      ctx.fill();

      // Snowflake / frost particle glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  } else if (building === 'electrolyzer') {
    // Electrolyzer (Teal and purple dual-node)
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(px + 2, py + 2, 3, 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + s - 5, py + 2, 3, 3);
  } else if (building === 'gas_pump') {
    // Gas Pump (Deep purple housing with fan)
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

    // Fan rotor
    ctx.fillStyle = powered ? '#38bdf8' : '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, s / 4), 0, Math.PI * 2);
    ctx.fill();
  } else if (building === 'gas_vent') {
    // Gas Vent (White & cyan air louvers)
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 3, cy - 2, s - 6, 1);
    ctx.fillRect(px + 3, cy, s - 6, 1);
    ctx.fillRect(px + 3, cy + 2, s - 6, 1);
  } else if (building === 'gas_filter') {
    // Gas Filter (High-tech multi-chamber filter)
    const isOverloaded = !!pCell?.filterOverload;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = isOverloaded ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

    // Filter cartridge indicator
    ctx.fillStyle = isOverloaded ? '#ef4444' : '#f59e0b';
    ctx.fillRect(cx - 2, cy - 3, 4, 6);

    // Visual notification effect: subtle pulse aura when multiple gas types detected in segment
    if (isOverloaded) {
      const pulse = Math.sin((tickCount || 0) * 0.28) * 0.5 + 0.5; // 0..1 smooth pulse
      ctx.save();
      // Amber/red glowing pulse wave expanding outward
      ctx.strokeStyle = `rgba(245, 158, 11, ${(0.35 + pulse * 0.55).toFixed(2)})`;
      ctx.lineWidth = 1.2 + pulse * 1.5;
      const expand = 2 + pulse * 3.5;
      ctx.strokeRect(px - expand, py - expand, s + expand * 2, s + expand * 2);

      // Warning beacon light on top of filter
      ctx.fillStyle = `rgba(239, 68, 68, ${(0.6 + pulse * 0.4).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(cx, py - 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Overload text badge above filter
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(cx - 22, py - 11, 44, 9);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(cx - 22, py - 11, 44, 9);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️OVERLOAD', cx, py - 6.5);
      ctx.restore();
    }
  } else if (building === 'pressure_gauge') {
    // Pressure Gauge (管線氣壓表 / 壓力計)
    const press = pCell?.measuredPressure ?? 0;
    const isRuptureRisk = press > 220;

    // Outer dial bezel
    ctx.fillStyle = isRuptureRisk ? '#450a0a' : '#0f172a';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = isRuptureRisk ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);

    // Round dial face
    const radius = Math.max(3, s / 3);
    ctx.fillStyle = isRuptureRisk ? '#7f1d1d' : '#1e293b';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Color gauge arcs
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 0.5, Math.PI * 0.75, Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 0.5, Math.PI * 1.8, Math.PI * 2.25);
    ctx.stroke();

    // Rotating indicator needle
    const needleAngle = Math.PI * 0.75 + Math.min(Math.PI * 1.5, (press / 280) * Math.PI * 1.5);
    ctx.strokeStyle = isRuptureRisk ? '#fca5a5' : '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius - 1), cy + Math.sin(needleAngle) * (radius - 1));
    ctx.stroke();

    // Center pivot
    ctx.fillStyle = isRuptureRisk ? '#ef4444' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Pressure Readout Tooltip / Overlay (Always visible in Normal and Pipe mode)
    ctx.save();
    const badgeWidth = isRuptureRisk ? 58 : 42;
    const badgeX = cx - badgeWidth / 2;
    const badgeY = py - 12;

    ctx.fillStyle = isRuptureRisk ? 'rgba(69, 10, 10, 0.95)' : 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(badgeX, badgeY, badgeWidth, 10);
    ctx.strokeStyle = isRuptureRisk ? '#ef4444' : '#0ea5e9';
    ctx.lineWidth = isRuptureRisk ? 1.2 : 0.8;
    ctx.strokeRect(badgeX, badgeY, badgeWidth, 10);

    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isRuptureRisk) {
      ctx.fillStyle = '#f87171';
      ctx.fillText(`⚠️${press.toFixed(0)}k RUPTURE`, cx, badgeY + 5);
    } else {
      ctx.fillStyle = press > 150 ? '#facc15' : '#38bdf8';
      ctx.fillText(`${press.toFixed(1)} kPa`, cx, badgeY + 5);
    }
    ctx.restore();
  } else if (building === 'air_circulator') {
    // Air Circulator Fan (Teal duct housing with turbine rotor)
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

    // Fan rotor & directional airflow
    ctx.fillStyle = powered ? '#a5f3fc' : '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, s / 3.5), 0, Math.PI * 2);
    ctx.fill();

    // Directional chevron
    ctx.fillStyle = powered ? '#0369a1' : '#334155';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2);
    ctx.lineTo(cx + 2, cy);
    ctx.lineTo(cx - 2, cy + 2);
    ctx.fill();
  } else if (building === 'air_scrubber') {
    // Air Scrubber / Purifier (Emerald catalytic tower)
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

    // Active catalytic core
    ctx.fillStyle = powered ? '#34d399' : '#047857';
    ctx.fillRect(cx - 2, cy - 3, 4, 6);

    // Sparkle dot
    if (powered) {
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  }
}

function renderAutomationCell(
  ctx: CanvasRenderingContext2D,
  cell: CellData,
  aCell: AutomationCellData,
  px: number,
  py: number,
  s: number,
  autoGrid: AutomationCellData[][],
  gx: number,
  gy: number,
  pCell: PipeCellData
) {
  // Dark blueprint background
  ctx.fillStyle = '#080d1a';
  ctx.fillRect(px, py, s, s);
  ctx.strokeStyle = '#172033';
  ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

  const cx = px + s / 2;
  const cy = py + s / 2;

  // If there's a building, draw faint ghost outline
  if (pCell.building !== 'none') {
    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);

    // Automation port circle
    ctx.fillStyle = pCell.powered ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw automation wire
  if (aCell.hasWire) {
    const wireColor = aCell.signal ? '#22c55e' : '#ef4444';
    const wireWidth = Math.max(2, Math.floor(s / 4));

    ctx.fillStyle = wireColor;
    ctx.fillRect(cx - wireWidth / 2, cy - wireWidth / 2, wireWidth, wireWidth);

    // 4-neighbor wire connections
    const connect = (nx: number, ny: number, ox: number, oy: number, w: number, h: number) => {
      const neighbor = autoGrid[ny]?.[nx];
      if (neighbor && (neighbor.hasWire || neighbor.sensor !== 'none')) {
        ctx.fillRect(ox, oy, w, h);
      }
    };

    connect(gx + 1, gy, cx, cy - wireWidth / 2, s / 2, wireWidth);
    connect(gx - 1, gy, px, cy - wireWidth / 2, s / 2, wireWidth);
    connect(gx, gy + 1, cx - wireWidth / 2, cy, wireWidth, s / 2);
    connect(gx, gy - 1, cx - wireWidth / 2, py, wireWidth, s / 2);
  }

  // Draw sensor
  if (aCell.sensor !== 'none') {
    renderSensorSprite(ctx, aCell, px, py, s);
  }

  // Draw logic gate
  if (aCell.gate !== 'none') {
    renderGateSprite(ctx, aCell, px, py, s);
  }
}

function renderGateSprite(
  ctx: CanvasRenderingContext2D,
  aCell: AutomationCellData,
  px: number,
  py: number,
  s: number
) {
  const cx = px + s / 2;
  const cy = py + s / 2;

  // Chip Base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 1, py + 1, s - 2, s - 2);
  ctx.strokeStyle = aCell.gate === 'not_gate' ? '#f59e0b' : '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);

  // Input & Output port indicators
  ctx.fillStyle = aCell.gateInputSignal ? '#22c55e' : '#ef4444';
  ctx.fillRect(px + 2, cy - 1, 2, 2);

  ctx.fillStyle = aCell.signal ? '#22c55e' : '#ef4444';
  ctx.fillRect(px + s - 4, cy - 1, 2, 2);

  if (aCell.gate === 'not_gate') {
    // NOT Gate: triangle + inversion bubble
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 3);
    ctx.lineTo(cx + 1, cy);
    ctx.lineTo(cx - 3, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Inversion circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 2.5, cy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (aCell.gate === 'buffer_gate') {
    // Buffer Gate: "BUF" label with countdown bar
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUF', cx, cy - 0.5);

    // Active countdown bar if buffer timer > 0
    if ((aCell.bufferTimer ?? 0) > 0) {
      const maxDelay = aCell.bufferDelayTicks ?? 30;
      const progress = Math.min((aCell.bufferTimer ?? 0) / maxDelay, 1.0);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px + 2, py + s - 3, (s - 4) * progress, 1.5);
    }
  }
}

function renderSensorSprite(
  ctx: CanvasRenderingContext2D,
  aCell: AutomationCellData,
  px: number,
  py: number,
  s: number
) {
  const cx = px + s / 2;
  const cy = py + s / 2;

  // Sensor plate
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
  ctx.strokeStyle = aCell.sensor === 'thermal_sensor' ? '#f59e0b' : '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(px + 2, py + 2, s - 4, s - 4);

  // Active status LED
  ctx.fillStyle = aCell.signal ? '#22c55e' : '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderSensorsInNormalView(
  ctx: CanvasRenderingContext2D,
  world: SimulationWorld,
  s: number
) {
  const { width, height, automationGrid } = world;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const a = automationGrid[y][x];
      if (a.sensor !== 'none') {
        renderSensorSprite(ctx, a, x * s, y * s, s);
      } else if (a.gate !== 'none') {
        renderGateSprite(ctx, a, x * s, y * s, s);
      } else if (a.hasWire) {
        // Subtle wire trace
        const px = x * s + s / 2;
        const py = y * s + s / 2;
        ctx.fillStyle = a.signal ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
  }
}

function renderDuplicant(
  ctx: CanvasRenderingContext2D,
  dupe: Duplicant,
  s: number,
  tickCount: number,
  viewMode: ViewOverlay
) {
  const px = dupe.x * s;
  const py = dupe.y * s;

  if (viewMode === 'thermal') {
    // Dupe emits 37°C in thermal view
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, s * 0.65, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  // Mini Duplicant (Meep / Bubbles)
  const cx = px + s / 2;
  const cy = py + s / 2;
  const dupeRadius = Math.max(3, s * 0.45);

  // Body
  ctx.fillStyle = dupe.color || '#4fd1c5';
  ctx.beginPath();
  ctx.arc(cx, cy + 2, dupeRadius * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(cx, cy - 2, dupeRadius * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#0f172a';
  const eyeOffset = dupe.facing === 'right' ? 1.5 : -1.5;
  ctx.fillRect(cx + eyeOffset, cy - 3, 1.5, 1.5);

  // Hair
  ctx.fillStyle = '#78350f';
  ctx.fillRect(cx - 3, cy - 5, 6, 2);

  // Suffocation warning bubble
  if (dupe.state === 'suffocating' || dupe.breath < 20) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('!', cx - 1, cy - 6);
  }

  // Name tag
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dupe.name.split(' ')[0], cx, py - 3);

  ctx.restore();
}
