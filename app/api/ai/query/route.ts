// app/api/ai/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import admin from "firebase-admin";
import { MemberType } from "@/lib/firebase/models";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// —————————————————————————————————————
// Initialisation Firebase Admin
// —————————————————————————————————————

const getServiceAccount = () => {
  try {
    if (process.env.NODE_ENV === "production") {
      const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
      if (!creds) throw new Error("FIREBASE_ADMIN_CREDENTIALS non défini");
      return JSON.parse(creds);
    } else {
      return require("@/firebase-admin-key.json");
    }
  } catch (error) {
    console.error("❌ Erreur lecture service account:", error);
    throw error;
  }
};

if (!admin.apps.length) {
  try {
    const serviceAccount = getServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialisé");
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase Admin:", error);
  }
}

const db = admin.firestore();
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

  // calcul des grands-parents
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

  // petits-enfants
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

  // oncle / tante
  for (const pid of parentIds) {
    const p = allMembers.find(m => m.id === pid);
    if (p?.brothersIds?.includes(targetId)) {
      return "oncle/tante";
    }
  }

  // grand-oncle / grand-tante
  for (const gpid of grandparentIds) {
    const gp = allMembers.find(m => m.id === gpid);
    if (gp?.brothersIds?.includes(targetId)) {
      return "grand-oncle/tante";
    }
  }

  // cousins
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

  // petit-neveu / nièce
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

  // cousin au second degré
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
  const potentialMatches: any[] = [];
  const surnames = currentTree.surnames || [];
  const userSurname = currentUserMember.lastName;
  if (surnames.length === 0 && !userSurname) {
    return [];
  }

  const searchSurnames = [...new Set([...surnames, userSurname].filter(Boolean))];
  console.log("🔍 Recherche de correspondances pour les noms:", searchSurnames);

  const otherMembersSnap = await db
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
      if (
        member.nationality &&
        currentTree.origin?.includes(member.nationality)
      ) {
        matchScore += 2;
        matchReasons.push("même origine géographique");
      }
      if (member.birthPlace && currentUserMember.birthPlace) {
        const userCity =
          (currentUserMember.birthPlace as any).city?.toLowerCase() ?? "";
        const memCity =
          (member.birthPlace as any).city?.toLowerCase() ?? "";
        if (userCity.includes(memCity) || memCity.includes(userCity)) {
          matchScore += 2;
          matchReasons.push("région de naissance similaire");
        }
      }
      if (member.birthDate && currentUserMember.birthDate) {
        const mYear = new Date(member.birthDate).getFullYear();
        const uYear = new Date(currentUserMember.birthDate).getFullYear();
        const diff = Math.abs(mYear - uYear);
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
  console.log(`✅ ${potentialMatches.length} correspondances potentielles trouvées`);
  return potentialMatches.slice(0, 20);
}

/**
 * Recherche d'arbres similaires par surname spécifique
 */
async function findSimilarFamilies(
  currentTree: any,
  searchSurname?: string
): Promise<any[]> {
  console.log("🧬 Recherche de familles similaires...");

  const surnamesLower: string[] = currentTree.surnamesLower || [];
  const origins: string[] = currentTree.origin || [];

  // Si un surname spécifique est recherché, l'utiliser
  const targetSurnames = searchSurname
    ? [searchSurname.toLowerCase()]
    : surnamesLower;

  if (targetSurnames.length === 0) {
    return [];
  }

  const allTreesSnap = await db.collection("Trees").get();
  const potential: any[] = [];

  allTreesSnap.forEach(doc => {
    if (doc.id === currentTree.id) return;
    const other = doc.data();

    // Chercher les noms communs
    const commonNames = (other.surnamesLower || []).filter((n: string) =>
      targetSurnames.includes(n)
    );

    // Chercher les origines communes
    const commonOrigins = (other.origin || []).filter((o: string) =>
      origins.includes(o)
    );

    // Cas 1: Nom + Origine (score plus élevé - match fort)
    if (commonNames.length > 0 && commonOrigins.length > 0) {
      const score = commonNames.length * 10 + commonOrigins.length * 5;
      const reasons: string[] = [];

      reasons.push(`même nom (${commonNames.join(", ")})`);
      reasons.push(`origine commune (${commonOrigins.join(", ")})`);

      potential.push({
        id: doc.id,
        cardType: "tree",
        name: other.name,
        surnames: other.surnames,
        origins: other.origin,
        matchScore: score,
        matchReasons: reasons,
        matchLevel: "strong", // Match fort
        ownerId: other.ownerId
      });
    }
    // Cas 2: Seulement nom (score plus faible - match faible)
    else if (commonNames.length > 0) {
      const score = commonNames.length * 3;
      const reasons: string[] = [];

      reasons.push(`même nom (${commonNames.join(", ")})`);
      if (commonOrigins.length === 0) {
        reasons.push("origines différentes");
      }

      potential.push({
        id: doc.id,
        cardType: "tree",
        name: other.name,
        surnames: other.surnames,
        origins: other.origin,
        matchScore: score,
        matchReasons: reasons,
        matchLevel: "weak", // Match faible
        ownerId: other.ownerId
      });
    }
  });

  potential.sort((a, b) => b.matchScore - a.matchScore);
  console.log(`✅ ${potential.length} familles similaires trouvées`);
  return potential.slice(0, 15); // Augmenté de 10 à 15 pour avoir plus de résultats
}

