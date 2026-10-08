/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SimulationWorld,
  createEmptyWorld,
  loadDefaultHabitat,
  loadSteamChamberPreset,
  loadGasStratificationPreset,
  loadElectrolyzerSPOMPreset,
  loadGasFilterAutomationPreset,
  loadGreenhouseAndAirCirculationPreset,
  loadCryoCoolerPreset,
  makeCell,
  stepSimulation,
  CELL_SIZE
} from './simulation/physicsEngine';
import { renderWorld } from './simulation/renderer';
import {
  ViewOverlay,
  ToolType,
  CellData,
  PipeCellData,
  AutomationCellData,
  Duplicant,
  MaterialKey,
  GateDirection,
  MATERIALS
} from './types/simulation';
import { Eye, EyeOff } from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { InspectorPanel } from './components/InspectorPanel';
import { DeviceConfigPopover } from './components/DeviceConfigPopover';
import { ScienceHandbookModal } from './components/ScienceHandbookModal';
import { playToolSound, setSoundEnabled } from './utils/sound';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<SimulationWorld>(createEmptyWorld());

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewOverlay>('normal');
  const [currentTool, setCurrentTool] = useState<ToolType>('tile');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [selectedPreset, setSelectedPreset] = useState<string>('automation_filter');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);

  // Hover telemetry
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<CellData | null>(null);
  const [hoverPipeCell, setHoverPipeCell] = useState<PipeCellData | null>(null);
  const [hoverAutoCell, setHoverAutoCell] = useState<AutomationCellData | null>(null);
  const [hoverDupe, setHoverDupe] = useState<Duplicant | null>(null);

  // Device config popover state
  const [configCoord, setConfigCoord] = useState<{ x: number; y: number } | null>(null);

  // Inspector Panel (bottom right matter status box) visibility and compact mode
  const [showInspector, setShowInspector] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('oni_show_inspector');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);

  const handleToggleInspector = useCallback(() => {
    setShowInspector((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('oni_show_inspector', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Colony statistics
  const [tickDisplay, setTickDisplay] = useState<number>(0);
  const [totalO2Kg, setTotalO2Kg] = useState<number>(0);
  const [avgTemp, setAvgTemp] = useState<number>(22);
  const [dupeCount, setDupeCount] = useState<number>(0);
  const [suffocatingCount, setSuffocatingCount] = useState<number>(0);

  // Mouse interaction
  const isMouseDownRef = useRef<boolean>(false);

  // Load preset helper
  const loadPreset = useCallback((presetName: string) => {
    const world = createEmptyWorld();
    worldRef.current = world;

    if (presetName === 'habitat') {
      loadDefaultHabitat(world);
    } else if (presetName === 'automation_filter') {
      loadGasFilterAutomationPreset(world);
    } else if (presetName === 'greenhouse') {
      loadGreenhouseAndAirCirculationPreset(world);
    } else if (presetName === 'steam') {
      loadSteamChamberPreset(world);
    } else if (presetName === 'gas_column') {
      loadGasStratificationPreset(world);
    } else if (presetName === 'spom') {
      loadElectrolyzerSPOMPreset(world);
    } else if (presetName === 'cryo') {
      loadCryoCoolerPreset(world);
    }
    setSelectedPreset(presetName);
    setConfigCoord(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadPreset('automation_filter');
  }, [loadPreset]);

  // Audio mute sync
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Tool brush painter
  const applyToolAt = useCallback(
    (gx: number, gy: number) => {
      const world = worldRef.current;
      const { width, height, grid, pipeGrid, automationGrid } = world;
      const r = brushSize - 1;

      playToolSound(currentTool);

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = gx + dx;
          const y = gy + dy;

          if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) continue;

          // Material brushes
          if (currentTool === 'tile') {
            grid[y][x] = makeCell('tile', 1800, 22);
          } else if (currentTool === 'insulated_tile') {
            grid[y][x] = makeCell('insulated_tile', 2200, 22);
          } else if (currentTool === 'metal_tile') {
            grid[y][x] = makeCell('metal_tile', 3000, 22);
          } else if (currentTool === 'ice') {
            grid[y][x] = makeCell('ice', 900, -15);
          } else if (currentTool === 'water') {
            grid[y][x] = makeCell('water', 980, 20);
          } else if (currentTool === 'hot_water') {
            grid[y][x] = makeCell('water', 980, 95);
          } else if (currentTool === 'polluted_water') {
            grid[y][x] = makeCell('polluted_water', 1050, 15);
          } else if (currentTool === 'petroleum') {
            grid[y][x] = makeCell('petroleum', 820, 24);
          } else if (currentTool === 'oxygen') {
            grid[y][x] = makeCell('oxygen', 1.8, 22);
          } else if (currentTool === 'co2') {
            grid[y][x] = makeCell('co2', 3.5, 24);
          } else if (currentTool === 'hydrogen') {
            grid[y][x] = makeCell('hydrogen', 0.9, 20);
          } else if (currentTool === 'methane') {
            grid[y][x] = makeCell('methane', 1.6, 32);
          } else if (currentTool === 'steam') {
            grid[y][x] = makeCell('steam', 2.2, 130);
          } else if (currentTool === 'dig') {
            grid[y][x] = makeCell('oxygen', 0.1, 20);
          } else if (currentTool === 'vacuum') {
            grid[y][x] = makeCell('vacuum', 0, 20);
          }
          // Machinery & Plumbing brushes
          else if (currentTool === 'pipe') {
            pipeGrid[y][x].hasPipe = true;
          } else if (currentTool === 'clear_pipe') {
            pipeGrid[y][x].hasPipe = false;
            pipeGrid[y][x].content = null;
          } else if (currentTool === 'pump') {
            pipeGrid[y][x].building = 'pump';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'vent') {
            pipeGrid[y][x].building = 'vent';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'gas_pump') {
            pipeGrid[y][x].building = 'gas_pump';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'gas_vent') {
            pipeGrid[y][x].building = 'gas_vent';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'gas_filter') {
            pipeGrid[y][x].building = 'gas_filter';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
            pipeGrid[y][x].filterTarget = 'co2';
          } else if (currentTool === 'pressure_gauge') {
            pipeGrid[y][x].building = 'pressure_gauge';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
            pipeGrid[y][x].measuredPressure = 0;
          } else if (currentTool === 'air_circulator') {
            pipeGrid[y][x].building = 'air_circulator';
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'air_scrubber') {
            pipeGrid[y][x].building = 'air_scrubber';
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'heater') {
            pipeGrid[y][x].building = 'heater';
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'cooler') {
            pipeGrid[y][x].building = 'cooler';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          } else if (currentTool === 'electrolyzer') {
            pipeGrid[y][x].building = 'electrolyzer';
            pipeGrid[y][x].hasPipe = true;
            pipeGrid[y][x].powered = true;
          }
          // Automation & Sensors & Logic Gates
          else if (currentTool === 'wire') {
            automationGrid[y][x].hasWire = true;
          } else if (currentTool === 'not_gate') {
            automationGrid[y][x].gate = 'not_gate';
            automationGrid[y][x].sensor = 'none';
            automationGrid[y][x].hasWire = false;
            automationGrid[y][x].gateDir = 'left_to_right';
          } else if (currentTool === 'buffer_gate') {
            automationGrid[y][x].gate = 'buffer_gate';
            automationGrid[y][x].sensor = 'none';
            automationGrid[y][x].hasWire = false;
            automationGrid[y][x].gateDir = 'left_to_right';
            automationGrid[y][x].bufferDelayTicks = 30;
            automationGrid[y][x].bufferTimer = 0;
          } else if (currentTool === 'clear_wire') {
            automationGrid[y][x].hasWire = false;
            automationGrid[y][x].sensor = 'none';
            automationGrid[y][x].gate = 'none';
            automationGrid[y][x].signal = false;
            automationGrid[y][x].bufferTimer = 0;
          } else if (currentTool === 'thermal_sensor') {
            automationGrid[y][x].sensor = 'thermal_sensor';
            automationGrid[y][x].hasWire = true;
            automationGrid[y][x].gate = 'none';
            automationGrid[y][x].comparison = 'below';
            automationGrid[y][x].threshold = 18.0;
          } else if (currentTool === 'pressure_sensor') {
            automationGrid[y][x].sensor = 'pressure_sensor';
            automationGrid[y][x].hasWire = true;
            automationGrid[y][x].gate = 'none';
            automationGrid[y][x].comparison = 'above';
            automationGrid[y][x].threshold = 1.0;
          }
        }
      }

      // Duplicant special spawn tool
      if (currentTool === 'spawn_dupe') {
        const names = ['米普 (Meep)', '泡泡 (Bubbles)', '尼古拉 (Nikola)', '哈桑 (Hassan)'];
        const colors = ['#4fd1c5', '#f6ad55', '#fc8181', '#63b3ed'];
        const idx = world.duplicants.length % names.length;
        world.duplicants.push({
          id: `dupe-${Date.now()}`,
          name: names[idx],
          x: gx,
          y: gy,
          vx: 0.3,
          vy: 0,
          breath: 100,
          health: 100,
          facing: 'right',
          state: 'idle',
          color: colors[idx]
        });
      }
    },
    [brushSize, currentTool]
  );

  // Mouse event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const gx = Math.floor(clientX / CELL_SIZE);
    const gy = Math.floor(clientY / CELL_SIZE);

    applyToolAt(gx, gy);

    // If clicking on a sensor, gate, or gas filter, open configuration
    const world = worldRef.current;
    if (gx >= 0 && gx < world.width && gy >= 0 && gy < world.height) {
      const a = world.automationGrid[gy][gx];
      const p = world.pipeGrid[gy][gx];
      if (a.sensor !== 'none' || a.gate !== 'none' || p.building === 'gas_filter') {
        setConfigCoord({ x: gx, y: gy });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const gx = Math.floor(clientX / CELL_SIZE);
    const gy = Math.floor(clientY / CELL_SIZE);

    const world = worldRef.current;
    if (gx >= 0 && gx < world.width && gy >= 0 && gy < world.height) {
      setHoverCoord({ x: gx, y: gy });
      setHoverCell(world.grid[gy][gx]);
      setHoverPipeCell(world.pipeGrid[gy][gx]);
      setHoverAutoCell(world.automationGrid[gy][gx]);

      // Check duplicant near cursor
      const dupe = world.duplicants.find(
        (d) => Math.abs(d.x - gx) < 2 && Math.abs(d.y - gy) < 2
      );
      setHoverDupe(dupe || null);

      if (isMouseDownRef.current) {
        applyToolAt(gx, gy);
      }
    } else {
      setHoverCoord(null);
      setHoverCell(null);
      setHoverPipeCell(null);
      setHoverAutoCell(null);
      setHoverDupe(null);
    }
  };

  const handleCanvasMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleCanvasMouseLeave = () => {
    isMouseDownRef.current = false;
    setHoverCoord(null);
    setHoverCell(null);
    setHoverPipeCell(null);
    setHoverAutoCell(null);
    setHoverDupe(null);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === '1') {
        setSimSpeed(1);
      } else if (e.key === '2') {
        setSimSpeed(2);
      } else if (e.key === '4') {
        setSimSpeed(4);
      } else if (e.key.toLowerCase() === 'r') {
        loadPreset(selectedPreset);
      } else if (e.key.toLowerCase() === 'h') {
        setIsHandbookOpen((open) => !open);
      } else if (e.key.toLowerCase() === 'n') {
        setViewMode('normal');
      } else if (e.key.toLowerCase() === 't') {
        setViewMode('thermal');
      } else if (e.key.toLowerCase() === 'p') {
        setViewMode('pipe');
      } else if (e.key.toLowerCase() === 'a') {
        setViewMode('automation');
      } else if (e.key.toLowerCase() === 'b') {
        setViewMode('breath');
      } else if (e.key.toLowerCase() === 'i') {
        handleToggleInspector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadPreset, selectedPreset, handleToggleInspector]);

  // Main animation / simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastStatsTime = 0;

    const loop = (timestamp: number) => {
      const world = worldRef.current;

      // Physics steps
      if (!isPaused) {
        for (let i = 0; i < simSpeed; i++) {
          stepSimulation(world);
        }
      }

      // Render frame
      renderWorld(ctx, world, viewMode, CELL_SIZE, hoverCoord, brushSize);

      // Periodically update UI colony vitals (every 250ms)
      if (timestamp - lastStatsTime > 250) {
        lastStatsTime = timestamp;
        setTickDisplay(world.tickCount);

        let totalO2 = 0;
        let tempSum = 0;
        let cellCount = 0;
        for (let y = 1; y < world.height - 1; y++) {
          for (let x = 1; x < world.width - 1; x++) {
            const c = world.grid[y][x];
            if (c.mat === 'oxygen') {
              totalO2 += c.mass;
            }
            if (c.mat !== 'vacuum') {
              tempSum += c.temp;
              cellCount++;
            }
          }
        }
        setTotalO2Kg(totalO2);
        setAvgTemp(cellCount > 0 ? tempSum / cellCount : 20);

        setDupeCount(world.duplicants.length);
        setSuffocatingCount(world.duplicants.filter((d) => d.state === 'suffocating').length);

        // Update hover cell real-time data
        if (hoverCoord) {
          const { x, y } = hoverCoord;
          setHoverCell({ ...world.grid[y][x] });
          setHoverPipeCell({ ...world.pipeGrid[y][x] });
          setHoverAutoCell({ ...world.automationGrid[y][x] });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, simSpeed, viewMode, hoverCoord, brushSize]);

  // Device configuration handlers
  const handleUpdateSensor = (comparison: 'above' | 'below', threshold: number) => {
    if (!configCoord) return;
    const a = worldRef.current.automationGrid[configCoord.y][configCoord.x];
    a.comparison = comparison;
    a.threshold = threshold;
    if (hoverCoord && hoverCoord.x === configCoord.x && hoverCoord.y === configCoord.y) {
      setHoverAutoCell({ ...a });
    }
  };

  const handleUpdateFilter = (target: MaterialKey) => {
    if (!configCoord) return;
    const p = worldRef.current.pipeGrid[configCoord.y][configCoord.x];
    p.filterTarget = target;
    if (hoverCoord && hoverCoord.x === configCoord.x && hoverCoord.y === configCoord.y) {
      setHoverPipeCell({ ...p });
    }
  };

  const handleUpdateGate = (gateDir: GateDirection, bufferDelayTicks?: number) => {
    if (!configCoord) return;
    const a = worldRef.current.automationGrid[configCoord.y][configCoord.x];
    a.gateDir = gateDir;
    if (bufferDelayTicks !== undefined) {
      a.bufferDelayTicks = bufferDelayTicks;
    }
    if (hoverCoord && hoverCoord.x === configCoord.x && hoverCoord.y === configCoord.y) {
      setHoverAutoCell({ ...a });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <HeaderBar
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onStep={() => stepSimulation(worldRef.current)}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        onReset={() => loadPreset(selectedPreset)}
        selectedPreset={selectedPreset}
        onSelectPreset={loadPreset}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
        onOpenHandbook={() => setIsHandbookOpen(true)}
        showInspector={showInspector}
        onToggleInspector={handleToggleInspector}
        tickCount={tickDisplay}
        dupeCount={dupeCount}
        suffocatingCount={suffocatingCount}
        totalO2Kg={totalO2Kg}
        avgTemp={avgTemp}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Interactive Tool Sidebar */}
        <Sidebar
          currentTool={currentTool}
          onSetTool={setCurrentTool}
          brushSize={brushSize}
          onSetBrushSize={setBrushSize}
        />

        {/* Center Simulation Canvas Container */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden p-2 select-none">
          <div className="relative border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden bg-slate-950">
            <canvas
              ref={canvasRef}
              width={worldRef.current.width * CELL_SIZE}
              height={worldRef.current.height * CELL_SIZE}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              className="cursor-crosshair block max-w-full max-h-[calc(100vh-80px)] object-contain"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Overlays Legend Bar at Top Left of canvas */}
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-slate-900/85 backdrop-blur border border-slate-700/60 text-[11px] font-mono text-slate-300 pointer-events-none flex items-center gap-2">
              <span className="text-teal-400 font-semibold">視圖:</span>
              {viewMode === 'normal' && <span>物質與機械圖層 (Normal)</span>}
              {viewMode === 'thermal' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">熱力圖:</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-2.5 h-2 bg-indigo-800 rounded-xs" title="-20°C 極寒"></span>
                    <span className="w-2.5 h-2 bg-cyan-600 rounded-xs" title="0°C 冰點"></span>
                    <span className="w-2.5 h-2 bg-emerald-500 rounded-xs" title="22°C 舒適"></span>
                    <span className="w-2.5 h-2 bg-yellow-400 rounded-xs" title="50°C 溫暖"></span>
                    <span className="w-2.5 h-2 bg-red-600 rounded-xs" title="100°C 沸騰"></span>
                  </div>
                  <span className="text-[10px] text-slate-400">(-20°C ~ 120°C+)</span>
                </div>
              )}
              {viewMode === 'pressure' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400">氣壓梯度:</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-2.5 h-2 bg-indigo-600 rounded-xs" title="<30 kPa 真空/極低壓"></span>
                    <span className="w-2.5 h-2 bg-sky-500 rounded-xs" title="50 kPa 低壓"></span>
                    <span className="w-2.5 h-2 bg-emerald-500 rounded-xs" title="101.3 kPa 標準大氣壓"></span>
                    <span className="w-2.5 h-2 bg-amber-500 rounded-xs" title="180 kPa 高壓"></span>
                    <span className="w-2.5 h-2 bg-red-500 rounded-xs" title="280 kPa 超壓"></span>
                    <span className="w-2.5 h-2 bg-fuchsia-600 rounded-xs" title=">350 kPa 極限過壓"></span>
                  </div>
                  <span className="text-[10px] text-slate-400">(0 ~ 400+ kPa)</span>
                </div>
              )}
              {viewMode === 'gas' && (
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-medium">大氣氣體成分:</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block shadow-sm"></span>
                      <span className="text-sky-300 font-semibold">O₂ 氧氣</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shadow-sm"></span>
                      <span className="text-purple-300 font-semibold">CO₂ 二氧化碳</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shadow-sm"></span>
                      <span className="text-rose-300 font-semibold">H₂ 氫氣</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-lime-400 inline-block shadow-sm"></span>
                      <span className="text-lime-300 font-semibold">CH₄ 甲烷</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-200 inline-block shadow-sm"></span>
                      <span className="text-slate-300">H₂O 蒸氣</span>
                    </span>
                  </div>
                </div>
              )}
              {viewMode === 'pipe' && <span className="text-cyan-400">水管與泵排藍圖 (Pipe Blueprint)</span>}
              {viewMode === 'automation' && <span className="text-emerald-400">⚡ 自動化導線與邏輯網絡 (Automation Circuit)</span>}
              {viewMode === 'breath' && <span className="text-blue-400">可呼吸度與氣壓 (Breathability)</span>}
            </div>

            {/* Live Hover Cell Inspector Tooltip or Hidden Quick Toggle */}
            {showInspector ? (
              <InspectorPanel
                cell={hoverCell}
                pipeCell={hoverPipeCell}
                autoCell={hoverAutoCell}
                dupeNear={hoverDupe}
                coord={hoverCoord}
                onOpenConfig={() => hoverCoord && setConfigCoord(hoverCoord)}
                onHide={handleToggleInspector}
                isCollapsed={isInspectorCollapsed}
                onToggleCollapse={() => setIsInspectorCollapsed((c) => !c)}
              />
            ) : (
              <button
                onClick={handleToggleInspector}
                className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-700/80 hover:border-teal-500/60 text-xs font-mono shadow-xl backdrop-blur flex items-center gap-1.5 transition-all z-20 cursor-pointer pointer-events-auto select-none"
                title="點擊展開狀態數值方框 (快速鍵: I)"
              >
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <span>顯示狀態方框</span>
                {hoverCell && (
                  <span className="text-[10px] text-teal-300/80 bg-slate-800 px-1 py-0.5 rounded border border-slate-700 hidden sm:inline">
                    {MATERIALS[hoverCell.mat]?.name}
                  </span>
                )}
                <kbd className="text-[10px] bg-slate-800 border border-slate-700 px-1 py-0.2 rounded text-slate-400 font-sans">
                  I
                </kbd>
              </button>
            )}

            {/* Device Config Popover */}
            {configCoord && (
              <DeviceConfigPopover
                coord={configCoord}
                cell={worldRef.current.grid[configCoord.y]?.[configCoord.x] || null}
                pipeCell={worldRef.current.pipeGrid[configCoord.y]?.[configCoord.x] || null}
                autoCell={worldRef.current.automationGrid[configCoord.y]?.[configCoord.x] || null}
                onClose={() => setConfigCoord(null)}
                onUpdateSensor={handleUpdateSensor}
                onUpdateFilter={handleUpdateFilter}
                onUpdateGate={handleUpdateGate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Science Handbook Dialog */}
      <ScienceHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />
    </div>
  );
}
