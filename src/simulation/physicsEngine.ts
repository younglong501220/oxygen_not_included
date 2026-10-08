import {
  MATERIALS,
  MaterialKey,
  CellData,
  PipeCellData,
  AutomationCellData,
  Duplicant,
  PipePacket,
  BuildingType
} from '../types/simulation';

export const GRID_WIDTH = 76;
export const GRID_HEIGHT = 48;
export const CELL_SIZE = 13; // default render size, zoomable

export interface SimulationWorld {
  width: number;
  height: number;
  grid: CellData[][];
  nextGrid: CellData[][];
  pipeGrid: PipeCellData[][];
  automationGrid: AutomationCellData[][];
  duplicants: Duplicant[];
  tickCount: number;
}

export function calcCellPressureAndVolume(
  matKey: MaterialKey,
  mass: number,
  temp: number
): { pressure: number; volume: number; density: number } {
  const def = MATERIALS[matKey];
  if (!def || def.state === 'vacuum' || mass <= 0.0001) {
    return { pressure: 0.0, volume: 0.0, density: 0.0 };
  }

  if (def.state === 'solid') {
    const volume = Math.min(1.0, Math.max(0.1, mass / Math.max(def.density, 100)));
    const pressure = 101.3 * Math.min(mass / 1000, 3.0);
    return { pressure, volume, density: def.density };
  }

  if (def.state === 'liquid') {
    // Liquid volume fraction (occupies up to 1.0 m³)
    const volume = Math.min(1.0, Math.max(0.05, mass / Math.max(def.density, 500)));
    // Base hydrostatic pressure
    const pressure = 101.3 + (mass / 1000) * 15.0;
    return { pressure, volume, density: def.density };
  }

  // Gas state: Accurate local gas density and Ideal Gas Law
  // Dynamic local density (kg/m³): rho = mass / volume (standard cell volume = 1.0 m³)
  const volume = 1.0;
  const density = Math.max(0.0001, mass / volume);
  const tempK = Math.max(temp + 273.15, 1.0);
  // Standard density rho_0 at standard temperature (20°C / 293.15 K) and standard atmospheric pressure (101.325 kPa)
  const stdDensity = Math.max(def.density, 0.05);
  // P = (rho / rho_0) * (T_K / 293.15 K) * 101.325 kPa
  const pressure = Math.max(0.0, (density / stdDensity) * (tempK / 293.15) * 101.325);
  return { pressure, volume, density };
}

export function makeCell(mat: MaterialKey, mass: number, temp: number): CellData {
  const pv = calcCellPressureAndVolume(mat, mass, temp);
  return { mat, mass, temp, pressure: pv.pressure, volume: pv.volume, density: pv.density, tempDelta: 0 };
}

export function createEmptyWorld(): SimulationWorld {
  const width = GRID_WIDTH;
  const height = GRID_HEIGHT;
  const grid: CellData[][] = [];
  const nextGrid: CellData[][] = [];
  const pipeGrid: PipeCellData[][] = [];
  const automationGrid: AutomationCellData[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    nextGrid[y] = [];
    pipeGrid[y] = [];
    automationGrid[y] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      const mat: MaterialKey = isBorder ? 'tile' : 'oxygen';
      const mass = isBorder ? 2000 : 1.2;
      const temp = 22.0;

      grid[y][x] = makeCell(mat, mass, temp);
      nextGrid[y][x] = makeCell(mat, mass, temp);
      pipeGrid[y][x] = {
        hasPipe: false,
        building: 'none',
        powered: true,
        content: null
      };
      automationGrid[y][x] = {
        hasWire: false,
        sensor: 'none',
        comparison: 'below',
        threshold: 20,
        signal: false,
        gate: 'none',
        gateDir: 'left_to_right',
        bufferDelayTicks: 30,
        bufferTimer: 0
      };
    }
  }

  return {
    width,
    height,
    grid,
    nextGrid,
    pipeGrid,
    automationGrid,
    duplicants: [],
    tickCount: 0
  };
}

export function loadDefaultHabitat(world: SimulationWorld) {
  const { width, height, grid, nextGrid, pipeGrid } = world;

  // Clear inner space to oxygen
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 1.4, temp: 22.0 };
      nextGrid[y][x] = { mat: 'oxygen', mass: 1.4, temp: 22.0 };
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
    }
  }

  // 1. Natural dirt floors & rooms
  // Middle floor (Colony Base Floor)
  for (let x = 6; x < 50; x++) {
    grid[28][x] = { mat: 'tile', mass: 1500, temp: 22 };
  }
  // Upper floor
  for (let x = 10; x < 40; x++) {
    grid[16][x] = { mat: 'tile', mass: 1500, temp: 22 };
  }
  // Lower divider floor
  for (let x = 6; x < 32; x++) {
    grid[38][x] = { mat: 'tile', mass: 1500, temp: 21 };
  }

  // 2. Water Reservoir (蓄水池) on bottom left
  for (let y = 30; y < 45; y++) {
    grid[y][5] = { mat: 'tile', mass: 2000, temp: 20 };
    grid[y][25] = { mat: 'tile', mass: 2000, temp: 20 };
  }
  for (let x = 5; x <= 25; x++) {
    grid[45][x] = { mat: 'tile', mass: 2000, temp: 20 };
  }
  // Fill water
  for (let y = 34; y < 45; y++) {
    for (let x = 6; x < 25; x++) {
      grid[y][x] = { mat: 'water', mass: 980, temp: 19.5 };
    }
  }

  // 3. CO2 Pit (底部沉降坑) on bottom right
  for (let y = 32; y < 47; y++) {
    grid[y][48] = { mat: 'tile', mass: 2000, temp: 22 };
    grid[y][70] = { mat: 'tile', mass: 2000, temp: 22 };
  }
  for (let x = 48; x <= 70; x++) {
    grid[46][x] = { mat: 'tile', mass: 2000, temp: 22 };
  }
  // Fill bottom pit with dense CO2
  for (let y = 38; y < 46; y++) {
    for (let x = 49; x < 70; x++) {
      grid[y][x] = { mat: 'co2', mass: 3.2, temp: 23.5 };
    }
  }

  // 4. Glacial Ice Biome (右上角冰原) with insulated wall
  for (let y = 3; y < 22; y++) {
    grid[y][52] = { mat: 'insulated_tile', mass: 2000, temp: -5.0 };
  }
  for (let x = 52; x < 74; x++) {
    grid[22][x] = { mat: 'insulated_tile', mass: 2000, temp: -5.0 };
  }
  for (let y = 4; y < 22; y++) {
    for (let x = 53; x < 74; x++) {
      if (Math.random() < 0.6) {
        grid[y][x] = { mat: 'ice', mass: 900, temp: -18.0 };
      } else {
        grid[y][x] = { mat: 'oxygen', mass: 0.8, temp: -15.0 };
      }
    }
  }

  // 5. Water pump and plumbing to a vent on the upper floor
  // Pump in water reservoir at (12, 40)
  pipeGrid[40][12] = { hasPipe: true, building: 'pump', powered: true, content: null };
  // Pipe path going up and right
  for (let py = 40; py >= 24; py--) {
    pipeGrid[py][12].hasPipe = true;
  }
  for (let px = 12; px <= 36; px++) {
    pipeGrid[24][px].hasPipe = true;
  }
  for (let py = 24; py >= 14; py--) {
    pipeGrid[py][36].hasPipe = true;
  }
  // Vent on upper floor at (36, 14)
  pipeGrid[14][36] = { hasPipe: true, building: 'vent', powered: true, content: null };

  // Space Heater in right lower pit
  pipeGrid[44][58] = { hasPipe: false, building: 'heater', powered: true, content: null };

  // Duplicants
  world.duplicants = [
    {
      id: 'dupe-1',
      name: '米普 (Meep)',
      x: 18,
      y: 27,
      vx: 0.4,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'right',
      state: 'walking',
      color: '#4fd1c5'
    },
    {
      id: 'dupe-2',
      name: '泡泡 (Bubbles)',
      x: 28,
      y: 15,
      vx: -0.3,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'left',
      state: 'idle',
      color: '#f6ad55'
    }
  ];
}