/**
 * Recherche d'ancêtres communs
 */
async function findCommonAncestors(
  currentTree: any,
  allMembers: any[]
): Promise<any[]> {
  console.log("🧬 Recherche d'ancêtres communs...");
  const ancestorNames = allMembers
    .filter(m => m.isAncestor)
    .map(m => m.lastName?.toLowerCase())
    .filter(Boolean);

  if (ancestorNames.length === 0) {
    return [];
  }

  const otherMembersSnap = await db
    .collection("Members")
    .where("lastNameLower", "in", ancestorNames.slice(0, 10))
    .get();

  const results: any[] = [];
  otherMembersSnap.forEach(doc => {
    const data = doc.data();
    if (data.treeId !== currentTree.id) {
      results.push({
        id: doc.id,
        cardType: "member",
        ...data,
        matchReason: "nom d'ancêtre commun",
      });
    }
  });

  console.log(`✅ ${results.length} ancêtres communs trouvés`);
  return results;
}

// —————————————————————————————————————
// Définition correcte des tools
// —————————————————————————————————————
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchPotentialRelatives",
      description:
        "Recherche des membres potentiellement liés dans d'autres arbres selon nom, lieu de naissance, etc.",
      parameters: {
        type: "object" as const,
        properties: {
          treeId: { type: "string" },
          userMemberId: { type: "string" },
        },
        required: ["treeId", "userMemberId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "findSimilarFamilies",
      description:
        "Recherche des arbres similaires (familles similaires) selon noms de famille ou origines partagées. Peut rechercher un nom de famille spécifique.",
      parameters: {
        type: "object" as const,
        properties: {
          treeId: { type: "string" },
          surname: { type: "string", description: "Nom de famille spécifique à rechercher (optionnel)" },
        },
        required: ["treeId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "findCommonAncestors",
      description:
        "Recherche d'ancêtres communs entre arbres",
      parameters: {
        type: "object" as const,
        properties: {
          treeId: { type: "string" },
          memberIds: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["treeId", "memberIds"],
      },
    },
  },
];

// —————————————————————————————————————
// Handler principal
// —————————————————————————————————————

export async function POST(req: Request) {
  try {
    console.log("📥 Requête reçue");
    const body = await req.json();
    const { prompt, userId } = body;

    if (!prompt || !userId)
      return NextResponse.json({ error: "Prompt ou userId manquant." }, { status: 400 });

    // 🔎 Données utilisateur + arbre
    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists)
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const user = userDoc.data();
    const treeId = user?.treesIds?.[0];
    if (!treeId) {
      const aiResponseNoTree = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es Fam, assistant en généalogie." },
          {
            role: "user",
            content: `L'utilisateur n'a pas encore d'arbre. Réponds à cette question : "${prompt}".`,
          },
        ],
        temperature: 0.7,
      });
      return NextResponse.json({
        answer: aiResponseNoTree.choices[0]?.message?.content ?? "",
      });
    }

    const treeDoc = await db.collection("Trees").doc(treeId).get();
    if (!treeDoc.exists)
      return NextResponse.json({ error: "Arbre introuvable." }, { status: 404 });

    const tree = { id: treeId, ...(treeDoc.data() as any) };
    const allMembersSnap = await db.collection("Members").where("treeId", "==", treeId).get();
    const allMembers: any[] = [];
    allMembersSnap.forEach(doc => allMembers.push({ id: doc.id, ...(doc.data() as MemberType) }));

    let currentUserMember =
      allMembers.find(m => m.id === userId) ||
      allMembers.find(m => m.id === (user as any).memberId);
    if (!currentUserMember)
      return NextResponse.json({
        error: "Votre profil n'est pas lié à un membre de cet arbre.",
      });

    // —————————————————————————————————————
    // 1️⃣ Premier appel à GPT (choix d'une fonction)
    // —————————————————————————————————————
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Tu es Fam, assistant IA spécialisé en généalogie. Tu peux utiliser les outils suivants : searchPotentialRelatives, findSimilarFamilies, findCommonAncestors.

