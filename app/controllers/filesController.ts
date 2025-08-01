import _ from "lodash";
import { Files } from "../../lib/firebase/models";
import { COLLECTIONS } from "../../lib/firebase/collections";
import { uploadFileToStorage } from "../../lib/firebase/firebase-functions";
import { addDocumentToCollection,getAllDataFromCollectionWithWhereArray, getDataFromCollection,getAllDataFromCollection,getAllDataFromCollectionWithIds, updateDocumentToCollection, deleteDocumentFromCollection,deleteFileFromStorage  } from "../../lib/firebase/firebase-functions";
import { FOLDER } from "../../lib/firebase/folder";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

export const createFile = async (
  file: File,
  folderName: FOLDER
): Promise<string> => {
  const fileUrl = await uploadFileToFirebase(file, folderName);

  const fileData: Omit<Files, "id"> = {
    associatedFolder: folderName,
    fileName: file.name,
    fileUrl,
    fileType: file.type,
    size: file.size,
    createdBy: _.split(file.name, "-")[0] || "unknown",
  };

  const docRef = await addDocumentToCollection(COLLECTIONS.FILES, fileData);

  // Ajout optionnel de l'id si tu veux retourner l'objet
  const newFile: Files = {
    ...fileData,
    id: typeof docRef === "string" ? docRef : "",
  };

  return newFile.fileUrl;
};

const getFileByUrl = async (fileUrl: string): Promise<Files> => {
    const file = await getAllDataFromCollectionWithWhereArray(COLLECTIONS.FILES, { property: "fileUrl" , propertyValue: fileUrl })
    return file
};


export const createOrReplaceAvatar = async (
  file: File,
  existingUrl?: string
): Promise<string> => {
  if (existingUrl) {
    await deleteFile(existingUrl);
  }
    return await createFile(file, FOLDER.AVATAR);
};

export const deleteFile = async (fileId: string): Promise<void> => { 
    const deletedFile = await getFileByUrl(fileId);
    await deleteFileFromStorage(deletedFile.associatedFolder, deletedFile.fileName);
    await deleteDocumentFromCollection(COLLECTIONS.FILES, deletedFile.id);
};

export const getAllFiles = async (): Promise<Files[]> => {
    const allFiles = await getAllDataFromCollection(COLLECTIONS.FILES)
    return _.map(allFiles, file => file)
};

export const getFileWithId = async (fileId: string): Promise<Files> => {
  const docSnap = await getDoc(doc(db, COLLECTIONS.FILES, fileId))

  if (!docSnap.exists()) {
    throw new Error("Fichier introuvable")
  }

  const data = docSnap.data()

  const file: Files = {
    id: docSnap.id,
    associatedFolder: data.associatedFolder,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    size: data.size,
    createdBy: data.createdBy,
  }

  return file
}

export const getAllFilesWithListOfIds = async (arrayFilesId: string[]): Promise<Files[]> => {
    const allFiles = await getAllDataFromCollectionWithIds(COLLECTIONS.FILES, arrayFilesId)
    return _.map(allFiles, file => file)
};


export const getAllFilesFromFolder = async (folderName: FOLDER) => {
    const allFilesFromCollection = await getAllFiles()
    return _.filter(allFilesFromCollection, ['associatedFolder', folderName])
};

export const updateFile = async (file: Files): Promise<void> => await updateDocumentToCollection(COLLECTIONS.FILES, file.id, file)

export const uploadFileToFirebase = async (
  file: File,
  folderName: string
): Promise<string> => {
  if (!file || !folderName) {
    throw new Error("Fichier ou nom de dossier manquant.");
  }

  const uniqueFileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(getStorage(), `${folderName}/${uniqueFileName}`);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};