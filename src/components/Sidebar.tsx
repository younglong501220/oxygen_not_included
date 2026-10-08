import React from 'react';
import {
  MATERIALS,
  ToolType,
  MaterialKey
} from '../types/simulation';
import {
  Hammer,
  Droplet,
  Cloud,
  Cpu,
  Eraser,
  Flame,
  Snowflake,
  UserPlus,
  UserMinus,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTool: ToolType;
  onSetTool: (tool: ToolType) => void;
  brushSize: number;
  onSetBrushSize: (size: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTool,
  onSetTool,
  brushSize,
  onSetBrushSize
}) => {
  // Details of current tool
  const currentMaterial = MATERIALS[currentTool as MaterialKey];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-700/80 p-3 flex flex-col gap-3.5 select-none overflow-y-auto z-10 text-xs">
      {/* 1. Solids Building */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Hammer className="w-3.5 h-3.5" />
          <span>固體建築 (Solids)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'tile'}
            onClick={() => onSetTool('tile')}
            icon="🧱"
            label="常規磚"
            sub="標準建材"
          />
          <ToolButton
            active={currentTool === 'insulated_tile'}
            onClick={() => onSetTool('insulated_tile')}
            icon="🛡️"
            label="隔熱磚"
            sub="阻隔熱流"
            highlight="amber"
          />
          <ToolButton
            active={currentTool === 'metal_tile'}
            onClick={() => onSetTool('metal_tile')}
            icon="🪙"
            label="導熱金屬磚"
            sub="極速均溫"
          />
          <ToolButton
            active={currentTool === 'ice'}
            onClick={() => onSetTool('ice')}
            icon="🧊"
            label="冰塊"
            sub="0°C融化"
            highlight="blue"
          />
        </div>
      </div>

      {/* 2. Liquids Spawning */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Droplet className="w-3.5 h-3.5" />
          <span>液體注入 (Liquids)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'water'}
            onClick={() => onSetTool('water')}
            icon="💧"
            label="純水 (20°C)"
            sub="常溫淡水"
          />
          <ToolButton
            active={currentTool === 'hot_water'}
            onClick={() => onSetTool('hot_water')}
            icon="♨️"
            label="沸水 (95°C)"
            sub="接近蒸發"
            highlight="red"
          />
          <ToolButton
            active={currentTool === 'polluted_water'}
            onClick={() => onSetTool('polluted_water')}
            icon="🧪"
            label="濃鹽污水"
            sub="-10°C冰點"
          />
          <ToolButton
            active={currentTool === 'petroleum'}
            onClick={() => onSetTool('petroleum')}
            icon="🛢️"
            label="原油/石油"
            sub="浮於水面"
          />
          <ToolButton
            active={currentTool === 'liquid_oxygen'}
            onClick={() => onSetTool('liquid_oxygen')}
            icon="❄️"
            label="液態氧 (LOX)"
            sub="-195°C深低溫"
            highlight="cyan"
          />
        </div>
      </div>

      {/* 3. Gases Spawning */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Cloud className="w-3.5 h-3.5" />
          <span>氣體注入 (Gases)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'oxygen'}
            onClick={() => onSetTool('oxygen')}
            icon="🟦"
            label="氧氣 (O₂)"
            sub="小人呼吸"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'co2'}
            onClick={() => onSetTool('co2')}
            icon="⬛"
            label="二氧化碳 (CO₂)"
            sub="沉降坑底"
          />
          <ToolButton
            active={currentTool === 'hydrogen'}
            onClick={() => onSetTool('hydrogen')}
            icon="🟣"
            label="輕質氫氣 (H₂)"
            sub="極輕/高導熱"
            highlight="pink"
          />
          <ToolButton
            active={currentTool === 'methane'}
            onClick={() => onSetTool('methane')}
            icon="🟢"
            label="甲烷溫室氣體"
            sub="輕質/溫室蓄熱"
            highlight="green"
          />
          <ToolButton
            active={currentTool === 'steam'}
            onClick={() => onSetTool('steam')}
            icon="💨"
            label="高溫蒸汽 (130°C)"
            sub="上升凝結"
          />
        </div>
      </div>

      {/* 4. Machinery & Pipe Graph */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Cpu className="w-3.5 h-3.5" />
          <span>管網與機電 (Plumbing & Machinery)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'pipe'}
            onClick={() => onSetTool('pipe')}
            icon="🔗"
            label="管道管網"
            sub="輸送流體"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'pump'}
            onClick={() => onSetTool('pump')}
            icon="⚙️"
            label="抽水泵"
            sub="抽取液體"
          />
          <ToolButton
            active={currentTool === 'vent'}
            onClick={() => onSetTool('vent')}
            icon="🚰"
            label="排液閥"
            sub="排放液體"
          />
          <ToolButton
            active={currentTool === 'gas_pump'}
            onClick={() => onSetTool('gas_pump')}
            icon="🌬️"
            label="氣體抽氣泵"
            sub="抽取環境氣體"
            highlight="pink"
          />
          <ToolButton
            active={currentTool === 'gas_vent'}
            onClick={() => onSetTool('gas_vent')}
            icon="💨"
            label="氣體排氣口"
            sub="釋放管內氣體"
          />
          <ToolButton
            active={currentTool === 'gas_filter'}
            onClick={() => onSetTool('gas_filter')}
            icon="🔬"
            label="氣體過濾機"
            sub="分流指定氣體"
            highlight="amber"
          />
          <ToolButton
            active={currentTool === 'pressure_gauge'}
            onClick={() => onSetTool('pressure_gauge')}
            icon="⏱️"
            label="管線氣壓表"
            sub="檢測破裂風險"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'air_circulator'}
            onClick={() => onSetTool('air_circulator')}
            icon="🌀"
            label="空氣對流風扇"
            sub="破除停滯氣團"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'air_scrubber'}
            onClick={() => onSetTool('air_scrubber')}
            icon="🧼"
            label="空氣淨化機"
            sub="清除甲烷與CO₂"
            highlight="green"
          />
          <ToolButton
            active={currentTool === 'heater'}
            onClick={() => onSetTool('heater')}
            icon="🔥"
            label="空間加熱器"
            sub="持續產熱"
            highlight="red"
          />
          <ToolButton
            active={currentTool === 'cooler'}
            onClick={() => onSetTool('cooler')}
            icon="❄️"
            label="液冷/降溫機"
            sub="管內冷卻-14°C"
            highlight="blue"
          />
          <ToolButton
            active={currentTool === 'cryo_cooler'}
            onClick={() => onSetTool('cryo_cooler')}
            icon="🧊"
            label="低溫深冷機"
            sub="氣體液化(<-183°C)"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'electrolyzer'}
            onClick={() => onSetTool('electrolyzer')}
            icon="⚡"
            label="電解槽 (SPOM)"
            sub="水析出O₂+H₂"
          />
        </div>
      </div>

      {/* 5. Automation & Sensors */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>自動化與傳感器 (Automation)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'wire'}
            onClick={() => onSetTool('wire')}
            icon="⚡"
            label="自動化導線"
            sub="傳送紅綠信號"
            highlight="green"
          />
          <ToolButton
            active={currentTool === 'not_gate'}
            onClick={() => onSetTool('not_gate')}
            icon="🔀"
            label="非門 (NOT Gate)"
            sub="反轉輸入信號"
            highlight="amber"
          />
          <ToolButton
            active={currentTool === 'buffer_gate'}
            onClick={() => onSetTool('buffer_gate')}
            icon="⏳"
            label="緩衝門 (Buffer Gate)"
            sub="脈衝延遲/展寬"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'thermal_sensor'}
            onClick={() => onSetTool('thermal_sensor')}
            icon="🌡️"
            label="溫度傳感器"
            sub="臨界溫控開關"
            highlight="amber"
          />
          <ToolButton
            active={currentTool === 'pressure_sensor'}
            onClick={() => onSetTool('pressure_sensor')}
            icon="⏱️"
            label="氣壓/質量傳感器"
            sub="質量壓力開關"
            highlight="cyan"
          />
          <ToolButton
            active={currentTool === 'clear_wire'}
            onClick={() => onSetTool('clear_wire')}
            icon="✂️"
            label="拆除導線/元件"
            sub="清除自動化"
          />
        </div>
      </div>

      {/* 5. Tools & Duplicants */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2 tracking-wide uppercase text-[11px]">
          <Eraser className="w-3.5 h-3.5" />
          <span>操作與沙盒工具 (Tools)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ToolButton
            active={currentTool === 'dig'}
            onClick={() => onSetTool('dig')}
            icon="⛏️"
            label="挖掘 / 拆除"
            sub="清空為氧氣"
          />
          <ToolButton
            active={currentTool === 'vacuum'}
            onClick={() => onSetTool('vacuum')}
            icon="🌌"
            label="抽成真空"
            sub="0 質量/絕熱"
          />
          <ToolButton
            active={currentTool === 'clear_pipe'}
            onClick={() => onSetTool('clear_pipe')}
            icon="✂️"
            label="拆除管道"
            sub="切斷管線"
          />
          <ToolButton
            active={currentTool === 'spawn_dupe'}
            onClick={() => onSetTool('spawn_dupe')}
            icon="👤"
            label="召喚複製人"
            sub="添加米普小人"
            highlight="green"
          />
        </div>
      </div>

      {/* Brush Size Selector */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-2.5">
        <div className="flex justify-between items-center text-slate-400 font-mono text-[11px] mb-1.5">
          <span>筆刷作用範圍 (Brush Size):</span>
          <span className="text-teal-400 font-bold">{brushSize}x{brushSize}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 5].map((size) => (
            <button
              key={size}
              onClick={() => onSetBrushSize(size)}
              className={`py-1 rounded font-mono font-medium border text-xs transition-colors ${
                brushSize === size
                  ? 'bg-teal-600 border-teal-400 text-white shadow-sm'
                  : 'bg-slate-750 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </div>

      {/* Active Material Technical Spec Sheet */}
      {currentMaterial && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-teal-300 font-semibold text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {currentMaterial.name} ({currentMaterial.nameEn})
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase font-mono">
              {currentMaterial.state}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            {currentMaterial.desc}
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono border-t border-slate-700/60 pt-1.5 text-slate-300">
            <div>密度: <span className="text-teal-300">{currentMaterial.density} kg/m³</span></div>
            <div>導熱率 k: <span className="text-amber-300">{currentMaterial.k}</span></div>
            <div>比熱容: <span className="text-blue-300">{currentMaterial.shc} J/g·K</span></div>
            {currentMaterial.boilTemp !== undefined && (
              <div>沸點: <span className="text-red-300">{currentMaterial.boilTemp}°C</span></div>
            )}
            {currentMaterial.meltTemp !== undefined && (
              <div>熔點: <span className="text-cyan-300">{currentMaterial.meltTemp}°C</span></div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sub: string;
  highlight?: 'amber' | 'blue' | 'red' | 'cyan' | 'green' | 'pink';
}

const ToolButton: React.FC<ToolBtnProps> = ({
  active,
  onClick,
  icon,
  label,
  sub,
  highlight
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md border text-left flex items-start gap-1.5 transition-all cursor-pointer ${
        active
          ? 'bg-teal-950/80 border-teal-400 text-teal-200 ring-1 ring-teal-400/50 shadow-[0_0_8px_rgba(45,212,191,0.2)]'
          : 'bg-slate-800/90 border-slate-700/70 text-slate-300 hover:bg-slate-700/80 hover:border-slate-600'
      }`}
    >
      <span className="text-sm mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="font-medium truncate text-[11px]">{label}</div>
        <div className="text-[9px] text-slate-400 truncate">{sub}</div>
      </div>
    </button>
  );
};
