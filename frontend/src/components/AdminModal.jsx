import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setModalOpen, loginAdmin, logoutAdmin, updateMandiPrice, clearUpdateResult } from '../store/adminSlice';
import { fetchPriceHistory, fetchLatestPrices, fetchComparisonPrices, fetchBarSummary } from '../store/pricesSlice';
import { X, Lock, Key, CheckCircle, AlertCircle, RefreshCw, Calculator, Edit3 } from 'lucide-react';

export default function AdminModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.admin.isModalOpen);
  const isAuthenticated = useSelector((state) => state.admin.isAuthenticated);
  const user = useSelector((state) => state.admin.user);
  const status = useSelector((state) => state.admin.status);
  const error = useSelector((state) => state.admin.error);

  const updateStatus = useSelector((state) => state.admin.updateStatus);
  const updateError = useSelector((state) => state.admin.updateError);
  const lastUpdateResult = useSelector((state) => state.admin.lastUpdateResult);

  const crops = useSelector((state) => state.crops.list);
  const markets = useSelector((state) => state.markets.list);
  const selectedCropId = useSelector((state) => state.crops.selectedCropId);
  const selectedMarketId = useSelector((state) => state.markets.selectedMarketId);
  const selectedCompareMarketIds = useSelector((state) => state.markets.selectedCompareMarketIds);
  const selectedRange = useSelector((state) => state.prices.selectedRange);

  // Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const [editCropId, setEditCropId] = useState(selectedCropId || (crops[0]?.id || 1));
  const [editMarketId, setEditMarketId] = useState(selectedMarketId || (markets[0]?.id || 1));
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    await dispatch(loginAdmin({ username, password }));
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!editPrice || Number(editPrice) <= 0) return;

    const resAction = await dispatch(
      updateMandiPrice({
        cropId: Number(editCropId),
        marketId: Number(editMarketId),
        price: Number(editPrice),
        recordedDate: editDate,
      })
    );

    if (updateMandiPrice.fulfilled.match(resAction)) {
      // Trigger global refresh of history, cached latest prices, and bar summary
      dispatch(fetchPriceHistory({ cropId: Number(editCropId), marketId: Number(editMarketId), range: selectedRange }));
      dispatch(fetchLatestPrices(Number(editCropId)));
      dispatch(fetchBarSummary(Number(editCropId)));
      if (selectedCompareMarketIds.length > 0) {
        dispatch(fetchComparisonPrices({ cropId: Number(editCropId), marketIds: selectedCompareMarketIds, range: selectedRange }));
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel glow-emerald"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          border: '1px solid var(--accent-emerald)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            dispatch(clearUpdateResult());
            dispatch(setModalOpen(false));
          }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {!isAuthenticated ? (
          /* LOGIN FORM */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: '#fff',
                }}
              >
                <Lock size={26} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>Admin Authentication</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Log in to update today's crop prices across mandis
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Default Credentials: <code>admin</code> / <code>admin123</code>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {status === 'loading' ? <RefreshCw size={16} className="spinner" /> : <Key size={16} />}
                Sign In as Admin
              </button>
            </form>
          </div>
        ) : (
          /* ADMIN PRICE UPDATE PANEL */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 color="#10b981" size={20} /> Today's Mandi Price Manager
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Logged in as <strong>{user?.username || 'Admin'}</strong>
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => dispatch(logoutAdmin())}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >
                Sign Out
              </button>
            </div>

            {/* Recalculation Alert Success Notification */}
            {lastUpdateResult && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16} /> Price Updated & Average Recalculated!
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#f8fafc' }}>
                  {lastUpdateResult.message}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px' }}>
                    <Calculator size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    New Crop Avg: <strong>₹{lastUpdateResult.recalculated_average_price}</strong>
                  </span>
                  <span style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px' }}>
                    Total Mandis: {lastUpdateResult.mandis_count}
                  </span>
                </div>
              </div>
            )}

            {updateError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} /> {updateError}
              </div>
            )}

            <form onSubmit={handlePriceUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Crop Commodity</label>
                <select
                  className="form-select"
                  value={editCropId}
                  onChange={(e) => setEditCropId(Number(e.target.value))}
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Mandi / Market</label>
                <select
                  className="form-select"
                  value={editMarketId}
                  onChange={(e) => setEditMarketId(Number(e.target.value))}
                >
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.state})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">New Price (₹ / Quintal)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 2450.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Record Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={updateStatus === 'loading'}
              >
                {updateStatus === 'loading' ? (
                  <RefreshCw size={16} className="spinner" />
                ) : (
                  <Calculator size={16} />
                )}
                Save Price & Recalculate Averages
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
