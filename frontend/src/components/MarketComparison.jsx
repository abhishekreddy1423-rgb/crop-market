import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { toggleCompareMarketId } from '../store/marketsSlice';
import { GitCompare, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const MARKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function MarketComparison() {
  const dispatch = useDispatch();
  const markets = useSelector((state) => state.markets.list);
  const selectedCompareMarketIds = useSelector((state) => state.markets.selectedCompareMarketIds);
  const comparisonData = useSelector((state) => state.prices.comparison);
  const status = useSelector((state) => state.prices.comparisonStatus);
  const crops = useSelector((state) => state.crops.list);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);

  const currentCrop = crops.find((c) => c.id === selectedCropId);

  const handleToggle = (mId) => {
    dispatch(toggleCompareMarketId(mId));
  };

  const formattedChartData = comparisonData.map((d) => {
    let displayDate = d.date;
    try {
      displayDate = format(parseISO(d.date), 'dd MMM');
    } catch (e) {
      displayDate = d.date;
    }
    return {
      ...d,
      displayDate,
    };
  });

  return (
    <div className="chart-card glass-panel">
      <div className="card-title-bar">
        <div className="card-title">
          <GitCompare color="#3b82f6" size={20} />
          Side-by-Side Market Price Comparison
        </div>
      </div>

      <div className="comparison-container">
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Select 2 to 4 mandis below to overlay price trajectories for {currentCrop?.name || 'this crop'}:
        </p>

        {/* Mandi Selection Chips */}
        <div className="market-chip-list">
          {markets.map((m) => {
            const isSelected = selectedCompareMarketIds.includes(m.id);
            return (
              <div
                key={m.id}
                className={`market-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggle(m.id)}
              >
                {isSelected && <CheckCircle2 size={13} color="#10b981" />}
                {m.name} ({m.state})
              </div>
            );
          })}
        </div>

        {/* Multi-Line Chart */}
        {status === 'loading' ? (
          <div className="spinner-container" style={{ minHeight: '260px' }}>
            <div className="spinner"></div>
            <p>Loading multi-market comparison...</p>
          </div>
        ) : formattedChartData.length === 0 ? (
          <div className="spinner-container" style={{ minHeight: '260px' }}>
            <p>Select at least one market above to view comparative lines.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="displayDate" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(59, 130, 246, 0.4)',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                  formatter={(val, name, props) => {
                    const mId = name.replace('market_', '');
                    const mName = props.payload[`name_${mId}`] || `Market ${mId}`;
                    return [`₹${val}`, mName];
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                {selectedCompareMarketIds.map((mId, index) => {
                  const mObj = markets.find((m) => m.id === mId);
                  const color = MARKET_COLORS[index % MARKET_COLORS.length];
                  return (
                    <Line
                      key={mId}
                      type="monotone"
                      dataKey={`market_${mId}`}
                      name={mObj ? mObj.name : `Market ${mId}`}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
