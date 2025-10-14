"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { TreePine } from "lucide-react"
import { nationalityToEmoji } from "@/app/helpers/memberHelper"

export function TreeCard({ tree }: { tree: any }) {
  const router = useRouter()

  const handleClick = () => {
    if (tree.id) {
      router.push(`/tree/${tree.ownerId}`)
    }
  }

  const hasNationalities =
    Array.isArray(tree.nationalities) && tree.nationalities.length > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-gradient-to-br from-green-50 to-emerald-100 border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* HEADER */}
      <div className="flex items-center space-x-3">
        {/* Cercle avec icône d’arbre */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-emerald-200 shadow-sm">
          <TreePine className="w-5 h-5 text-emerald-700" />
        </div>

        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-800 text-sm">
            {tree.name || "Arbre sans nom"}
          </h3>
          {tree.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {tree.description}
            </p>
          )}
        </div>
      </div>

      {/* NATIONALITÉS - sous forme d’emojis drapeaux */}
      {hasNationalities && (
        <div className="flex flex-wrap items-center gap-1 mt-3">
          {tree.nationalities.slice(0, 3).map((nat: string, idx: number) => (
            <div
              key={idx}
              className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-sm shadow-sm cursor-default"
              title={nat}
            >
              {nationalityToEmoji(nat)}
            </div>
          ))}
          {tree.nationalities.length > 3 && (
            <div
              className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300 text-xs text-gray-600 shadow-sm cursor-default"
              title={tree.nationalities.slice(3).join(", ")}
            >
              +{tree.nationalities.length - 3}
            </div>
          )}
        </div>
      )}

      {/* INFOS SUPPLÉMENTAIRES */}
      <div className="mt-3 text-xs text-gray-500">
        Créé le{" "}
        {new Date(tree.createdDate).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </div>
    </motion.div>
  )
}

export default TreeCard
