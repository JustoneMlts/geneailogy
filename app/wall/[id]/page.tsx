"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { UserType } from "@/lib/firebase/models"
import OtherWallPage from "@/components/otherWallPage"
import { Sidebar } from "@/components/sidebar"
import { getLeftMargin } from "@/app/helpers/uiHelper"

export default function UserWallPage() {
    const params = useParams();            // params = { id: "abc123" }
    const id = params?.id as string;       // récupère "id", pas "userId"
    const [wallOwner, setWallOwner] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isPinned, setIsPinned] = useState(false)

    useEffect(() => {
        if (!id) return

        const fetchUser = async () => {
            const docRef = doc(db, "Users", id) // id correspond à l'uid de ton user
            const snap = await getDoc(docRef)
            if (snap.exists()) {
                setWallOwner({ id: snap.id, ...snap.data() } as UserType)
            }
            setLoading(false)
        }

        fetchUser()
    }, [id])

    if (loading) return <p>Chargement...</p>
    if (!wallOwner) return <p>Utilisateur introuvable</p>

    return (
        <div>
            <Sidebar
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                isPinned={isPinned}
                setIsPinned={setIsPinned}
            />
            <div className={`min-h-screen transition-all duration-300 ease-in-out ${getLeftMargin(isExpanded, isPinned)}`}>
                <OtherWallPage wallOwner={wallOwner} />
            </div>
        </div>
    )
}
