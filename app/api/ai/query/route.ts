// app/api/ai/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import admin from "firebase-admin";
import { MemberType } from "@/lib/firebase/models";

const getServiceAccount = () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
      if (!creds) {
        throw new Error("FIREBASE_ADMIN_CREDENTIALS non défini");
      }
      return JSON.parse(creds);
    } else {
      return require('@/firebase-admin-key.json');
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

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY non défini");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 🔹 Fonction pour déterminer la relation
function determineRelationship(currentMember: any, targetMember: any, allMembers: any[]) {
  const currentId = currentMember.id;
  const targetId = targetMember.id;

  if (currentId === targetId) return "moi-même";
  if (currentMember.parentsIds?.includes(targetId)) return "parent";
  if (currentMember.childrenIds?.includes(targetId)) return "enfant";
  if (currentMember.brothersIds?.includes(targetId)) return "frère/sœur";

  const siblings = currentMember.brothersIds || [];
  for (const siblingId of siblings) {
    const sibling = allMembers.find(m => m.id === siblingId);
    if (sibling?.childrenIds?.includes(targetId)) {
      return "neveu/nièce";
    }
  }

  const parentIds = currentMember.parentsIds || [];
  for (const parentId of parentIds) {
    const parent = allMembers.find(m => m.id === parentId);
    if (parent?.parentsIds?.includes(targetId)) {
      return "grand-parent";
    }
  }

  const childrenIds = currentMember.childrenIds || [];
  for (const childId of childrenIds) {
    const child = allMembers.find(m => m.id === childId);
    if (child?.childrenIds?.includes(targetId)) {
      return "petit-enfant";
    }
  }

  for (const parentId of parentIds) {
    const parent = allMembers.find(m => m.id === parentId);
    if (parent?.brothersIds?.includes(targetId)) {
      return "oncle/tante";
    }
  }

  for (const parentId of parentIds) {
    const parent = allMembers.find(m => m.id === parentId);
    const unclesAunts = parent?.brothersIds || [];

    for (const uncleAuntId of unclesAunts) {
      const uncleAunt = allMembers.find(m => m.id === uncleAuntId);
      if (uncleAunt?.childrenIds?.includes(targetId)) {
        return "cousin/cousine";
      }
    }
  }

  return "autre membre de la famille";
}

// 🔹 Nouvelle fonction : Rechercher des membres potentiels dans d'autres arbres
async function searchPotentialRelatives(currentTree: any, currentUserMember: any, allCurrentMembers: any[]) {
  try {
    const potentialMatches: any[] = [];

    // Extraire les noms de famille de l'arbre actuel
    const surnames = currentTree.surnames || [];
    const userSurname = currentUserMember.lastName;

    if (surnames.length === 0 && !userSurname) {
      return [];
    }

    // Chercher dans tous les noms de famille pertinents
    const searchSurnames = [...new Set([...surnames, userSurname].filter(Boolean))];

    console.log("🔍 Recherche de correspondances pour les noms:", searchSurnames);

    // Rechercher dans d'autres arbres avec les mêmes noms de famille
    const otherMembersSnap = await db.collection("Members")
      .where("lastName", "in", searchSurnames.slice(0, 10)) // Firestore limite à 10
      .get();

    otherMembersSnap.forEach(doc => {
      const member = { id: doc.id, ...(doc.data() as MemberType) };
      // Exclure les membres de l'arbre actuel
      if (member.treeId !== currentTree.id && !allCurrentMembers.some(m => m.id === member.id)) {

        // Calculer un score de correspondance
        let matchScore = 0;
        let matchReasons: string[] = [];

        // Même nom de famille
        if (member.lastName === userSurname) {
          matchScore += 3;
          matchReasons.push("même nom de famille");
        }

        // Même nationalité/origine
        if (member.nationality && currentTree.origin?.includes(member.nationality)) {
          matchScore += 2;
          matchReasons.push("même origine géographique");
        }

        // Même région de naissance (si disponible)
        if (member.birthPlace && currentUserMember.birthPlace) {
          const userCity = currentUserMember.birthPlace.toLowerCase();
          const memberCity = member.birthPlace.city.toLowerCase();

          if (userCity.includes(memberCity) || memberCity.includes(userCity)) {
            matchScore += 2;
            matchReasons.push("région de naissance similaire");
          }
        }

        // Période temporelle proche
        if (member.birthDate && currentUserMember.birthDate) {
          const memberYear = new Date(member.birthDate).getFullYear();
          const userYear = new Date(currentUserMember.birthDate).getFullYear();
          const yearDiff = Math.abs(memberYear - userYear);

          if (yearDiff < 50) {
            matchScore += 1;
            matchReasons.push("période similaire");
          }
        }

        // Ajouter seulement si score > 2
        if (matchScore >= 2) {
          potentialMatches.push({
            ...member,
            matchScore,
            matchReasons,
          });
        }
      }
    });

    // Trier par score décroissant
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`✅ ${potentialMatches.length} correspondances potentielles trouvées`);

    return potentialMatches.slice(0, 20); // Limiter à 20 résultats

  } catch (error) {
    console.error("❌ Erreur recherche membres potentiels:", error);
    return [];
  }
}