// Preset: Geothermal Steam Chamber & Turbine Loop
export function loadSteamChamberPreset(world: SimulationWorld) {
  const { width, height, grid, pipeGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 1.2, temp: 25.0 };
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
    }
  }

  // Insulated Chamber in center
  for (let y = 14; y <= 40; y++) {
    grid[y][18] = { mat: 'insulated_tile', mass: 2500, temp: 30 };
    grid[y][56] = { mat: 'insulated_tile', mass: 2500, temp: 30 };
  }
  for (let x = 18; x <= 56; x++) {
    grid[14][x] = { mat: 'insulated_tile', mass: 2500, temp: 30 };
    grid[40][x] = { mat: 'insulated_tile', mass: 2500, temp: 30 };
  }

  // Inside chamber bottom: Superheated magma/metal tiles and boiling hot water
  for (let x = 19; x < 56; x++) {
    grid[39][x] = { mat: 'metal_tile', mass: 3000, temp: 180 };
  }
  for (let y = 35; y < 39; y++) {
    for (let x = 19; x < 56; x++) {
      grid[y][x] = { mat: 'water', mass: 700, temp: 98.5 };
    }
  }
  // High temp steam above
  for (let y = 15; y < 35; y++) {
    for (let x = 19; x < 56; x++) {
      grid[y][x] = { mat: 'steam', mass: 2.2, temp: 135.0 };
    }
  }

  // Heaters on bottom floor
  pipeGrid[38][25] = { hasPipe: false, building: 'heater', powered: true, content: null };
  pipeGrid[38][48] = { hasPipe: false, building: 'heater', powered: true, content: null };

  // Condenser cold pipes looping along top of chamber
  for (let x = 20; x <= 54; x++) {
    pipeGrid[16][x] = { hasPipe: true, building: 'none', powered: true, content: null };
    pipeGrid[17][x] = { hasPipe: true, building: 'none', powered: true, content: null };
  }
  pipeGrid[16][54] = { hasPipe: true, building: 'cooler', powered: true, content: null };

  world.duplicants = [];
}

// Preset: Gas Density Stratification Column & High-Pressure Expansion Chambers
export function loadGasStratificationPreset(world: SimulationWorld) {
  const { width, height, grid, pipeGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = makeCell('vacuum', 0, 20.0);
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
    }
  }

  // Central column: Atmospheric sorting chamber (x: 22 to 53, y: 6 to 44)
  for (let y = 6; y <= 44; y++) {
    grid[y][22] = makeCell('tile', 2000, 20);
    grid[y][53] = makeCell('tile', 2000, 20);
  }
  for (let x = 22; x <= 53; x++) {
    grid[6][x] = makeCell('tile', 2000, 20);
    grid[44][x] = makeCell('tile', 2000, 20);
  }

  // Distribute all 4 primary gas elements: Hydrogen, Methane, Oxygen, CO2
  for (let y = 7; y < 44; y++) {
    for (let x = 23; x < 53; x++) {
      const rand = Math.random();
      if (rand < 0.25) {
        grid[y][x] = makeCell('hydrogen', 0.2, 22); // Ultra light
      } else if (rand < 0.50) {
        grid[y][x] = makeCell('methane', 0.85, 26); // Light greenhouse gas
      } else if (rand < 0.75) {
        grid[y][x] = makeCell('oxygen', 1.45, 20); // Breathable medium
      } else {
        grid[y][x] = makeCell('co2', 2.8, 22); // Heavy dense gas
      }
    }
  }

  // Left Chamber: High-Pressure Hydrogen & Methane Pocket Tank (x: 3 to 18, y: 14 to 34)
  // Demonstrates explosive expansion into vacuum when breached or unsealed!
  for (let y = 14; y <= 34; y++) {
    grid[y][3] = makeCell('insulated_tile', 2500, 20);
    grid[y][18] = makeCell('insulated_tile', 2500, 20);
  }
  for (let x = 3; x <= 18; x++) {
    grid[14][x] = makeCell('insulated_tile', 2500, 20);
    grid[34][x] = makeCell('insulated_tile', 2500, 20);
  }
  for (let y = 15; y < 34; y++) {
    for (let x = 4; x < 18; x++) {
      grid[y][x] = makeCell('hydrogen', 1.6, 28); // Compressed high-pressure Hydrogen (~1800 kPa)
    }
  }

  // Right Chamber: High-Pressure CO2 Tank (x: 57 to 72, y: 14 to 34)
  for (let y = 14; y <= 34; y++) {
    grid[y][57] = makeCell('insulated_tile', 2500, 20);
    grid[y][72] = makeCell('insulated_tile', 2500, 20);
  }
  for (let x = 57; x <= 72; x++) {
    grid[14][x] = makeCell('insulated_tile', 2500, 20);
    grid[34][x] = makeCell('insulated_tile', 2500, 20);
  }
  for (let y = 15; y < 34; y++) {
    for (let x = 58; x < 72; x++) {
      grid[y][x] = makeCell('co2', 5.5, 22); // Compressed heavy gas (~280 kPa)
    }
  }

  world.duplicants = [];
}

// Preset: Gas Filter & Automation System (CO2 filter loop + thermal sensor heater + pressure sensor gas pump)
export function loadGasFilterAutomationPreset(world: SimulationWorld) {
  const { width, height, grid, nextGrid, pipeGrid, automationGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 1.2, temp: 17.0 };
      nextGrid[y][x] = { mat: 'oxygen', mass: 1.2, temp: 17.0 };
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
      automationGrid[y][x] = {
        hasWire: false,
        sensor: 'none',
        comparison: 'below',
        threshold: 18,
        signal: false,
        gate: 'none'
      };
    }
  }

  // 1. Upper Living Room (Colony Habitation)
  for (let x = 10; x <= 45; x++) {
    grid[12][x] = { mat: 'insulated_tile', mass: 2000, temp: 17 };
    grid[24][x] = { mat: 'insulated_tile', mass: 2000, temp: 17 };
  }
  for (let y = 12; y <= 24; y++) {
    grid[y][10] = { mat: 'insulated_tile', mass: 2000, temp: 17 };
    grid[y][45] = { mat: 'insulated_tile', mass: 2000, temp: 17 };
  }

  // Living Room Content: Oxygen at 16°C
  for (let y = 13; y < 24; y++) {
    for (let x = 11; x < 45; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 1.5, temp: 16.0 };
    }
  }

  // Space Heater at (38, 22)
  pipeGrid[22][38] = { hasPipe: false, building: 'heater', powered: false, content: null };

  // Thermal Sensor at (22, 22): Configured to activate when temp > 21°C (Overheat alarm)
  automationGrid[22][22] = {
    hasWire: true,
    sensor: 'thermal_sensor',
    comparison: 'above',
    threshold: 21.0,
    signal: false,
    gate: 'none'
  };
  // Wire from sensor to NOT gate input
  automationGrid[22][23].hasWire = true;

  // NOT Gate at (24, 22): Inverts "High Temp" into "Low Temp = Heat Needed"
  automationGrid[22][24] = {
    hasWire: false,
    sensor: 'none',
    comparison: 'below',
    threshold: 0,
    signal: true,
    gate: 'not_gate',
    gateDir: 'left_to_right'
  };

  // Wire from NOT Gate output (25, 22) to Space Heater (38, 22)
  for (let wx = 25; wx <= 38; wx++) {
    automationGrid[22][wx].hasWire = true;
  }

  // 2. Lower Gas Mixing Pit & Filtration Area
  for (let x = 10; x <= 65; x++) {
    grid[35][x] = { mat: 'tile', mass: 2000, temp: 22 };
    grid[45][x] = { mat: 'tile', mass: 2000, temp: 22 };
  }
  for (let y = 35; y <= 45; y++) {
    grid[y][10] = { mat: 'tile', mass: 2000, temp: 22 };
    grid[y][65] = { mat: 'tile', mass: 2000, temp: 22 };
  }

  // Internal divider separating Carbon Storage (right) from Mixed Gas Area (left)
  for (let y = 35; y <= 45; y++) {
    grid[y][48] = { mat: 'tile', mass: 2000, temp: 22 };
  }

  // Mixed Gas Area (left pit): Bottom has heavy CO2, top has Oxygen
  for (let y = 41; y < 45; y++) {
    for (let x = 11; x < 48; x++) {
      grid[y][x] = { mat: 'co2', mass: 2.8, temp: 23.0 };
    }
  }
  for (let y = 36; y < 41; y++) {
    for (let x = 11; x < 48; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 1.2, temp: 21.0 };
    }
  }

  // Gas Pump at (22, 42) in the mixed gas pit
  pipeGrid[42][22] = { hasPipe: true, building: 'gas_pump', powered: false, content: null };

  // Pressure Sensor at (13, 42): Only trigger when Gas Mass > 1.0 kg
  automationGrid[42][13] = {
    hasWire: true,
    sensor: 'pressure_sensor',
    comparison: 'above',
    threshold: 1.0,
    signal: true,
    gate: 'none'
  };
  // Wire to Buffer Gate input
  automationGrid[42][14].hasWire = true;

  // Buffer Gate at (15, 42): Delays/extends pulse for 40 ticks so pump pulls cleanly
  automationGrid[42][15] = {
    hasWire: false,
    sensor: 'none',
    comparison: 'above',
    threshold: 0,
    signal: true,
    gate: 'buffer_gate',
    gateDir: 'left_to_right',
    bufferDelayTicks: 40,
    bufferTimer: 40
  };

  // Wire from Buffer Gate output (16, 42) to Gas Pump (22, 42)
  for (let wx = 16; wx <= 22; wx++) {
    automationGrid[42][wx].hasWire = true;
  }

  // Gas Pipe from Gas Pump up to Gas Filter at (30, 28)
  for (let py = 42; py >= 28; py--) {
    pipeGrid[py][22].hasPipe = true;
  }
  for (let px = 22; px <= 30; px++) {
    pipeGrid[28][px].hasPipe = true;
  }

  // Pressure Gauge on the pipe segment feeding into the gas filter at (26, 28)
  pipeGrid[28][26] = {
    hasPipe: true,
    building: 'pressure_gauge',
    powered: true,
    content: null,
    measuredPressure: 101.3
  };

  // Gas Filter at (30, 28) - configured to separate CO2!
  pipeGrid[28][30] = {
    hasPipe: true,
    building: 'gas_filter',
    powered: true,
    content: null,
    filterTarget: 'co2'
  };

  // Branch 1 (Filtered Output for CO2): goes DOWN into Carbon Storage on right
  for (let py = 29; py <= 39; py++) {
    pipeGrid[py][30].hasPipe = true;
  }
  for (let px = 30; px <= 56; px++) {
    pipeGrid[39][px].hasPipe = true;
  }
  // Gas Vent for filtered CO2 at (56, 39)
  pipeGrid[39][56] = { hasPipe: true, building: 'gas_vent', powered: true, content: null };

  // Branch 2 (Pass-through for pure Oxygen): goes UP into Duplicant Living Room
  for (let px = 31; px <= 35; px++) {
    pipeGrid[28][px].hasPipe = true;
  }
  for (let py = 28; py >= 16; py--) {
    pipeGrid[py][35].hasPipe = true;
  }
  // Gas Vent for clean Oxygen at (35, 16) inside the living room!
  pipeGrid[16][35] = { hasPipe: true, building: 'gas_vent', powered: true, content: null };

  // Duplicant in living room
  world.duplicants = [
    {
      id: 'dupe-1',
      name: '米普 (Meep)',
      x: 18,
      y: 23,
      vx: 0.25,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'right',
      state: 'walking',
      color: '#4fd1c5'
    }
  ];
}

