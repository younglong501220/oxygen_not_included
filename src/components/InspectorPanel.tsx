import React from 'react';
import {
  CellData,
  PipeCellData,
  AutomationCellData,
  Duplicant,
  MATERIALS
} from '../types/simulation';
import {
  Thermometer,
  Gauge,
  Activity,
  ShieldAlert,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InspectorPanelProps {
  cell: CellData | null;
  pipeCell: PipeCellData | null;
  autoCell?: AutomationCellData | null;
  dupeNear: Duplicant | null;
  coord: { x: number; y: number } | null;
  onOpenConfig?: () => void;
  onHide?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  cell,
  pipeCell,
  autoCell,
  dupeNear,
  coord,
  onOpenConfig,
  onHide,
  isCollapsed = false,
  onToggleCollapse
}) => {
  if (!cell || !coord) return null;

  const mat = MATERIALS[cell.mat];
  const tempC = cell.temp;
  const tempK = tempC + 273.15;
  const tempF = (tempC * 9) / 5 + 32;

  const canConfigure =
    (autoCell && (autoCell.sensor !== 'none' || autoCell.gate !== 'none')) ||
    (pipeCell && pipeCell.building === 'gas_filter');

  // Pressure evaluation for gases and fluids
  const pressVal = cell.pressure ?? 101.3;
  let pressureStatus = '正常常壓';
  let pressureColor = 'text-teal-400';
  if (mat.state === 'gas' || mat.state === 'liquid') {
    if (pressVal < 30) {
      pressureStatus = '真空/超低壓';
      pressureColor = 'text-indigo-400';
    } else if (pressVal < 75) {
      pressureStatus = '稀薄低壓';
      pressureColor = 'text-sky-400';
    } else if (pressVal <= 130) {
      pressureStatus = '標準大氣壓 (1 atm)';
      pressureColor = 'text-emerald-400';
    } else if (pressVal <= 250) {
      pressureStatus = '高壓壓縮';
      pressureColor = 'text-amber-400';
    } else {
      pressureStatus = '危險超壓破膜!';
      pressureColor = 'text-red-400';
    }
  }

  // Mini / Collapsed Mode (Minimal bar that doesn't obstruct view)
  if (isCollapsed) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-700/90 rounded-lg px-3 py-2 text-xs text-slate-200 shadow-2xl pointer-events-auto min-w-[220px] max-w-[320px] z-30 font-mono transition-all flex items-center justify-between gap-2.5"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
            style={{ backgroundColor: `rgb(${mat.color.join(',')})` }}
          />
          <div className="truncate">
            <span className="font-bold text-teal-300">{mat.name}</span>
            <span className="text-[10px] text-slate-400 ml-1">[{coord.x}, {coord.y}]</span>
          </div>
          <span className="text-slate-100 font-semibold text-[11px] whitespace-nowrap">
            {cell.mass >= 1 ? `${cell.mass.toFixed(1)}kg` : `${(cell.mass * 1000).toFixed(0)}g`}
          </span>
          <span
            className={`text-[11px] font-semibold whitespace-nowrap ${
              tempC > 60 ? 'text-red-400' : tempC < 0 ? 'text-blue-400' : 'text-emerald-300'
            }`}
          >
            {tempC.toFixed(0)}°C
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="展開詳細狀態方框"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="隱藏此狀態方框 (快速鍵: I)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-700/90 rounded-lg p-3 text-xs text-slate-200 shadow-2xl pointer-events-auto min-w-[240px] max-w-[285px] z-30 font-mono transition-all"
    >
      {/* Element Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
        <div>
          <div className="font-bold text-sm text-teal-300 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
              style={{ backgroundColor: `rgb(${mat.color.join(',')})` }}
            ></span>
            <span>{mat.name}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {mat.nameEn} · [{coord.x}, {coord.y}]
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase text-[10px]">
            {mat.state}
          </span>
          {onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="摺疊為精簡標籤"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="隱藏此狀態方框 (快速鍵: I)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Vitals: Mass & Temp */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-slate-400" />
            質量 (Mass):
          </span>
          <span className="font-semibold text-slate-100">
            {cell.mass >= 1
              ? `${cell.mass.toFixed(2)} kg`
              : `${(cell.mass * 1000).toFixed(0)} g`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-purple-400" />
            氣壓 (Pressure):
          </span>
          <div className="text-right">
            <span className={`font-semibold ${pressureColor}`}>
              {pressVal.toFixed(1)} kPa
            </span>
            <span className="text-[10px] text-slate-400 ml-1">
              ({(pressVal / 101.3).toFixed(2)} atm)
            </span>
          </div>
        </div>

        {(mat.state === 'gas' || mat.state === 'liquid') && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">體積佔比 (Volume):</span>
            <span className="text-cyan-300 font-semibold">
              {(cell.volume ?? 1.0).toFixed(2)} m³
            </span>
          </div>
        )}

        {mat.state === 'gas' && (
          <>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">氣體密度 (Density):</span>
              <span className="text-teal-300 font-semibold">
                {(cell.density ?? cell.mass).toFixed(3)} kg/m³
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">壓強狀態:</span>
              <span className={`font-semibold ${pressureColor}`}>{pressureStatus}</span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-400" />
            溫度 (Temp):
          </span>
          <div className="text-right">
            <span
              className={`font-semibold ${
                tempC > 60
                  ? 'text-red-400'
                  : tempC < 0
                  ? 'text-blue-400'
                  : 'text-emerald-300'
              }`}
            >
              {tempC.toFixed(1)} °C
            </span>
            <span className="text-[10px] text-slate-400 ml-1">
              ({tempK.toFixed(1)} K / {tempF.toFixed(0)}°F)
            </span>
          </div>
        </div>

        {/* Technical Properties */}
        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
          <div>
            導熱率: <span className="text-slate-200">{mat.k}</span>
          </div>
          <div>
            比熱: <span className="text-slate-200">{mat.shc}</span>
          </div>
          <div>
            密度: <span className="text-slate-200">{mat.density}</span>
          </div>
          <div>
            可呼吸:{' '}
            <span className={mat.breathable ? 'text-teal-400' : 'text-red-400'}>
              {mat.breathable ? '是' : '否'}
            </span>
          </div>
        </div>

        {/* Phase Transitions */}
        {(mat.meltTemp !== undefined || mat.boilTemp !== undefined) && (
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/80">
            {mat.meltTemp !== undefined && <div>· 熔點: {mat.meltTemp}°C</div>}
            {mat.boilTemp !== undefined && <div>· 沸點: {mat.boilTemp}°C</div>}
          </div>
        )}

        {/* Pipe Layer Details */}
        {pipeCell && (pipeCell.hasPipe || pipeCell.building !== 'none') && (
          <div className="pt-2 border-t border-slate-700/80 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-semibold mb-0.5">
              <Activity className="w-3 h-3" />
              <span>管網與機電狀態</span>
            </div>
            <div className="text-[10px] text-slate-300">
              {pipeCell.building !== 'none' && (
                <div className="text-amber-300">
                  設施: <span className="font-semibold uppercase">{pipeCell.building}</span>
                  {pipeCell.powered ? (
                    <span className="text-emerald-400 ml-1">● 運行中</span>
                  ) : (
                    <span className="text-red-400 ml-1">● 自動化待機(OFF)</span>
                  )}
                  {pipeCell.building === 'gas_filter' && (
                    <div className="text-teal-300 mt-0.5">
                      分流目標: {MATERIALS[pipeCell.filterTarget || 'co2'].name} ({MATERIALS[pipeCell.filterTarget || 'co2'].nameEn})
                    </div>
                  )}
                  {pipeCell.building === 'pressure_gauge' && (
                    <div className="mt-1 p-1.5 rounded bg-slate-800/90 border border-cyan-500/40 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-300 font-semibold">管內氣壓讀數:</span>
                        <span className={((pipeCell.measuredPressure || 0) > 220) ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-300 font-bold'}>
                          {(pipeCell.measuredPressure || 0).toFixed(1)} kPa
                        </span>
                      </div>
                      <div className="text-[9px] mt-0.5">
                        {((pipeCell.measuredPressure || 0) > 220) ? (
                          <span className="text-red-400 font-bold">⚠️ 超壓危險！面臨管線爆裂漏氣風險！</span>
                        ) : (
                          <span className="text-slate-400">安全範圍（管網破裂極限: 220 kPa）</span>
                        )}
                      </div>
                    </div>
                  )}
                  {pipeCell.building === 'gas_filter' && pipeCell.filterOverload && (
                    <div className="mt-1 p-1.5 rounded bg-amber-950/80 border border-amber-500/60 text-[10px] text-amber-300">
                      <div className="font-bold flex items-center gap-1">
                        <span className="animate-ping inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        ⚠️ 過濾機混氣超載警示 (Overload)
                      </div>
                      <div className="text-[9px] text-amber-200/80 mt-0.5">
                        管段內同時混有多種不同氣體，請加設緩衝氣罐或前置分流以防氣阻！
                      </div>
                    </div>
                  )}
                </div>
              )}
              {pipeCell.hasPipe && (
                <div>
                  管道: {pipeCell.hasPipe ? '已連通' : '無'}
                  {pipeCell.content ? (
                    <span className="text-cyan-300 ml-1">
                      [包: {MATERIALS[pipeCell.content.mat].name} {pipeCell.content.mass.toFixed(1)}kg ({pipeCell.content.temp.toFixed(1)}°C)]
                    </span>
                  ) : (
                    <span className="text-slate-500 ml-1">(無流體)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Automation Grid Details */}
        {autoCell && (autoCell.hasWire || autoCell.sensor !== 'none' || autoCell.gate !== 'none') && (
          <div className="pt-2 border-t border-slate-700/80 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold mb-0.5">
              <ShieldAlert className="w-3 h-3 text-yellow-400" />
              <span>自動化信號網絡</span>
            </div>
            <div className="text-[10px] space-y-0.5 text-slate-300">
              {autoCell.gate !== 'none' && (
                <div>
                  邏輯門:{' '}
                  <span className="text-cyan-300 font-medium">
                    {autoCell.gate === 'not_gate' ? '非門 (NOT Gate)' : '緩衝門 (Buffer Gate)'}
                  </span>
                  <div className="text-slate-400">
                    輸入: {autoCell.gateInputSignal ? '🟢 (ON)' : '🔴 (OFF)'} → 輸出:{' '}
                    {autoCell.signal ? '🟢 (ON)' : '🔴 (OFF)'}
                  </div>
                  {autoCell.gate === 'buffer_gate' && (
                    <div className="text-slate-400">
                      緩衝延遲: {autoCell.bufferDelayTicks || 30} ticks
                      {(autoCell.bufferTimer ?? 0) > 0 && (
                        <span className="text-emerald-400 ml-1">
                          [倒數中: {autoCell.bufferTimer}t]
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {autoCell.sensor !== 'none' && (
                <div>
                  傳感器:{' '}
                  <span className="text-amber-300 font-medium">
                    {autoCell.sensor === 'thermal_sensor' ? '溫度傳感器' : '氣壓傳感器'}
                  </span>
                  <div className="text-slate-400">
                    邏輯: {autoCell.comparison === 'above' ? '高於' : '低於'}{' '}
                    {autoCell.sensor === 'thermal_sensor'
                      ? `${autoCell.threshold}°C`
                      : `${autoCell.threshold}kg`}
                  </div>
                </div>
              )}
              {autoCell.hasWire && (
                <div className="flex items-center gap-1.5">
                  <span>線路信號:</span>
                  <span
                    className={`font-bold ${
                      autoCell.signal ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {autoCell.signal ? '🟢 綠色 (通電/ON)' : '🔴 紅色 (斷電/OFF)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Device Configure Call-to-action button */}
        {canConfigure && onOpenConfig && (
          <div className="pt-2 border-t border-slate-700/80 mt-1 pointer-events-auto">
            <button
              onClick={onOpenConfig}
              className="w-full py-1 rounded bg-teal-800/80 hover:bg-teal-700 border border-teal-500/60 text-teal-200 text-center font-sans font-medium text-[11px] transition-colors cursor-pointer"
            >
              ⚙️ 調整此設施參數 (Configure)
            </button>
          </div>
        )}

        {/* Duplicant Near Check */}
        {dupeNear && (
          <div className="pt-2 border-t border-slate-700/80 mt-1 bg-slate-800/60 p-1.5 rounded">
            <div className="flex items-center justify-between text-yellow-300 font-semibold mb-1">
              <span>複製人: {dupeNear.name}</span>
              <span className="text-[10px] text-slate-400 capitalize">{dupeNear.state}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">氧氣呼吸量:</span>
                <span className={dupeNear.breath < 30 ? 'text-red-400 font-bold' : 'text-teal-300'}>
                  {dupeNear.breath.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    dupeNear.breath < 30 ? 'bg-red-500' : 'bg-teal-400'
                  }`}
                  style={{ width: `${dupeNear.breath}%` }}
                ></div>
              </div>
              {dupeNear.state === 'suffocating' && (
                <div className="flex items-center gap-1 text-[10px] text-red-400 font-semibold mt-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>正在窒息中！請提供氧氣！</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer: Quick Hide / Toggle Tip */}
        <div className="pt-2 border-t border-slate-800/90 mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span>按鍵</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-sans">I</kbd>
            <span>切換顯隱</span>
          </span>
          {onHide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHide();
              }}
              className="text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              隱藏方框
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
