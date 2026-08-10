import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import StatCards from './components/StatCards';
import PriceChart from './components/PriceChart';
import MarketComparison from './components/MarketComparison';
import PriceTable from './components/PriceTable';
import BarChartPage from './components/BarChartPage';
import AdminModal from './components/AdminModal';

import { fetchCrops } from './store/cropsSlice';
import { fetchMarkets } from './store/marketsSlice';
import { fetchPriceHistory, fetchLatestPrices, fetchComparisonPrices, fetchBarSummary } from './store/pricesSlice';

export default function App() {
  const dispatch = useDispatch();
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('trend'); // 'trend' | 'barchart'

  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);
  const selectedCompareMarketIds = useSelector((state) => state.markets.selectedCompareMarketIds);
  const selectedRange = useSelector((state) => state.prices.selectedRange);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Initial load: Fetch crops and markets
  useEffect(() => {
    dispatch(fetchCrops());
    dispatch(fetchMarkets());
  }, [dispatch]);

  // Fetch price history & cached latest whenever selected Crop, Market, or Range changes
  useEffect(() => {
    if (selectedCropId && selectedMarketId) {
      dispatch(fetchPriceHistory({ cropId: selectedCropId, marketId: selectedMarketId, range: selectedRange }));
    }
  }, [dispatch, selectedCropId, selectedMarketId, selectedRange]);

  useEffect(() => {
    if (selectedCropId) {
      dispatch(fetchLatestPrices(selectedCropId));
      dispatch(fetchBarSummary(selectedCropId));
    }
  }, [dispatch, selectedCropId]);

  // Fetch side-by-side comparison whenever crop, comparison markets, or range changes
  useEffect(() => {
    if (selectedCropId && selectedCompareMarketIds.length > 0) {
      dispatch(
        fetchComparisonPrices({
          cropId: selectedCropId,
          marketIds: selectedCompareMarketIds,
          range: selectedRange,
        })
      );
    }
  }, [dispatch, selectedCropId, selectedCompareMarketIds, selectedRange]);

  return (
    <div className="app-container">
      {/* Header / Navbar with Tab Controls & Admin Portal */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Filter Controls Bar */}
      <FilterBar />

      {/* VIEW MODE SWITCHING */}
      {activeTab === 'trend' ? (
        <>
          {/* Metric Stat Cards */}
          <StatCards />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            <PriceChart />
            <MarketComparison />
          </div>

          {/* Detailed Historical Records Table */}
          <PriceTable />
        </>
      ) : (
        /* MANDI BAR CHART VIEW */
        <BarChartPage />
      )}

      {/* Admin Login & Price Manager Portal Modal */}
      <AdminModal />

      {/* App Footer */}
      <footer className="footer">
        <p>🌾 <strong>CropMarket Price Tracker</strong> &copy; {new Date().getFullYear()} — Built with Python Flask, PostgreSQL, Redis, Celery & React Redux</p>
        <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>Automated Daily Mandi Data Ingestion & Admin Management Portal</p>
      </footer>
    </div>
  );
}
