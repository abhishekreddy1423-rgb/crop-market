import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCropId } from '../store/cropsSlice';
import { setSelectedMarketId } from '../store/marketsSlice';
import { setSelectedRange } from '../store/pricesSlice';
import { Wheat, Store, Calendar } from 'lucide-react';

export default function FilterBar() {
  const dispatch = useDispatch();
  const crops = useSelector((state) => state.crops.list);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const markets = useSelector((state) => state.markets.list);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);
  const selectedRange = useSelector((state) => state.prices.selectedRange);

  return (
    <div className="filter-bar glass-panel glow-emerald">
      <div className="form-group">
        <label className="form-label">
          <Wheat size={14} color="#10b981" /> Select Crop
        </label>
        <select 
          className="form-select"
          value={selectedCropId || ''}
          onChange={(e) => dispatch(setSelectedCropId(Number(e.target.value)))}
        >
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.category}) - ₹/{c.unit}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          <Store size={14} color="#3b82f6" /> Primary Mandi / Market
        </label>
        <select 
          className="form-select"
          value={selectedMarketId || ''}
          onChange={(e) => dispatch(setSelectedMarketId(Number(e.target.value)))}
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.state}, {m.district})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          <Calendar size={14} color="#f59e0b" /> Trend Date Range
        </label>
        <div className="range-pills">
          {['7d', '30d', '90d', '1y'].map((r) => (
            <button
              key={r}
              className={`pill-btn ${selectedRange === r ? 'active' : ''}`}
              onClick={() => dispatch(setSelectedRange(r))}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
