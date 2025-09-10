import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit"
import { RootState } from "../store"
import { NotificationType } from "@/lib/firebase/models"

interface NotificationState {
  notifications: NotificationType[]
  unreadCount: number
  isLoading: boolean
  activePage: string | null   // 🔥 nouvelle propriété
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  activePage: null,
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationType[]>) => {
      const unique = new Map<string, NotificationType>()

      action.payload.forEach((n) => {
        // 🔑 on se base uniquement sur l'id Firestore
        if (n.id) {
          unique.set(n.id, n)
        } else {
          // fallback au cas où
          const key = `${n.senderId}-${n.recipientId}-${n.timestamp}`
          unique.set(key, n)
        }
      })

      state.notifications = Array.from(unique.values())
      state.unreadCount = state.notifications.filter((n) => n.unread).length
      state.isLoading = false
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload)
      if (notif && notif.unread) {
        notif.unread = false
        state.unreadCount = state.notifications.filter((n) => n.unread).length
      }
    },
    markConnectionNotificationsAsRead: (state) => {
      state.notifications = state.notifications.map((n) =>
        n.type === "connection" ? { ...n, unread: false } : n
      )
      state.unreadCount = state.notifications.filter((n) => n.unread).length
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
      state.isLoading = false
    },
    // 🔥 nouvelle action
    setActivePage: (state, action: PayloadAction<string | null>) => {
      state.activePage = action.payload
    },
  },
})

export const {
  setNotifications,
  markAsRead,
  clearNotifications,
  markConnectionNotificationsAsRead,
  setActivePage,
} = notificationSlice.actions

// --- Selectors existants ---
export const selectNotifications = (state: RootState) => state.notifications.notifications
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount
export const selectNotifLoading = (state: RootState) => state.notifications.isLoading
export const selectActivePage = (state: RootState) => state.notifications.activePage // 🔥 nouveau sélecteur

// --- Nouveaux Selectors pour trier par type ---
export const selectUnreadByType = (type: string) =>
  createSelector([selectNotifications], (notifications) =>
    notifications.filter((n) => n.unread && n.type === type).length
  )

// Sélecteurs pratiques pour messages et connexions
export const selectUnreadMessagesCount = selectUnreadByType("message")
export const selectUnreadConnectionsCount = createSelector(
  [selectNotifications],
  (notifications) => {
    const unique = new Map<string, boolean>()

    notifications.forEach((n) => {
      if (n.type === "connection" && n.unread) {
        const key = `${n.senderId}-${n.recipientId}`
        unique.set(key, true)
      }
    })

    return unique.size
  }
)

export default notificationSlice.reducer
