"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { collection, query, where, onSnapshot, getDoc, doc, QueryDocumentSnapshot, DocumentData, deleteDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { Links, UserType } from "@/lib/firebase/models"

interface LinksContextType {
    links: Links[]
    usersMap: Record<string, UserType>
    isLoading: boolean
    removeLink?: (linkId: string) => void
}

const LinksContext = createContext<LinksContextType>({
    links: [],
    usersMap: {},
    isLoading: true,
})

export const LinksProvider = ({ userId, children }: { userId: string, children: ReactNode }) => {
    const [links, setLinks] = useState<Links[]>([])
    const [usersMap, setUsersMap] = useState<Record<string, UserType>>({})
    const [isLoading, setIsLoading] = useState(true)

    // Supprimer un lien côté local et Firestore
    const removeLink = async (linkId: string) => {
        const link = links.find(l => l.linkId === linkId)
        if (!link) return

        const otherUserId = link.senderId === userId ? link.receiverId : link.senderId

        try {
            // Supprimer le lien et mettre à jour les deux utilisateurs
            const currentUserRef = doc(db, "Users", userId)
            const otherUserRef = doc(db, "Users", otherUserId)
            const linkRef = doc(db, "Links", linkId)

            await Promise.all([
                updateDoc(currentUserRef, { friends: arrayRemove(otherUserId) }),
                updateDoc(otherUserRef, { friends: arrayRemove(userId) }),
                deleteDoc(linkRef)
            ])

            // Mise à jour locale immédiate pour re-render instantané
            setLinks(prev => prev.filter(l => l.linkId !== linkId))
        } catch (err) {
            console.error("Erreur suppression lien:", err)
        }
    }

    useEffect(() => {
        if (!userId) return

        setIsLoading(true)
        const linksCollection = collection(db, "Links")
        const qSender = query(linksCollection, where("senderId", "==", userId))
        const qReceiver = query(linksCollection, where("receiverId", "==", userId))

        const handleSnapshot = async (snapshot: any) => {
            const updatedLinks: Links[] = snapshot.docs.map(
                (docSnap: QueryDocumentSnapshot<DocumentData>) => ({ linkId: docSnap.id, ...(docSnap.data() as Omit<Links, "linkId">) })
            )

            setLinks(prev => {
                const map = new Map(prev.map(l => [l.linkId, l]))
                updatedLinks.forEach(l => map.set(l.linkId, l))
                return Array.from(map.values())
            })

            // Charger les utilisateurs liés
            const userIds = new Set<string>()
            updatedLinks.forEach(link => {
                if (link.senderId !== userId) userIds.add(link.senderId)
                if (link.receiverId !== userId) userIds.add(link.receiverId)
            })

            userIds.forEach(async id => {
                if (!usersMap[id]) {
                    try {
                        const userSnap = await getDoc(doc(db, "Users", id))
                        if (userSnap.exists()) {
                            setUsersMap(prev => ({
                                ...prev,
                                [id]: { id: userSnap.id, ...(userSnap.data() as UserType) }
                            }))
                        }
                    } catch (err) {
                        console.error("Erreur chargement user:", id, err)
                    }
                }
            })

            setIsLoading(false)
        }

        const unsubscribeSender = onSnapshot(qSender, handleSnapshot)
        const unsubscribeReceiver = onSnapshot(qReceiver, handleSnapshot)

        return () => {
            unsubscribeSender()
            unsubscribeReceiver()
        }
    }, [userId])

    return (
        <LinksContext.Provider value={{ links, usersMap, isLoading, removeLink }}>
            {children}
        </LinksContext.Provider>
    )
}

export const useLinks = () => useContext(LinksContext)