// 🔹 Détecter si la requête concerne la recherche de parents éloignés
function isSearchQuery(prompt: string): boolean {
  const searchKeywords = [
    'retrouver', 'recherche', 'cherche', 'trouver', 'découvrir',
    'cousin éloigné', 'cousins éloignés', 'parent éloigné', 'parents éloignés',
    'lien de parenté', 'correspondance', 'même nom', 'ancêtre commun',
    'famille élargie', 'branche familiale', 'descendants'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return searchKeywords.some(keyword => lowerPrompt.includes(keyword));
}

export async function POST(req: Request) {
  try {
    console.log("📥 Requête reçue");

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Corps de la requête invalide" },
        { status: 400 }
      );
    }

    const { prompt, userId } = body;
    console.log("📝 Prompt:", prompt);
    console.log("👤 UserId:", userId);

    if (!prompt || !userId) {
      return NextResponse.json(
        { error: "Prompt ou userId manquant." },
        { status: 400 }
      );
    }

    // 🔹 Récupérer l'utilisateur
    console.log("🔍 Recherche utilisateur...");
    const userDoc = await db.collection("Users").doc(userId).get();

    if (!userDoc.exists) {
      console.log("❌ Utilisateur non trouvé");
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const user = userDoc.data();
    console.log("✅ Utilisateur trouvé");

    // 🔹 Vérifier si l'utilisateur a un arbre
    const treeId = user?.treesIds?.[0];

    if (!treeId) {
      console.log("⚠️ Utilisateur sans arbre - Mode général");

      const aiPrompt = `
Tu es Fam, un assistant expert en généalogie.
L'utilisateur n'a pas encore créé son arbre généalogique.

Question de l'utilisateur : "${prompt}"

Réponds de manière claire et amicale, comme si tu étais un ami qui répondait à un message. Si la question concerne son arbre personnel ou la recherche de parents, explique-lui qu'il doit d'abord créer son arbre généalogique pour pouvoir bénéficier de la fonctionnalité de recherche de parents potentiels.
`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es Fam, assistant expert et amical en généalogie." },
          { role: "user", content: aiPrompt },
        ],
        temperature: 0.7,
      });

      const answer = aiResponse.choices[0]?.message?.content ?? "Je n'ai pas pu trouver de réponse 😅";
      return NextResponse.json({ answer });
    }

    console.log("🌳 TreeId:", treeId);
    const treeDoc = await db.collection("Trees").doc(treeId).get();

    if (!treeDoc.exists) {
      console.log("❌ Arbre non trouvé");
      return NextResponse.json(
        { error: "Arbre introuvable." },
        { status: 404 }
      );
    }

    const tree = { id: treeId, ...treeDoc.data() };
    console.log("✅ Arbre trouvé");

    // 🔹 Récupérer TOUS les membres
    console.log("👥 Récupération des membres...");
    const allMembersSnap = await db.collection("Members")
      .where("treeId", "==", treeId)
      .get();

    const allMembers: any[] = [];
    allMembersSnap.forEach(doc => {
      allMembers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ ${allMembers.length} membres trouvés`);

    // 🔹 Trouver le membre correspondant à l'utilisateur
    let currentUserMember = allMembers.find(m => m.id === userId);

    if (!currentUserMember && user.memberId) {
      currentUserMember = allMembers.find(m => m.id === user.memberId);
    }

    console.log("👤 Membre utilisateur:", currentUserMember?.firstName, currentUserMember?.lastName);

    if (!currentUserMember) {
      console.log("⚠️ Membre utilisateur non trouvé dans l'arbre");
      return NextResponse.json(
        { error: "Votre profil n'est pas lié à un membre de l'arbre." },
        { status: 400 }
      );
    }

    // 🔹 Enrichir avec les relations
    const membersWithRelations = allMembers.map(member => {
      const relationship = determineRelationship(currentUserMember, member, allMembers);

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        birthDate: member.birthDate || null,
        nationality: member.nationality || null,
        relationship: relationship,
      };
    });

    // 🔹 NOUVEAU : Détecter si c'est une recherche de parents éloignés
    const isSearchRequest = isSearchQuery(prompt);
    let potentialRelatives: any[] = [];

    if (isSearchRequest) {
      console.log("🔍 Requête de recherche détectée - Recherche de correspondances...");
      potentialRelatives = await searchPotentialRelatives(tree, currentUserMember, allMembers);
    }

    // 🔹 Log pour déboguer
    console.log("🔗 Relations identifiées:");
    membersWithRelations.forEach(m => {
      if (m.relationship !== "autre membre de la famille") {
        console.log(`  - ${m.firstName} ${m.lastName}: ${m.relationship}`);
      }
    });

    // 🔹 Appel OpenAI avec contexte enrichi
    console.log("🤖 Appel OpenAI...");

    let contextInfo = `
Tu es Fam, un assistant expert en généalogie.

Voici l'arbre généalogique de l'utilisateur avec les RELATIONS EXACTES :
${JSON.stringify(membersWithRelations, null, 2)}

DÉFINITIONS IMPORTANTES :
- "moi-même" = l'utilisateur
- "parent" = père ou mère
- "enfant" = fils ou fille
- "frère/sœur" = partage les mêmes parents
- "neveu/nièce" = enfants des frères/sœurs
- "oncle/tante" = frères/sœurs des parents
- "cousin/cousine" = enfants des oncles/tantes (PAS les neveux !)
- "grand-parent" = parents des parents
`;

    // Ajouter les correspondances potentielles si recherche
    if (isSearchRequest && potentialRelatives.length > 0) {
      contextInfo += `

🔍 CORRESPONDANCES POTENTIELLES TROUVÉES DANS D'AUTRES ARBRES :
${JSON.stringify(potentialRelatives.map(m => ({
        firstName: m.firstName,
        lastName: m.lastName,
        birthDate: m.birthDate,
        birthPlace: m.birthPlace,
        nationality: m.nationality,
        matchScore: m.matchScore,
        matchReasons: m.matchReasons,
        treeId: m.treeId
      })), null, 2)}

Ces personnes partagent des similarités avec ton arbre (même nom de famille, origine, etc.) et pourraient être des parents éloignés. Tu peux les contacter pour vérifier les liens de parenté !
`;
    } else if (isSearchRequest && potentialRelatives.length === 0) {
      contextInfo += `

🔍 RECHERCHE DE CORRESPONDANCES :
Aucune correspondance potentielle n'a été trouvée pour le moment dans les autres arbres de la plateforme. Cela peut signifier :
- Il n'y a pas encore d'autres utilisateurs avec des noms de famille similaires
- Les correspondances potentielles n'ont pas encore rejoint la plateforme
- Il faut peut-être élargir les critères de recherche

Suggestions : Encourage l'utilisateur à inviter des membres de sa famille à rejoindre la plateforme, ou à rechercher activement avec des noms de famille spécifiques.
`;
    }

    const aiPrompt = `
${contextInfo}

Question de l'utilisateur : "${prompt}"

IMPORTANT : Formate ta réponse en Markdown pour une meilleure lisibilité :
- Utilise **gras** pour les noms importants
- Utilise des listes numérotées ou à puces quand approprié
- Structure ta réponse en paragraphes clairs
- Utilise des émojis pour rendre la réponse plus agréable 😊
${isSearchRequest ? '\n- Si des correspondances ont été trouvées, présente-les de manière attractive avec leurs points communs\n- Propose des actions concrètes (contacter, comparer les arbres, etc.)' : ''}

Réponds de manière claire, structurée et conviviale en te basant STRICTEMENT sur les données fournies.
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es Fam, expert en généalogie. Tu aides les utilisateurs à explorer leur arbre et à retrouver des parents éloignés." },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.6,
    });

    const answer = aiResponse.choices[0]?.message?.content ?? "Je n'ai pas pu trouver de réponse 😅";
    console.log("✅ Réponse générée");

    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error("❌ ERREUR SERVEUR:", error);
    console.error("Stack:", error?.stack);

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}