"use client"
import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import AiChatBox from "./aiChatBox"

export default function FloatingAiAssistant() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bulle flottante */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-10 right-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full p-4 shadow-lg hover:scale-105 transition"
        whileHover={{ scale: 1.1 }}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </motion.button>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-24 right-10 w-80 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl border border-gray-200 overflow-hidden"
          >
            <AiChatBox onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