// Preset: SPOM (Self-Powered Oxygen Machine / Electrolyzer Loop)
export function loadElectrolyzerSPOMPreset(world: SimulationWorld) {
  const { width, height, grid, pipeGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = { mat: 'oxygen', mass: 0.8, temp: 22.0 };
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
    }
  }

  // Enclosed SPOM box
  for (let y = 12; y <= 38; y++) {
    grid[y][22] = { mat: 'insulated_tile', mass: 2000, temp: 24 };
    grid[y][54] = { mat: 'insulated_tile', mass: 2000, temp: 24 };
  }
  for (let x = 22; x <= 54; x++) {
    grid[12][x] = { mat: 'insulated_tile', mass: 2000, temp: 24 };
    grid[38][x] = { mat: 'insulated_tile', mass: 2000, temp: 24 };
  }

  // Small internal divider that forms hydrogen apex pocket at top left
  for (let y = 12; y <= 22; y++) {
    grid[y][34] = { mat: 'tile', mass: 1500, temp: 24 };
  }

  // Electrolyzer placed at (38, 32)
  pipeGrid[32][38] = { hasPipe: true, building: 'electrolyzer', powered: true, content: null };

  // Water supply tank on left
  for (let y = 26; y < 38; y++) {
    for (let x = 8; x < 20; x++) {
      grid[y][x] = { mat: 'water', mass: 950, temp: 20 };
    }
  }
  for (let y = 25; y <= 38; y++) {
    grid[y][7] = { mat: 'tile', mass: 2000, temp: 20 };
    grid[y][20] = { mat: 'tile', mass: 2000, temp: 20 };
  }
  for (let x = 7; x <= 20; x++) {
    grid[38][x] = { mat: 'tile', mass: 2000, temp: 20 };
  }

  // Pump inside water tank connecting to electrolyzer
  pipeGrid[34][12] = { hasPipe: true, building: 'pump', powered: true, content: null };
  for (let px = 12; px <= 38; px++) {
    pipeGrid[34][px].hasPipe = true;
  }
  pipeGrid[33][38].hasPipe = true;
  pipeGrid[32][38].hasPipe = true;

  world.duplicants = [
    {
      id: 'dupe-1',
      name: '米普 (Meep)',
      x: 60,
      y: 37,
      vx: 0,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'left',
      state: 'idle',
      color: '#4fd1c5'
    }
  ];
  for (let x = 55; x < 74; x++) {
    grid[38][x] = makeCell('tile', 2000, 22);
  }
}

// Preset: Greenhouse Gas (Methane) & Air Recirculation / Purification Loop
export function loadGreenhouseAndAirCirculationPreset(world: SimulationWorld) {
  const { width, height, grid, nextGrid, pipeGrid, automationGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = makeCell('oxygen', 1.3, 22.0);
      nextGrid[y][x] = makeCell('oxygen', 1.3, 22.0);
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
      automationGrid[y][x] = {
        hasWire: false,
        sensor: 'none',
        comparison: 'above',
        threshold: 28,
        signal: false,
        gate: 'none',
        gateDir: 'left_to_right',
        bufferDelayTicks: 45,
        bufferTimer: 0
      };
    }
  }

  // 1. External Insulated Biosphere Dome
  for (let x = 8; x <= 67; x++) {
    grid[6][x] = makeCell('insulated_tile', 2000, 22);
    grid[45][x] = makeCell('tile', 2000, 22);
  }
  for (let y = 6; y <= 45; y++) {
    grid[y][8] = makeCell('insulated_tile', 2000, 22);
    grid[y][67] = makeCell('insulated_tile', 2000, 22);
  }

  // Middle mezzanine floor dividing Greenhouse Dome (upper) and Colony Base (lower)
  for (let x = 9; x <= 66; x++) {
    if (x < 24 || (x > 32 && x < 44) || x > 52) {
      grid[24][x] = makeCell('tile', 1800, 24);
    }
  }

  // 2. Upper Greenhouse Chamber (Methane Accumulation & Heat Trap)
  for (let y = 7; y < 24; y++) {
    for (let x = 9; x < 67; x++) {
      if (y < 14) {
        // High concentration warm Methane gas at the ceiling
        grid[y][x] = makeCell('methane', 1.9, 36.5);
      } else {
        // Warm Oxygen / mixed gas
        grid[y][x] = makeCell('oxygen', 1.2, 29.0);
      }
    }
  }

  // 3. Air Circulation Fan (空氣對流風扇) placed at (28, 20)
  // Forces trapped hot air downwards through the ventilation gap
  pipeGrid[20][28] = {
    hasPipe: false,
    building: 'air_circulator',
    powered: true,
    content: null
  };

  // 4. Air Scrubber (空氣淨化機) placed at (48, 20)
  // Scrubs greenhouse methane and CO2, releasing clean fresh oxygen!
  pipeGrid[20][48] = {
    hasPipe: false,
    building: 'air_scrubber',
    powered: false,
    content: null
  };

  // 5. Automation Circuit:
  // Thermal Sensor at (18, 12) inside hot methane pocket: triggers if Temp > 28°C
  automationGrid[12][18] = {
    hasWire: true,
    sensor: 'thermal_sensor',
    comparison: 'above',
    threshold: 28.0,
    signal: true,
    gate: 'none'
  };

  // Pressure Sensor at (58, 12) inside methane zone: triggers if Pressure > 115 kPa
  automationGrid[12][58] = {
    hasWire: true,
    sensor: 'pressure_sensor',
    comparison: 'above',
    threshold: 115.0,
    signal: true,
    gate: 'none'
  };

  // Buffer Gate at (20, 14): keeps fan and scrubber active for 45 ticks when triggered
  automationGrid[14][20] = {
    hasWire: false,
    sensor: 'none',
    comparison: 'above',
    threshold: 0,
    signal: true,
    gate: 'buffer_gate',
    gateDir: 'left_to_right',
    bufferDelayTicks: 45,
    bufferTimer: 45
  };
  automationGrid[13][18].hasWire = true;
  automationGrid[14][18].hasWire = true;
  automationGrid[14][19].hasWire = true;

  // Wire from Buffer Gate output down to Air Circulator (28, 20)
  for (let wx = 21; wx <= 28; wx++) {
    automationGrid[14][wx].hasWire = true;
  }
  for (let wy = 15; wy <= 20; wy++) {
    automationGrid[wy][28].hasWire = true;
  }

  // Wire over to Air Scrubber at (48, 20)
  for (let wx = 28; wx <= 48; wx++) {
    automationGrid[20][wx].hasWire = true;
  }

  // 6. Lower Living Quarters:
  // Duplicants breathing and walking
  world.duplicants = [
    {
      id: 'dupe-1',
      name: '米普 (Meep)',
      x: 16,
      y: 43,
      vx: 0.25,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'right',
      state: 'walking',
      color: '#4fd1c5'
    },
    {
      id: 'dupe-2',
      name: '泡泡 (Bubbles)',
      x: 36,
      y: 43,
      vx: -0.22,
      vy: 0,
      breath: 100,
      health: 100,
      facing: 'left',
      state: 'walking',
      color: '#f6ad55'
    }
  ];

  // Polluted Water Sump at bottom right (54 to 65, 41 to 44) off-gassing methane
  for (let y = 41; y < 45; y++) {
    for (let x = 54; x < 66; x++) {
      grid[y][x] = makeCell('polluted_water', 980, 21.0);
    }
  }
  for (let y = 40; y < 45; y++) {
    grid[y][53] = makeCell('tile', 2000, 21);
  }
}

