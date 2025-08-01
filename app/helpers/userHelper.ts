import { UserType } from "@/lib/firebase/models"

export const handleGetUserName = (user: UserType) => {
    return user.firstName + " " + user.lastName
}

export const handleGetUserNameInitials = (user: UserType) => {
    return user.firstName[0] + user.lastName[0]
}