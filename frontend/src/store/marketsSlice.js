import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchMarkets = createAsyncThunk('markets/fetchMarkets', async () => {
  const response = await api.get('/api/markets');
  return response.data;
});

const marketsSlice = createSlice({
  name: 'markets',
  initialState: {
    list: [],
    selectedMarketId: null,
    selectedCompareMarketIds: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setSelectedMarketId: (state, action) => {
      state.selectedMarketId = action.payload;
    },
    toggleCompareMarketId: (state, action) => {
      const id = action.payload;
      if (state.selectedCompareMarketIds.includes(id)) {
        state.selectedCompareMarketIds = state.selectedCompareMarketIds.filter(mId => mId !== id);
      } else {
        if (state.selectedCompareMarketIds.length < 4) {
          state.selectedCompareMarketIds.push(id);
        }
      }
    },
    setCompareMarketIds: (state, action) => {
      state.selectedCompareMarketIds = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkets.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMarkets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
        if (!state.selectedMarketId && action.payload.length > 0) {
          state.selectedMarketId = action.payload[0].id;
        }
        if (state.selectedCompareMarketIds.length === 0 && action.payload.length >= 2) {
          state.selectedCompareMarketIds = [action.payload[0].id, action.payload[1].id];
        }
      })
      .addCase(fetchMarkets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setSelectedMarketId, toggleCompareMarketId, setCompareMarketIds } = marketsSlice.actions;
export default marketsSlice.reducer;
