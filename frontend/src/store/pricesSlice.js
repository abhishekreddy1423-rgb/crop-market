import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchPriceHistory = createAsyncThunk(
  'prices/fetchPriceHistory',
  async ({ cropId, marketId, range }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/prices', {
        params: { crop_id: cropId, market_id: marketId, range },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchLatestPrices = createAsyncThunk(
  'prices/fetchLatestPrices',
  async (cropId, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/prices/latest', {
        params: cropId ? { crop_id: cropId } : {},
      });
      return response.data; // { source: 'cache'|'database', data: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchComparisonPrices = createAsyncThunk(
  'prices/fetchComparisonPrices',
  async ({ cropId, marketIds, range }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/prices/compare', {
        params: {
          crop_id: cropId,
          market_ids: marketIds.join(','),
          range,
        },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchBarSummary = createAsyncThunk(
  'prices/fetchBarSummary',
  async (cropId, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/prices/bar-summary', {
        params: cropId ? { crop_id: cropId } : {},
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const triggerSeedData = createAsyncThunk('prices/triggerSeedData', async () => {
  const response = await api.post('/api/seed');
  return response.data;
});

export const triggerDailyFetch = createAsyncThunk('prices/triggerDailyFetch', async () => {
  const response = await api.post('/api/seed');
  return response.data;
});

const pricesSlice = createSlice({
  name: 'prices',
  initialState: {
    history: [],
    historyStatus: 'idle',
    latest: [],
    latestSource: 'database',
    latestStatus: 'idle',
    comparison: [],
    comparisonStatus: 'idle',
    barSummary: null,
    barSummaryStatus: 'idle',
    selectedRange: '30d',
    error: null,
  },
  reducers: {
    setSelectedRange: (state, action) => {
      state.selectedRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Price History
      .addCase(fetchPriceHistory.pending, (state) => {
        state.historyStatus = 'loading';
      })
      .addCase(fetchPriceHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.history = action.payload;
      })
      .addCase(fetchPriceHistory.rejected, (state, action) => {
        state.historyStatus = 'failed';
        state.error = action.payload;
      })

      // Latest Prices (Redis cached)
      .addCase(fetchLatestPrices.pending, (state) => {
        state.latestStatus = 'loading';
      })
      .addCase(fetchLatestPrices.fulfilled, (state, action) => {
        state.latestStatus = 'succeeded';
        state.latest = action.payload.data || [];
        state.latestSource = action.payload.source || 'database';
      })
      .addCase(fetchLatestPrices.rejected, (state, action) => {
        state.latestStatus = 'failed';
        state.error = action.payload;
      })

      // Market Comparison
      .addCase(fetchComparisonPrices.pending, (state) => {
        state.comparisonStatus = 'loading';
      })
      .addCase(fetchComparisonPrices.fulfilled, (state, action) => {
        state.comparisonStatus = 'succeeded';
        state.comparison = action.payload;
      })
      .addCase(fetchComparisonPrices.rejected, (state, action) => {
        state.comparisonStatus = 'failed';
        state.error = action.payload;
      })

      // Bar Summary
      .addCase(fetchBarSummary.pending, (state) => {
        state.barSummaryStatus = 'loading';
      })
      .addCase(fetchBarSummary.fulfilled, (state, action) => {
        state.barSummaryStatus = 'succeeded';
        state.barSummary = action.payload;
      })
      .addCase(fetchBarSummary.rejected, (state, action) => {
        state.barSummaryStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setSelectedRange } = pricesSlice.actions;
export default pricesSlice.reducer;

