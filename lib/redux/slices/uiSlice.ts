// lib/redux/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UiState {
  activeTab: string
}

const initialState: UiState = {
  activeTab: "feed", // tab par défaut
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
    },
  },
})

export const { setActiveTab } = uiSlice.actions
export const selectActiveTab = (state: any) => state.ui.activeTab
export default uiSlice.reducer
