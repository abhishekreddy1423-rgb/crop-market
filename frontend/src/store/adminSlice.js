import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

// Check persisted admin token
const savedToken = localStorage.getItem('adminToken');
const savedUser = localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')) : null;

export const loginAdmin = createAsyncThunk(
  'admin/loginAdmin',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/admin/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const updateMandiPrice = createAsyncThunk(
  'admin/updateMandiPrice',
  async ({ cropId, marketId, price, recordedDate }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/admin/prices', {
        crop_id: cropId,
        market_id: marketId,
        price,
        recorded_date: recordedDate,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update price');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    isAuthenticated: !!savedToken,
    token: savedToken || null,
    user: savedUser || null,
    isModalOpen: false,
    status: 'idle',
    updateStatus: 'idle',
    error: null,
    updateError: null,
    lastUpdateResult: null,
  },
  reducers: {
    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    logoutAdmin: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.isModalOpen = false;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    },
    clearUpdateResult: (state) => {
      state.lastUpdateResult = null;
      state.updateError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update Price
      .addCase(updateMandiPrice.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateMandiPrice.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.lastUpdateResult = action.payload;
      })
      .addCase(updateMandiPrice.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload;
      });
  },
});

export const { setModalOpen, logoutAdmin, clearUpdateResult } = adminSlice.actions;
export default adminSlice.reducer;
