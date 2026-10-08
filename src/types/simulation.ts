export type MaterialState = 'vacuum' | 'solid' | 'liquid' | 'gas';

export type MaterialKey =
  | 'vacuum'
  | 'tile'
  | 'insulated_tile'
  | 'metal_tile'
  | 'ice'
  | 'dirt'
  | 'water'
  | 'hot_water'
  | 'polluted_water'
  | 'petroleum'
  | 'oxygen'
  | 'co2'
  | 'hydrogen'
  | 'methane'
  | 'steam'
  | 'liquid_oxygen'
  | 'liquid_hydrogen'
  | 'liquid_methane'
  | 'liquid_co2';

export interface MaterialDef {
  id: MaterialKey;
  name: string;
  nameEn: string;
  state: MaterialState;
  density: number; // kg/m³
  k: number; // Thermal conductivity W/(m·K)
  shc: number; // Specific heat capacity J/(g·K)
  color: [number, number, number];
  opacity?: number;
  freezeTemp?: number; // °C
  freezeTarget?: MaterialKey;
  meltTemp?: number; // °C
  meltTarget?: MaterialKey;
  boilTemp?: number; // °C
  boilTarget?: MaterialKey;
  condenseTemp?: number; // °C
  condenseTarget?: MaterialKey;
  breathable?: boolean;
  desc: string;
}

