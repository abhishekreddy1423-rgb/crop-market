import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchCrops = createAsyncThunk('crops/fetchCrops', async () => {
  const response = await api.get('/api/crops');
  return response.data;
});

const cropsSlice = createSlice({
  name: 'crops',
  initialState: {
    list: [],
    selectedCropId: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    setSelectedCropId: (state, action) => {
      state.selectedCropId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrops.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCrops.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
        if (!state.selectedCropId && action.payload.length > 0) {
          state.selectedCropId = action.payload[0].id;
        }
      })
      .addCase(fetchCrops.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setSelectedCropId } = cropsSlice.actions;
export default cropsSlice.reducer;
