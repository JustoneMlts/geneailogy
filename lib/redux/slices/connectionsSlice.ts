// lib/redux/slices/connectionsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { UserLink, LinkStatus } from "@/lib/firebase/models"

interface ConnectionsState {
  links: UserLink[]
  isLoading: boolean
}

const initialState: ConnectionsState = {
  links: [],
  isLoading: true,
}

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    setConnections: (state, action: PayloadAction<UserLink[]>) => {
      state.links = action.payload
      state.isLoading = false
    },
    clearConnections: (state) => {
      state.links = []
      state.isLoading = false
    },
    addConnection: (state, action: PayloadAction<UserLink>) => {
      // Ajoute une nouvelle connexion (optimiste)
      const exists = state.links.some(
        (c) =>
          c.userId === action.payload.userId &&
          c.senderId === action.payload.senderId
      )
      if (!exists) {
        state.links.push(action.payload)
      }
    },
    updateConnectionStatusInStore: (
      state,
      action: PayloadAction<{ userId: string; senderId: string; status: LinkStatus }>
    ) => {
      state.links = state.links.map((c) =>
        c.userId === action.payload.userId && c.senderId === action.payload.senderId
          ? { ...c, status: action.payload.status }
          : c
      )
    },
    removeConnectionFromStore: (state, action: PayloadAction<{ userId: string; senderId: string }>) => {
      state.links = state.links.filter(
        (c) => !(c.userId === action.payload.userId && c.senderId === action.payload.senderId)
      )
    },
  },
})

export const {
  setConnections,
  clearConnections,
  addConnection,
  updateConnectionStatusInStore,
  removeConnectionFromStore,
} = connectionsSlice.actions
export default connectionsSlice.reducer

// Selectors
export const selectConnections = (state: RootState) => state.connections.links

export const selectPendingRequestsCount =
  (userId: string) => (state: RootState) =>
    state.connections.links.filter(
      (c) => c.status === "pending" && c.senderId !== userId
    ).length
