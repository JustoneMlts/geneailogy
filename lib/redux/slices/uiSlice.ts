// lib/redux/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UiState {
  activeTab: string
}

// 🔄 Récupère la valeur persistée ou utilise "feed" par défaut
const persistedTab =
  typeof window !== "undefined" ? localStorage.getItem("activeTab") : null

const initialState: UiState = {
  activeTab: persistedTab || "feed",
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload

      // 💾 Sauvegarde dans localStorage pour persister entre les refresh
      if (typeof window !== "undefined") {
        localStorage.setItem("activeTab", action.payload)
      }
    },
  },
})

export const { setActiveTab } = uiSlice.actions
export const selectActiveTab = (state: any) => state.ui.activeTab
export default uiSlice.reducer
