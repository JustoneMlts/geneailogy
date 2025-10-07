"use client"
import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MemberType } from "@/lib/firebase/models"
import { getMembersByTreeId } from "@/app/controllers/treesController"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { useSelector } from "react-redux"

interface EventItem {
    name: string
    date: string
    type: "birthday" | "anniversary"
}

export default function WidgetUpcomingEvents() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const currentUser = useSelector(selectUser)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                if (currentUser && currentUser.treesIds && currentUser.treesIds.length) {
                    setIsLoading(true)
                    const members: MemberType[] = await getMembersByTreeId(currentUser?.treesIds[0])
                    const today = new Date()
                    const upcoming: EventItem[] = []

                    members.forEach(member => {
                        // 🎂 Anniversaires
                        if (member.birthDate) {
                            const birth = new Date(member.birthDate)
                            const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
                            const diff = (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                            if (diff >= 0 && diff <= 30) {
                                upcoming.push({
                                    name: member.firstName || "Inconnu",
                                    date: nextBirthday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                                    type: "birthday",
                                })
                            }
                        }

                        // 💍 Mariages (si les données existent)
                        if ((member as any).weddingDate) {
                            const wedding = new Date((member as any).weddingDate)
                            const nextAnniversary = new Date(today.getFullYear(), wedding.getMonth(), wedding.getDate())
                            const diff = (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                            if (diff >= 0 && diff <= 30) {
                                upcoming.push({
                                    name: member.firstName || "Inconnu",
                                    date: nextAnniversary.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                                    type: "anniversary",
                                })
                            }
                        }
                    })

                    setEvents(upcoming.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4))
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }

        fetchEvents()
    }, [])

    return (
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-2 flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm font-semibold text-gray-800">Événements à venir</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
                {isLoading ? (
                    <p className="text-gray-500 text-xs animate-pulse">Chargement...</p>
                ) : events.length === 0 ? (
                    <p className="text-gray-500 text-xs">Aucun événement dans les 30 jours</p>
                ) : (
                    events.map((e, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs">{e.type === "birthday" ? "🎂" : "💍"}</span>
                                <span className="text-gray-800 text-xs truncate">{e.name}</span>
                            </div>
                            <span className="text-gray-600 text-xs font-medium">{e.date}</span>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
