import { db } from "@/lib/firebase/firebase"
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { AiMessageType } from "@/lib/firebase/models"
import { COLLECTIONS } from "@/lib/firebase/collections"

// Récupérer tous les messages d'un utilisateur
export async function getAiMessages(userId: string): Promise<AiMessageType[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.AICHAT),
      where("userId", "==", userId),
      orderBy("createdAt", "asc")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AiMessageType))
  } catch (error) {
    console.error("Erreur lors du chargement des messages IA :", error)
    return []
  }
}

// Enregistrer un message IA ou utilisateur
export async function saveAiMessage(message: AiMessageType) {
  try {
    await addDoc(collection(db, COLLECTIONS.AICHAT), message)
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message IA :", error)
  }
}
