// helpers/userHelper.ts
import { UserType } from "@/lib/firebase/models"

type UserPartial = {
  firstName: string
  lastName: string
  avatar?: string
}

export const handleGetUserName = (user: UserType) => {
    return user.firstName + " " + user.lastName
}

export const handleGetUserNameInitials = (user: UserType) => {
    return user.firstName[0] + user.lastName[0]
}

// 🔹 Nouvelles fonctions pour UserPartial
export const handleGetUserNameFromPartial = (user: UserPartial) => {
  return user.firstName + " " + user.lastName
}

export const handleGetUserNameInitialsFromPartial = (user: UserPartial) => {
  return (user.firstName[0] || "") + (user.lastName[0] || "")
}

export const handleGetUserNameInitialsFromName = (userName: string): string => {
  if (!userName) return ""

  const parts = userName.trim().split(" ").filter(Boolean)
  const initials = parts.map(p => p[0].toUpperCase())
  return initials.slice(0, 2).join("") // 🔹 max 2 lettres
}
