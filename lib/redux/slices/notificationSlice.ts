import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { NotificationType } from "@/lib/firebase/models"

interface NotificationState {
  notifications: NotificationType[]
  unreadCount: number
  isLoading: boolean
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true,
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationType[]>) => {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter((n) => n.unread).length
      state.isLoading = false
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload)
      if (notif && notif.unread) {
        notif.unread = false
        state.unreadCount = state.notifications.filter((n) => n.unread).length
      }
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
      state.isLoading = false
    },
  },
})

export const { setNotifications, markAsRead, clearNotifications } = notificationSlice.actions

// Selectors
export const selectNotifications = (state: RootState) => state.notifications.notifications
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount
export const selectNotifLoading = (state: RootState) => state.notifications.isLoading

export default notificationSlice.reducer
