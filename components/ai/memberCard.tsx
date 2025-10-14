"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useEffect } from "react"

export function MemberCard({ member }: { member: any }) {
  const router = useRouter()

  const handleClick = () => {
    if (member.treeId) {
      router.push(`/tree/${member.id}`)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 border rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-start space-x-2">
        <div>
          <Avatar className="w-8 h-8">
            <AvatarImage src={member?.avatar} />
            <AvatarFallback className="text-md bg-white"> {member && member?.firstName[0] + member?.lastName[0]} </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-800">
            {member.firstName} {member.lastName}
          </h4>
          {member.birthDate && (
            <p className="text-xs text-gray-500">
              Né(e) le {new Date(member.birthDate).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
      {member.birthPlace && (
        <p className="text-xs text-gray-500">
          {typeof member.birthPlace === "string"
            ? member.birthPlace
            : member.birthPlace.city}
        </p>
      )}
      {member.matchScore && (
        <p className="text-xs text-blue-600 mt-1">
          🔍 Score de correspondance : {member.matchScore}
        </p>
      )}
    </motion.div>
  )
}

export default MemberCard;