// Preset: Cryo-Cooler, Liquified Gases & Thermal Leak Diagnostics
export function loadCryoCoolerPreset(world: SimulationWorld) {
  const { width, height, grid, nextGrid, pipeGrid, automationGrid } = world;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      grid[y][x] = makeCell('vacuum', 0, 20.0);
      nextGrid[y][x] = makeCell('vacuum', 0, 20.0);
      pipeGrid[y][x] = { hasPipe: false, building: 'none', powered: true, content: null };
      automationGrid[y][x] = {
        hasWire: false,
        sensor: 'none',
        comparison: 'below',
        threshold: -180,
        signal: false,
        gate: 'none'
      };
    }
  }

  // 1. Double-walled insulated Cryogenic Liquification Chamber (x: 10 to 44, y: 10 to 42)
  for (let y = 10; y <= 42; y++) {
    grid[y][10] = makeCell('insulated_tile', 2500, -140);
    grid[y][44] = makeCell('insulated_tile', 2500, -140);
  }
  for (let x = 10; x <= 44; x++) {
    grid[10][x] = makeCell('insulated_tile', 2500, -140);
    grid[42][x] = makeCell('insulated_tile', 2500, -140);
  }

  // Fill Cryo-Chamber with Cold Oxygen gas (-150°C)
  for (let y = 11; y < 42; y++) {
    for (let x = 11; x < 44; x++) {
      grid[y][x] = makeCell('oxygen', 1.8, -150);
    }
  }

  // Lower basin with existing Liquid Oxygen (LOX, -195°C) pooling on floor
  for (let y = 37; y < 42; y++) {
    for (let x = 14; x < 41; x++) {
      grid[y][x] = makeCell('liquid_oxygen', 950, -195);
    }
  }

  // Cryo-Cooler building in center of chamber (x: 27, y: 24)
  pipeGrid[24][27] = {
    hasPipe: true,
    building: 'cryo_cooler',
    powered: true,
    content: { mat: 'oxygen', mass: 1.0, temp: -175 }
  };

  // Connected gas supply pipe looping into the Cryo-Cooler
  for (let x = 14; x <= 27; x++) {
    pipeGrid[24][x].hasPipe = true;
    pipeGrid[24][x].content = { mat: 'oxygen', mass: 1.0, temp: -120 };
  }
  for (let y = 24; y <= 35; y++) {
    pipeGrid[y][34].hasPipe = true;
  }
  pipeGrid[24][34].hasPipe = true;
  pipeGrid[35][34].building = 'gas_vent'; // vents supercooled liquid gas into basin!

  // Thermal sensor monitoring cryo basin
  automationGrid[36][27] = {
    hasWire: true,
    sensor: 'thermal_sensor',
    comparison: 'below',
    threshold: -183,
    signal: true,
    gate: 'none'
  };

  // 2. Thermal Leak Diagnostics Section (x: 48 to 72, y: 15 to 38)
  // Warm room with space heater (65°C) separated by insulated wall EXCEPT for an uninsulated tile bridge!
  for (let y = 15; y <= 38; y++) {
    // Insulated wall between cold chamber and warm room
    // Intentional thermal leak at (44, 22) and (44, 23): Regular Tile that conducts heat!
    if (y === 22 || y === 23) {
      grid[y][44] = makeCell('tile', 2000, 10); // Heat leak!
    }
    grid[y][70] = makeCell('tile', 2000, 45);
  }
  for (let x = 44; x <= 70; x++) {
    grid[15][x] = makeCell('tile', 2000, 45);
    grid[38][x] = makeCell('tile', 2000, 45);
  }
  // Warm room interior: warm oxygen and space heater
  for (let y = 16; y < 38; y++) {
    for (let x = 45; x < 70; x++) {
      grid[y][x] = makeCell('oxygen', 1.4, 60);
    }
  }
  pipeGrid[34][58] = { hasPipe: false, building: 'heater', powered: true, content: null };

  world.duplicants = [];
}

// Deep copy for double buffering
function syncBuffers(world: SimulationWorld) {
  const { width, height, grid, nextGrid } = world;
  for (let y = 0; y < height; y++) {
    const row = grid[y];
    const nRow = nextGrid[y];
    for (let x = 0; x < width; x++) {
      nRow[x].mat = row[x].mat;
      nRow[x].mass = row[x].mass;
      nRow[x].temp = row[x].temp;
      nRow[x].pressure = row[x].pressure;
      nRow[x].volume = row[x].volume;
      nRow[x].density = row[x].density;
      nRow[x].tempDelta = row[x].tempDelta;
    }
  }
}

function swapBuffers(world: SimulationWorld) {
  const tmp = world.grid;
  world.grid = world.nextGrid;
  world.nextGrid = tmp;
}

function getGatePortCoords(x: number, y: number, dir?: string) {
  if (dir === 'up_to_down') return { inX: x, inY: y - 1, outX: x, outY: y + 1 };
  if (dir === 'right_to_left') return { inX: x + 1, inY: y, outX: x - 1, outY: y };
  if (dir === 'down_to_up') return { inX: x, inY: y + 1, outX: x, outY: y - 1 };
  return { inX: x - 1, inY: y, outX: x + 1, outY: y };
}

// -------------------------------------------------------------
// AUTOMATION SYSTEM STEP (Sensors & Logic Propagation)
// -------------------------------------------------------------
export function stepAutomation(world: SimulationWorld) {
  const { width, height, grid, pipeGrid, automationGrid } = world;

  // 1. Evaluate individual sensors
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const aCell = automationGrid[y][x];
      const env = grid[y][x];

      if (aCell.sensor === 'thermal_sensor') {
        const cond = aCell.comparison === 'above' ? env.temp > aCell.threshold : env.temp < aCell.threshold;
        aCell.signal = cond;
      } else if (aCell.sensor === 'pressure_sensor') {
        // Compare pressure (kPa) if threshold > 10, else compare mass (kg)
        const val = aCell.threshold > 10 ? (env.pressure ?? 101.3) : env.mass;
        const cond = aCell.comparison === 'above' ? val > aCell.threshold : val < aCell.threshold;
        aCell.signal = cond;
      } else if (!aCell.hasWire && aCell.gate === 'none') {
        aCell.signal = false;
      }
    }
  }

  // 2. Propagate signals through passive wire networks (BFS)
  // Gate tiles are NOT passive wires; they separate input and output networks!
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const start = automationGrid[y][x];
      // Only group passive wires and sensors (exclude gate cells from bridging)
      if ((start.hasWire && start.gate === 'none' || start.sensor !== 'none') && !visited[y][x]) {
        const queue: [number, number][] = [[x, y]];
        const component: [number, number][] = [];
        let hasActiveGreenDriver = false;
        visited[y][x] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          component.push([cx, cy]);
          const cCell = automationGrid[cy][cx];

          if (cCell.sensor !== 'none' && cCell.signal === true) {
            hasActiveGreenDriver = true;
          }

          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1 && !visited[ny][nx]) {
              const nCell = automationGrid[ny][nx];
              if ((nCell.hasWire && nCell.gate === 'none') || nCell.sensor !== 'none') {
                visited[ny][nx] = true;
                queue.push([nx, ny]);
              }
            }
          }
        }

        // Apply network signal
        for (const [cx, cy] of component) {
          const cCell = automationGrid[cy][cx];
          if (cCell.hasWire && cCell.gate === 'none') {
            cCell.signal = hasActiveGreenDriver;
          }
        }
      }
    }
  }

  // 3. Evaluate Logic Gates (NOT Gate & Buffer Gate)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const aCell = automationGrid[y][x];
      if (aCell.gate === 'none') continue;

      const { inX, inY } = getGatePortCoords(x, y, aCell.gateDir);
      let inSignal = false;

      if (inX >= 1 && inX < width - 1 && inY >= 1 && inY < height - 1) {
        const inCell = automationGrid[inY][inX];
        if (inCell.hasWire || inCell.sensor !== 'none' || inCell.gate !== 'none') {
          inSignal = inCell.signal;
        }
      }
      aCell.gateInputSignal = inSignal;

      let outSignal = false;
      if (aCell.gate === 'not_gate') {
        // Invert signal
        outSignal = !inSignal;
      } else if (aCell.gate === 'buffer_gate') {
        const delay = aCell.bufferDelayTicks ?? 30;
        if (inSignal === true) {
          aCell.bufferTimer = delay;
          outSignal = true;
        } else {
          if ((aCell.bufferTimer ?? 0) > 0) {
            aCell.bufferTimer = (aCell.bufferTimer ?? 0) - 1;
            outSignal = true;
          } else {
            outSignal = false;
          }
        }
      }

      aCell.signal = outSignal;
    }
  }

  // 4. Propagate Gate Outputs to Downstream Wire Networks
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const aCell = automationGrid[y][x];
      if (aCell.gate === 'none' || !aCell.signal) continue;

      const { outX, outY } = getGatePortCoords(x, y, aCell.gateDir);
      if (outX >= 1 && outX < width - 1 && outY >= 1 && outY < height - 1) {
        const outCell = automationGrid[outY][outX];
        if (outCell.hasWire && outCell.gate === 'none') {
          // BFS propagate active green to downstream wire network
          const dVisited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
          const queue: [number, number][] = [[outX, outY]];
          dVisited[outY][outX] = true;

          while (queue.length > 0) {
            const [cx, cy] = queue.shift()!;
            automationGrid[cy][cx].signal = true;

            const neighbors: [number, number][] = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1 && !dVisited[ny][nx]) {
                const nCell = automationGrid[ny][nx];
                if (nCell.hasWire && nCell.gate === 'none') {
                  dVisited[ny][nx] = true;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }
      }
    }
  }

  // 5. Machine Automation Control: machines connected to wires or sensors take the signal
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = pipeGrid[y][x];
      if (p.building === 'none') continue;

      const selfAuto = automationGrid[y][x];
      let hasLink = selfAuto.hasWire || selfAuto.sensor !== 'none' || selfAuto.gate !== 'none';
      let incomingSignal = selfAuto.signal;

      if (!hasLink) {
        const neighbors: [number, number][] = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1]
        ];
        for (const [nx, ny] of neighbors) {
          const nAuto = automationGrid[ny][nx];
          if (nAuto.hasWire || nAuto.sensor !== 'none' || nAuto.gate !== 'none') {
            hasLink = true;
            if (nAuto.signal) {
              incomingSignal = true;
            }
          }
        }
      }

      if (hasLink) {
        p.powered = incomingSignal;
      } else {
        p.powered = true; // default manual ON if no automation wired
      }
    }
  }
}

