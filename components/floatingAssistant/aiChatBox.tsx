"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAiMessages, saveAiMessage } from "@/app/controllers/aiChatController"
import { AiMessageType } from "@/lib/firebase/models"

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
                            content: "Salut 👋, je suis **Fam**, ton assistant IA en généalogie ! Comment puis-je t’aider aujourd’hui ? 😊",
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

            const aiMsg: AiMessageType = {
                userId: currentUser.id,
                role: "ai",
                content: data.answer ?? "Je n’ai pas pu trouver de réponse 😅",
                createdAt: Date.now(),
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
                        <div key={i} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
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
                                dangerouslySetInnerHTML={{ __html: m.content }}
                            />
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
                    )
                })}
                {loading && <p className="text-xs text-gray-400 italic">Analyse en cours...</p>}

                {/* 👇 Élément invisible qui sert d’ancre pour scroller */}
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