export const MATERIALS: Record<MaterialKey, MaterialDef> = {
  vacuum: {
    id: 'vacuum',
    name: '真空',
    nameEn: 'Vacuum',
    state: 'vacuum',
    density: 0,
    k: 0.000001,
    shc: 1,
    color: [12, 16, 22],
    desc: '完全真空，質量為 0，具有完美的隔熱特性。'
  },
  tile: {
    id: 'tile',
    name: '常規磚',
    nameEn: 'Regular Tile',
    state: 'solid',
    density: 1800,
    k: 1.0,
    shc: 0.92,
    color: [88, 96, 110],
    desc: '標準建築磚塊，硬度與導熱性中等。'
  },
  insulated_tile: {
    id: 'insulated_tile',
    name: '隔熱磚',
    nameEn: 'Insulated Tile',
    state: 'solid',
    density: 2200,
    k: 0.0001,
    shc: 2.5,
    color: [136, 115, 84],
    desc: '超低導熱率材料，有效防止不同溫區之間熱量擴散。'
  },
  metal_tile: {
    id: 'metal_tile',
    name: '導熱金屬磚',
    nameEn: 'Metal Tile',
    state: 'solid',
    density: 7800,
    k: 54.0,
    shc: 0.45,
    color: [175, 140, 75],
    desc: '金屬鑄造磚，極高導熱係數，適合建立熱交換室與散熱片。'
  },
  dirt: {
    id: 'dirt',
    name: '泥土岩層',
    nameEn: 'Dirt Rock',
    state: 'solid',
    density: 1500,
    k: 0.45,
    shc: 1.48,
    color: [112, 85, 60],
    desc: '原始地殼自然形成的泥土固體層。'
  },
  ice: {
    id: 'ice',
    name: '冰塊',
    nameEn: 'Ice',
    state: 'solid',
    density: 917,
    k: 2.18,
    shc: 2.05,
    color: [130, 205, 245],
    meltTemp: 0.0,
    meltTarget: 'water',
    desc: '固態水，溫度低於 0°C。吸熱超過 0°C 即融化為液態水。'
  },
  water: {
    id: 'water',
    name: '水',
    nameEn: 'Water',
    state: 'liquid',
    density: 1000,
    k: 0.606,
    shc: 4.179,
    color: [42, 130, 230],
    freezeTemp: 0.0,
    freezeTarget: 'ice',
    boilTemp: 100.0,
    boilTarget: 'steam',
    desc: '生命之源，比熱容極高（絕佳熱載體），0°C 結冰，100°C 沸騰為水蒸氣。'
  },
  hot_water: {
    id: 'hot_water',
    name: '沸水/熱水',
    nameEn: 'Hot Water',
    state: 'liquid',
    density: 980,
    k: 0.65,
    shc: 4.18,
    color: [55, 160, 240],
    freezeTemp: 0.0,
    freezeTarget: 'ice',
    boilTemp: 100.0,
    boilTarget: 'steam',
    desc: '高溫純水（約 95°C），即將抵達相變臨界點。'
  },
  polluted_water: {
    id: 'polluted_water',
    name: '濃鹽污水',
    nameEn: 'Brine / Polluted Water',
    state: 'liquid',
    density: 1050,
    k: 0.58,
    shc: 4.0,
    color: [72, 130, 80],
    freezeTemp: -10.0,
    freezeTarget: 'ice',
    boilTemp: 115.0,
    boilTarget: 'steam',
    desc: '雜質較高的污水，冰點更低（-10°C），密度大於普通水。'
  },
  petroleum: {
    id: 'petroleum',
    name: '原油/石油',
    nameEn: 'Petroleum',
    state: 'liquid',
    density: 820,
    k: 0.14,
    shc: 1.76,
    color: [180, 110, 30],
    boilTemp: 350.0,
    desc: '密度較小且耐高溫的碳氫化合物液體，浮於水面。'
  },
  oxygen: {
    id: 'oxygen',
    name: '氧氣',
    nameEn: 'Oxygen',
    state: 'gas',
    density: 1.42,
    k: 0.026,
    shc: 1.005,
    color: [100, 200, 255],
    opacity: 0.45,
    condenseTemp: -183.0,
    condenseTarget: 'liquid_oxygen',
    breathable: true,
    desc: '標準可呼吸氣體。密度介於氫氣與二氧化碳之間；冷卻至 -183°C 以下液化為液態氧。'
  },
  co2: {
    id: 'co2',
    name: '二氧化碳',
    nameEn: 'Carbon Dioxide',
    state: 'gas',
    density: 1.98,
    k: 0.016,
    shc: 0.846,
    color: [52, 58, 68],
    opacity: 0.85,
    condenseTemp: -56.6,
    condenseTarget: 'liquid_co2',
    breathable: false,
    desc: '沉重氣體，在常壓下會自然下沉積聚在基地坑底。低溫高壓下可液化為液態二氧化碳。'
  },
  hydrogen: {
    id: 'hydrogen',
    name: '氫氣',
    nameEn: 'Hydrogen',
    state: 'gas',
    density: 0.089,
    k: 0.18,
    shc: 2.4,
    color: [240, 105, 175],
    opacity: 0.5,
    condenseTemp: -253.0,
    condenseTarget: 'liquid_hydrogen',
    breathable: false,
    desc: '全宇宙最輕的氣體！具有極高氣體導熱性，會迅速上升聚集在天花板；冷卻至 -253°C 液化為液態氫。'
  },
  methane: {
    id: 'methane',
    name: '甲烷/天然氣',
    nameEn: 'Methane (CH₄)',
    state: 'gas',
    density: 0.717,
    k: 0.034,
    shc: 2.22,
    color: [115, 230, 95],
    opacity: 0.65,
    condenseTemp: -161.6,
    condenseTarget: 'liquid_methane',
    breathable: false,
    desc: '強力溫室氣體，密度輕於空氣。積聚在頂部並造成高溫蓄積；降至 -162°C 以下液化為液態甲烷。'
  },
  steam: {
    id: 'steam',
    name: '高溫水蒸氣',
    nameEn: 'Steam',
    state: 'gas',
    density: 0.59,
    k: 0.025,
    shc: 2.01,
    color: [225, 235, 245],
    opacity: 0.65,
    condenseTemp: 99.0,
    condenseTarget: 'water',
    breathable: false,
    desc: '高溫氣態水，密度小於氧氣與二氧化碳而向上翻湧；降溫至 99°C 以下凝結為雨水。'
  },
  liquid_oxygen: {
    id: 'liquid_oxygen',
    name: '液態氧',
    nameEn: 'Liquid Oxygen (LOX)',
    state: 'liquid',
    density: 1141,
    k: 0.152,
    shc: 1.70,
    color: [125, 211, 252],
    opacity: 0.85,
    boilTemp: -183.0,
    boilTarget: 'oxygen',
    freezeTemp: -218.8,
    freezeTarget: 'ice',
    breathable: false,
    desc: '深低溫液態氧（LOX，<-183°C），密度大於常溫水，強效火箭氧化劑；遇熱急劇沸騰汽化為氧氣。'
  },
  liquid_hydrogen: {
    id: 'liquid_hydrogen',
    name: '液態氫',
    nameEn: 'Liquid Hydrogen (LH2)',
    state: 'liquid',
    density: 70.8,
    k: 0.12,
    shc: 9.69,
    color: [244, 114, 182],
    opacity: 0.8,
    boilTemp: -253.0,
    boilTarget: 'hydrogen',
    freezeTemp: -259.2,
    freezeTarget: 'ice',
    breathable: false,
    desc: '極限低溫液態氫（<-253°C），宇宙中密度最小之極冷液體；回溫即爆發性汽化為氫氣。'
  },
  liquid_methane: {
    id: 'liquid_methane',
    name: '液態甲烷',
    nameEn: 'Liquid Methane (LNG)',
    state: 'liquid',
    density: 422.6,
    k: 0.185,
    shc: 3.48,
    color: [74, 222, 128],
    opacity: 0.85,
    boilTemp: -161.6,
    boilTarget: 'methane',
    freezeTemp: -182.5,
    freezeTarget: 'ice',
    breathable: false,
    desc: '低溫液化天然氣（<-162°C），高效碳氫燃料；回溫迅速蒸發膨脹為溫室氣體甲烷。'
  },
  liquid_co2: {
    id: 'liquid_co2',
    name: '液態二氧化碳',
    nameEn: 'Liquid Carbon Dioxide',
    state: 'liquid',
    density: 1101,
    k: 0.20,
    shc: 2.1,
    color: [192, 132, 252],
    opacity: 0.85,
    boilTemp: -56.6,
    boilTarget: 'co2',
    freezeTemp: -78.5,
    freezeTarget: 'ice',
    breathable: false,
    desc: '低溫高壓液態二氧化碳（<-56.6°C）；吸熱極易沸騰昇華為濃重二氧化碳氣體。'
  }
};