// -------------------------------------------------------------
// CORE PHYSICS SIMULATION STEP
// -------------------------------------------------------------
export function stepSimulation(world: SimulationWorld) {
  const { width, height, grid, nextGrid, pipeGrid } = world;
  world.tickCount++;

  // Step Automation Logic first so machine power states are current
  stepAutomation(world);

  syncBuffers(world);

  // -----------------------------------------------------------
  // STEP 1: Fourier Heat Conduction & Machinery Radiators
  // -----------------------------------------------------------
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const cell = grid[y][x];
      if (cell.mat === 'vacuum' || cell.mass <= 0.001) continue;

      const matInfo = MATERIALS[cell.mat];
      const pCell = pipeGrid[y][x];

      // Methane Greenhouse Effect: Traps thermal energy, accumulating local heat
      if (cell.mat === 'methane' && cell.mass > 0.05) {
        nextGrid[y][x].temp += 0.12;
      }

      // Active Machinery Thermal Effects
      if (pCell.building === 'heater' && pCell.powered) {
        // Space Heater warms surroundings up to 280°C
        if (cell.temp < 280) {
          nextGrid[y][x].temp += 2.0;
        }
      } else if (pCell.building === 'cooler' && pCell.powered) {
        // Cooler freezes surroundings down to -60°C
        if (cell.temp > -60) {
          nextGrid[y][x].temp -= 2.0;
        }
      } else if (pCell.building === 'cryo_cooler' && pCell.powered) {
        // Cryo-Cooler freezes core down towards -265°C
        if (cell.temp > -265) {
          nextGrid[y][x].temp -= 6.5;
        }
      } else if (pCell.building === 'electrolyzer' && pCell.powered) {
        // Slight heat from chemical dissociation
        nextGrid[y][x].temp += 0.25;
      }

      // 4-Neighbor Heat Exchange
      const neighbors: [number, number][] = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const [nx, ny] = neighbors[i];
        const nCell = grid[ny][nx];
        if (nCell.mat === 'vacuum' || nCell.mass <= 0.001) continue;

        const nMatInfo = MATERIALS[nCell.mat];

        // Harmonic mean conductivity (crucial for ONI insulated tiles!)
        const kHarmonic = (2 * matInfo.k * nMatInfo.k) / (matInfo.k + nMatInfo.k + 1e-8);
        const tempDiff = nCell.temp - cell.temp;

        if (Math.abs(tempDiff) > 0.01) {
          // Heat flux dQ
          const dQ = kHarmonic * tempDiff * 0.12;

          // Thermal capacity C = shc * mass
          const cSelf = matInfo.shc * Math.max(cell.mass, 0.2);
          const deltaT = dQ / cSelf;

          // Safe clamping to avoid numerical overshoot
          const maxDelta = Math.abs(tempDiff) * 0.25;
          const clampedDeltaT = Math.sign(deltaT) * Math.min(Math.abs(deltaT), maxDelta);

          nextGrid[y][x].temp += clampedDeltaT;
        }
      }

      // Net thermal flux rate (°C/tick) for heat-leak and thermal diagnostics
      nextGrid[y][x].tempDelta = nextGrid[y][x].temp - cell.temp;
    }
  }

  // -----------------------------------------------------------
  // STEP 2: Thermodynamic Phase Transitions
  // -----------------------------------------------------------
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const cell = nextGrid[y][x];
      const mat = cell.mat;
      const temp = cell.temp;

      // Ice melting -> Water (> 0°C)
      if (mat === 'ice' && temp > 0) {
        cell.mat = 'water';
      }
      // Water freezing -> Ice (<= 0°C)
      else if (mat === 'water' && temp <= 0) {
        cell.mat = 'ice';
      }
      // Water boiling -> Steam (>= 100°C)
      else if ((mat === 'water' || mat === 'hot_water') && temp >= 100) {
        cell.mat = 'steam';
      }
      // Polluted Water boiling -> Steam (>= 115°C)
      else if (mat === 'polluted_water' && temp >= 115) {
        cell.mat = 'steam';
      }
      // Steam condensing -> Water (< 99°C)
      else if (mat === 'steam' && temp < 99) {
        cell.mat = 'water';
      }
      // Cryogenic Gas Condensation (Liquification) & Cryo Liquid Boiling
      else if (mat === 'oxygen' && temp <= -183.0) {
        cell.mat = 'liquid_oxygen';
      } else if (mat === 'liquid_oxygen' && temp > -183.0) {
        cell.mat = 'oxygen';
      } else if (mat === 'hydrogen' && temp <= -253.0) {
        cell.mat = 'liquid_hydrogen';
      } else if (mat === 'liquid_hydrogen' && temp > -253.0) {
        cell.mat = 'hydrogen';
      } else if (mat === 'methane' && temp <= -161.6) {
        cell.mat = 'liquid_methane';
      } else if (mat === 'liquid_methane' && temp > -161.6) {
        cell.mat = 'methane';
      } else if (mat === 'co2' && temp <= -56.6) {
        cell.mat = 'liquid_co2';
      } else if (mat === 'liquid_co2' && temp > -56.6) {
        cell.mat = 'co2';
      }

      // Polluted Water off-gassing greenhouse methane (microbiological anaerobic digestion)
      if (cell.mat === 'polluted_water' && cell.mass > 5.0 && y > 1 && Math.random() < 0.003) {
        const above = nextGrid[y - 1][x];
        if (
          above.mat === 'vacuum' ||
          above.mat === 'methane' ||
          (MATERIALS[above.mat].state === 'gas' && above.mass < 2.0)
        ) {
          if (above.mat === 'vacuum') {
            above.mat = 'methane';
            above.mass = 0.06;
            above.temp = cell.temp;
          } else if (above.mat === 'methane') {
            above.mass += 0.06;
          }
          cell.mass = Math.max(0.1, cell.mass - 0.06);
        }
      }
    }
  }

  // -----------------------------------------------------------
  // STEP 3: Fluid & Gas Flow Dynamics (Cellular Automata)
  // -----------------------------------------------------------
  // Scan alternating vertical order for bias prevention
  const rowIndices: number[] = [];
  for (let y = 1; y < height - 1; y++) rowIndices.push(y);
  if (world.tickCount % 2 === 0) {
    rowIndices.reverse();
  }

  for (const y of rowIndices) {
    for (let x = 1; x < width - 1; x++) {
      const cell = nextGrid[y][x];
      const mat = cell.mat;
      if (mat === 'vacuum' || cell.mass <= 0.001) continue;

      const matInfo = MATERIALS[mat];
      if (matInfo.state === 'solid') continue;

      // A. LIQUID DYNAMICS
      if (matInfo.state === 'liquid') {
        const belowY = y + 1;
        const belowCell = nextGrid[belowY][x];
        const belowInfo = MATERIALS[belowCell.mat];

        // 1. Fall directly downward if gas or vacuum or lighter liquid
        if (
          belowInfo.state === 'vacuum' ||
          belowInfo.state === 'gas' ||
          (belowInfo.state === 'liquid' && matInfo.density > belowInfo.density)
        ) {
          // Swap positions
          const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
          cell.mat = belowCell.mat; cell.mass = belowCell.mass; cell.temp = belowCell.temp;
          belowCell.mat = tMat; belowCell.mass = tMass; belowCell.temp = tTemp;
          continue;
        }

        // 2. Diagonal slide if down-left or down-right has gas/vacuum
        const diagSides = Math.random() < 0.5 ? [-1, 1] : [1, -1];
        let movedDiag = false;
        for (const dx of diagSides) {
          const nx = x + dx;
          if (nx <= 0 || nx >= width - 1) continue;
          const diagCell = nextGrid[belowY][nx];
          const diagInfo = MATERIALS[diagCell.mat];

          if (diagInfo.state === 'vacuum' || diagInfo.state === 'gas') {
            const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
            cell.mat = diagCell.mat; cell.mass = diagCell.mass; cell.temp = diagCell.temp;
            diagCell.mat = tMat; diagCell.mass = tMass; diagCell.temp = tTemp;
            movedDiag = true;
            break;
          }
        }
        if (movedDiag) continue;

        // 3. Horizontal leveling & hydrostatic spreading
        const horizSides = Math.random() < 0.5 ? [-1, 1] : [1, -1];
        for (const dx of horizSides) {
          const nx = x + dx;
          if (nx <= 0 || nx >= width - 1) continue;
          const sideCell = nextGrid[y][nx];
          const sideInfo = MATERIALS[sideCell.mat];

          if (sideInfo.state === 'gas' || sideInfo.state === 'vacuum') {
            // Liquid flows sideways into gas/vacuum
            const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
            cell.mat = sideCell.mat; cell.mass = sideCell.mass; cell.temp = sideCell.temp;
            sideCell.mat = tMat; sideCell.mass = tMass; sideCell.temp = tTemp;
            break;
          } else if (sideCell.mat === cell.mat && cell.mass > sideCell.mass + 1.0) {
            // Equalize fluid pressure horizontally
            const flow = (cell.mass - sideCell.mass) * 0.3;
            cell.mass -= flow;
            sideCell.mass += flow;
            // Balance temperature
            const blendedTemp = (cell.temp + sideCell.temp) / 2;
            cell.temp = blendedTemp;
            sideCell.temp = blendedTemp;
            break;
          }
        }
      }

      // B. GAS DYNAMICS (Accurate Density Buoyancy & High-Pressure Driven Diffusion Expansion)
      else if (matInfo.state === 'gas') {
        const selfDensity = cell.density ?? Math.max(0.0001, cell.mass / (cell.volume ?? 1.0));
        const pSelf = cell.pressure ?? 101.3;

        // 1. Buoyancy Stratification based on dynamic local gas densities
        // Lighter gas (lower density kg/m³) rises above denser gas; denser gas sinks
        if (y > 1) {
          const aboveCell = nextGrid[y - 1][x];
          const aboveInfo = MATERIALS[aboveCell.mat];
          if (aboveInfo.state === 'vacuum') {
            // Rapid upward rise into vacuum
            const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
            cell.mat = aboveCell.mat; cell.mass = aboveCell.mass; cell.temp = aboveCell.temp;
            aboveCell.mat = tMat; aboveCell.mass = tMass; aboveCell.temp = tTemp;
            continue;
          } else if (aboveInfo.state === 'gas') {
            const aboveDensity = aboveCell.density ?? Math.max(0.0001, aboveCell.mass / (aboveCell.volume ?? 1.0));
            if (selfDensity < aboveDensity && Math.random() < 0.65) {
              // Lighter gas floats upward
              const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
              cell.mat = aboveCell.mat; cell.mass = aboveCell.mass; cell.temp = aboveCell.temp;
              aboveCell.mat = tMat; aboveCell.mass = tMass; aboveCell.temp = tTemp;
              continue;
            }
          }
        }
        if (y < height - 2) {
          const belowCell = nextGrid[y + 1][x];
          const belowInfo = MATERIALS[belowCell.mat];
          if (belowInfo.state === 'gas') {
            const belowDensity = belowCell.density ?? Math.max(0.0001, belowCell.mass / (belowCell.volume ?? 1.0));
            if (selfDensity > belowDensity && Math.random() < 0.65) {
              // Denser gas sinks downward
              const tMat = cell.mat, tMass = cell.mass, tTemp = cell.temp;
              cell.mat = belowCell.mat; cell.mass = belowCell.mass; cell.temp = belowCell.temp;
              belowCell.mat = tMat; belowCell.mass = tMass; belowCell.temp = tTemp;
              continue;
            }
          }
        }

        // 2. High-Pressure Driven Diffusion & Volumetric Gas Expansion
        // Graham's Law: Effusion and diffusion mobility scales inversely with sqrt of gas density
        // Lighter gases (Hydrogen ~4.0x, Methane ~1.4x) diffuse much faster than heavier gases (CO2 ~0.85x)
        const stdDensity = Math.max(matInfo.density, 0.08);
        const gasMobility = Math.sqrt(1.429 / stdDensity);

        // High-pressure pocket boost factor:
        // Pockets above nominal atmospheric pressure (101.3 kPa) expand with high velocity
        const overpressure = Math.max(0, pSelf - 101.3);
        const pressureVelocityMultiplier = 1.0 + Math.min(6.0, overpressure / 60.0);
        const diffusionSpeed = gasMobility * pressureVelocityMultiplier;

        // Multi-directional gradient diffusion
        const gasNeighbors: [number, number][] = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1]
        ].sort(() => Math.random() - 0.5) as [number, number][];

        for (const [nx, ny] of gasNeighbors) {
          if (nx <= 0 || nx >= width - 1 || ny <= 0 || ny >= height - 1) continue;
          if (cell.mass <= 0.005) break;

          const target = nextGrid[ny][nx];
          const targetInfo = MATERIALS[target.mat];

          if (target.mat === 'vacuum') {
            // Rapid expansion into vacuum, accelerated by high pressure & gas mobility
            const expandRatio = Math.min(0.48, 0.22 * diffusionSpeed);
            const expandMass = cell.mass * expandRatio;
            if (expandMass > 0.005) {
              target.mat = cell.mat;
              target.mass = expandMass;
              target.temp = cell.temp;
              cell.mass -= expandMass;
            }
            // For extreme overpressure pockets, continue expanding into adjacent vacuum/gas neighbors
            if (pSelf < 180) break;
          } else if (targetInfo.state === 'gas') {
            const pTarget = target.pressure ?? 101.3;
            const deltaP = pSelf - pTarget;

            if (target.mat === cell.mat && deltaP > 1.2) {
              // Same gas species: diffuse along pressure gradient
              // Diffusion speed directly influences mass transfer rate
              const transferRatio = Math.min(
                0.40,
                (deltaP / Math.max(pSelf, 15.0)) * 0.32 * diffusionSpeed
              );
              const deltaM = cell.mass * transferRatio;
              if (deltaM > 0.004) {
                cell.mass -= deltaM;
                target.mass += deltaM;
                const tot = target.mass;
                target.temp = (target.temp * (tot - deltaM) + cell.temp * deltaM) / tot;
              }
              if (pSelf < 220) break;
            } else if (target.mat !== cell.mat && deltaP > 15.0) {
              // Cross-species high pressure expansion:
              // Overpressured gas forces its way into adjacent gas, displacing or compressing it
              if (deltaP > 40.0) {
                const pushM = Math.min(cell.mass * 0.25, 0.15 * diffusionSpeed);
                if (pushM > 0.01 && target.mass > 0.02) {
                  // If target has a further open neighbor along expansion direction, displace it
                  const ddx = nx - x;
                  const ddy = ny - y;
                  const farX = nx + ddx;
                  const farY = ny + ddy;
                  if (farX > 0 && farX < width - 1 && farY > 0 && farY < height - 1) {
                    const farCell = nextGrid[farY][farX];
                    if (farCell.mat === 'vacuum') {
                      farCell.mat = target.mat;
                      farCell.mass = target.mass * 0.4;
                      farCell.temp = target.temp;
                      target.mass *= 0.6;
                    } else if (farCell.mat === target.mat) {
                      const shiftM = target.mass * 0.3;
                      target.mass -= shiftM;
                      farCell.mass += shiftM;
                    }
                  }
                  cell.mass -= pushM;
                  target.mass += pushM * 0.6;
                }
              }
              if (pSelf < 250) break;
            }
          }
        }
      }
    }
  }

  // -----------------------------------------------------------
  // STEP 4: Pipe Network Overlay & Machinery Logic
  // -----------------------------------------------------------
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = pipeGrid[y][x];

      // 1. LIQUID PUMP
      if (p.building === 'pump' && p.powered && p.hasPipe && !p.content) {
        // Suck liquid from cell or immediate cell below
        const targets = [
          [x, y],
          [x, y + 1],
          [x - 1, y],
          [x + 1, y]
        ];
        for (const [tx, ty] of targets) {
          const env = nextGrid[ty][tx];
          const envInfo = MATERIALS[env.mat];
          if (envInfo.state === 'liquid' && env.mass > 2.0) {
            const pullMass = Math.min(env.mass, 10.0); // 10 kg standard packet
            p.content = {
              mat: env.mat,
              mass: pullMass,
              temp: env.temp
            };
            env.mass -= pullMass;
            if (env.mass <= 0.01) {
              env.mat = 'vacuum';
              env.mass = 0;
            }
            break;
          }
        }
      }

      // 2. LIQUID VENT
      if (p.building === 'vent' && p.content) {
        const env = nextGrid[y][x];
        const envInfo = MATERIALS[env.mat];

        // Vent discharges if environment is not solid and not over-pressured
        if (envInfo.state !== 'solid' && (env.mat === p.content.mat || envInfo.state === 'gas' || envInfo.state === 'vacuum')) {
          if (env.mat === p.content.mat) {
            const totalMass = env.mass + p.content.mass;
            env.temp = (env.temp * env.mass + p.content.temp * p.content.mass) / totalMass;
            env.mass = totalMass;
          } else {
            // Replaces gas/vacuum with liquid
            env.mat = p.content.mat;
            env.mass = p.content.mass;
            env.temp = p.content.temp;
          }
          p.content = null;
        }
      }

      // 3. ELECTROLYZER (Classic ONI machine)
      // Consumes water, emits 88.8% Oxygen and 11.2% Hydrogen!
      if (p.building === 'electrolyzer' && p.powered) {
        let hasWater = false;
        let waterTemp = 20;

        // Check if pipe packet has water
        if (p.content && (p.content.mat === 'water' || p.content.mat === 'hot_water')) {
          waterTemp = p.content.temp;
          p.content = null;
          hasWater = true;
        } else {
          // Check ambient cell
          const env = nextGrid[y][x];
          if (env.mat === 'water' && env.mass >= 1.0) {
            env.mass -= 1.0;
            waterTemp = env.temp;
            if (env.mass <= 0.01) {
              env.mat = 'oxygen';
              env.mass = 0.5;
            }
            hasWater = true;
          }
        }

        if (hasWater) {
          // Spawn Hydrogen to upper cell (light gas)
          if (y > 1) {
            const topCell = nextGrid[y - 1][x];
            if (topCell.mat === 'vacuum' || topCell.mat === 'hydrogen' || MATERIALS[topCell.mat].state === 'gas') {
              topCell.mat = 'hydrogen';
              topCell.mass = Math.min(topCell.mass + 0.12, 10.0);
              topCell.temp = Math.max(waterTemp, 70); // Electrolyzer emits warm gas
            }
          }
          // Spawn Oxygen to current cell
          const env = nextGrid[y][x];
          if (env.mat === 'vacuum' || env.mat === 'oxygen' || MATERIALS[env.mat].state === 'gas') {
            env.mat = 'oxygen';
            env.mass = Math.min(env.mass + 0.88, 10.0);
            env.temp = Math.max(waterTemp, 70);
          }
        }
      }

      // 4. PIPE AQUATUNER / COOLER
      // If a liquid packet passes through, cools it by -14°C and expels heat to surrounding environment!
      if (p.building === 'cooler' && p.hasPipe && p.content && p.powered) {
        const drop = 14.0;
        p.content.temp -= drop;
        // Dump expelled heat to ambient cell
        const env = nextGrid[y][x];
        if (MATERIALS[env.mat].state !== 'vacuum') {
          env.temp += 4.5;
        }
      }

      // 4.1 CRYO-COOLER (低溫深冷機 / Cryo-Cooler)
      // Extreme cryogenic refrigeration: cools gases down to their liquification point (e.g. O2 -> LOX at -183°C)
      // and powerfully chills the surrounding 3x3 atmosphere down towards absolute zero!
      if (p.building === 'cryo_cooler' && p.powered) {
        // A. Pipe Packet Cryogenic Cooling & Liquification
        if (p.hasPipe && p.content) {
          p.content.temp -= 28.0; // Rapid cooling per tick
          const def = MATERIALS[p.content.mat];
          if (def.condenseTemp !== undefined && def.condenseTarget && p.content.temp <= def.condenseTemp) {
            p.content.mat = def.condenseTarget; // Condenses into liquid gas!
          }
        }

        // B. Environmental Atmospheric Cryogenic Chilling (3x3 area)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx <= 0 || tx >= width - 1 || ty <= 0 || ty >= height - 1) continue;
            const target = nextGrid[ty][tx];
            const tDef = MATERIALS[target.mat];
            if (tDef.state !== 'vacuum' && target.temp > -268) {
              const chill = (dx === 0 && dy === 0) ? 14.0 : 8.5;
              target.temp -= chill;

              // Immediately liquify atmospheric gas if it drops below its liquification point!
              if (tDef.condenseTemp !== undefined && tDef.condenseTarget && target.temp <= tDef.condenseTemp) {
                target.mat = tDef.condenseTarget;
              }
            }
          }
        }

        // C. Cryo Heat Exhaust (refrigeration waste heat released above building)
        if (y > 1) {
          const exhaust = nextGrid[y - 1][x];
          if (MATERIALS[exhaust.mat].state !== 'vacuum') {
            exhaust.temp += 3.5;
          }
        }
      }

      // 5. GAS PUMP (氣體抽氣泵)
      if (p.building === 'gas_pump' && p.powered && p.hasPipe && !p.content) {
        const targets = [
          [x, y],
          [x, y - 1],
          [x - 1, y],
          [x + 1, y],
          [x, y + 1]
        ];
        for (const [tx, ty] of targets) {
          if (tx <= 0 || tx >= width - 1 || ty <= 0 || ty >= height - 1) continue;
          const env = nextGrid[ty][tx];
          const envInfo = MATERIALS[env.mat];
          if (envInfo.state === 'gas' && env.mass > 0.05) {
            const pullMass = Math.min(env.mass, 1.0); // 1.0 kg gas packet
            p.content = {
              mat: env.mat,
              mass: pullMass,
              temp: env.temp
            };
            env.mass -= pullMass;
            if (env.mass <= 0.01) {
              env.mat = 'vacuum';
              env.mass = 0;
            }
            break;
          }
        }
      }

      // 6. GAS VENT (氣體/液態氣體排氣口)
      if (
        p.building === 'gas_vent' &&
        p.content &&
        (MATERIALS[p.content.mat].state === 'gas' || MATERIALS[p.content.mat].state === 'liquid')
      ) {
        const env = nextGrid[y][x];
        const envInfo = MATERIALS[env.mat];
        if (envInfo.state !== 'solid' && env.mass < 5.0) {
          if (env.mat === p.content.mat) {
            const totalMass = env.mass + p.content.mass;
            env.temp = (env.temp * env.mass + p.content.temp * p.content.mass) / totalMass;
            env.mass = totalMass;
          } else if (envInfo.state === 'vacuum' || env.mass <= 0.05) {
            env.mat = p.content.mat;
            env.mass = p.content.mass;
            env.temp = p.content.temp;
          } else {
            env.mass += p.content.mass;
          }
          p.content = null;
        }
      }

      // 7. GAS FILTER (氣體過濾機)
      if (p.building === 'gas_filter') {
        // Detect multiple gas types in the connected pipe segment (within 3 pipe links)
        const gasTypesInSegment = new Set<MaterialKey>();
        if (p.content && MATERIALS[p.content.mat].state === 'gas') {
          gasTypesInSegment.add(p.content.mat);
        }

        const visitedPipes = new Set<string>();
        const queue: [number, number, number][] = [[x, y, 0]];
        visitedPipes.add(`${x},${y}`);

        while (queue.length > 0) {
          const [cx, cy, dist] = queue.shift()!;
          if (dist < 3) {
            const nbs: [number, number][] = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];
            for (const [nx, ny] of nbs) {
              if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1) {
                const key = `${nx},${ny}`;
                if (!visitedPipes.has(key)) {
                  visitedPipes.add(key);
                  const np = pipeGrid[ny][nx];
                  if (np.hasPipe) {
                    if (np.content && MATERIALS[np.content.mat].state === 'gas') {
                      gasTypesInSegment.add(np.content.mat);
                    }
                    queue.push([nx, ny, dist + 1]);
                  }
                }
              }
            }
          }
        }

        // Overload state is triggered when multiple distinct gas types are in the same pipe segment
        p.filterOverload = gasTypesInSegment.size >= 2;

        if (p.content) {
          const targetGas = p.filterTarget || 'co2';
          const isTarget = p.content.mat === targetGas;

          // If target match: routes to vertical branch [x, y+1], [x, y-1] (Filtered port)
          // If not match: routes to horizontal branch [x+1, y], [x-1, y] (Pass-through line)
          const priorityDirections: [number, number][] = isTarget
            ? [[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y]]
            : [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];

          for (const [nx, ny] of priorityDirections) {
            if (nx <= 0 || nx >= width - 1 || ny <= 0 || ny >= height - 1) continue;
            const np = pipeGrid[ny][nx];
            if (np.hasPipe && !np.content) {
              np.content = p.content;
              p.content = null;
              break;
            }
          }
        }
      }

      // 8. AIR CIRCULATOR (空氣對流風扇)
      // When powered, active draft draws air from left and blows right, equalizing temperature and circulating stagnant pockets
      if (p.building === 'air_circulator' && p.powered) {
        const inX = x - 1;
        const outX = x + 1;
        if (inX >= 1 && outX < width - 1) {
          const inCell = nextGrid[y][inX];
          const outCell = nextGrid[y][outX];
          if (MATERIALS[inCell.mat].state === 'gas' && inCell.mass > 0.15) {
            const flow = Math.min(inCell.mass * 0.35, 0.6);
            inCell.mass -= flow;
            if (outCell.mat === inCell.mat) {
              const newMass = outCell.mass + flow;
              outCell.temp = (outCell.temp * outCell.mass + inCell.temp * flow) / newMass;
              outCell.mass = newMass;
            } else if (outCell.mat === 'vacuum' || outCell.mass <= 0.05) {
              outCell.mat = inCell.mat;
              outCell.mass = flow;
              outCell.temp = inCell.temp;
            } else {
              outCell.mass += flow * 0.5;
            }
            // Thermal mixing
            const avgTemp = (inCell.temp + outCell.temp) / 2;
            inCell.temp += (avgTemp - inCell.temp) * 0.2;
            outCell.temp += (avgTemp - outCell.temp) * 0.2;
          }
        }
      }

      // 9. AIR SCRUBBER / CARBON & METHANE FILTER (空氣淨化機)
      // When powered, actively scrubs greenhouse methane and CO2 from 3x3 surrounding cells and releases fresh oxygen!
      if (p.building === 'air_scrubber' && p.powered) {
        let absorbedGas = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx <= 0 || tx >= width - 1 || ty <= 0 || ty >= height - 1) continue;
            const target = nextGrid[ty][tx];
            if (target.mat === 'methane' || target.mat === 'co2') {
              const absorb = Math.min(target.mass, 0.3);
              target.mass -= absorb;
              if (target.mass <= 0.01) {
                target.mat = 'vacuum';
                target.mass = 0;
              }
              absorbedGas = true;
              break;
            }
          }
          if (absorbedGas) break;
        }

        if (absorbedGas) {
          // Release clean breathable Oxygen at 22°C
          const current = nextGrid[y][x];
          if (current.mat === 'vacuum' || current.mat === 'oxygen') {
            current.mat = 'oxygen';
            current.mass = Math.min(current.mass + 0.25, 4.0);
            current.temp = 22.0;
          }
        }
      }

      // 10. PRESSURE GAUGE (管線氣壓表 / 壓力計)
      if (p.building === 'pressure_gauge') {
        // Measure gas pressure inside packet in this gauge cell or adjacent connected pipes
        let packet = p.content;
        if (!packet) {
          const adjPipes: [number, number][] = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
          ];
          for (const [ax, ay] of adjPipes) {
            if (ax >= 1 && ax < width - 1 && ay >= 1 && ay < height - 1) {
              const ap = pipeGrid[ay][ax];
              if (ap.hasPipe && ap.content) {
                packet = ap.content;
                break;
              }
            }
          }
        }

        if (packet) {
          const pMat = MATERIALS[packet.mat];
          let press = 0;
          if (pMat.state === 'gas') {
            const tempK = Math.max(packet.temp + 273.15, 1.0);
            press = (packet.mass / 1.0) * (tempK / 293.15) * 101.3;
          } else if (pMat.state === 'liquid') {
            press = 101.3 + (packet.mass / 10.0) * 20.0;
          }
          p.measuredPressure = Math.round(press * 10) / 10;
        } else {
          // Decay reading slightly so the display doesn't flicker between ticks
          if (p.measuredPressure && p.measuredPressure > 0) {
            p.measuredPressure = Math.max(0, Math.round(p.measuredPressure * 0.94 * 10) / 10);
          } else {
            p.measuredPressure = 0;
          }
        }
      }
    }
  }

  // 5. Pipe Network Liquid Flow (Packet Propagation along Pipe Graph)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = pipeGrid[y][x];
      if (p.hasPipe && p.content) {
        const pipeNeighbors: [number, number][] = [
          [x + 1, y],
          [x, y + 1],
          [x - 1, y],
          [x, y - 1]
        ].sort(() => Math.random() - 0.5) as [number, number][];

        for (const [nx, ny] of pipeNeighbors) {
          const np = pipeGrid[ny][nx];
          if (np.hasPipe && !np.content) {
            np.content = p.content;
            p.content = null;
            break;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------
  // STEP 5: Duplicants (Colonists AI, Breathing & Heat)
  // -----------------------------------------------------------
  for (const dupe of world.duplicants) {
    const gx = Math.floor(dupe.x);
    const gy = Math.floor(dupe.y);

    if (gx > 0 && gx < width - 1 && gy > 0 && gy < height - 1) {
      const currentCell = nextGrid[gy][gx];
      const floorCell = nextGrid[gy + 1]?.[gx];

      // Gravity: Check if there's solid floor beneath
      const isGrounded = floorCell && MATERIALS[floorCell.mat].state === 'solid';

      if (!isGrounded) {
        dupe.vy += 0.2; // Gravity pull
        dupe.y += dupe.vy;
        if (dupe.y > height - 3) {
          dupe.y = height - 3;
          dupe.vy = 0;
        }
      } else {
        dupe.vy = 0;
        dupe.y = Math.floor(dupe.y); // Snap to ground

        // Patrol walking logic
        dupe.x += dupe.vx;
        const nextGx = Math.floor(dupe.x + Math.sign(dupe.vx));
        const wallAhead = nextGrid[gy]?.[nextGx];
        const floorAhead = nextGrid[gy + 1]?.[nextGx];

        // Turn around if facing wall or pit cliff
        if (
          nextGx <= 1 ||
          nextGx >= width - 2 ||
          (wallAhead && MATERIALS[wallAhead.mat].state === 'solid') ||
          (floorAhead && MATERIALS[floorAhead.mat].state !== 'solid')
        ) {
          dupe.vx = -dupe.vx;
          dupe.facing = dupe.vx > 0 ? 'right' : 'left';
        }
      }

      // Breathing mechanics
      if (currentCell.mat === 'oxygen' && currentCell.mass > 0.05) {
        // Inhale oxygen
        const inhale = Math.min(currentCell.mass, 0.02);
        currentCell.mass -= inhale;
        // Exhale CO2 at 37°C
        if (Math.random() < 0.25) {
          if (gy < height - 2 && nextGrid[gy + 1][gx].mat === 'oxygen') {
            nextGrid[gy + 1][gx].mat = 'co2';
            nextGrid[gy + 1][gx].mass = 0.05;
            nextGrid[gy + 1][gx].temp = 37.0;
          }
        }
        dupe.breath = Math.min(dupe.breath + 2.0, 100);
        dupe.state = Math.abs(dupe.vx) > 0.05 ? 'walking' : 'idle';
      } else {
        // Holding breath or suffocating!
        dupe.breath = Math.max(dupe.breath - 1.5, 0);
        if (dupe.breath <= 0) {
          dupe.health = Math.max(dupe.health - 0.5, 0);
          dupe.state = 'suffocating';
        } else {
          dupe.state = 'idle';
        }
      }

      // Body heat emission (37°C)
      currentCell.temp += (37.0 - currentCell.temp) * 0.01;

      // Duplicant digestion / occasional methane off-gas
      if (Math.random() < 0.0015) {
        if (currentCell.mat === 'oxygen' || currentCell.mat === 'vacuum' || currentCell.mat === 'methane') {
          if (currentCell.mat === 'vacuum') {
            currentCell.mat = 'methane';
            currentCell.mass = 0.08;
            currentCell.temp = 36.5;
          } else if (currentCell.mat === 'methane') {
            currentCell.mass += 0.08;
          }
        }
      }
    }
  }

  // -----------------------------------------------------------
  // STEP 6: Independent Pressure & Volume Calculation
  // -----------------------------------------------------------
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = nextGrid[y][x];
      const pv = calcCellPressureAndVolume(c.mat, c.mass, c.temp);
      c.pressure = pv.pressure;
      c.volume = pv.volume;
      c.density = pv.density;
    }
  }

  // Hydrostatic head addition for liquid columns (deeper liquid = higher hydrostatic pressure)
  for (let x = 1; x < width - 1; x++) {
    let headPressure = 0;
    for (let y = 1; y < height - 1; y++) {
      const c = nextGrid[y][x];
      if (MATERIALS[c.mat].state === 'liquid') {
        headPressure += (c.mass / 1000) * 12.0;
        c.pressure = (c.pressure ?? 101.3) + headPressure;
      } else {
        headPressure = 0;
      }
    }
  }

  swapBuffers(world);
}
