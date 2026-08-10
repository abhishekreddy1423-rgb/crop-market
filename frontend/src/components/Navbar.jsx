import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sprout, RefreshCw, Sun, Moon, Database, Zap, Lock, UserCheck, BarChart3, LineChart } from 'lucide-react';
import { triggerDailyFetch, fetchLatestPrices, fetchPriceHistory, fetchComparisonPrices, fetchBarSummary } from '../store/pricesSlice';
import { setModalOpen } from '../store/adminSlice';

export default function Navbar({ theme, toggleTheme, activeTab, setActiveTab }) {
  const dispatch = useDispatch();
  const latestSource = useSelector((state) => state.prices.latestSource);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);
  const selectedCompareMarketIds = useSelector((state) => state.markets.selectedCompareMarketIds);
  const selectedRange = useSelector((state) => state.prices.selectedRange);

  const isAuthenticated = useSelector((state) => state.admin.isAuthenticated);
  const user = useSelector((state) => state.admin.user);

  const [syncing, setSyncing] = React.useState(false);

  const handleSyncData = async () => {
    setSyncing(true);
    await dispatch(triggerDailyFetch());
    if (selectedCropId && selectedMarketId) {
      await dispatch(fetchPriceHistory({ cropId: selectedCropId, marketId: selectedMarketId, range: selectedRange }));
    }
    if (selectedCropId) {
      await dispatch(fetchLatestPrices(selectedCropId));
      await dispatch(fetchBarSummary(selectedCropId));
      if (selectedCompareMarketIds.length > 0) {
        await dispatch(fetchComparisonPrices({ cropId: selectedCropId, marketIds: selectedCompareMarketIds, range: selectedRange }));
      }
    }
    setTimeout(() => setSyncing(false), 800);
  };

  return (
    <nav className="navbar glass-panel glow-emerald">
      <div className="brand">
        <div className="brand-icon">
          <Sprout size={24} />
        </div>
        <div>
          <div className="brand-title">CropMarket Tracker</div>
          <div className="brand-subtitle">Agmarknet Mandi Price Intelligence</div>
        </div>
      </div>

      {/* Navigation View Mode Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <button
          className={`pill-btn ${activeTab === 'trend' ? 'active' : ''}`}
          onClick={() => setActiveTab('trend')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
        >
          <LineChart size={15} /> Trend View
        </button>
        <button
          className={`pill-btn ${activeTab === 'barchart' ? 'active' : ''}`}
          onClick={() => setActiveTab('barchart')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
        >
          <BarChart3 size={15} /> Mandi Bar View
        </button>
      </div>

      <div className="nav-actions">
        <span className="cache-badge">
          {latestSource === 'cache' ? (
            <>
              <Zap size={13} color="#60a5fa" /> Redis Cached
            </>
          ) : (
            <>
              <Database size={13} color="#94a3b8" /> PostgreSQL DB
            </>
          )}
        </span>

        {/* Admin Portal Button */}
        <button
          className={`btn ${isAuthenticated ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => dispatch(setModalOpen(true))}
          title="Admin Login & Price Editor"
        >
          {isAuthenticated ? <UserCheck size={16} /> : <Lock size={16} />}
          {isAuthenticated ? `Admin (${user?.username || 'Admin'})` : 'Admin Login'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleSyncData}
          disabled={syncing}
          title="Fetch latest daily price ingestion"
        >
          <RefreshCw size={16} className={syncing ? 'spinner' : ''} />
          {syncing ? 'Syncing...' : 'Sync Prices'}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />}
        </button>
      </div>
    </nav>
  );
}
