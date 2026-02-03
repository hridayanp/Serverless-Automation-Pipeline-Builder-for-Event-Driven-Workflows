import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { userReducer } from './slices/userSlice';
import { workflowReducer } from './slices/workflowSlice';
import connectorReducer from './slices/connectorSlice';
import { fieldReducer } from './slices/fieldSlice';

const rootReducer = {
  user: persistReducer({ key: 'user', storage }, userReducer),
  workflow: persistReducer({ key: 'workflow', storage }, workflowReducer),
  connector: persistReducer({ key: 'connector', storage }, connectorReducer),
  field: persistReducer({ key: 'field', storage }, fieldReducer),
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
