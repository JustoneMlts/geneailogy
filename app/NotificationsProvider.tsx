"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import Snackbar from "@mui/material/Snackbar"
import Slide from "@mui/material/Slide"
import SnackbarContent from "@mui/material/SnackbarContent"
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { setNotifications, clearNotifications } from "../lib/redux/slices/notificationSlice"
import { selectNotifications } from "../lib/redux/slices/notificationSlice"
import { selectUser } from "../lib/redux/slices/currentUserSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { handleGetUserNameInitialsFromName } from "@/app/helpers/userHelper"

function SlideTransition(props: any) {
  return <Slide {...props} direction="left" />
}

// Fonction utilitaire pour convertir différents formats de timestamp en millisecondes
function getTimestampInMillis(timestamp: any): number | null {
  if (!timestamp) return null
  
  // Firestore Timestamp
  if (timestamp && typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis()
  }
  
  // JavaScript Date
  if (timestamp && typeof timestamp.getTime === 'function') {
    return timestamp.getTime()
  }
  
  // Nombre (déjà en millisecondes)
  if (typeof timestamp === 'number') {
    return timestamp
  }
  
  // String de date
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date.getTime()
  }
  
  // Objet avec seconds et nanoseconds (format Firestore sérialisé)
  if (timestamp && typeof timestamp.seconds === 'number') {
    return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
  }
  
  console.warn("⚠️ Unknown timestamp format:", typeof timestamp, timestamp)
  return null
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector(selectUser)
  const notifications = useSelector(selectNotifications)

  const displayedIdsRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<typeof notifications>([])
  const connectionTimestampRef = useRef<number | null>(null) // Stocker en millisecondes
  const isInitializedRef = useRef(false)

  const [currentNotif, setCurrentNotif] = useState<null | typeof notifications[0]>(null)
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")

  // 🔹 Reset des refs quand l'utilisateur change
  useEffect(() => {
    if (!user?.id) {
      console.log("🔄 User disconnected, clearing notifications")
      dispatch(clearNotifications())
      connectionTimestampRef.current = null
      isInitializedRef.current = false
      displayedIdsRef.current.clear()
      queueRef.current = []
      setCurrentNotif(null)
      setOpen(false)
      return
    }

    // Reset pour un nouvel utilisateur
    if (!isInitializedRef.current) {
      connectionTimestampRef.current = Date.now() // Utiliser Date.now() pour plus de simplicité
      displayedIdsRef.current.clear()
      queueRef.current = []
      isInitializedRef.current = true
    }
  }, [user?.id, dispatch])

  // 🔹 Listener Firestore temps réel
  useEffect(() => {
    if (!user?.id || !isInitializedRef.current) {
      return
    }

    const q = query(
      collection(db, "Notifications"),
      where("recipientId", "==", user.id),
      orderBy("timestamp", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      
      // Toujours mettre à jour le store
      dispatch(setNotifications(notifs))

      // Ne traiter que les notifications créées après la connexion
      if (connectionTimestampRef.current && notifs.length > 0) {
        const connectionTime = connectionTimestampRef.current

        const newNotifications = notifs.filter(n => {
          const notifTime = getTimestampInMillis(n.timestamp)
          
          if (notifTime === null) {
            console.warn("⚠️ Could not parse timestamp for notification:", n.id, n.timestamp)
            return false
          }
          
          const isNew = notifTime > connectionTime
          
          if (isNew) {
            console.log("🆕 New notification found:", n.id, new Date(notifTime))
          } else {
            console.log("⏳ Old notification skipped:", n.id, new Date(notifTime))
          }
          
          return isNew
        })

        // Ajouter seulement les nouvelles notifications non affichées
        const unshownNewNotifs = newNotifications.filter(n => {
          const isUnshown = n.id && !displayedIdsRef.current.has(n.id)
          if (isUnshown) {
            console.log("➕ Adding notification to queue:", n.id, n.message)
          }
          return isUnshown
        })

        if (unshownNewNotifs.length > 0) {
          unshownNewNotifs.forEach(n => {
            if (n.id) {
              displayedIdsRef.current.add(n.id)
              queueRef.current.push(n)
            }
          })

          // Si aucune notification n'est affichée, afficher la prochaine
          if (!currentNotif && queueRef.current.length > 0) {
            const nextNotif = queueRef.current.shift()!
            setCurrentNotif(nextNotif)
            setOpen(true)
          }
        }
      }
    }, (error) => {
      console.error("❌ Firestore listener error:", error)
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, dispatch, currentNotif])

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return
    setOpen(false)
  }

  const handleExited = () => {
    setCurrentNotif(null)
    
    // Afficher la prochaine notification dans la queue
    if (queueRef.current.length > 0) {
      const nextNotif = queueRef.current.shift()!
      setCurrentNotif(nextNotif)
      setOpen(true)
    } else {
      console.log("📭 Queue empty, no more notifications to show")
    }
  }

  const handleClick = () => {
    if (!currentNotif) return
        
    setOpen(false) // Fermer immédiatement
    
    if (currentNotif.type === "message" && currentNotif.senderId) {
      router.push(`/messages/${currentNotif.relatedId}`)
    } else if (currentNotif.type === "connection" && currentNotif.senderId) {
      router.push(`/wall/${currentNotif.senderId}`)
    } else {
      router.push("/")
    }
  }

  // Précharger l'avatar à chaque nouvelle notification
  useEffect(() => {
    if (!currentNotif) return
    
    const url = currentNotif.senderAvatarUrl ?? ""
    if (url) {
      const img = new Image()
      img.onload = () => {
        setAvatarUrl(url)
      }
      img.onerror = () => {
        setAvatarUrl("")
      }
      img.src = url
    } else {
      setAvatarUrl("")
    }
  }, [currentNotif])

  return (
    <>
      {children}
      {currentNotif && (
        <Snackbar
          open={open}
          onClose={handleClose}
          TransitionComponent={SlideTransition}
          TransitionProps={{
            onExited: handleExited,
          }}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <SnackbarContent
            onClick={handleClick}
            sx={{
              background: "#FFFFFF",
              color: "#000000",
              border: 1,
              borderColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 2,
              minWidth: 250,
              maxWidth: 400,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            message={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar style={{ width: 40, height: 40 }}>
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {handleGetUserNameInitialsFromName(currentNotif.senderName ?? "Utilisateur inconnu")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span>{currentNotif.message}</span>
              </div>
            }
          />
        </Snackbar>
      )}
    </>
  )
} 