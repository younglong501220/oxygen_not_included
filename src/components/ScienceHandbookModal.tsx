import React from 'react';
import { X, BookOpen, Flame, Droplets, Wind, Cpu, ShieldCheck, Eye } from 'lucide-react';

interface ScienceHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScienceHandbookModal: React.FC<ScienceHandbookModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-teal-300">《缺氧》底層物理引擎科學手冊</h2>
              <p className="text-xs text-slate-400">Thermodynamics & Cellular Automata Engine Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1: Cellular Automata & Buoyancy */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>1. 二維細胞自動機氣液分離與浮力排序</span>
            </div>
            <p>
              本系統中每個格子皆具有真實物理質量（Mass）與密度（Density）。每幀進行垂直掃描時，依據阿基米德浮力與重力排序進行位置對調（Density Sort）：
            </p>
            <div className="bg-slate-900/80 p-2.5 rounded font-mono text-[11px] text-teal-200">
              氣體密度排序：氫氣 H₂ (0.09) &lt; 蒸汽 Steam (0.59) &lt; 氧氣 O₂ (1.42) &lt; 二氧化碳 CO₂ (1.98)
            </div>
            <p>
              • <strong>天然氣體分層</strong>：超輕的氫氣會自動翻湧至天花板聚集；沉重的二氧化碳會迅速沉降至基地底部坑洞。
              <br />
              • <strong>靜水壓橫向鋪平</strong>：液體受阻擋時，透過橫向分壓平衡公式 <code className="text-teal-300 font-mono">ΔM = (M₁ - M₂) × 0.25</code> 均勻流動，形成平整的水平面。
            </p>
          </div>

          {/* Section 2: Fourier Conduction & Insulation */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>2. 傅立葉熱傳導方程式與調和平均數隔熱原理</span>
            </div>
            <p>
              任意相鄰兩格子之間，每幀依據熱傳導率與溫度差進行熱量傳遞：
            </p>
            <div className="bg-slate-900/80 p-2.5 rounded font-mono text-[11px] text-amber-200 space-y-1">
              <div>熱流通量 dQ = k_harmonic · (T_neighbor - T_self) · dt</div>
              <div>調和平均導熱係數 k_harmonic = (2 · k₁ · k₂) / (k₁ + k₂)</div>
              <div>溫差變化 ΔT = dQ / (比熱容 SHC · 質量 Mass)</div>
            </div>
            <p>
              • <strong>隔熱磚的神奇功效</strong>：由於採用調和平均數（Harmonic Mean），只要其中一側是隔熱磚（k = 0.0001），相鄰計算後的綜合導熱係數就會直接暴跌至趨近於零，成功封鎖高溫蒸氣或極寒冰原！
            </p>
          </div>

          {/* Section 3: Phase Change */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span>3. 熱力學狀態相變循環 (Phase Change)</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong className="text-cyan-300">冰塊融化 (0°C)</strong>：冰磚吸收周圍熱量，溫度超過 0°C 即時融化為等質量的常溫水。
              </li>
              <li>
                <strong className="text-red-300">水沸騰蒸發 (100°C)</strong>：水受加熱器持續升溫達 100°C 時，體積膨脹相變為高溫水蒸氣，向上疾馳。
              </li>
              <li>
                <strong className="text-blue-300">蒸氣冷凝降雨 (99°C)</strong>：蒸氣在低溫環境中散熱降溫至 99°C 以下時，凝結為液滴像雨水般落下。
              </li>
            </ul>
          </div>

          {/* Section 4: Pipe Network & Gas Filter */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>4. 圖論管線網絡與氣體過濾機 (Gas Filter)</span>
            </div>
            <p>
              管道圖層是獨立於常規物質層的覆蓋圖層（Overlay Graph）：
            </p>
            <p>
              • <strong>水泵與氣體泵 (Pumps)</strong>：主動偵測周遭液體（10kg封包）或氣體（1kg封包）封裝送入管網。
              <br />
              • <strong>管線氣壓表 (Pressure Gauge)</strong>：安裝於管線節點，即時監控管內氣體壓強，並於普通視圖與管網視圖以懸浮 HUD 標籤顯示 kPa 讀數；當氣壓超過 220 kPa 極限時觸發 ⚠️ 破裂風險（Rupture Risk）警報，防止管線超壓爆管！
              <br />
              • <strong>氣體過濾機與混氣超載 (Gas Filter & Overload)</strong>：設定過濾目標（如 CO₂）。匹配目標的氣體分流至垂直分支管道（Filtered Port），其餘氣體順著水平主線通行。若同一管段內同時湧入多種不同氣體，過濾機會呈現呼吸脈衝警示（Visual Pulse Notification），提示過濾負載過重！
              <br />
              • <strong>排液閥與排氣口 (Vents)</strong>：將終端抵達的流體封包重新釋放回環境。
            </p>
          </div>

          {/* Section 5: Automation Network, Sensors & Logic Gates */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>5. 自動化導線、邏輯門與傳感器網絡 (Automation & Logic Gates)</span>
            </div>
            <p>
              • <strong>溫度傳感器 (Thermal Sensor)</strong>：實時監測環境溫度，當滿足條件（高於或低於自定臨界值）時輸出 🟢 綠色激活信號，否則輸出 🔴 紅色待機信號。
              <br />
              • <strong>氣壓/質量傳感器 (Pressure Sensor)</strong>：實時監測格子質量氣壓，避免泵浦在氣體稀薄時空轉浪費電力。
              <br />
              • <strong>非門 / 反相門 (NOT Gate)</strong>：反轉輸入端的邏輯信號（綠變紅、紅變綠），例如將「高溫警報」反相為「低溫需要加熱」以控制加熱棒。
              <br />
              • <strong>緩衝門 (Buffer Gate)</strong>：提供脈衝寬度展寬與關閉延遲；當輸入信號轉為紅燈後，維持輸出端綠燈達指定刻數（Ticks），有效杜絕泵浦或機器因臨界震盪頻繁啟閉！
              <br />
              • <strong>自動化導線 (Automation Wire)</strong>：沿電路傳導邏輯信號，將傳感器、邏輯門與機器緊密連結，建構高度精密的閉環環境控制工程。
            </p>
          </div>

          {/* Section 6: Pressure & Volume Physics */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>6. 氣體與液體「壓力 (Pressure)」與「體積 (Volume)」物理學</span>
            </div>
            <p>
              本系統將<strong>體積 (Volume)</strong> 與 <strong>氣壓 (Pressure)</strong> 作為獨立計算變數：
            </p>
            <div className="bg-slate-900/80 p-2.5 rounded font-mono text-[11px] text-purple-200 space-y-1">
              <div>理想氣體狀態方程：P = (Mass / M_ref) · ((T + 273.15) / 293.15) · 101.3 kPa / Volume</div>
              <div>氣體擴散壓差驅動：ΔP = P_source - P_target (高壓向低壓擴散膨脹)</div>
              <div>深水靜水壓疊加：P_depth = P_surface + (Mass / 1000) · 12.0 kPa (水深水頭壓強)</div>
            </div>
            <p>
              • <strong>高壓壓縮與爆炸性膨脹</strong>：高密度或受熱氣體具備強大壓強（&gt; 250 kPa），一旦周圍出現真空或低壓洞口，高壓氣體會劇烈噴湧膨脹；小人處於超壓環境亦有耳膜破裂之警示。
              <br />
              • <strong>氣壓等壓線視圖 (Pressure Overlay)</strong>：可一鍵切換氣壓分佈圖，清晰洞察密封氣壓艙與氣閥之壓強梯度。
            </p>
          </div>

          {/* Section 7: Greenhouse Gas & Air Recirculation */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <Wind className="w-4 h-4 text-emerald-400" />
              <span>7. 溫室氣體積聚與空氣循環淨化系統 (Greenhouse & Air Recirculation)</span>
            </div>
            <p>
              • <strong>甲烷溫室效應 (Methane Greenhouse Trap)</strong>：甲烷 CH₄ 密度輕於空氣（0.717），會漂浮聚集在天花板，強力阻擋紅外熱輻射散逸，使頂部氣室溫度快速蓄積上升！
              <br />
              • <strong>天然生成機制</strong>：濃鹽污水槽有機物緩慢厭氧分解會自然析出甲烷氣泡；小人飲食消化亦會偶發放屁析出微量甲烷。
              <br />
              • <strong>空氣對流風扇 (Air Circulator)</strong>：主動推動定向風道氣流，打破頂層高溫停滯死區，均勻混合全區溫度與氣體分佈。
              <br />
              • <strong>空氣淨化機 (Air Scrubber)</strong>：催化過濾周遭 3x3 區域內之甲烷與二氧化碳，釋放清涼潔淨的 22°C 氧氣，配合自動化溫壓傳感器可打造完全自循環生態穹頂！
            </p>
          </div>

          {/* Section 8: Duplicants */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-yellow-300 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>8. 複製人（小人）呼吸與體溫機制</span>
            </div>
            <p>
              複製人（例如米普 Meep 與泡泡 Bubbles）在平台巡邏時，會自動吸入身邊的氧氣（O₂），並呼出 37°C 的二氧化碳（CO₂）。如果置身於真空、水底或二氧化碳坑中，呼吸條會持續下降；若歸零則會進入窒息危險狀態！小人身體亦會自然散發 37°C 體溫。
            </p>
          </div>

          {/* Section 9: Gas Overlay & Pressure Diffusion */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>9. 大氣成分視圖與格拉罕擴散定律 (Gas Overlay & Diffusion Speed)</span>
            </div>
            <p>
              點擊頂部<strong>「大氣」</strong>視圖可切換高對比氣體元素色彩識別層：
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px] bg-slate-900/80 p-2.5 rounded">
              <div className="flex items-center gap-1.5 text-sky-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>O₂ 氧氣 (天藍)</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span>CO₂ 二氧化碳 (碳紫)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span>H₂ 氫氣 (霓虹粉)</span>
              </div>
              <div className="flex items-center gap-1.5 text-lime-300">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400"></span>
                <span>CH₄ 甲烷 (螢光綠)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                <span>H₂O 水蒸氣 (銀白)</span>
              </div>
            </div>
            <p>
              • <strong>高壓氣袋擴散加速</strong>：物理引擎依據理想氣體狀態與格拉罕擴散定律（Graham&apos;s Law），高壓區（&gt;101.3 kPa）具備極高位能差，向相鄰低壓/真空方向多向擴散速度倍增，重現氣體爆破洩壓與衝擊波膨脹！
            </p>
          </div>

          {/* Section 10: Status Inspector Box & Controls */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
              <Eye className="w-4 h-4 text-teal-400" />
              <span>10. 狀態檢視方框與顯隱切換 (Status Inspector Box & Hotkey)</span>
            </div>
            <p>
              • <strong>右下角狀態數值方框</strong>：顯示所選/指針所指的物質（液體、氣體、固體）之質量、氣壓、體積佔比、溫度及導熱率等核心物理數值。
              <br />
              • <strong>自由顯示 / 隱藏切換</strong>：為避免遮擋遊戲圖面，您可以隨時選擇隱藏或顯示方框：
            </p>
            <ul className="list-disc list-inside text-slate-300 text-xs space-y-1 pl-1">
              <li>點擊頂部工具列<strong>「狀態方框」</strong>切換開關</li>
              <li>點擊方框右上角的眼睛圖示 <Eye className="w-3 h-3 inline text-slate-400" /> 或底部的<strong>「隱藏方框」</strong></li>
              <li>直接按下鍵盤快捷鍵 <strong>[I]</strong> 鍵即時顯隱</li>
              <li>點擊摺疊圖示縮小為單行精簡標籤（Compact Mode）</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            了解，開始模擬！
          </button>
        </div>
      </div>
    </div>
  );
};
