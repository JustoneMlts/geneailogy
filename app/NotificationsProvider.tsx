"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import Snackbar from "@mui/material/Snackbar"
import Slide from "@mui/material/Slide"
import SnackbarContent from "@mui/material/SnackbarContent"
import IconButton from "@mui/material/IconButton"
import { X } from "lucide-react"
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { setNotifications, clearNotifications } from "../lib/redux/slices/notificationSlice"
import { selectNotifications } from "../lib/redux/slices/notificationSlice"
import { selectUser } from "../lib/redux/slices/currentUserSlice"
import { selectActiveTab } from "../lib/redux/slices/uiSlice" // ✨ Import du sélecteur activeTab
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { handleGetUserNameInitialsFromName } from "@/app/helpers/userHelper"
import { createNotification } from "./controllers/notificationsController"
import QuickReplyBox from "@/components/quickReplyBox"

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
  const pathname = usePathname() // ✨ Récupère le chemin actuel
  const user = useSelector(selectUser)
  const notifications = useSelector(selectNotifications)
  const activeTab = useSelector(selectActiveTab) // ✨ Récupère l'onglet actif

  const displayedIdsRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<typeof notifications>([])
  const connectionTimestampRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)
  const processedMessagesRef = useRef<Set<string>>(new Set())

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
      processedMessagesRef.current.clear()
      queueRef.current = []
      setCurrentNotif(null)
      setOpen(false)
      return
    }

    // Reset pour un nouvel utilisateur
    if (!isInitializedRef.current) {
      connectionTimestampRef.current = Date.now()
      displayedIdsRef.current.clear()
      processedMessagesRef.current.clear()
      queueRef.current = []
      isInitializedRef.current = true
      console.log("✅ NotificationsProvider initialized at:", new Date(connectionTimestampRef.current))
    }
  }, [user?.id, dispatch])

  // 🔹 Listener Firestore temps réel pour les notifications
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

  // 🔹 Listener Firestore pour les nouveaux messages
  useEffect(() => {
    if (!user?.id || !isInitializedRef.current) return

    console.log("🔍 Setting up messages listener for userId:", user.id)

    const messagesQuery = query(
      collection(db, "Messages"),
      orderBy("createdDate", "desc")
    )

    const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
      const changes = snapshot.docChanges()
      const newMessages = changes.filter(change => change.type === "added")

      console.log("📨 Message changes detected:", newMessages.length)

      for (const change of newMessages) {
        const msg = change.doc.data() as any
        const messageId = change.doc.id
        const messageTimestamp = msg.createdDate

        // Skip if already processed
        if (processedMessagesRef.current.has(messageId)) {
          console.log("⏭️ Message already processed:", messageId)
          continue
        }

        // Vérifier si le message est nouveau (après la connexion)
        if (connectionTimestampRef.current && messageTimestamp <= connectionTimestampRef.current) {
          console.log("⏳ Old message, marking as processed:", messageId)
          processedMessagesRef.current.add(messageId)
          continue
        }

        console.log("💬 Processing new message:", {
          id: messageId,
          senderId: msg.senderId,
          conversationId: msg.conversationId,
          text: msg.text,
          createdDate: msg.createdDate
        })

        // Éviter les notifs pour ses propres messages
        if (msg.senderId === user.id) {
          console.log("⏭️ Message sent by current user, skipped")
          processedMessagesRef.current.add(messageId)
          continue
        }

        // ✨ Ne pas afficher de notification si l'utilisateur est sur /dashboard avec activeTab === "messages"
        const isOnMessagesScreen = pathname === "/dashboard" && activeTab === "messages"
        if (isOnMessagesScreen) {
          console.log("⏭️ User is on messages screen, notification skipped")
          processedMessagesRef.current.add(messageId)
          continue
        }

        // Vérifier si ce message appartient à une conversation de l'utilisateur
        if (!msg.conversationId) {
          console.log("⚠️ Message without conversationId, skipped")
          processedMessagesRef.current.add(messageId)
          continue
        }

        try {
          // Vérifier si l'utilisateur fait partie de cette conversation
          const conversationsQuery = query(
            collection(db, "Conversations"),
            where("participantIds", "array-contains", user.id)
          )

          const conversationsSnapshot = await getDocs(conversationsQuery)
          const userConversation = conversationsSnapshot.docs.find(doc => doc.id === msg.conversationId)

          if (!userConversation) {
            console.log("⏭️ User is not part of this conversation")
            processedMessagesRef.current.add(messageId)
            continue
          }

          const convData = userConversation.data()
          console.log("✅ Found conversation:", convData)

          // Trouver les infos de l'expéditeur dans participants
          const senderInfo = convData.participants?.find((p: any) => p.userId === msg.senderId)

          if (!senderInfo) {
            console.log("⚠️ Sender info not found in conversation")
            processedMessagesRef.current.add(messageId)
            continue
          }

          console.log("✅ Creating notification for message")

          // Créer une notification
          await createNotification({
            recipientId: user.id ?? "",
            senderId: msg.senderId,
            senderName: `${senderInfo.firstName} ${senderInfo.lastName}`,
            senderAvatarUrl: senderInfo.avatarUrl ?? "",
            type: "message",
            message: msg.text?.substring(0, 100) ?? "Nouveau message reçu 💬",
            relatedId: msg.conversationId,
            title: "Nouveau message"
          })

          // Mark message as processed
          processedMessagesRef.current.add(messageId)
        } catch (error) {
          console.error("❌ Error processing message:", error)
          processedMessagesRef.current.add(messageId)
        }
      }
    }, (error) => {
      console.error("❌ Firestore messages listener error:", error)
    })

    return () => unsubscribeMessages()
  }, [user?.id, pathname, activeTab]) // ✨ Ajout de pathname et activeTab dans les dépendances

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

    setOpen(false)

    if (currentNotif.type === "message" && currentNotif.senderId) {
      router.push(`/messages/${currentNotif.relatedId}`)
    } else if (currentNotif.type === "connection" && currentNotif.senderId) {
      router.push(`/wall/${currentNotif.senderId}`)
    } else {
      router.push("/")
    }
  }

  // ✨ Fermeture manuelle via croix
  const handleManualClose = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la propagation au onClick du conteneur
    setOpen(false)
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
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        TransitionProps={{
          onExited: handleExited
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {currentNotif ? (
          <SnackbarContent
            onClick={currentNotif.type !== "message" ? handleClick : undefined}
            sx={{
              background: "#FFFFFF",
              color: "#000000",
              border: 1,
              borderColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              p: 1.5,
              borderRadius: 2,
              minWidth: 280,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: currentNotif.type === "message" ? "default" : "pointer",
              position: "relative",
            }}
            message={
              <div className="flex flex-col w-full gap-2 text-left relative">
                {/* ✨ Bouton de fermeture en haut à droite */}
                <IconButton
                  size="small"
                  onClick={handleManualClose}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    color: "#9ca3af",
                    "&:hover": {
                      color: "#6b7280",
                      backgroundColor: "#f3f4f6"
                    }
                  }}
                >
                  <X size={16} />
                </IconButton>

                <div className="flex items-center gap-2">
                  <Avatar style={{ width: 40, height: 40 }}>
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} />
                    ) : (
                      <AvatarFallback>
                        {handleGetUserNameInitialsFromName(currentNotif.senderName ?? "Utilisateur inconnu")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium">{currentNotif.senderName}</span>
                </div>

                {/* ✅ Correction de l’alignement du message */}
                <p className="text-sm text-gray-700 w-full break-words whitespace-pre-wrap">
                  {currentNotif.message}
                </p>

                {/* ✅ Zone de réponse rapide uniquement pour les notifs de message */}
                {currentNotif.type === "message" && currentNotif.relatedId && (
                  <QuickReplyBox conversationId={currentNotif.relatedId} setOpen={setOpen} />
                )}
              </div>
            }
          />
        ) : <div></div>}
      </Snackbar>
    </>
  )

}