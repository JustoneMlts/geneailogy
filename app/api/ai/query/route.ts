// app/api/ai/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import admin from "firebase-admin";
import { MemberType } from "@/lib/firebase/models";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// —————————————————————————————————————
// Initialisation Firebase Admin (lazy)
// —————————————————————————————————————
let db: FirebaseFirestore.Firestore | null = null;

function initFirebaseAdmin() {
  if (db) return db; // Déjà initialisé
  
  if (!admin.apps.length) {
    try {
      let serviceAccount;
      
      if (process.env.NODE_ENV === "production") {
        const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
        if (!creds) {
          throw new Error("FIREBASE_ADMIN_CREDENTIALS non défini en production");
        }
        serviceAccount = JSON.parse(creds);
      } else {
        // En développement, essayer de charger le fichier local
        try {
          serviceAccount = require("@/firebase-admin-key.json");
        } catch (error) {
          console.warn("⚠️ Fichier firebase-admin-key.json non trouvé en développement");
          return null;
        }
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
    } catch (error) {
      console.error("❌ Erreur initialisation Firebase Admin:", error);
      return null;
    }
  }
  
  db = admin.firestore();
  return db;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// —————————————————————————————————————
// Fonctions "tools" de recherche
// —————————————————————————————————————

function determineRelationship(
  currentMember: any,
  targetMember: any,
  allMembers: any[]
): string {
  const currentId = currentMember.id;
  const targetId = targetMember.id;

  if (currentId === targetId) return "moi-même";
  if (currentMember.parentsIds?.includes(targetId)) return "parent";
  if (currentMember.childrenIds?.includes(targetId)) return "enfant";
  if (currentMember.brothersIds?.includes(targetId)) return "frère/sœur";

  const siblings = currentMember.brothersIds || [];
  if (targetMember.parentsIds) {
    for (const parentId of targetMember.parentsIds) {
      if (siblings.includes(parentId)) {
        return "neveu/nièce";
      }
    }
  }

  const parentIds = currentMember.parentsIds || [];

  let grandparentIds: string[] = [];
  for (const pid of parentIds) {
    const p = allMembers.find(m => m.id === pid);
    if (p?.parentsIds) {
      grandparentIds.push(...p.parentsIds);
    }
  }

  for (const gpId of grandparentIds) {
    const gp = allMembers.find(m => m.id === gpId);
    if (gp?.parentsIds?.includes(targetId)) {
      return "arrière-grand-parent";
    }
  }
  if (grandparentIds.includes(targetId)) {
    return "grand-parent";
  }

  const childrenIds = currentMember.childrenIds || [];
  let grandchildrenIds: string[] = [];
  for (const cid of childrenIds) {
    const c = allMembers.find(m => m.id === cid);
    if (c?.childrenIds) {
      grandchildrenIds.push(...c.childrenIds);
    }
  }
  if (grandchildrenIds.includes(targetId)) {
    return "petit-enfant";
  }
  for (const gcId of grandchildrenIds) {
    const gc = allMembers.find(m => m.id === gcId);
    if (gc?.childrenIds?.includes(targetId)) {
      return "arrière-petit-enfant";
    }
  }

  for (const pid of parentIds) {
    const p = allMembers.find(m => m.id === pid);
    if (p?.brothersIds?.includes(targetId)) {
      return "oncle/tante";
    }
  }

  for (const gpid of grandparentIds) {
    const gp = allMembers.find(m => m.id === gpid);
    if (gp?.brothersIds?.includes(targetId)) {
      return "grand-oncle/tante";
    }
  }

  for (const pid of parentIds) {
    const p = allMembers.find(m => m.id === pid);
    const unclesAunts = p?.brothersIds || [];
    if (targetMember.parentsIds) {
      for (const tpid of targetMember.parentsIds) {
        if (unclesAunts.includes(tpid)) {
          return "cousin/cousine";
        }
      }
    }
  }

  for (const sid of siblings) {
    const s = allMembers.find(m => m.id === sid);
    const niecesNephews = s?.childrenIds || [];
    for (const nnid of niecesNephews) {
      const nn = allMembers.find(m => m.id === nnid);
      if (nn?.childrenIds?.includes(targetId)) {
        return "petit-neveu/nièce";
      }
    }
  }

  for (const pid of parentIds) {
    const p = allMembers.find(m => m.id === pid);
    const unclesAunts = p?.brothersIds || [];
    const cousinIds: string[] = [];
    for (const ua of unclesAunts) {
      const uam = allMembers.find(m => m.id === ua);
      if (uam?.childrenIds) {
        cousinIds.push(...uam.childrenIds);
      }
    }
    if (targetMember.parentsIds) {
      for (const tpid of targetMember.parentsIds) {
        if (cousinIds.includes(tpid)) {
          return "cousin au second degré";
        }
      }
    }
  }

  return "autre membre de la famille";
}

/**
 * Recherche de membres potentiels dans d'autres arbres
 */
async function searchPotentialRelatives(
  currentTree: any,
  currentUserMember: any,
  allCurrentMembers: any[]
): Promise<any[]> {
  const database = initFirebaseAdmin();
  if (!database) return [];

  const potentialMatches: any[] = [];
  const surnames = currentTree.surnames || [];
  const userSurname = currentUserMember.lastName;
  if (surnames.length === 0 && !userSurname) return [];

  const searchSurnames = [...new Set([...surnames, userSurname].filter(Boolean))];
  const otherMembersSnap = await database
    .collection("Members")
    .where("lastName", "in", searchSurnames.slice(0, 10))
    .get();

  otherMembersSnap.forEach(doc => {
    const member = { id: doc.id, ...(doc.data() as MemberType) };
    if (
      member.treeId !== currentTree.id &&
      !allCurrentMembers.some(m => m.id === member.id)
    ) {
      let matchScore = 0;
      const matchReasons: string[] = [];

      if (member.lastName === userSurname) {
        matchScore += 3;
        matchReasons.push("même nom de famille");
      }
      if (member.nationality && currentTree.origin?.includes(member.nationality)) {
        matchScore += 2;
        matchReasons.push("même origine géographique");
      }
      if (member.birthPlace && currentUserMember.birthPlace) {
        const userCity = (currentUserMember.birthPlace as any).city?.toLowerCase() ?? "";
        const memCity = (member.birthPlace as any).city?.toLowerCase() ?? "";
        if (userCity.includes(memCity) || memCity.includes(userCity)) {
          matchScore += 2;
          matchReasons.push("région de naissance similaire");
        }
      }
      if (member.birthDate && currentUserMember.birthDate) {
        const diff = Math.abs(new Date(member.birthDate).getFullYear() - new Date(currentUserMember.birthDate).getFullYear());
        if (diff < 50) {
          matchScore += 1;
          matchReasons.push("période similaire");
        }
      }

      if (matchScore >= 2) {
        potentialMatches.push({
          ...member,
          cardType: "member",
          matchScore,
          matchReasons,
        });
      }
    }
  });

  potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
  return potentialMatches.slice(0, 20);
}

/**
 * Recherche d'arbres similaires par surname spécifique
 */
async function findSimilarFamilies(currentTree: any, searchSurname?: string): Promise<any[]> {
  const database = initFirebaseAdmin();
  if (!database) return [];
  
  const surnamesLower: string[] = currentTree.surnamesLower || [];
  const origins: string[] = currentTree.origin || [];

  const targetSurnames = searchSurname ? [searchSurname.toLowerCase()] : surnamesLower;
  if (targetSurnames.length === 0) return [];

  const allTreesSnap = await database.collection("Trees").get();
  const potential: any[] = [];

  allTreesSnap.forEach(doc => {
    if (doc.id === currentTree.id) return;
    const other = doc.data();

    const commonNames = (other.surnamesLower || []).filter((n: string) => targetSurnames.includes(n));
    const commonOrigins = (other.origin || []).filter((o: string) => origins.includes(o));

    if (commonNames.length > 0 && commonOrigins.length > 0) {
      const score = commonNames.length * 10 + commonOrigins.length * 5;
      const reasons: string[] = [`même nom (${commonNames.join(", ")})`, `origine commune (${commonOrigins.join(", ")})`];
      potential.push({ id: doc.id, cardType: "tree", name: other.name, surnames: other.surnames, origins: other.origin, matchScore: score, matchReasons: reasons, matchLevel: "strong", ownerId: other.ownerId });
    } else if (commonNames.length > 0) {
      const score = commonNames.length * 3;
      const reasons: string[] = [`même nom (${commonNames.join(", ")})`];
      if (commonOrigins.length === 0) reasons.push("origines différentes");
      potential.push({ id: doc.id, cardType: "tree", name: other.name, surnames: other.surnames, origins: other.origin, matchScore: score, matchReasons: reasons, matchLevel: "weak", ownerId: other.ownerId });
    }
  });

  potential.sort((a, b) => b.matchScore - a.matchScore);
  return potential.slice(0, 15);
}

/**
 * Recherche d'ancêtres communs
 */
async function findCommonAncestors(currentTree: any, allMembers: any[]): Promise<any[]> {
  const database = initFirebaseAdmin();
  if (!database) return [];
  
  const ancestorNames = allMembers.filter(m => m.isAncestor).map(m => m.lastName?.toLowerCase()).filter(Boolean);
  if (ancestorNames.length === 0) return [];

  const otherMembersSnap = await database.collection("Members").where("lastNameLower", "in", ancestorNames.slice(0, 10)).get();
  const results: any[] = [];
  otherMembersSnap.forEach(doc => {
    const data = doc.data();
    if (data.treeId !== currentTree.id) {
      results.push({ id: doc.id, cardType: "member", ...data, matchReason: "nom d'ancêtre commun" });
    }
  });
  return results;
}

// —————————————————————————————————————
// Définition des tools
// —————————————————————————————————————
const tools: ChatCompletionTool[] = [
  { type: "function", function: { name: "searchPotentialRelatives", description: "Recherche des membres potentiellement liés", parameters: { type: "object" as const, properties: { treeId: { type: "string" }, userMemberId: { type: "string" } }, required: ["treeId", "userMemberId"] } } },
  { type: "function", function: { name: "findSimilarFamilies", description: "Recherche des arbres similaires", parameters: { type: "object" as const, properties: { treeId: { type: "string" }, surname: { type: "string", description: "Nom de famille spécifique" } }, required: ["treeId"] } } },
  { type: "function", function: { name: "findCommonAncestors", description: "Recherche d'ancêtres communs", parameters: { type: "object" as const, properties: { treeId: { type: "string" }, memberIds: { type: "array", items: { type: "string" } } }, required: ["treeId", "memberIds"] } } },
];

// —————————————————————————————————————
// Handler principal
// —————————————————————————————————————
export async function POST(req: Request) {
  try {
    const database = initFirebaseAdmin();
    
    if (!database) {
      return NextResponse.json({ 
        error: "Firebase Admin non disponible. Configuration manquante." 
      }, { status: 503 });
    }

    const body = await req.json();
    const { prompt, userId } = body;
    
    if (!prompt || !userId) {
      return NextResponse.json({ 
        error: "Prompt ou userId manquant." 
      }, { status: 400 });
    }

    const userDoc = await database.collection("Users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: "Utilisateur introuvable." 
      }, { status: 404 });
    }

    const user = userDoc.data();
    const treeId = user?.treesIds?.[0];
    
    if (!treeId) {
      const aiResponseNoTree = await openai.chat.completions.create({ 
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: "Tu es Fam, assistant en généalogie." }, 
          { role: "user", content: `L'utilisateur n'a pas encore d'arbre. Réponds à cette question : "${prompt}".` }
        ], 
        temperature: 0.7 
      });
      return NextResponse.json({ 
        answer: aiResponseNoTree.choices[0]?.message?.content ?? "" 
      });
    }

    const treeDoc = await database.collection("Trees").doc(treeId).get();
    if (!treeDoc.exists) {
      return NextResponse.json({ 
        error: "Arbre introuvable." 
      }, { status: 404 });
    }

    const tree = { id: treeId, ...(treeDoc.data() as any) };
    const allMembersSnap = await database.collection("Members").where("treeId", "==", treeId).get();
    const allMembers: any[] = [];
    allMembersSnap.forEach(doc => allMembers.push({ id: doc.id, ...(doc.data() as MemberType) }));

    let currentUserMember = allMembers.find(m => m.id === userId) || allMembers.find(m => m.id === (user as any).memberId);
    if (!currentUserMember) {
      return NextResponse.json({ 
        error: "Votre profil n'est pas lié à un membre de cet arbre." 
      });
    }

    const messages: ChatCompletionMessageParam[] = [
      { 
        role: "system", 
        content: `Tu es Fam, assistant IA spécialisé en généalogie. Utilise tools: searchPotentialRelatives, findSimilarFamilies, findCommonAncestors. Contexte: arbre=${tree.id}, noms: ${(tree.surnames || []).join(", ")}` 
      },
      { role: "user", content: prompt },
    ];

    const aiResponse = await openai.chat.completions.create({ 
      model: "gpt-4o-mini", 
      messages, 
      tools, 
      tool_choice: "auto", 
      temperature: 0 
    });
    
    const message0 = aiResponse.choices[0].message;
    const toolCalls = (message0 as any).tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const allResults: any[] = [];
      const toolResponses: ChatCompletionMessageParam[] = [...messages, message0 as ChatCompletionMessageParam];

      for (const toolCall of toolCalls) {
        const { function: fn, id: callId } = toolCall;
        const name = fn.name;
        let args: any = {};
        try { args = JSON.parse(fn.arguments || "{}"); } catch {}
        let result: any = null;

        if (name === "searchPotentialRelatives") {
          result = await searchPotentialRelatives(tree, currentUserMember, allMembers);
        } else if (name === "findSimilarFamilies") {
          result = await findSimilarFamilies(tree, args.surname || undefined);
        } else if (name === "findCommonAncestors") {
          result = await findCommonAncestors(tree, allMembers);
        } else {
          throw new Error(`Fonction inconnue appelée : ${name}`);
        }

        toolResponses.push({ 
          role: "tool", 
          tool_call_id: callId, 
          content: JSON.stringify(result) 
        });
        allResults.push(...result);
      }

      const secondResponse = await openai.chat.completions.create({ 
        model: "gpt-4o-mini", 
        messages: toolResponses, 
        temperature: 0.7 
      });
      
      return NextResponse.json({ 
        answer: secondResponse.choices[0]?.message?.content ?? "", 
        cards: allResults, 
        calledFunction: toolCalls.map((tc: any) => tc.function.name).join(", ") 
      });
    }

    return NextResponse.json({ 
      answer: message0?.content ?? "" 
    });
    
  } catch (error: any) {
    console.error("Erreur dans POST /api/ai/query:", error);
    return NextResponse.json({ 
      error: "Erreur interne serveur", 
      details: process.env.NODE_ENV === "development" ? error.message : undefined 
    }, { status: 500 });
  }
}