**STYLE DE RÉPONSE (TRÈS IMPORTANT):**
- Sois CONCIS et DIRECT (max 2-3 phrases par idée)
- Utilise une structure claire avec des tirets ou numérotation si nécessaire
- Sois AMICAL et BIENVEILLANT dans le ton
- Évite les pavés de texte
- Va droit au but sans détails superflus
- Si tu trouves des résultats, résume-les rapidement

**EXEMPLES:**
❌ "Nous avons effectué une recherche exhaustive dans notre base de données et avons trouvé plusieurs correspondances potentielles qui pourraient présenter un intérêt généalogique..."
✅ "J'ai trouvé 3 Bonanno dans d'autres arbres ! Ils ont tous l'origine italienne comme toi 🎯"

**IMPORTANT - QUAND UTILISER findSimilarFamilies:**
L'utilisateur cherche des noms de famille dans les AUTRES ARBRES généalogiques, pas dans le sien.
Tu dois appeler findSimilarFamilies avec le surname extrait de la demande.
Exemple: "Peux-tu chercher des Maltese" → appelle findSimilarFamilies avec surname: "Maltese"

**CONTEXTE:**
- L'ID de l'arbre actuel: ${tree.id}
- Nom de l'arbre: ${tree.name}
- Noms de famille DANS CET ARBRE: ${(tree.surnames || []).join(", ")}

IMPORTANT: Utilise TOUJOURS l'ID réel de l'arbre, pas le nom.`,
      },
      { role: "user", content: prompt },
    ];

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0,
    });

    const message0 = aiResponse.choices[0].message;
    const toolCalls = (message0 as any).tool_calls;

    // —————————————————————————————————————
    // 2️⃣ Si GPT appelle une ou plusieurs fonctions
    // —————————————————————————————————————
    if (toolCalls && toolCalls.length > 0) {
      const allResults: any[] = [];
      const toolResponses: ChatCompletionMessageParam[] = [
        ...messages,
        message0 as ChatCompletionMessageParam,
      ];

      // Traiter TOUS les tool_calls
      for (const toolCall of toolCalls) {
        const { function: fn, id: callId } = toolCall;
        const name = fn.name;
        let args: any = {};

        try {
          args = JSON.parse(fn.arguments || "{}");
        } catch {
          console.warn("⚠️ Impossible de parser les arguments du tool_call");
        }

        let result: any = null;
        console.log(`🛠️ GPT appelle ${name} avec`, args);

        if (name === "searchPotentialRelatives")
          result = await searchPotentialRelatives(tree, currentUserMember, allMembers);
        else if (name === "findSimilarFamilies") {
          const searchSurname = args.surname || undefined;
          result = await findSimilarFamilies(tree, searchSurname);
        }
        else if (name === "findCommonAncestors")
          result = await findCommonAncestors(tree, allMembers);
        else throw new Error(`Fonction inconnue appelée : ${name}`);

        // Ajouter la réponse du tool
        toolResponses.push({
          role: "tool",
          tool_call_id: callId,
          content: JSON.stringify(result),
        });

        allResults.push(...result);
      }

      // —————————————————————————————————————
      // 3️⃣ Second appel GPT : réponse finale avec résultats
      // —————————————————————————————————————
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: toolResponses,
        temperature: 0.7,
      });

      const finalAnswer = secondResponse.choices[0]?.message?.content ?? "";
      return NextResponse.json({
        answer: finalAnswer,
        cards: allResults,
        calledFunction: toolCalls.map((tc: any) => tc.function.name).join(", "),
      });
    }

    // —————————————————————————————————————
    // 4️⃣ Sinon : GPT répond directement
    // —————————————————————————————————————
    const finalText = message0?.content ?? "";
    return NextResponse.json({ answer: finalText });
  } catch (error: any) {
    console.error("❌ ERREUR SERVEUR:", error);
    return NextResponse.json(
      {
        error: "Erreur interne serveur",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}