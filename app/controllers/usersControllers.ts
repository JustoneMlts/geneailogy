import { addDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const createUser = async ({ email, firstName, lastName } : { email: string, firstName: string, lastName: string}) => {
    try {
        await addDocumentToCollection(COLLECTIONS.USERS, { email: email, firstName: firstName, lastName: lastName});
    } catch (error) {
        console.log("Error createUser", error);
    }
};