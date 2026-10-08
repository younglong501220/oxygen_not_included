import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  Thermometer,
  Layers,
  Activity,
  Wind,
  Gauge,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { ViewOverlay } from '../types/simulation';

interface HeaderBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onStep: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onReset: () => void;
  selectedPreset: string;
  onSelectPreset: (presetKey: string) => void;
  viewMode: ViewOverlay;
  onSetViewMode: (mode: ViewOverlay) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenHandbook: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  tickCount: number;
  dupeCount: number;
  suffocatingCount: number;
  totalO2Kg: number;
  avgTemp: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isPaused,
  onTogglePause,
  onStep,
  simSpeed,
  onSetSimSpeed,
  onReset,
  selectedPreset,
  onSelectPreset,
  viewMode,
  onSetViewMode,
  soundOn,
  onToggleSound,
  onOpenHandbook,
  showInspector,
  onToggleInspector,
  tickCount,
  dupeCount,
  suffocatingCount,
  totalO2Kg,
  avgTemp
}) => {
  const cycleNumber = Math.floor(tickCount / 600) + 1;

  return (
    <header className="bg-slate-900 border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-200 select-none shadow-md z-20">
      {/* Brand & Cycle Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400 flex items-center justify-center font-bold text-teal-300 font-mono text-sm shadow-[0_0_12px_rgba(45,212,191,0.25)]">
            O₂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-wide text-teal-400 leading-none">
                缺氧物理引擎模擬器
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                ONI Lab
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Cycle {cycleNumber} · Tick {tickCount}
            </p>
          </div>
        </div>

        {/* Colony Quick Vitals */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
          <div className="flex items-center gap-1.5" title="殖民地總氧氣質量">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-slate-400">O₂存量:</span>
            <span className="text-cyan-300 font-semibold">{totalO2Kg.toFixed(1)} kg</span>
          </div>
          <div className="w-px h-3 bg-slate-700"></div>
          <div className="flex items-center gap-1.5" title="殖民地平均溫度">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">均溫:</span>
            <span className={`font-semibold ${avgTemp > 40 ? 'text-red-400' : avgTemp < 10 ? 'text-blue-400' : 'text-emerald-300'}`}>
              {avgTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="w-px h-3 bg-slate-700"></div>
          <div className="flex items-center gap-1.5" title="複製人生存狀態">
            <span className="text-slate-400">複製人:</span>
            <span className="text-yellow-300 font-semibold">{dupeCount}名</span>
            {suffocatingCount > 0 && (
              <span className="px-1 py-0.2 rounded bg-red-900/80 border border-red-500 text-red-200 text-[10px] animate-bounce">
                {suffocatingCount}窒息危險!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 hidden sm:inline">預設場景:</label>
        <select
          value={selectedPreset}
          onChange={(e) => onSelectPreset(e.target.value)}
          aria-label="選擇預設場景"
          className="bg-slate-800 text-teal-300 text-xs px-2.5 py-1.5 rounded border border-slate-700 hover:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
        >
          <option value="habitat">經典殖民基地與蓄水池 (Habitat & Pool)</option>
          <option value="automation_filter">⚡ 氣體過濾與自動化系統 (Gas Filter & Automation)</option>
          <option value="greenhouse">🌿 溫室氣體與空氣循環淨化 (Greenhouse & Air Recirculation)</option>
          <option value="steam">高溫蒸氣發電與冷凝室 (Steam Turbine Loop)</option>
          <option value="gas_column">氣體重力沉降塔 (Gas Density Tower)</option>
          <option value="spom">自能氧氣機 SPOM 電解槽 (Electrolyzer SPOM)</option>
          <option value="cryo">❄️ 低溫深冷機與液態氧/熱漏診斷 (Cryo-Cooler & Liquid LOX)</option>
          <option value="empty">空白真空沙盒 (Empty Sandbox)</option>
        </select>
      </div>

      {/* View Overlays */}
      <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
        <button
          onClick={() => onSetViewMode('normal')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'normal'
              ? 'bg-teal-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="物質視圖 (Normal)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>物質</span>
        </button>
        <button
          onClick={() => onSetViewMode('thermal')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'thermal'
              ? 'bg-amber-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="溫度熱力圖 (Thermal Overlay)"
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>熱力圖</span>
        </button>
        <button
          onClick={() => onSetViewMode('pressure')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'pressure'
              ? 'bg-purple-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="氣壓與體積等壓線視圖 (Pressure & Volume Overlay)"
        >
          <Gauge className="w-3.5 h-3.5 text-purple-300" />
          <span>氣壓</span>
        </button>
        <button
          onClick={() => onSetViewMode('gas')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'gas'
              ? 'bg-sky-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="大氣氣體成分分析視圖 (Gas Composition Overlay: O₂, CO₂, H₂, CH₄)"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          <span>大氣</span>
        </button>
        <button
          onClick={() => onSetViewMode('pipe')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'pipe'
              ? 'bg-cyan-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="管線網絡層 (Pipe Network Overlay)"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>管網</span>
        </button>
        <button
          onClick={() => onSetViewMode('automation')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'automation'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="自動化導線與傳感器 (Automation Overlay)"
        >
          <Activity className="w-3.5 h-3.5 text-yellow-300" />
          <span>自動化</span>
        </button>
        <button
          onClick={() => onSetViewMode('breath')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            viewMode === 'breath'
              ? 'bg-blue-600 text-white font-medium shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
          title="氣體呼吸率 (Breathability Overlay)"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>呼吸率</span>
        </button>
      </div>

      {/* Simulation Playback Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onTogglePause}
          className={`p-1.5 rounded border transition-colors flex items-center justify-center ${
            isPaused
              ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
              : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500'
          }`}
          title={isPaused ? '繼續模擬 (Space)' : '暫停模擬 (Space)'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={onStep}
          disabled={!isPaused}
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          title="單步前進 (Step)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed presets */}
        <div className="flex items-center bg-slate-800 rounded border border-slate-700 text-xs font-mono">
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSimSpeed(spd)}
              className={`px-2 py-1 transition-colors ${
                simSpeed === spd
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <button
          onClick={onReset}
          className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-red-900/60 hover:text-red-300 hover:border-red-600 transition-colors"
          title="重設目前場景"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 mx-1"></div>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded border transition-colors ${
            soundOn
              ? 'bg-slate-800 border-slate-700 text-teal-400 hover:bg-slate-700'
              : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
          }`}
          title={soundOn ? '音效開啟' : '音效靜音'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Handbook Button */}
        <button
          onClick={onOpenHandbook}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-teal-900/40 border border-teal-500/40 text-teal-300 text-xs hover:bg-teal-800/60 transition-colors"
          title="查看物理學與機制說明書"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">科學手冊</span>
        </button>

        {/* Toggle Status Inspector Box */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
            showInspector
              ? 'bg-teal-950/70 border-teal-500/50 text-teal-300 hover:bg-teal-900/60'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          title={showInspector ? '點擊隱藏右下角狀態數值方框 (快速鍵: I)' : '點擊顯示右下角狀態數值方框 (快速鍵: I)'}
        >
          {showInspector ? <Eye className="w-3.5 h-3.5 text-teal-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden xl:inline">狀態方框</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900/60 border border-slate-700/60">
            {showInspector ? '顯示' : '隱藏'}
          </span>
        </button>
      </div>
    </header>
  );
};
