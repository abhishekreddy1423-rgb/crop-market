import React from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp, TrendingDown, Minus, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCards() {
  const history = useSelector((state) => state.prices.history);
  const latestList = useSelector((state) => state.prices.latest);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);
  const crops = useSelector((state) => state.crops.list);
  const markets = useSelector((state) => state.markets.list);

  const currentCrop = crops.find((c) => c.id === selectedCropId);
  const currentMarket = markets.find((m) => m.id === selectedMarketId);

  // Find latest record for selected crop & market from latestList or history
  const latestMatch = latestList.find(
    (item) => item.crop_id === selectedCropId && item.market_id === selectedMarketId
  ) || (history.length > 0 ? history[history.length - 1] : null);

  const latestPrice = latestMatch ? latestMatch.price : (history.length > 0 ? history[history.length - 1].price : 0);
  const changePct = latestMatch?.change_pct !== undefined ? latestMatch.change_pct : (() => {
    if (history.length >= 2) {
      const prev = history[history.length - 2].price;
      const curr = history[history.length - 1].price;
      return prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(2)) : 0;
    }
    return 0;
  })();

  // Calculate highest & lowest in active history
  const pricesInHistory = history.map((h) => Number(h.price));
  const maxPrice = pricesInHistory.length > 0 ? Math.max(...pricesInHistory) : latestPrice;
  const minPrice = pricesInHistory.length > 0 ? Math.min(...pricesInHistory) : latestPrice;
  const avgPrice = pricesInHistory.length > 0 
    ? (pricesInHistory.reduce((a, b) => a + b, 0) / pricesInHistory.length).toFixed(1) 
    : latestPrice;

  const isPositive = changePct > 0;
  const isNegative = changePct < 0;

  return (
    <div className="stat-cards-grid">
      {/* Card 1: Latest Price */}
      <div className="stat-card glass-panel glow-emerald">
        <div className="stat-card-header">
          <span className="stat-card-title">Latest Market Price</span>
          <span className={`stat-card-badge ${isPositive ? 'badge-positive' : isNegative ? 'badge-negative' : 'badge-neutral'}`}>
            {isPositive && <TrendingUp size={14} />}
            {isNegative && <TrendingDown size={14} />}
            {!isPositive && !isNegative && <Minus size={14} />}
            {changePct > 0 ? `+${changePct}%` : `${changePct}%`} vs yesterday
          </span>
        </div>
        <div className="stat-card-value">
          ₹{Number(latestPrice).toLocaleString('en-IN')}
          <span className="stat-card-unit"> / {currentCrop?.unit || 'Quintal'}</span>
        </div>
        <div className="stat-card-sub">
          {currentCrop?.name || 'Crop'} @ {currentMarket?.name || 'Mandi'}
        </div>
      </div>

      {/* Card 2: Peak High Price */}
      <div className="stat-card glass-panel">
        <div className="stat-card-header">
          <span className="stat-card-title">Peak Range High</span>
          <span className="stat-card-badge badge-positive">
            <ArrowUpRight size={14} /> High
          </span>
        </div>
        <div className="stat-card-value" style={{ color: '#34d399' }}>
          ₹{Number(maxPrice).toLocaleString('en-IN')}
        </div>
        <div className="stat-card-sub">
          Maximum recorded in selected timeframe
        </div>
      </div>

      {/* Card 3: Floor Low Price */}
      <div className="stat-card glass-panel">
        <div className="stat-card-header">
          <span className="stat-card-title">Floor Range Low</span>
          <span className="stat-card-badge badge-negative">
            <ArrowDownRight size={14} /> Low
          </span>
        </div>
        <div className="stat-card-value" style={{ color: '#fb7185' }}>
          ₹{Number(minPrice).toLocaleString('en-IN')}
        </div>
        <div className="stat-card-sub">
          Minimum recorded in selected timeframe
        </div>
      </div>

      {/* Card 4: Average Price */}
      <div className="stat-card glass-panel">
        <div className="stat-card-header">
          <span className="stat-card-title">Period Average</span>
          <span className="stat-card-badge badge-neutral">
            <Activity size={14} /> Avg
          </span>
        </div>
        <div className="stat-card-value" style={{ color: '#60a5fa' }}>
          ₹{Number(avgPrice).toLocaleString('en-IN')}
        </div>
        <div className="stat-card-sub">
          Weighted mean price across selected period
        </div>
      </div>
    </div>
  );
}
