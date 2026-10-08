import React from 'react';
import {
  PipeCellData,
  AutomationCellData,
  MaterialKey,
  GateDirection,
  CellData,
  MATERIALS
} from '../types/simulation';
import { X, Sliders, Thermometer, Gauge, Filter, Zap, Clock } from 'lucide-react';

interface DeviceConfigPopoverProps {
  coord: { x: number; y: number } | null;
  cell: CellData | null;
  pipeCell: PipeCellData | null;
  autoCell: AutomationCellData | null;
  onClose: () => void;
  onUpdateSensor: (comparison: 'above' | 'below', threshold: number) => void;
  onUpdateFilter: (target: MaterialKey) => void;
  onUpdateGate?: (gateDir: GateDirection, bufferDelayTicks?: number) => void;
}

export const DeviceConfigPopover: React.FC<DeviceConfigPopoverProps> = ({
  coord,
  cell,
  pipeCell,
  autoCell,
  onClose,
  onUpdateSensor,
  onUpdateFilter,
  onUpdateGate
}) => {
  if (!coord) return null;

  const hasSensor = autoCell && autoCell.sensor !== 'none';
  const hasFilter = pipeCell && pipeCell.building === 'gas_filter';
  const hasGate = autoCell && autoCell.gate !== 'none';

  if (!hasSensor && !hasFilter && !hasGate) return null;

  return (
    <div className="absolute top-14 left-4 z-40 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-slate-100 font-sans text-xs w-80 backdrop-blur select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-teal-300">
          <Sliders className="w-4 h-4 text-teal-400" />
          <span>設施參數設定 [{coord.x}, {coord.y}]</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logic Gate Configuration */}
      {hasGate && autoCell && onUpdateGate && (
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            {autoCell.gate === 'not_gate' ? (
              <>
                <Zap className="w-4 h-4 text-amber-400" />
                <span>非門 (NOT Gate / Inverter)</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>緩衝門 (Buffer Gate / Delay)</span>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {autoCell.gate === 'not_gate'
              ? '將輸入信號反相：輸入為綠燈（ON）時輸出紅燈（OFF）；輸入為紅燈時輸出綠燈。'
              : '脈衝展寬與延遲：當輸入信號轉為紅燈後，維持輸出綠燈達設定刻數，提供穩定的脈衝寬度控制。'}
          </p>

          {/* Direction selector */}
          <div>
            <span className="text-slate-400 block mb-1">信號流向 (方向):</span>
            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded border border-slate-700">
              <button
                onClick={() => onUpdateGate('left_to_right', autoCell.bufferDelayTicks)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  (autoCell.gateDir || 'left_to_right') === 'left_to_right'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                左 → 右 (Left to Right)
              </button>
              <button
                onClick={() => onUpdateGate('up_to_down', autoCell.bufferDelayTicks)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  autoCell.gateDir === 'up_to_down'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                上 → 下 (Up to Down)
              </button>
              <button
                onClick={() => onUpdateGate('right_to_left', autoCell.bufferDelayTicks)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  autoCell.gateDir === 'right_to_left'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                右 → 左 (Right to Left)
              </button>
              <button
                onClick={() => onUpdateGate('down_to_up', autoCell.bufferDelayTicks)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  autoCell.gateDir === 'down_to_up'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                下 → 上 (Down to Up)
              </button>
            </div>
          </div>

          {/* Buffer Gate Duration Slider */}
          {autoCell.gate === 'buffer_gate' && (
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>延遲展寬刻數 (Ticks):</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {autoCell.bufferDelayTicks || 30} ticks (~{((autoCell.bufferDelayTicks || 30) / 30).toFixed(1)}s)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={autoCell.bufferDelayTicks || 30}
                onChange={(e) =>
                  onUpdateGate(autoCell.gateDir || 'left_to_right', parseInt(e.target.value))
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex gap-1 mt-1.5">
                {[10, 20, 30, 60, 90].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onUpdateGate(autoCell.gateDir || 'left_to_right', preset)}
                    className="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 font-mono"
                  >
                    {preset}t
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Gate Status Preview */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              輸入: {autoCell.gateInputSignal ? '🟢 (ON)' : '🔴 (OFF)'}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              輸出: {autoCell.signal ? '🟢 (ON)' : '🔴 (OFF)'}
            </span>
          </div>
        </div>
      )}

      {/* Sensor Configuration */}
      {hasSensor && autoCell && cell && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            {autoCell.sensor === 'thermal_sensor' ? (
              <>
                <Thermometer className="w-4 h-4" />
                <span>溫度傳感器 (Thermal Sensor)</span>
              </>
            ) : (
              <>
                <Gauge className="w-4 h-4" />
                <span>氣壓/質量傳感器 (Pressure Sensor)</span>
              </>
            )}
          </div>

          {/* Condition selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">觸發條件:</span>
            <div className="flex bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                onClick={() => onUpdateSensor('above', autoCell.threshold)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  autoCell.comparison === 'above'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                高於 (&gt;)
              </button>
              <button
                onClick={() => onUpdateSensor('below', autoCell.threshold)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  autoCell.comparison === 'below'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                低於 (&lt;)
              </button>
            </div>
          </div>

          {/* Threshold value input */}
          {autoCell.sensor === 'thermal_sensor' ? (
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>設定臨界溫度:</span>
                <span className="text-amber-300 font-mono font-bold">
                  {autoCell.threshold.toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="120"
                step="1"
                value={autoCell.threshold}
                onChange={(e) =>
                  onUpdateSensor(autoCell.comparison, parseFloat(e.target.value))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[0, 18, 25, 40, 95].map((presetT) => (
                  <button
                    key={presetT}
                    onClick={() => onUpdateSensor(autoCell.comparison, presetT)}
                    className="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 font-mono"
                  >
                    {presetT}°C
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>設定臨界氣壓 / 質量:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  {autoCell.threshold > 10
                    ? `${autoCell.threshold.toFixed(0)} kPa (~${(autoCell.threshold / 72.3).toFixed(2)} kg)`
                    : `${autoCell.threshold.toFixed(2)} kg (~${(autoCell.threshold * 72.3).toFixed(0)} kPa)`}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={autoCell.threshold > 10 ? autoCell.threshold : autoCell.threshold * 72.3}
                onChange={(e) =>
                  onUpdateSensor(autoCell.comparison, parseFloat(e.target.value))
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex gap-1.5 mt-1.5">
                {[50, 101, 150, 220].map((presetKPa) => (
                  <button
                    key={presetKPa}
                    onClick={() => onUpdateSensor(autoCell.comparison, presetKPa)}
                    className="flex-1 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 font-mono"
                  >
                    {presetKPa}kPa
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Live State Preview */}
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-400">
              目前實測:{' '}
              {autoCell.sensor === 'thermal_sensor'
                ? `${cell.temp.toFixed(1)}°C`
                : `${(cell.pressure ?? 101.3).toFixed(1)}kPa / ${cell.mass.toFixed(2)}kg`}
            </span>
            <span
              className={`font-bold flex items-center gap-1 ${
                autoCell.signal ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  autoCell.signal ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              ></span>
              {autoCell.signal ? '綠燈 (ON/啟動)' : '紅燈 (OFF/待機)'}
            </span>
          </div>
        </div>
      )}

      {/* Gas Filter Configuration */}
      {hasFilter && pipeCell && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 font-semibold text-teal-300">
            <Filter className="w-4 h-4" />
            <span>氣體過濾機 (Gas Filter)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            選擇要過濾分流的目標氣體。符合的氣體會分流至垂直管道（Filtered Port），其他氣體沿水平管道通行（Pass-Through Port）。
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['co2', 'oxygen', 'hydrogen', 'methane', 'steam'] as MaterialKey[]).map((matKey) => {
              const m = MATERIALS[matKey];
              const isSelected = (pipeCell.filterTarget || 'co2') === matKey;
              return (
                <button
                  key={matKey}
                  onClick={() => onUpdateFilter(matKey)}
                  className={`p-1.5 rounded border text-left flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-teal-900/60 border-teal-400 text-teal-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: `rgb(${m.color.join(',')})` }}
                  ></span>
                  <div className="min-w-0">
                    <div className="font-medium text-[11px] truncate">{m.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{m.nameEn}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

