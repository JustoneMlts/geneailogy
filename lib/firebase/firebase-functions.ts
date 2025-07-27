import { collection, query, where } from "firebase/firestore";
import { doc, getDoc, getDocs, updateDoc , addDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "./collections"
import { db } from "./firebase";
import { formatDate } from "../utils";


export const getDataFromCollection = async (
  collectionName: string,
  dataId: string
) => {
  const docRef = doc(db, collectionName, dataId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document does not exist");
  }

  const docData = docSnap.data();

  return { ...docData, id: docSnap.id };
};

export const getAllDataFromCollectionWithIds = async (
  collectionName: string,
  listOfIds: string[]
) => {
  let listOfData: any = [];

  await Promise.all(
    listOfIds.map(async (id) => {
      const data = await getDataFromCollection(collectionName, id);
      listOfData.push(data);
    })
  );

  return listOfData;
};

export const getAllDataFromCollection = async (collectionName: string) => {
    try {
        let allDataFromCollection: any = [];
        const querySnapshot = await getDocs(collection(db, collectionName));
      
        querySnapshot.forEach((doc) => {
          allDataFromCollection.push({ ...doc.data(), id: doc.id });
        });
      
        return allDataFromCollection.filter(allDataFromCollection, "isActive");
    } catch (error) {
        console.log("Error On getAllDataFromCollection()", error);
    }

};

export const addDocumentToCollection = async (
  collectionName: string,
  dataToCollection: any
): Promise<string | void> => {
  try {
    dataToCollection.createdDate = formatDate.getUnixTimeStamp(new Date());
    dataToCollection.updatedDate = formatDate.getUnixTimeStamp(new Date());
    dataToCollection.isActive = true;
    const addedDocumentToCollection = collection(db, collectionName);
    const newDocRef = await addDoc(
      addedDocumentToCollection,
      dataToCollection
    );
    return newDocRef.id;
  } catch (error) {
    console.log("Error On addDocumentToCollection()", error);
  }
};

export const updateDocumentToCollection = async (
  collectionName: string,
  dataToUpdateId: string,
  dataToUpdate: any
): Promise<void> => {
  try {
    dataToUpdate.updatedDate = formatDate.getUnixTimeStamp(new Date());
    const docRefToUpdate = doc(db, collectionName, dataToUpdateId);
    await updateDoc(docRefToUpdate, dataToUpdate);
  } catch (error) {
    console.log("Error On updateDocumentToCollection()", error);
  }
};

export const deleteDocumentFromCollection = async (
  collectionName: string,
  dataToDeleteId: string
): Promise<void> => {
  const docRefToDelete = doc(db, collectionName, dataToDeleteId);
  await deleteDoc(docRefToDelete);
};

export const getAllDataFromCollectionWithWhereArray = async (collectionName: COLLECTIONS, whereArray: any) => {

    let arrayData: any = []
    const q = query(collection(db,collectionName), where(whereArray.property, '==', whereArray.propertyValue))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
        arrayData.push({...doc.data(), id: doc.id})
    })
    
    if (arrayData.length === 1) {
        return arrayData[0];
    }

    return arrayData
};