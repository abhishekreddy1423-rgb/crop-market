import React from 'react';
import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let formattedDate = label;
    try {
      formattedDate = format(parseISO(label), 'dd MMM yyyy');
    } catch (e) {
      formattedDate = label;
    }

    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '10px 14px',
          color: '#f8fafc',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
          📅 {formattedDate}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#34d399' }}>
          ₹{Number(data.price).toLocaleString('en-IN')}{' '}
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>/ {unit}</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
          Source: {data.source || 'Agmarknet API'}
        </div>
      </div>
    );
  }
  return null;
};

export default function PriceChart() {
  const history = useSelector((state) => state.prices.history);
  const status = useSelector((state) => state.prices.historyStatus);
  const selectedRange = useSelector((state) => state.prices.selectedRange);
  const crops = useSelector((state) => state.crops.list);
  const markets = useSelector((state) => state.markets.list);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);

  const currentCrop = crops.find((c) => c.id === selectedCropId);
  const currentMarket = markets.find((m) => m.id === selectedMarketId);

  const formattedData = history.map((item) => {
    let displayDate = item.recorded_date;
    try {
      displayDate = format(parseISO(item.recorded_date), 'dd MMM');
    } catch (e) {
      displayDate = item.recorded_date;
    }
    return {
      ...item,
      displayDate,
      price: Number(item.price),
    };
  });

  // Determine domain bounds with buffer
  const prices = formattedData.map((d) => d.price);
  const minP = prices.length > 0 ? Math.floor(Math.min(...prices) * 0.95) : 0;
  const maxP = prices.length > 0 ? Math.ceil(Math.max(...prices) * 1.05) : 5000;

  if (status === 'loading') {
    return (
      <div className="chart-card glass-panel spinner-container">
        <div className="spinner"></div>
        <p>Fetching price history trend line...</p>
      </div>
    );
  }

  return (
    <div className="chart-card glass-panel glow-emerald">
      <div className="card-title-bar">
        <div className="card-title">
          <TrendingUp color="#10b981" size={20} />
          {currentCrop?.name || 'Crop'} Price Trend ({selectedRange.toUpperCase()})
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          📍 {currentMarket?.name}, {currentMarket?.state}
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="spinner-container" style={{ minHeight: '300px' }}>
          <Calendar size={32} color="#64748b" />
          <p>No price records found for this market and timeframe.</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                domain={[minP, maxP]}
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `₹${val}`}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip unit={currentCrop?.unit || 'Quintal'} />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#priceGradient)"
                activeDot={{ r: 7, fill: '#34d399', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
