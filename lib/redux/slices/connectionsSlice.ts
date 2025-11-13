import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { Links } from "@/lib/firebase/models"

interface ConnectionsState {
  items: Links[]
  isLoading: boolean
}

const initialState: ConnectionsState = {
  items: [],
  isLoading: true,
}

export const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    setConnections: (state, action: PayloadAction<Links[]>) => {
      state.items = action.payload
      state.isLoading = false
    },

    addConnection: (state, action: PayloadAction<Links>) => {
      const exists = state.items.some(l => l.linkId === action.payload.linkId)
      if (!exists) {
        state.items.push(action.payload)
      }
    },

    updateConnectionStatusInStore: (
      state,
      action: PayloadAction<{ linkId: string; status: Links["status"] }>
    ) => {
      const link = state.items.find(l => l.linkId === action.payload.linkId)
      if (link) link.status = action.payload.status
    },

    removeConnection: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(l => l.linkId !== action.payload)
    },

    clearConnections: (state) => {
      state.items = []
      state.isLoading = true
    },
  },
})

export const {
  setConnections,
  addConnection,
  updateConnectionStatusInStore,
  removeConnection,
  clearConnections,
} = connectionsSlice.actions

export const selectConnections = (state: RootState) => state.connections.items
export const selectConnectionsLoading = (state: RootState) => state.connections.isLoading

export default connectionsSlice.reducer
