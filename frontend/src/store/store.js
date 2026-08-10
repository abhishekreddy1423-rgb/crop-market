import { configureStore } from '@reduxjs/toolkit';
import cropsReducer from './cropsSlice';
import marketsReducer from './marketsSlice';
import pricesReducer from './pricesSlice';
import adminReducer from './adminSlice';

export const store = configureStore({
  reducer: {
    crops: cropsReducer,
    markets: marketsReducer,
    prices: pricesReducer,
    admin: adminReducer,
  },
});

