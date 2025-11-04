"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { sendMessage } from "@/app/controllers/messagesController"
import { MessageType } from "@/lib/firebase/models"

interface QuickReplyBoxProps {
  conversationId: string
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function QuickReplyBox({ conversationId, setOpen }: QuickReplyBoxProps) {
  const currentUser = useSelector(selectUser)
  const [replyText, setReplyText] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentUser?.id || isSending) return

    setIsSending(true)

    const msg: Omit<MessageType, "id"> = {
      conversationId,
      senderId: currentUser.id,
      text: replyText.trim(),
      createdDate: Date.now(),
    }

    try {
      await sendMessage(msg)
      setReplyText("")
      setOpen(false)
      console.log("✅ Quick reply sent successfully")
    } catch (error) {
      console.error("❌ Error sending quick reply:", error)
    } finally {
      setIsSending(false)
    }
  }

  // ✨ Gestion de la touche Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Input
        placeholder="Répondre rapidement..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        onKeyDown={handleKeyDown} // ✨ Ajout de la gestion Enter
        disabled={isSending}
        className="flex-1 text-sm"
      />
      <Button
        onClick={handleSendReply}
        disabled={!replyText.trim() || isSending}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}