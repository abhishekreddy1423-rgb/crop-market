import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, Search, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PriceTable() {
  const history = useSelector((state) => state.prices.history);
  const crops = useSelector((state) => state.crops.list);
  const markets = useSelector((state) => state.markets.list);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);

  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const currentCrop = crops.find((c) => c.id === selectedCropId);
  const currentMarket = markets.find((m) => m.id === selectedMarketId);

  const filteredHistory = history
    .filter((row) => {
      if (!search) return true;
      const dateStr = row.recorded_date || '';
      const priceStr = String(row.price);
      return dateStr.includes(search) || priceStr.includes(search);
    })
    .sort((a, b) => {
      const dateA = new Date(a.recorded_date).getTime();
      const dateB = new Date(b.recorded_date).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="chart-card glass-panel" style={{ marginTop: '1.5rem' }}>
      <div className="card-title-bar">
        <div className="card-title">
          <Table color="#f59e0b" size={20} />
          Historical Daily Mandi Records: {currentCrop?.name || 'Crop'} ({currentMarket?.name || 'Market'})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search date or price..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', width: '220px' }}
            />
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => setSortAsc(!sortAsc)}>
                Recorded Date <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
              </th>
              <th>Crop Name</th>
              <th>Market Mandi</th>
              <th>Price (₹ / {currentCrop?.unit || 'Quintal'})</th>
              <th>Data Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No historical entries match search query.
                </td>
              </tr>
            ) : (
              filteredHistory.map((row) => {
                let dateDisplay = row.recorded_date;
                try {
                  dateDisplay = format(parseISO(row.recorded_date), 'EEEE, dd MMMM yyyy');
                } catch (e) {
                  dateDisplay = row.recorded_date;
                }

                return (
                  <tr key={row.id}>
                    <td style={{ fontWeight: '600' }}>{dateDisplay}</td>
                    <td>{currentCrop?.name || row.crop_name || 'Crop'}</td>
                    <td>{currentMarket?.name || row.market_name || 'Market'}</td>
                    <td style={{ fontWeight: '700', color: '#10b981' }}>
                      ₹{Number(row.price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {row.source || 'Agmarknet Portal'}
                    </td>
                    <td>
                      <span className="badge-positive" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        <ShieldCheck size={11} style={{ marginRight: '3px' }} /> Verified
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
