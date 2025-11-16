import { configureStore, combineReducers } from "@reduxjs/toolkit"
import currentUserReducer from "../slices/currentUserSlice"
import notificationReducer from "../slices/notificationSlice"
import uiReducer from "../slices/uiSlice"
import connectionsReducer from "../slices/connectionsSlice"
import usersLiveReducer from "../slices/usersLiveSlice"
import friendsReducer from "../slices/friendsSlice"

import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage"

const rootReducer = combineReducers({
  connections: connectionsReducer,
  ui: uiReducer,
  user: currentUserReducer,
  usersLive: usersLiveReducer,
  notifications: notificationReducer,
  friends: friendsReducer, 
  
})

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"], // ⚠️ tu ne persistes pas les notifs (elles viennent de Firestore en temps réel)
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
