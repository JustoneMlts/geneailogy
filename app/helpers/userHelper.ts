import { UserType } from "@/lib/firebase/models"

export const handleGetUserName = (user: UserType) => {
    return user.firstName + " " + user.lastName
}

export const handleGetUserNameInitials = (user: UserType) => {
    return user.firstName[0] + user.lastName[0]
}

export const handleGetUserNameInitialsFromName = (userName: string): string => {
  if (!userName) return ""

  const parts = userName.trim().split(" ").filter(Boolean)
  const initials = parts.map(p => p[0].toUpperCase())
  return initials.slice(0, 2).join("") // 🔹 max 2 lettres
}