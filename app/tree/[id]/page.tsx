"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "next/navigation"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { Sidebar } from "@/components/sidebar"
import { Tree } from "@/components/tree"

export default function TreePage() {
    const params = useParams()
    const rawId = params?.id
    const userId = Array.isArray(rawId) ? rawId[0] : rawId
    const currentUser = useSelector(selectUser)

    if (!userId) {
        return <div className="p-6">Utilisateur introuvable</div>
    }

    return (
        <div className="flex">

            {/* Contenu principal */}
            <div
                className={`min-h-screen p-6 w-full bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 transition-all duration-300 ease-in-ou`}
            >
                <div className="p-6">
                    <div className="mb-8 p-4">
                        {userId &&
                            <Tree userId={userId} />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
