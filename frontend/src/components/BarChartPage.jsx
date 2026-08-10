import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { fetchBarSummary } from '../store/pricesSlice';
import { BarChart3, TrendingUp, Award, Layers, Calculator } from 'lucide-react';

const CustomBarTooltip = ({ active, payload, label, unit, averagePrice }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const price = Number(data.price);
    const diff = (price - averagePrice).toFixed(2);
    const isAbove = price >= averagePrice;

    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#f8fafc',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
          📍 {data.market_name} ({data.state})
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>
          ₹{price.toLocaleString('en-IN')}{' '}
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>/ {unit}</span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '6px', color: isAbove ? '#f59e0b' : '#38bdf8' }}>
          {isAbove ? `▲ +₹${diff} above average` : `▼ ₹${Math.abs(diff)} below average`}
        </div>
      </div>
    );
  }
  return null;
};

export default function BarChartPage() {
  const dispatch = useDispatch();
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const crops = useSelector((state) => state.crops.list);
  const barSummary = useSelector((state) => state.prices.barSummary);
  const status = useSelector((state) => state.prices.barSummaryStatus);

  const currentCrop = crops.find((c) => c.id === selectedCropId);

  useEffect(() => {
    if (selectedCropId) {
      dispatch(fetchBarSummary(selectedCropId));
    }
  }, [dispatch, selectedCropId]);

  if (status === 'loading') {
    return (
      <div className="chart-card glass-panel spinner-container" style={{ minHeight: '350px' }}>
        <div className="spinner"></div>
        <p>Loading Mandi Bar Comparison & Averages...</p>
      </div>
    );
  }

  const mandisData = barSummary?.mandis || [];
  const averagePrice = barSummary?.average_price || 0.0;
  const unit = barSummary?.unit || 'Quintal';

  // Calculate highest & lowest mandi
  const pricesList = mandisData.map((m) => m.price);
  const highestPrice = pricesList.length > 0 ? Math.max(...pricesList) : 0;
  const lowestPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;
  const highestMandi = mandisData.find((m) => m.price === highestPrice);
  const lowestMandi = mandisData.find((m) => m.price === lowestPrice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Bar Page Header Cards */}
      <div className="stat-cards-grid">
        {/* Card 1: Calculated Average Price */}
        <div className="stat-card glass-panel glow-emerald">
          <div className="stat-card-header">
            <span className="stat-card-title">Calculated National Average</span>
            <span className="stat-card-badge badge-positive">
              <Calculator size={14} /> Recalculated
            </span>
          </div>
          <div className="stat-card-value" style={{ color: '#10b981' }}>
            ₹{Number(averagePrice).toLocaleString('en-IN')}
            <span className="stat-card-unit"> / {unit}</span>
          </div>
          <div className="stat-card-sub">
            Mean mandi price across {mandisData.length} active markets
          </div>
        </div>

        {/* Card 2: Highest Mandi Price */}
        <div className="stat-card glass-panel">
          <div className="stat-card-header">
            <span className="stat-card-title">Highest Priced Mandi</span>
            <span className="stat-card-badge badge-positive">
              <Award size={14} /> Peak
            </span>
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            ₹{Number(highestPrice).toLocaleString('en-IN')}
          </div>
          <div className="stat-card-sub">
            {highestMandi ? `${highestMandi.market_name} (${highestMandi.state})` : 'N/A'}
          </div>
        </div>

        {/* Card 3: Lowest Mandi Price */}
        <div className="stat-card glass-panel">
          <div className="stat-card-header">
            <span className="stat-card-title">Lowest Priced Mandi</span>
            <span className="stat-card-badge badge-neutral">
              <TrendingUp size={14} /> Floor
            </span>
          </div>
          <div className="stat-card-value" style={{ color: '#38bdf8' }}>
            ₹{Number(lowestPrice).toLocaleString('en-IN')}
          </div>
          <div className="stat-card-sub">
            {lowestMandi ? `${lowestMandi.market_name} (${lowestMandi.state})` : 'N/A'}
          </div>
        </div>

        {/* Card 4: Markets Count */}
        <div className="stat-card glass-panel">
          <div className="stat-card-header">
            <span className="stat-card-title">Tracked Mandis</span>
            <span className="stat-card-badge badge-neutral">
              <Layers size={14} /> Markets
            </span>
          </div>
          <div className="stat-card-value" style={{ color: '#cbd5e1' }}>
            {mandisData.length}
          </div>
          <div className="stat-card-sub">
            Coverage for {currentCrop?.name || 'Selected Crop'}
          </div>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="chart-card glass-panel glow-emerald">
        <div className="card-title-bar">
          <div className="card-title">
            <BarChart3 color="#10b981" size={22} />
            Mandi Price Distribution Bar Chart — {currentCrop?.name || 'Crop'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            📊 Average Reference Line: <strong style={{ color: '#10b981' }}>₹{averagePrice}</strong> / {unit}
          </div>
        </div>

        <div style={{ width: '100%', height: '420px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mandisData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="market_name"
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip content={<CustomBarTooltip unit={unit} averagePrice={averagePrice} />} />

              {/* National Average Reference Line */}
              <ReferenceLine
                y={averagePrice}
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="6 6"
                label={{
                  value: `National Avg: ₹${averagePrice}`,
                  fill: '#34d399',
                  position: 'top',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />

              {/* Bar items with dynamic color fills */}
              <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                {mandisData.map((entry, index) => {
                  const isAbove = entry.price >= averagePrice;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isAbove ? 'url(#aboveGradient)' : 'url(#belowGradient)'}
                    />
                  );
                })}
              </Bar>

              <defs>
                <linearGradient id="aboveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="belowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#10b981', display: 'inline-block' }}></span>
            <span>Mandi Price &ge; Average</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#3b82f6', display: 'inline-block' }}></span>
            <span>Mandi Price &lt; Average</span>
          </div>
        </div>
      </div>
    </div>
  );
}
