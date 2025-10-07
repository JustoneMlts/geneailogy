"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { NotificationType } from "@/lib/firebase/models"
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export default function WidgetNotifications() {
    const currentUser = useSelector(selectUser)
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [loading, setLoading] = useState(true)

    // 🔹 Fonction utilitaire pour convertir le timestamp
    const getTimestampValue = (timestamp: any): number => {
        if (!timestamp) return 0

        if (typeof timestamp === "number") return timestamp // déjà en ms
        if (timestamp.seconds) return timestamp.seconds * 1000 // Firestore Timestamp
        if (timestamp.toMillis) return timestamp.toMillis() // méthode Firestore
        return 0
    }

    useEffect(() => {
        if (!currentUser?.id) return

        const q = query(
            collection(db, "Notifications"),
            where("recipientId", "==", currentUser.id),
            where("unread", "==", true),
            orderBy("timestamp", "desc")
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetched = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as NotificationType),
                }))
                setNotifications(fetched)
                setLoading(false)
            },
            (error) => {
                console.error("❌ Erreur Firestore (notifications widget):", error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [currentUser?.id])

    if (loading) {
        return (
            <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                </div>
                <p className="text-gray-500 text-xs">Chargement...</p>
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                </div>
                <p className="text-gray-500 text-xs">Pas de nouvelles notifications</p>
            </div>
        )
    }

    const containerHeightClass = notifications.length > 3 ? "max-h-48 overflow-y-auto" : ""

    return (
        <div className={`bg-white rounded-md shadow-sm p-3 border border-gray-200 ${containerHeightClass}`}>
            <div className="flex items-center gap-1.5 mb-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            </div>

            <ul className="space-y-2 text-xs">
                {notifications.map((n) => (
                    <li
                        key={n.id}
                        className="flex flex-col bg-gray-50 p-2 rounded-md hover:bg-blue-50 cursor-pointer transition"
                    >
                        <span className="text-gray-800">{n.message}</span>
                        <span className="text-[11px] text-gray-500">
                            {new Date(getTimestampValue(n.timestamp)).toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
