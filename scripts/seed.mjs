/**
 * 🌱 SCRIPT DE SEED — GeneAIlogy
 *
 * Comptes de test créés :
 * ┌─────────────────────────────────┬─────────────────┬───────────────────────┐
 * │ Email                           │ Mot de passe    │ Profil                │
 * ├─────────────────────────────────┼─────────────────┼───────────────────────┤
 * │ jean.dupont@test.com            │ Test1234!       │ Jean Dupont (FR)      │
 * │ sophie.dupont@test.com          │ Test1234!       │ Sophie Dupont (FR)    │
 * │ carlos.martin@test.com          │ Test1234!       │ Carlos Martin (ES)    │
 * │ amina.benali@test.com           │ Test1234!       │ Amina Benali (MA)     │
 * └─────────────────────────────────┴─────────────────┴───────────────────────┘
 *
 * Usage : node scripts/seed.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-9YaFuZpCdHXVib2tiMWxCCSESziuqdM",
  authDomain: "geneailogy.firebaseapp.com",
  projectId: "geneailogy",
  storageBucket: "geneailogy.firebasestorage.app",
  messagingSenderId: "1048729297378",
  appId: "1:1048729297378:web:3603bcb3c4043c0eaa59bb",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const NOW = Date.now();
const D = (year, month, day) => new Date(year, month - 1, day).getTime();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createAuthUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log(`  ⚠️  ${email} existe déjà → connexion`);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user.uid;
    }
    throw err;
  }
}

async function createUserDoc(uid, data) {
  await setDoc(doc(db, "Users", uid), {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    firstNameLower: data.firstName.toLowerCase(),
    lastNameLower: data.lastName.toLowerCase(),
    avatarUrl: "",
    bio: data.bio || "",
    phoneNumber: "",
    localisation: data.localisation || "",
    nationality: data.nationality || "",
    birthDate: data.birthDate,
    oldestAncestor: "",
    familyOrigin: data.familyOrigin || "",
    researchInterests: "",
    treesIds: [],
    friends: [],
    createdDate: NOW,
    updatedDate: NOW,
    isActive: true,
  });
}

async function createTree(name, description, ownerId) {
  const ref = await addDoc(collection(db, "Trees"), {
    name,
    description,
    ownerId,
    memberIds: [],
    origin: [],
    createdDate: NOW,
    updatedDate: NOW,
    isActive: true,
  });
  // Ajouter le treeId à l'utilisateur
  await updateDoc(doc(db, "Users", ownerId), {
    treesIds: arrayUnion(ref.id),
  });
  return ref.id;
}

async function createMember(data, forcedId = null) {
  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    gender: data.gender,
    treeId: data.treeId,
    birthDate: data.birthDate || null,
    deathDate: data.deathDate || null,
    birthPlace: data.birthPlace || null,
    deathPlace: data.deathPlace || "",
    nationality: data.nationality || "",
    avatar: data.avatar || "",
    bio: data.bio || "",
    isMarried: data.isMarried || false,
    mariageId: data.mariageId || null,
    parentsIds: data.parentsIds || [],
    childrenIds: data.childrenIds || [],
    brothersIds: data.brothersIds || [],
    createdDate: NOW,
    updatedDate: NOW,
    isActive: true,
  };

  // Nettoyer les null
  Object.keys(payload).forEach((k) => {
    if (payload[k] === null || payload[k] === undefined) delete payload[k];
  });

  if (forcedId) {
    await setDoc(doc(db, "Members", forcedId), payload);
    await updateDoc(doc(db, "Trees", data.treeId), {
      memberIds: arrayUnion(forcedId),
    });
    return forcedId;
  } else {
    const ref = await addDoc(collection(db, "Members"), payload);
    await updateDoc(doc(db, "Trees", data.treeId), {
      memberIds: arrayUnion(ref.id),
    });
    return ref.id;
  }
}

async function linkRelations(memberId, { parentsIds, childrenIds, brothersIds, spouseId } = {}) {
  const updates = {};
  if (parentsIds?.length) updates.parentsIds = parentsIds;
  if (childrenIds?.length) updates.childrenIds = childrenIds;
  if (brothersIds?.length) updates.brothersIds = brothersIds;
  if (spouseId) { updates.mariageId = spouseId; updates.isMarried = true; }
  if (Object.keys(updates).length) {
    await updateDoc(doc(db, "Members", memberId), updates);
  }
}

// ─── FAMILLE 1 : Jean Dupont (Français) ─────────────────────────────────────
// Arbre multigénérationnel : grands-parents → parents → Jean + sœur → enfants
async function seedJeanDupont() {
  console.log("\n👨 Création de Jean Dupont...");
  const uid = await createAuthUser("jean.dupont@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "jean.dupont@test.com",
    firstName: "Jean",
    lastName: "Dupont",
    birthDate: D(1985, 6, 14),
    nationality: "Française",
    localisation: "Paris, France",
    familyOrigin: "Normandie",
    bio: "Passionné d'histoire familiale, je retrace les origines de ma famille depuis le XVIIIe siècle.",
  });

  const treeId = await createTree("Famille Dupont", "Arbre généalogique de la famille Dupont - branche normande", uid);

  // Grands-parents paternels
  const gpPereId = await createMember({ firstName: "Georges", lastName: "Dupont", gender: "male", treeId, birthDate: D(1920, 3, 10), deathDate: D(1998, 11, 2), nationality: "Française", birthPlace: { label: "Rouen, France", lat: 49.4431, lng: 1.0993 }, bio: "Artisan boulanger à Rouen pendant 40 ans." });
  const gpMereId = await createMember({ firstName: "Yvette", lastName: "Lecomte", gender: "female", treeId, birthDate: D(1923, 7, 22), deathDate: D(2005, 4, 15), nationality: "Française", birthPlace: { label: "Caen, France", lat: 49.1829, lng: -0.3707 } });

  // Grands-parents maternels
  const gpMaterPereId = await createMember({ firstName: "Marcel", lastName: "Fontaine", gender: "male", treeId, birthDate: D(1918, 1, 5), deathDate: D(2001, 8, 30), nationality: "Française", birthPlace: { label: "Lyon, France", lat: 45.7640, lng: 4.8357 } });
  const gpMaterMereId = await createMember({ firstName: "Simone", lastName: "Renard", gender: "female", treeId, birthDate: D(1922, 9, 18), deathDate: D(2010, 2, 7), nationality: "Française" });

  // Parents
  const pereId = await createMember({ firstName: "Henri", lastName: "Dupont", gender: "male", treeId, birthDate: D(1955, 4, 3), nationality: "Française", birthPlace: { label: "Rouen, France", lat: 49.4431, lng: 1.0993 }, isMarried: true });
  const mereId = await createMember({ firstName: "Marguerite", lastName: "Fontaine", gender: "female", treeId, birthDate: D(1958, 11, 27), nationality: "Française", birthPlace: { label: "Lyon, France", lat: 45.7640, lng: 4.8357 }, isMarried: true });

  // Mariage parents
  await linkRelations(pereId, { parentsIds: [gpPereId, gpMereId], spouseId: mereId });
  await linkRelations(mereId, { parentsIds: [gpMaterPereId, gpMaterMereId], spouseId: pereId });
  await updateDoc(doc(db, "Members", gpPereId), { childrenIds: [pereId], spouseId: gpMereId, isMarried: true });
  await updateDoc(doc(db, "Members", gpMereId), { childrenIds: [pereId], spouseId: gpPereId, isMarried: true });
  await updateDoc(doc(db, "Members", gpMaterPereId), { childrenIds: [mereId], spouseId: gpMaterMereId, isMarried: true });
  await updateDoc(doc(db, "Members", gpMaterMereId), { childrenIds: [mereId], spouseId: gpMaterPereId, isMarried: true });

  // Jean lui-même (membre = uid)
  const jeanMemberId = await createMember({ firstName: "Jean", lastName: "Dupont", gender: "male", treeId, birthDate: D(1985, 6, 14), nationality: "Française", birthPlace: { label: "Paris, France", lat: 48.8566, lng: 2.3522 }, isMarried: true }, uid);

  // Sœur
  const soeurId = await createMember({ firstName: "Claire", lastName: "Dupont", gender: "female", treeId, birthDate: D(1988, 2, 9), nationality: "Française", birthPlace: { label: "Paris, France", lat: 48.8566, lng: 2.3522 } });

  // Épouse
  const epouseId = await createMember({ firstName: "Sophie", lastName: "Moreau", gender: "female", treeId, birthDate: D(1987, 9, 30), nationality: "Française", birthPlace: { label: "Bordeaux, France", lat: 44.8378, lng: -0.5792 }, isMarried: true });

  // Enfants
  const enfant1Id = await createMember({ firstName: "Lucas", lastName: "Dupont", gender: "male", treeId, birthDate: D(2012, 5, 17), nationality: "Française" });
  const enfant2Id = await createMember({ firstName: "Emma", lastName: "Dupont", gender: "female", treeId, birthDate: D(2015, 10, 3), nationality: "Française" });

  // Lier Jean
  await linkRelations(uid, { parentsIds: [pereId, mereId], brothersIds: [soeurId], childrenIds: [enfant1Id, enfant2Id], spouseId: epouseId });
  await linkRelations(soeurId, { parentsIds: [pereId, mereId], brothersIds: [uid] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [enfant1Id, enfant2Id] });
  await linkRelations(enfant1Id, { parentsIds: [uid, epouseId], brothersIds: [enfant2Id] });
  await linkRelations(enfant2Id, { parentsIds: [uid, epouseId], brothersIds: [enfant1Id] });

  // Parents → enfants
  await updateDoc(doc(db, "Members", pereId), { childrenIds: [uid, soeurId] });
  await updateDoc(doc(db, "Members", mereId), { childrenIds: [uid, soeurId] });

  console.log("  ✅ Jean Dupont — arbre multigénérationnel (3 générations, 11 membres)");
  return uid;
}

// ─── FAMILLE 2 : Sophie Dupont (même nom, branche différente) ───────────────
async function seedSophieDupont() {
  console.log("\n👩 Création de Sophie Dupont...");
  const uid = await createAuthUser("sophie.dupont@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "sophie.dupont@test.com",
    firstName: "Sophie",
    lastName: "Dupont",
    birthDate: D(1990, 3, 21),
    nationality: "Française",
    localisation: "Lyon, France",
    familyOrigin: "Alsace",
    bio: "Je recherche des connexions avec d'autres branches de la famille Dupont.",
  });

  const treeId = await createTree("Famille Dupont (branche alsacienne)", "Branche alsacienne de la famille Dupont", uid);

  // Grands-parents
  const gpId = await createMember({ firstName: "Alfred", lastName: "Dupont", gender: "male", treeId, birthDate: D(1925, 8, 12), deathDate: D(2003, 1, 19), nationality: "Française", birthPlace: { label: "Strasbourg, France", lat: 48.5734, lng: 7.7521 } });
  const gpfId = await createMember({ firstName: "Hilda", lastName: "Muller", gender: "female", treeId, birthDate: D(1928, 12, 4), deathDate: D(2015, 6, 8), nationality: "Française", birthPlace: { label: "Strasbourg, France", lat: 48.5734, lng: 7.7521 } });

  // Parents
  const pereId = await createMember({ firstName: "Robert", lastName: "Dupont", gender: "male", treeId, birthDate: D(1960, 7, 15), nationality: "Française", isMarried: true });
  const mereId = await createMember({ firstName: "Hélène", lastName: "Bernard", gender: "female", treeId, birthDate: D(1963, 4, 29), nationality: "Française", isMarried: true });

  // Sophie (membre = uid)
  await createMember({ firstName: "Sophie", lastName: "Dupont", gender: "female", treeId, birthDate: D(1990, 3, 21), nationality: "Française", birthPlace: { label: "Lyon, France", lat: 45.7640, lng: 4.8357 } }, uid);

  // Frère
  const frereId = await createMember({ firstName: "Thomas", lastName: "Dupont", gender: "male", treeId, birthDate: D(1993, 6, 8), nationality: "Française" });

  await linkRelations(pereId, { parentsIds: [gpId, gpfId], spouseId: mereId, childrenIds: [uid, frereId] });
  await linkRelations(mereId, { spouseId: pereId, childrenIds: [uid, frereId] });
  await linkRelations(uid, { parentsIds: [pereId, mereId], brothersIds: [frereId] });
  await linkRelations(frereId, { parentsIds: [pereId, mereId], brothersIds: [uid] });
  await updateDoc(doc(db, "Members", gpId), { childrenIds: [pereId], spouseId: gpfId, isMarried: true });
  await updateDoc(doc(db, "Members", gpfId), { childrenIds: [pereId], spouseId: gpId, isMarried: true });

  console.log("  ✅ Sophie Dupont — famille alsacienne (même nom, branche distincte, 6 membres)");
  return uid;
}

// ─── FAMILLE 3 : Carlos Martin (Espagnol) ───────────────────────────────────
async function seedCarlosMartin() {
  console.log("\n🇪🇸 Création de Carlos Martin...");
  const uid = await createAuthUser("carlos.martin@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "carlos.martin@test.com",
    firstName: "Carlos",
    lastName: "Martin",
    birthDate: D(1982, 11, 5),
    nationality: "Espagnole",
    localisation: "Barcelone, Espagne",
    familyOrigin: "Andalousie",
    bio: "Originaire de Séville, installé à Barcelone. Je retrace mes racines andalouses.",
  });

  const treeId = await createTree("Familia Martin", "Arbre généalogique de la familia Martin — origines andalouses", uid);

  // Grands-parents
  const abuelo1Id = await createMember({ firstName: "Antonio", lastName: "Martin", gender: "male", treeId, birthDate: D(1928, 4, 17), deathDate: D(2002, 9, 3), nationality: "Espagnole", birthPlace: { label: "Séville, Espagne", lat: 37.3891, lng: -5.9845 } });
  const abuela1Id = await createMember({ firstName: "Carmen", lastName: "García", gender: "female", treeId, birthDate: D(1931, 7, 22), deathDate: D(2018, 3, 11), nationality: "Espagnole", birthPlace: { label: "Séville, Espagne", lat: 37.3891, lng: -5.9845 } });

  // Parents
  const padreId = await createMember({ firstName: "Miguel", lastName: "Martin", gender: "male", treeId, birthDate: D(1955, 9, 1), nationality: "Espagnole", birthPlace: { label: "Séville, Espagne", lat: 37.3891, lng: -5.9845 }, isMarried: true });
  const madreId = await createMember({ firstName: "Isabel", lastName: "Lopez", gender: "female", treeId, birthDate: D(1958, 12, 14), nationality: "Espagnole", birthPlace: { label: "Malaga, Espagne", lat: 36.7213, lng: -4.4214 }, isMarried: true });

  // Carlos (membre = uid)
  await createMember({ firstName: "Carlos", lastName: "Martin", gender: "male", treeId, birthDate: D(1982, 11, 5), nationality: "Espagnole", birthPlace: { label: "Séville, Espagne", lat: 37.3891, lng: -5.9845 }, isMarried: true }, uid);

  // Frère et sœur
  const hermanoId = await createMember({ firstName: "Diego", lastName: "Martin", gender: "male", treeId, birthDate: D(1985, 3, 19), nationality: "Espagnole" });
  const hermanaId = await createMember({ firstName: "Lucia", lastName: "Martin", gender: "female", treeId, birthDate: D(1989, 8, 27), nationality: "Espagnole" });

  // Épouse (franco-espagnole)
  const epouseId = await createMember({ firstName: "Nathalie", lastName: "Rousseau", gender: "female", treeId, birthDate: D(1984, 6, 10), nationality: "Française", birthPlace: { label: "Marseille, France", lat: 43.2965, lng: 5.3698 }, isMarried: true });

  // Enfant
  const hijoId = await createMember({ firstName: "Pablo", lastName: "Martin", gender: "male", treeId, birthDate: D(2010, 2, 28), nationality: "Espagnole" });

  await linkRelations(padreId, { parentsIds: [abuelo1Id, abuela1Id], spouseId: madreId, childrenIds: [uid, hermanoId, hermanaId] });
  await linkRelations(madreId, { spouseId: padreId, childrenIds: [uid, hermanoId, hermanaId] });
  await linkRelations(uid, { parentsIds: [padreId, madreId], brothersIds: [hermanoId, hermanaId], spouseId: epouseId, childrenIds: [hijoId] });
  await linkRelations(hermanoId, { parentsIds: [padreId, madreId], brothersIds: [uid, hermanaId] });
  await linkRelations(hermanaId, { parentsIds: [padreId, madreId], brothersIds: [uid, hermanoId] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [hijoId] });
  await linkRelations(hijoId, { parentsIds: [uid, epouseId] });
  await updateDoc(doc(db, "Members", abuelo1Id), { childrenIds: [padreId], spouseId: abuela1Id, isMarried: true });
  await updateDoc(doc(db, "Members", abuela1Id), { childrenIds: [padreId], spouseId: abuelo1Id, isMarried: true });

  console.log("  ✅ Carlos Martin — familia andalouse franco-espagnole (3 générations, 9 membres)");
  return uid;
}

// ─── FAMILLE 4 : Amina Benali (Marocaine) ───────────────────────────────────
async function seedAminaBenali() {
  console.log("\n🇲🇦 Création de Amina Benali...");
  const uid = await createAuthUser("amina.benali@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "amina.benali@test.com",
    firstName: "Amina",
    lastName: "Benali",
    birthDate: D(1993, 5, 8),
    nationality: "Marocaine",
    localisation: "Casablanca, Maroc",
    familyOrigin: "Fès",
    bio: "Issue d'une famille de Fès, je vis à Casablanca et cherche à préserver la mémoire familiale.",
  });

  const treeId = await createTree("Famille Benali", "Arbre généalogique de la famille Benali — origines de Fès", uid);

  // Grands-parents
  const jaddId = await createMember({ firstName: "Mohamed", lastName: "Benali", gender: "male", treeId, birthDate: D(1930, 2, 3), deathDate: D(2008, 10, 15), nationality: "Marocaine", birthPlace: { label: "Fès, Maroc", lat: 34.0181, lng: -5.0078 } });
  const jadddaId = await createMember({ firstName: "Fatima", lastName: "Alaoui", gender: "female", treeId, birthDate: D(1935, 6, 20), nationality: "Marocaine", birthPlace: { label: "Fès, Maroc", lat: 34.0181, lng: -5.0078 } });

  // Parents
  const pereId = await createMember({ firstName: "Youssef", lastName: "Benali", gender: "male", treeId, birthDate: D(1962, 9, 11), nationality: "Marocaine", birthPlace: { label: "Fès, Maroc", lat: 34.0181, lng: -5.0078 }, isMarried: true });
  const mereId = await createMember({ firstName: "Khadija", lastName: "Tazi", gender: "female", treeId, birthDate: D(1965, 3, 28), nationality: "Marocaine", birthPlace: { label: "Meknès, Maroc", lat: 33.8935, lng: -5.5473 }, isMarried: true });

  // Amina (membre = uid)
  await createMember({ firstName: "Amina", lastName: "Benali", gender: "female", treeId, birthDate: D(1993, 5, 8), nationality: "Marocaine", birthPlace: { label: "Casablanca, Maroc", lat: 33.5731, lng: -7.5898 } }, uid);

  // Frères et sœurs
  const frere1Id = await createMember({ firstName: "Karim", lastName: "Benali", gender: "male", treeId, birthDate: D(1990, 1, 14), nationality: "Marocaine", birthPlace: { label: "Fès, Maroc", lat: 34.0181, lng: -5.0078 } });
  const frere2Id = await createMember({ firstName: "Omar", lastName: "Benali", gender: "male", treeId, birthDate: D(1996, 8, 22), nationality: "Marocaine" });
  const soeurId = await createMember({ firstName: "Sara", lastName: "Benali", gender: "female", treeId, birthDate: D(1999, 11, 5), nationality: "Marocaine" });

  // Oncle et tante (frère du père)
  const oncleId = await createMember({ firstName: "Hassan", lastName: "Benali", gender: "male", treeId, birthDate: D(1965, 7, 17), nationality: "Marocaine", isMarried: true });
  const tanteId = await createMember({ firstName: "Nadia", lastName: "Berrada", gender: "female", treeId, birthDate: D(1968, 4, 9), nationality: "Marocaine", isMarried: true });

  // Cousin
  const cousinId = await createMember({ firstName: "Amine", lastName: "Benali", gender: "male", treeId, birthDate: D(1995, 3, 30), nationality: "Marocaine" });

  await linkRelations(pereId, { parentsIds: [jaddId, jadddaId], spouseId: mereId, childrenIds: [uid, frere1Id, frere2Id, soeurId], brothersIds: [oncleId] });
  await linkRelations(mereId, { spouseId: pereId, childrenIds: [uid, frere1Id, frere2Id, soeurId] });
  await linkRelations(uid, { parentsIds: [pereId, mereId], brothersIds: [frere1Id, frere2Id, soeurId] });
  await linkRelations(frere1Id, { parentsIds: [pereId, mereId], brothersIds: [uid, frere2Id, soeurId] });
  await linkRelations(frere2Id, { parentsIds: [pereId, mereId], brothersIds: [uid, frere1Id, soeurId] });
  await linkRelations(soeurId, { parentsIds: [pereId, mereId], brothersIds: [uid, frere1Id, frere2Id] });
  await linkRelations(oncleId, { parentsIds: [jaddId, jadddaId], spouseId: tanteId, childrenIds: [cousinId], brothersIds: [pereId] });
  await linkRelations(tanteId, { spouseId: oncleId, childrenIds: [cousinId] });
  await linkRelations(cousinId, { parentsIds: [oncleId, tanteId] });
  await updateDoc(doc(db, "Members", jaddId), { childrenIds: [pereId, oncleId], spouseId: jadddaId, isMarried: true });
  await updateDoc(doc(db, "Members", jadddaId), { childrenIds: [pereId, oncleId], spouseId: jaddId, isMarried: true });

  console.log("  ✅ Amina Benali — famille marocaine étendue avec oncle/tante/cousin (11 membres)");
  return uid;
}

// ─── FAMILLE 5 : Salvatore Maltese (Sicilien) ───────────────────────────────
async function seedSalvatoreMaltese() {
  console.log("\n🇮🇹 Création de Salvatore Maltese...");
  const uid = await createAuthUser("salvatore.maltese@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "salvatore.maltese@test.com",
    firstName: "Salvatore",
    lastName: "Maltese",
    birthDate: D(1980, 8, 15),
    nationality: "Italienne",
    localisation: "Palerme, Sicile",
    familyOrigin: "Palerme",
    bio: "Né à Palerme, fier de mes racines siciliennes. Je retrace l'histoire de la famille Maltese depuis le XIXe siècle.",
  });

  const treeId = await createTree("Famiglia Maltese", "Albero genealogico della famiglia Maltese — origini palermitane", uid);

  // Bisnonno / Bisnonna
  const bisnonnoPId = await createMember({ firstName: "Rosario", lastName: "Maltese", gender: "male", treeId, birthDate: D(1895, 3, 7), deathDate: D(1971, 12, 24), nationality: "Italienne", birthPlace: { label: "Palerme, Sicile, Italie", lat: 38.1157, lng: 13.3615 }, bio: "Pêcheur à Palerme, immigrant vers l'Argentine en 1920." });
  const bisnonnaMId = await createMember({ firstName: "Concetta", lastName: "Amato", gender: "female", treeId, birthDate: D(1900, 6, 14), deathDate: D(1985, 4, 2), nationality: "Italienne", birthPlace: { label: "Palerme, Sicile, Italie", lat: 38.1157, lng: 13.3615 } });

  // Grands-parents
  const nonnoId = await createMember({ firstName: "Vincenzo", lastName: "Maltese", gender: "male", treeId, birthDate: D(1925, 11, 19), deathDate: D(2003, 7, 8), nationality: "Italienne", birthPlace: { label: "Palerme, Sicile, Italie", lat: 38.1157, lng: 13.3615 }, bio: "Menuisier, revenu en Sicile après la guerre." });
  const nonnaId = await createMember({ firstName: "Maria", lastName: "Greco", gender: "female", treeId, birthDate: D(1928, 4, 30), deathDate: D(2015, 1, 17), nationality: "Italienne", birthPlace: { label: "Catane, Sicile, Italie", lat: 37.5079, lng: 15.0830 } });

  // Parents
  const padreId = await createMember({ firstName: "Giuseppe", lastName: "Maltese", gender: "male", treeId, birthDate: D(1952, 2, 28), nationality: "Italienne", birthPlace: { label: "Palerme, Sicile, Italie", lat: 38.1157, lng: 13.3615 }, isMarried: true });
  const madreId = await createMember({ firstName: "Rosa", lastName: "Conti", gender: "female", treeId, birthDate: D(1956, 9, 5), nationality: "Italienne", birthPlace: { label: "Messine, Sicile, Italie", lat: 38.1938, lng: 15.5540 }, isMarried: true, bio: "Née Conti, elle a rejoint la famille Maltese en épousant Giuseppe." });

  // Salvatore (membre = uid)
  await createMember({ firstName: "Salvatore", lastName: "Maltese", gender: "male", treeId, birthDate: D(1980, 8, 15), nationality: "Italienne", birthPlace: { label: "Palerme, Sicile, Italie", lat: 38.1157, lng: 13.3615 }, isMarried: true }, uid);

  // Frères et sœurs
  const fratello1Id = await createMember({ firstName: "Antonio", lastName: "Maltese", gender: "male", treeId, birthDate: D(1977, 5, 3), nationality: "Italienne" });
  const sorella1Id = await createMember({ firstName: "Giovanna", lastName: "Maltese", gender: "female", treeId, birthDate: D(1983, 12, 11), nationality: "Italienne" });

  // Épouse (famille Bonanno — lien inter-familles siciliennes)
  const epouseId = await createMember({ firstName: "Carmela", lastName: "Bonanno", gender: "female", treeId, birthDate: D(1982, 3, 22), nationality: "Italienne", birthPlace: { label: "Trapani, Sicile, Italie", lat: 38.0176, lng: 12.5365 }, isMarried: true, bio: "Née Bonanno, famille originaire de Trapani." });

  // Enfants
  const figlio1Id = await createMember({ firstName: "Luca", lastName: "Maltese", gender: "male", treeId, birthDate: D(2008, 7, 19), nationality: "Italienne" });
  const figlio2Id = await createMember({ firstName: "Sofia", lastName: "Maltese", gender: "female", treeId, birthDate: D(2011, 10, 4), nationality: "Italienne" });

  // Oncle (frère du père) + cousins
  const zioId = await createMember({ firstName: "Francesco", lastName: "Maltese", gender: "male", treeId, birthDate: D(1955, 8, 14), nationality: "Italienne", isMarried: true });
  const ziaId = await createMember({ firstName: "Lucia", lastName: "Castiglia", gender: "female", treeId, birthDate: D(1958, 6, 2), nationality: "Italienne", isMarried: true, bio: "Née Castiglia, famille de Agrigente." });
  const cugino1Id = await createMember({ firstName: "Marco", lastName: "Maltese", gender: "male", treeId, birthDate: D(1984, 1, 27), nationality: "Italienne" });
  const cugina1Id = await createMember({ firstName: "Elena", lastName: "Maltese", gender: "female", treeId, birthDate: D(1987, 9, 16), nationality: "Italienne" });

  // Relations
  await linkRelations(bisnonnoPId, { spouseId: bisnonnaMId, childrenIds: [nonnoId] });
  await updateDoc(doc(db, "Members", bisnonnoPId), { isMarried: true });
  await linkRelations(bisnonnaMId, { spouseId: bisnonnoPId, childrenIds: [nonnoId] });
  await updateDoc(doc(db, "Members", bisnonnaMId), { isMarried: true });

  await linkRelations(nonnoId, { parentsIds: [bisnonnoPId, bisnonnaMId], spouseId: nonnaId, childrenIds: [padreId, zioId] });
  await linkRelations(nonnaId, { spouseId: nonnoId, childrenIds: [padreId, zioId] });

  await linkRelations(padreId, { parentsIds: [nonnoId, nonnaId], spouseId: madreId, childrenIds: [uid, fratello1Id, sorella1Id], brothersIds: [zioId] });
  await linkRelations(madreId, { spouseId: padreId, childrenIds: [uid, fratello1Id, sorella1Id] });

  await linkRelations(uid, { parentsIds: [padreId, madreId], brothersIds: [fratello1Id, sorella1Id], spouseId: epouseId, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(fratello1Id, { parentsIds: [padreId, madreId], brothersIds: [uid, sorella1Id] });
  await linkRelations(sorella1Id, { parentsIds: [padreId, madreId], brothersIds: [uid, fratello1Id] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(figlio1Id, { parentsIds: [uid, epouseId], brothersIds: [figlio2Id] });
  await linkRelations(figlio2Id, { parentsIds: [uid, epouseId], brothersIds: [figlio1Id] });

  await linkRelations(zioId, { parentsIds: [nonnoId, nonnaId], brothersIds: [padreId], spouseId: ziaId, childrenIds: [cugino1Id, cugina1Id] });
  await linkRelations(ziaId, { spouseId: zioId, childrenIds: [cugino1Id, cugina1Id] });
  await linkRelations(cugino1Id, { parentsIds: [zioId, ziaId], brothersIds: [cugina1Id] });
  await linkRelations(cugina1Id, { parentsIds: [zioId, ziaId], brothersIds: [cugino1Id] });

  console.log("  ✅ Salvatore Maltese — famille sicilienne 4 générations, liens Bonanno/Conti/Castiglia (17 membres)");
  return uid;
}

// ─── FAMILLE 6 : Rosario Bonanno (Sicilien) ─────────────────────────────────
async function seedRosarioBonanno() {
  console.log("\n🇮🇹 Création de Rosario Bonanno...");
  const uid = await createAuthUser("rosario.bonanno@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "rosario.bonanno@test.com",
    firstName: "Rosario",
    lastName: "Bonanno",
    birthDate: D(1978, 4, 12),
    nationality: "Italienne",
    localisation: "Trapani, Sicile",
    familyOrigin: "Trapani",
    bio: "Famille Bonanno de Trapani depuis plusieurs générations. Ma sœur Carmela a épousé un Maltese.",
  });

  const treeId = await createTree("Famiglia Bonanno", "Albero genealogico della famiglia Bonanno — origini trapanesi", uid);

  // Grands-parents
  const nonnoId = await createMember({ firstName: "Calogero", lastName: "Bonanno", gender: "male", treeId, birthDate: D(1920, 5, 8), deathDate: D(1999, 3, 14), nationality: "Italienne", birthPlace: { label: "Trapani, Sicile, Italie", lat: 38.0176, lng: 12.5365 } });
  const nonnaId = await createMember({ firstName: "Giuseppina", lastName: "Ferrera", gender: "female", treeId, birthDate: D(1924, 10, 27), deathDate: D(2010, 8, 5), nationality: "Italienne", birthPlace: { label: "Trapani, Sicile, Italie", lat: 38.0176, lng: 12.5365 } });

  // Parents
  const padreId = await createMember({ firstName: "Pietro", lastName: "Bonanno", gender: "male", treeId, birthDate: D(1950, 7, 3), nationality: "Italienne", isMarried: true });
  const madreId = await createMember({ firstName: "Angela", lastName: "Rizzo", gender: "female", treeId, birthDate: D(1953, 2, 18), nationality: "Italienne", isMarried: true });

  // Rosario (membre = uid)
  await createMember({ firstName: "Rosario", lastName: "Bonanno", gender: "male", treeId, birthDate: D(1978, 4, 12), nationality: "Italienne", birthPlace: { label: "Trapani, Sicile, Italie", lat: 38.0176, lng: 12.5365 } }, uid);

  // Sœur Carmela (mariée à Salvatore Maltese — même prénom/nom que dans l'arbre Maltese)
  const sorellaId = await createMember({ firstName: "Carmela", lastName: "Bonanno", gender: "female", treeId, birthDate: D(1982, 3, 22), nationality: "Italienne", isMarried: true, bio: "Mariée à Salvatore Maltese de Palerme." });

  // Frère
  const fratelloId = await createMember({ firstName: "Benedetto", lastName: "Bonanno", gender: "male", treeId, birthDate: D(1985, 11, 9), nationality: "Italienne" });

  // Épouse de Rosario (famille Castiglia)
  const epouseId = await createMember({ firstName: "Vittoria", lastName: "Castiglia", gender: "female", treeId, birthDate: D(1980, 8, 30), nationality: "Italienne", birthPlace: { label: "Agrigente, Sicile, Italie", lat: 37.3111, lng: 13.5765 }, isMarried: true, bio: "Née Castiglia d'Agrigente." });

  // Enfants
  const figlio1Id = await createMember({ firstName: "Matteo", lastName: "Bonanno", gender: "male", treeId, birthDate: D(2006, 9, 14), nationality: "Italienne" });
  const figlio2Id = await createMember({ firstName: "Chiara", lastName: "Bonanno", gender: "female", treeId, birthDate: D(2009, 4, 22), nationality: "Italienne" });

  await linkRelations(nonnoId, { spouseId: nonnaId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnoId), { isMarried: true });
  await linkRelations(nonnaId, { spouseId: nonnoId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnaId), { isMarried: true });

  await linkRelations(padreId, { parentsIds: [nonnoId, nonnaId], spouseId: madreId, childrenIds: [uid, sorellaId, fratelloId] });
  await linkRelations(madreId, { spouseId: padreId, childrenIds: [uid, sorellaId, fratelloId] });

  await linkRelations(uid, { parentsIds: [padreId, madreId], brothersIds: [sorellaId, fratelloId], spouseId: epouseId, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(sorellaId, { parentsIds: [padreId, madreId], brothersIds: [uid, fratelloId] });
  await linkRelations(fratelloId, { parentsIds: [padreId, madreId], brothersIds: [uid, sorellaId] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(figlio1Id, { parentsIds: [uid, epouseId], brothersIds: [figlio2Id] });
  await linkRelations(figlio2Id, { parentsIds: [uid, epouseId], brothersIds: [figlio1Id] });

  console.log("  ✅ Rosario Bonanno — Trapani, sœur mariée aux Maltese, épouse Castiglia (11 membres)");
  return uid;
}

// ─── FAMILLE 7 : Ignazio Castiglia (Sicilien, Agrigente) ────────────────────
async function seedIgnazioCastiglia() {
  console.log("\n🇮🇹 Création de Ignazio Castiglia...");
  const uid = await createAuthUser("ignazio.castiglia@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "ignazio.castiglia@test.com",
    firstName: "Ignazio",
    lastName: "Castiglia",
    birthDate: D(1975, 1, 17),
    nationality: "Italienne",
    localisation: "Agrigente, Sicile",
    familyOrigin: "Agrigente",
    bio: "Famille Castiglia d'Agrigente, région de la Vallée des Temples. Deux de mes cousines ont épousé des Bonanno et des Maltese.",
  });

  const treeId = await createTree("Famiglia Castiglia", "Albero genealogico della famiglia Castiglia — Agrigento", uid);

  // Grands-parents
  const nonnoId = await createMember({ firstName: "Salvatore", lastName: "Castiglia", gender: "male", treeId, birthDate: D(1915, 7, 21), deathDate: D(1990, 5, 3), nationality: "Italienne", birthPlace: { label: "Agrigente, Sicile, Italie", lat: 37.3111, lng: 13.5765 } });
  const nonnaId = await createMember({ firstName: "Nunzia", lastName: "Lombardo", gender: "female", treeId, birthDate: D(1919, 3, 11), deathDate: D(2001, 9, 28), nationality: "Italienne", birthPlace: { label: "Agrigente, Sicile, Italie", lat: 37.3111, lng: 13.5765 } });

  // Parents
  const padreId = await createMember({ firstName: "Carmelo", lastName: "Castiglia", gender: "male", treeId, birthDate: D(1948, 10, 6), nationality: "Italienne", isMarried: true });
  const madreId = await createMember({ firstName: "Filomena", lastName: "Amato", gender: "female", treeId, birthDate: D(1951, 5, 14), nationality: "Italienne", isMarried: true });

  // Ignazio (membre = uid)
  await createMember({ firstName: "Ignazio", lastName: "Castiglia", gender: "male", treeId, birthDate: D(1975, 1, 17), nationality: "Italienne", birthPlace: { label: "Agrigente, Sicile, Italie", lat: 37.3111, lng: 13.5765 } }, uid);

  // Frères et sœurs
  const sorella1Id = await createMember({ firstName: "Lucia", lastName: "Castiglia", gender: "female", treeId, birthDate: D(1958, 6, 2), nationality: "Italienne", isMarried: true, bio: "Mariée à Francesco Maltese (oncle de Salvatore)." });
  const sorella2Id = await createMember({ firstName: "Vittoria", lastName: "Castiglia", gender: "female", treeId, birthDate: D(1980, 8, 30), nationality: "Italienne", isMarried: true, bio: "Mariée à Rosario Bonanno de Trapani." });
  const fratelloId = await createMember({ firstName: "Nunzio", lastName: "Castiglia", gender: "male", treeId, birthDate: D(1978, 4, 25), nationality: "Italienne" });

  // Épouse d'Ignazio (famille Conti)
  const epouseId = await createMember({ firstName: "Grazia", lastName: "Conti", gender: "female", treeId, birthDate: D(1977, 11, 3), nationality: "Italienne", birthPlace: { label: "Syracuse, Sicile, Italie", lat: 37.0755, lng: 15.2866 }, isMarried: true, bio: "Née Conti de Syracuse." });

  // Enfants
  const figlio1Id = await createMember({ firstName: "Domenico", lastName: "Castiglia", gender: "male", treeId, birthDate: D(2003, 6, 18), nationality: "Italienne" });
  const figlio2Id = await createMember({ firstName: "Rossella", lastName: "Castiglia", gender: "female", treeId, birthDate: D(2006, 2, 9), nationality: "Italienne" });

  await linkRelations(nonnoId, { spouseId: nonnaId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnoId), { isMarried: true });
  await linkRelations(nonnaId, { spouseId: nonnoId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnaId), { isMarried: true });

  await linkRelations(padreId, { parentsIds: [nonnoId, nonnaId], spouseId: madreId, childrenIds: [uid, sorella1Id, sorella2Id, fratelloId] });
  await linkRelations(madreId, { spouseId: padreId, childrenIds: [uid, sorella1Id, sorella2Id, fratelloId] });

  await linkRelations(uid, { parentsIds: [padreId, madreId], brothersIds: [sorella1Id, sorella2Id, fratelloId], spouseId: epouseId, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(sorella1Id, { parentsIds: [padreId, madreId], brothersIds: [uid, sorella2Id, fratelloId] });
  await linkRelations(sorella2Id, { parentsIds: [padreId, madreId], brothersIds: [uid, sorella1Id, fratelloId] });
  await linkRelations(fratelloId, { parentsIds: [padreId, madreId], brothersIds: [uid, sorella1Id, sorella2Id] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(figlio1Id, { parentsIds: [uid, epouseId], brothersIds: [figlio2Id] });
  await linkRelations(figlio2Id, { parentsIds: [uid, epouseId], brothersIds: [figlio1Id] });

  console.log("  ✅ Ignazio Castiglia — Agrigente, sœurs mariées aux Maltese et Bonanno, épouse Conti (12 membres)");
  return uid;
}

// ─── FAMILLE 8 : Leonardo Conti (Sicilien, Syracuse) ────────────────────────
async function seedLeonardoConti() {
  console.log("\n🇮🇹 Création de Leonardo Conti...");
  const uid = await createAuthUser("leonardo.conti@test.com", "Test1234!");

  await createUserDoc(uid, {
    email: "leonardo.conti@test.com",
    firstName: "Leonardo",
    lastName: "Conti",
    birthDate: D(1974, 9, 28),
    nationality: "Italienne",
    localisation: "Syracuse, Sicile",
    familyOrigin: "Syracuse",
    bio: "Famille Conti de Syracuse. Ma sœur Grazia a épousé un Castiglia d'Agrigente — nos familles sont liées depuis.",
  });

  const treeId = await createTree("Famiglia Conti", "Albero genealogico della famiglia Conti — Siracusa", uid);

  // Grands-parents
  const nonnoId = await createMember({ firstName: "Sebastiano", lastName: "Conti", gender: "male", treeId, birthDate: D(1912, 11, 4), deathDate: D(1988, 6, 19), nationality: "Italienne", birthPlace: { label: "Syracuse, Sicile, Italie", lat: 37.0755, lng: 15.2866 }, bio: "Pêcheur à Syracuse, il a traversé les deux guerres mondiales." });
  const nonnaId = await createMember({ firstName: "Assunta", lastName: "Marino", gender: "female", treeId, birthDate: D(1916, 2, 14), deathDate: D(2004, 11, 30), nationality: "Italienne", birthPlace: { label: "Syracuse, Sicile, Italie", lat: 37.0755, lng: 15.2866 } });

  // Parents
  const padreId = await createMember({ firstName: "Enzo", lastName: "Conti", gender: "male", treeId, birthDate: D(1945, 8, 7), deathDate: D(2020, 4, 2), nationality: "Italienne", isMarried: true, bio: "Professeur d'histoire à Syracuse." });
  const madreId = await createMember({ firstName: "Rosalia", lastName: "Pappalardo", gender: "female", treeId, birthDate: D(1948, 5, 23), nationality: "Italienne", isMarried: true });

  // Leonardo (membre = uid)
  await createMember({ firstName: "Leonardo", lastName: "Conti", gender: "male", treeId, birthDate: D(1974, 9, 28), nationality: "Italienne", birthPlace: { label: "Syracuse, Sicile, Italie", lat: 37.0755, lng: 15.2866 } }, uid);

  // Sœur Grazia (mariée à Ignazio Castiglia)
  const sorellaId = await createMember({ firstName: "Grazia", lastName: "Conti", gender: "female", treeId, birthDate: D(1977, 11, 3), nationality: "Italienne", isMarried: true, bio: "Mariée à Ignazio Castiglia d'Agrigente." });

  // Frère
  const fratelloId = await createMember({ firstName: "Alfio", lastName: "Conti", gender: "male", treeId, birthDate: D(1971, 7, 15), nationality: "Italienne", isMarried: true });

  // Épouse de Leonardo
  const epouseId = await createMember({ firstName: "Caterina", lastName: "Musso", gender: "female", treeId, birthDate: D(1976, 3, 11), nationality: "Italienne", birthPlace: { label: "Raguse, Sicile, Italie", lat: 36.9249, lng: 14.7252 }, isMarried: true });

  // Épouse d'Alfio
  const bellaId = await createMember({ firstName: "Marina", lastName: "Russo", gender: "female", treeId, birthDate: D(1973, 12, 8), nationality: "Italienne", isMarried: true });

  // Enfants de Leonardo
  const figlio1Id = await createMember({ firstName: "Emanuele", lastName: "Conti", gender: "male", treeId, birthDate: D(2002, 5, 12), nationality: "Italienne" });
  const figlio2Id = await createMember({ firstName: "Valeria", lastName: "Conti", gender: "female", treeId, birthDate: D(2005, 8, 27), nationality: "Italienne" });

  // Enfants d'Alfio
  const nipote1Id = await createMember({ firstName: "Giulio", lastName: "Conti", gender: "male", treeId, birthDate: D(2000, 3, 6), nationality: "Italienne" });

  await linkRelations(nonnoId, { spouseId: nonnaId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnoId), { isMarried: true });
  await linkRelations(nonnaId, { spouseId: nonnoId, childrenIds: [padreId] });
  await updateDoc(doc(db, "Members", nonnaId), { isMarried: true });

  await linkRelations(padreId, { parentsIds: [nonnoId, nonnaId], spouseId: madreId, childrenIds: [uid, sorellaId, fratelloId] });
  await linkRelations(madreId, { spouseId: padreId, childrenIds: [uid, sorellaId, fratelloId] });

  await linkRelations(uid, { parentsIds: [padreId, madreId], brothersIds: [sorellaId, fratelloId], spouseId: epouseId, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(sorellaId, { parentsIds: [padreId, madreId], brothersIds: [uid, fratelloId] });
  await linkRelations(fratelloId, { parentsIds: [padreId, madreId], brothersIds: [uid, sorellaId], spouseId: bellaId, childrenIds: [nipote1Id] });
  await linkRelations(epouseId, { spouseId: uid, childrenIds: [figlio1Id, figlio2Id] });
  await linkRelations(bellaId, { spouseId: fratelloId, childrenIds: [nipote1Id] });
  await linkRelations(figlio1Id, { parentsIds: [uid, epouseId], brothersIds: [figlio2Id] });
  await linkRelations(figlio2Id, { parentsIds: [uid, epouseId], brothersIds: [figlio1Id] });
  await linkRelations(nipote1Id, { parentsIds: [fratelloId, bellaId] });

  console.log("  ✅ Leonardo Conti — Syracuse, sœur mariée aux Castiglia, réseau Maltese/Bonanno/Castiglia/Conti (13 membres)");
  return uid;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Démarrage du seed GeneAIlogy...\n");
  console.log("━".repeat(55));

  await seedJeanDupont();
  await seedSophieDupont();
  await seedCarlosMartin();
  await seedAminaBenali();
  await seedSalvatoreMaltese();
  await seedRosarioBonanno();
  await seedIgnazioCastiglia();
  await seedLeonardoConti();

  console.log("\n" + "━".repeat(55));
  console.log("\n✅ Seed terminé avec succès !\n");
  console.log("📋 Comptes de test :");
  console.log("  jean.dupont@test.com        — Test1234!  (FR, 3 générations)");
  console.log("  sophie.dupont@test.com      — Test1234!  (FR, même nom Dupont)");
  console.log("  carlos.martin@test.com      — Test1234!  (ES, franco-espagnol)");
  console.log("  amina.benali@test.com       — Test1234!  (MA, famille étendue)");
  console.log("  salvatore.maltese@test.com  — Test1234!  (IT 🇮🇹 Palerme, 4 générations)");
  console.log("  rosario.bonanno@test.com    — Test1234!  (IT 🇮🇹 Trapani, lié aux Maltese)");
  console.log("  ignazio.castiglia@test.com  — Test1234!  (IT 🇮🇹 Agrigente, lié aux Bonanno)");
  console.log("  leonardo.conti@test.com     — Test1234!  (IT 🇮🇹 Syracuse, lié aux Castiglia)");
  console.log("\n💡 Réseau sicilien :");
  console.log("  Maltese ←→ Bonanno (Carmela Bonanno mariée à Salvatore Maltese)");
  console.log("  Bonanno ←→ Castiglia (Vittoria Castiglia mariée à Rosario Bonanno)");
  console.log("  Castiglia ←→ Conti (Grazia Conti mariée à Ignazio Castiglia)");
  console.log("  Maltese ←→ Castiglia (Lucia Castiglia mariée à Francesco Maltese)");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Erreur durant le seed :", err.message);
  process.exit(1);
});
