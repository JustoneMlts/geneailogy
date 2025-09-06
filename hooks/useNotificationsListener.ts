import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { setNotifications, clearNotifications } from "../lib/redux/slices/notificationSlice"
import { selectUser } from "../lib/redux/slices/currentUserSlice"

export const useNotificationsListener = () => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  useEffect(() => {
    if (!user?.id) {
      dispatch(clearNotifications())
      return
    }

    const q = query(
      collection(db, "Notifications"),
      where("recipientId", "==", user.id),
      orderBy("timestamp", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      dispatch(setNotifications(notifs))
    })

    return () => unsubscribe()
  }, [user?.id, dispatch])
}
