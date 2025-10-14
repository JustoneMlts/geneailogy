"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAiMessages, saveAiMessage } from "@/app/controllers/aiChatController"
import { AiMessageType } from "@/lib/firebase/models"
import ReactMarkdown from "react-markdown"
import { MemberCard } from "../ai/memberCard"
import TreeCard from "../treeCard"

export default function AiChatBox({ onClose }: { onClose: () => void }) {
    const currentUser = useSelector(selectUser)
    const [messages, setMessages] = useState<AiMessageType[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    // 🔹 Référence du conteneur de messages
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    // 🔹 Fonction pour scroller tout en bas
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // 🔹 Scroll auto à chaque ajout de message
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 🔹 Charger les messages existants
    useEffect(() => {
        if (!currentUser?.id) return

        const fetchMessages = async () => {
            try {
                if (currentUser && currentUser.id) {
                    const msgs = await getAiMessages(currentUser.id)
                    if (msgs.length > 0) {
                        setMessages(msgs)
                    } else {
                        const welcome: AiMessageType = {
                            userId: currentUser.id,
                            role: "ai",
                            content: "Salut 👋, je suis **Fam**, ton assistant IA en généalogie ! Comment puis-je t'aider aujourd'hui ? 😊",
                            createdAt: Date.now(),
                        }
                        setMessages([welcome])
                        await saveAiMessage(welcome)
                    }
                }
            } catch {
                console.log("Une erreur est survenue lors de la récupération des messages du chatbot.")
            }
        }

        fetchMessages()
    }, [currentUser])

    // 🔹 Déterminer le type de card à afficher
    const getCardType = (card: any): "member" | "tree" | null => {
        // Si cardType est explicitement défini
        if (card.cardType) return card.cardType

        // Détection automatique basée sur les propriétés
        if (card.membersIds && card.surnames && card.origin) {
            return "tree"
        }
        if (card.firstName && card.lastName && card.birthDate) {
            return "member"
        }

        return null
    }

    // 🔹 Envoyer un message utilisateur
    const sendMessage = async () => {
        if (!input.trim() || !currentUser?.id) return

        const userMsg: AiMessageType = {
            userId: currentUser.id,
            role: "user",
            content: input.trim(),
            createdAt: Date.now(),
        }

        setMessages(prev => [...prev, userMsg])
        setInput("")
        setLoading(true)
        await saveAiMessage(userMsg)

        try {
            const res = await fetch("/api/ai/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userMsg.content,
                    userId: currentUser.id,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Erreur de l'API")

            // 🔹 Traiter les cards retournées
            const processedCards = data.cards
                ? data.cards.map((card: any, idx: number) => ({
                    ...card,
                    cardType: getCardType(card),
                    _key: card.id || `card-${idx}`,
                }))
                : null

            const aiMsg: AiMessageType = {
                userId: currentUser.id,
                role: "ai",
                content: data.answer ?? "Je n'ai pas pu trouver de réponse 😅",
                createdAt: Date.now(),
                cards: processedCards,
                calledFunction: data.calledFunction || null,
            }

            setMessages(prev => [...prev, aiMsg])
            await saveAiMessage(aiMsg)
        } catch (err) {
            console.error("Erreur chatbot :", err)
            const errorMsg: AiMessageType = {
                userId: currentUser.id,
                role: "ai",
                content: "⚠️ Une erreur est survenue lors de la génération de la réponse.",
                createdAt: Date.now(),
            }
            setMessages(prev => [...prev, errorMsg])
            await saveAiMessage(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    // 🔹 Renderer pour les cards
    const renderCard = (card: any) => {
        const cardType = getCardType(card)

        if (cardType === "member") {
            return (
                <MemberCard
                    key={card._key}
                    member={{
                        id: card.id,
                        firstName: card.firstName,
                        lastName: card.lastName,
                        birthDate: card.birthDate,
                        birthPlace: card.birthPlace,
                        nationality: card.nationality,
                        matchScore: card.matchScore,
                        matchReasons: card.matchReasons,
                    }}
                />
            )
        }

        if (cardType === "tree") {
            return (
                <TreeCard
                    key={card._key}
                    tree={{
                        id: card.id,
                        name: card.name,
                        surnames: card.surnames,
                        origins: card.origins,
                        matchScore: card.matchScore,
                        matchReasons: card.matchReasons,
                        ownerId: card.ownerId
                    }}
                />
            )
        }

        return null
    }

    return (
        <div className="flex flex-col h-96 bg-white rounded-2xl shadow-md">
            {/* 🔹 En-tête */}
            <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50 rounded-t-2xl">
                <h3 className="font-semibold text-sm text-gray-700">Assistant IA - Fam 🤖</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">
                    ✕
                </button>
            </div>

            {/* 🔹 Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((m, i) => {
                    const isUser = m.role === "user"
                    return (
                        <div key={i} className="space-y-2">
                            <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                                {!isUser && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback>IA</AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={`p-2 rounded-lg text-sm max-w-[75%] break-words ${isUser
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                        }`}
                                >
                                    {isUser ? (
                                        m.content
                                    ) : (
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <span>{children}</span>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                                {isUser && (
                                    <Avatar className="w-8 h-8">
                                        {currentUser?.avatarUrl ? (
                                            <AvatarImage src={currentUser.avatarUrl} />
                                        ) : (
                                            <AvatarFallback>{currentUser?.firstName?.[0] ?? "U"}</AvatarFallback>
                                        )}
                                    </Avatar>
                                )}
                            </div>

                            {/* 🆕 Cards de correspondances si présentes */}
                            {!isUser && m.cards && m.cards.length > 0 && (
                                <div className="ml-10 space-y-2">
                                    {m.cards.map((card: any) => {
                                        const cardType = getCardType(card)

                                        if (!cardType) {
                                            // Fallback : afficher les données brutes si le type ne peut pas être déterminé
                                            return (
                                                <div
                                                    key={card._key}
                                                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs"
                                                >
                                                    <pre className="overflow-auto">
                                                        {JSON.stringify(card, null, 2)}
                                                    </pre>
                                                </div>
                                            )
                                        }

                                        return renderCard(card)
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
                {loading && <p className="text-xs text-gray-400 italic">Analyse en cours...</p>}

                {/* 👇 Élément invisible qui sert d'ancre pour scroller */}
                <div ref={messagesEndRef} />
            </div>

            {/* 🔹 Input */}
            <div className="border-t p-2 flex space-x-2">
                <input
                    className="flex-1 text-sm border rounded-lg px-3 py-1 focus:outline-none"
                    placeholder="Posez une question..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="bg-blue-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                    Envoyer
                </button>
            </div>
        </div>
    )
}