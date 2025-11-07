// lib/redux/slices/connectionsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { LinkStatus } from "@/lib/firebase/models"

export interface UserLink {
  senderId: string
  receiverId: string
  status: LinkStatus
}

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
      // Évite les doublons (peu importe le sens)
      const exists = state.links.some(
        (c) =>
          (c.senderId === action.payload.senderId &&
            c.receiverId === action.payload.receiverId) ||
          (c.senderId === action.payload.receiverId &&
            c.receiverId === action.payload.senderId)
      )
      if (!exists) {
        state.links.push(action.payload)
      }
    },

    updateConnectionStatusInStore: (
      state,
      action: PayloadAction<{ senderId: string; receiverId: string; status: LinkStatus }>
    ) => {
      const { senderId, receiverId, status } = action.payload
      state.links = state.links.map((c) =>
        (c.senderId === senderId && c.receiverId === receiverId) ||
        (c.senderId === receiverId && c.receiverId === senderId)
          ? { ...c, status }
          : c
      )
    },

    removeConnectionFromStore: (
      state,
      action: PayloadAction<{ senderId: string; receiverId: string }>
    ) => {
      const { senderId, receiverId } = action.payload
      state.links = state.links.filter(
        (c) =>
          !(
            (c.senderId === senderId && c.receiverId === receiverId) ||
            (c.senderId === receiverId && c.receiverId === senderId)
          )
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

// --- 🔍 Selectors ---
export const selectConnections = (state: RootState) => state.connections.links

export const selectPendingRequestsCount =
  (currentUserId: string) => (state: RootState) =>
    state.connections.links.filter(
      (c) => c.status === "pending" && c.receiverId === currentUserId
    ).length