export type BuildingType =
  | 'none'
  | 'pump' // Liquid Pump
  | 'vent' // Liquid Vent
  | 'gas_pump' // Gas Pump
  | 'gas_vent' // Gas Vent
  | 'gas_filter' // Gas Filter
  | 'pressure_gauge' // 管線氣壓表 / 壓力計 (Pressure Gauge)
  | 'air_circulator' // 空氣對流風扇
  | 'air_scrubber' // 空氣淨化過濾器 (去除溫室氣體)
  | 'heater'
  | 'cooler'
  | 'cryo_cooler' // 低溫深冷機 (Cryo-Cooler: 液化氣體至極低溫)
  | 'electrolyzer';

export type SensorType = 'none' | 'thermal_sensor' | 'pressure_sensor';
export type LogicComparison = 'above' | 'below';
export type GateType = 'none' | 'not_gate' | 'buffer_gate';
export type GateDirection = 'left_to_right' | 'up_to_down' | 'right_to_left' | 'down_to_up';

export interface AutomationCellData {
  hasWire: boolean;
  sensor: SensorType;
  comparison: LogicComparison;
  threshold: number; // °C for thermal, kg for pressure
  signal: boolean; // true = Green (active/ON), false = Red (inactive/OFF)
  gate: GateType;
  gateDir?: GateDirection;
  gateInputSignal?: boolean;
  bufferDelayTicks?: number; // for buffer gate: configurable duration in ticks
  bufferTimer?: number; // countdown ticks remaining
}

export interface PipePacket {
  mat: MaterialKey;
  mass: number; // in kg
  temp: number; // in °C
}

export interface CellData {
  mat: MaterialKey;
  mass: number; // kg
  temp: number; // °C
  pressure?: number; // kPa (Standard atmospheric pressure ~101.3 kPa)
  volume?: number; // m³ (Occupied cell volume fraction, max 1.0 m³)
  density?: number; // kg/m³ (Effective dynamic gas/liquid density)
  tempDelta?: number; // °C/tick (Thermal flux rate for heat leak diagnostics)
}

export interface PipeCellData {
  hasPipe: boolean;
  building: BuildingType;
  powered: boolean;
  content: PipePacket | null;
  filterTarget?: MaterialKey; // for gas_filter: element to separate
  filterOverload?: boolean; // visual alert: multiple gas types in same pipe segment
  measuredPressure?: number; // for pressure_gauge: current measured gas pressure in kPa
}

export interface Duplicant {
  id: string;
  name: string;
  x: number; // grid coords (floating point)
  y: number;
  vx: number;
  vy: number;
  breath: number; // 0 to 100
  health: number; // 0 to 100
  facing: 'left' | 'right';
  state: 'idle' | 'walking' | 'breathing' | 'suffocating' | 'swimming';
  color: string;
}

export type ViewOverlay = 'normal' | 'thermal' | 'pipe' | 'automation' | 'breath' | 'pressure' | 'gas';

export type ToolType =
  | 'tile'
  | 'insulated_tile'
  | 'metal_tile'
  | 'ice'
  | 'water'
  | 'hot_water'
  | 'polluted_water'
  | 'petroleum'
  | 'oxygen'
  | 'co2'
  | 'hydrogen'
  | 'methane'
  | 'steam'
  | 'liquid_oxygen'
  | 'liquid_hydrogen'
  | 'liquid_methane'
  | 'dig'
  | 'vacuum'
  | 'pipe'
  | 'clear_pipe'
  | 'pump'
  | 'vent'
  | 'gas_pump'
  | 'gas_vent'
  | 'gas_filter'
  | 'pressure_gauge'
  | 'air_circulator'
  | 'air_scrubber'
  | 'heater'
  | 'cooler'
  | 'cryo_cooler'
  | 'electrolyzer'
  | 'wire'
  | 'thermal_sensor'
  | 'pressure_sensor'
  | 'not_gate'
  | 'buffer_gate'
  | 'clear_wire'
  | 'spawn_dupe'
  | 'remove_dupe';

