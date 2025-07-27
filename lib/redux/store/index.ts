import { configureStore, combineReducers } from '@reduxjs/toolkit'
import currentUserReducer from '../slices/currentUserSlice'
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // par défaut localStorage pour web

// 1. Combine tes reducers (utile si tu en ajoutes plus tard)
const rootReducer = combineReducers({
  user: currentUserReducer,
})

// 2. Configuration persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // on ne persiste que la clé 'user'
}

// 3. Reducer persistant
const persistedReducer = persistReducer(persistConfig, rootReducer)

// 4. Création du store avec middleware adapté
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Nécessaire pour éviter les erreurs redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

// 5. Export du persistor
export const persistor = persistStore(store)

// 6. Types utiles
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
