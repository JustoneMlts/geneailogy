import { configureStore } from '@reduxjs/toolkit'
import currentUserReducer from '../slices/currentUserSlice'

export const store = configureStore({
  reducer: {
    user: currentUserReducer,
  },
})

// Types utiles (si tu utilises TypeScript)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
