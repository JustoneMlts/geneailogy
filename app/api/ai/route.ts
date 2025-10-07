// app/api/ai/query/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS!)
    ),
  });
}

const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();
    if (!prompt || !userId) {
      return NextResponse.json(
        { error: "Prompt ou userId manquant." },
        { status: 400 }
      );
    }

    // 🔹 Récupérer l'utilisateur
    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const user = userDoc.data() as any;

    // 🔹 Récupérer l'arbre principal
    const treeId = user.treeIds?.[0];
    if (!treeId) return NextResponse.json({ error: "Utilisateur sans arbre." }, { status: 400 });

    const treeDoc = await db.collection("Trees").doc(treeId).get();
    if (!treeDoc.exists) return NextResponse.json({ error: "Arbre introuvable." }, { status: 404 });
    const tree = treeDoc.data() as any;

    // 🔹 Construire les filtres Firestore
    const membersRef = db.collection("Members").where("treeId", "==", treeId);

    // 🔹 Filtrer par surnames si présents
    let surnameFilteredQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = membersRef;
    if (tree.surnames && tree.surnames.length) {
      surnameFilteredQuery = membersRef.where("lastName", "in", tree.surnames.slice(0, 10)); 
      // Firestore ne supporte que jusqu'à 10 éléments dans 'in'
    }

    // 🔹 Récupérer les membres filtrés
    const membersSnap = await surnameFilteredQuery.get();
    const members: any[] = [];
    membersSnap.forEach(doc => {
      const data = doc.data();
      // Filtrer localement les origines si nécessaire
      if (!tree.origin || !tree.origin.length || tree.origin.includes(data.nationality)) {
        members.push({
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate || null,
          parentsIds: data.parentsIds || [],
          nationality: data.nationality || null,
        });
      }
    });

    // 🔹 Limiter à 50 membres max pour le prompt
    const membersForPrompt = members.slice(0, 50);

    // 🔹 Construire le prompt pour OpenAI
    const aiPrompt = `
Tu es Fam, un assistant expert en généalogie.
Voici les informations de l'arbre principal de l'utilisateur :
${JSON.stringify({ origins: tree.origin, surnames: tree.surnames, members: membersForPrompt }, null, 2)}

Réponds de manière claire et concise à cette question :
"${prompt}"
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es Fam, assistant expert en généalogie." },
        { role: "user", content: aiPrompt },
      ],
      temperature: 0.6,
    });

    const answer = aiResponse.choices[0]?.message?.content ?? "Je n’ai pas pu trouver de réponse 😅";
    return NextResponse.json({ answer });

  } catch (error) {
    console.error("Erreur IA :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
