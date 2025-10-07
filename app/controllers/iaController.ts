import { MemberType } from "@/lib/firebase/models";

/**
 * Calcule le score de correspondance entre deux membres
 */
export function calculateMatchScore(newMember: MemberType, existingMember: MemberType): number {
  let score = 0;

  const sameLastName = newMember.lastName?.toLowerCase() === existingMember.lastName?.toLowerCase();
  const sameNationality = !!(newMember.nationality && existingMember.nationality &&
    [newMember.nationality].flat().some(n => [existingMember.nationality].flat().includes(n)));

  const sharedRelatives = [
    ...(newMember.parentsIds || []),
    ...(newMember.childrenIds || []),
    ...(newMember.brothersIds || [])
  ].filter(id =>
    existingMember.parentsIds?.includes(id) ||
    existingMember.childrenIds?.includes(id) ||
    existingMember.brothersIds?.includes(id)
  );

  let sameBirthPeriodAndPlace = false;
  if (newMember.birthDate && existingMember.birthDate) {
    const diffYears = Math.abs(
      new Date(newMember.birthDate).getFullYear() -
      new Date(existingMember.birthDate).getFullYear()
    );
    if (diffYears <= 5 && newMember.birthPlace?.city === existingMember.birthPlace?.city) {
      sameBirthPeriodAndPlace = true;
    }
  }

  // Règles combinées
  if (sameLastName && sharedRelatives.length > 0) score += 40;
  if (sameBirthPeriodAndPlace) score += 30;
  if (sameNationality && newMember.birthPlace?.country === existingMember.birthPlace?.country) score += 15;
  if (sharedRelatives.length > 0) score += 50;
  if (sameLastName) score += 10;
  if (sameNationality) score += 10;

  return Math.min(score, 100);
}

/**
 * Déduit la relation probable entre deux membres en fonction des âges + ancêtres communs
 */
export function guessRelation(newMember: MemberType, existingMember: MemberType): string {
  if (!newMember || !existingMember) return "Lien inconnu";

  const ageNew = newMember.birthDate ? new Date(newMember.birthDate).getFullYear() : null;
  const ageExisting = existingMember.birthDate ? new Date(existingMember.birthDate).getFullYear() : null;
  const ageDiff = ageNew && ageExisting ? ageNew - ageExisting : null;

  // 🔹 Cas directs par les IDs (parents / enfants / frères)
  if (newMember.parentsIds?.includes(existingMember.id!)) return "Parent";
  if (existingMember.parentsIds?.includes(newMember.id!)) return "Enfant";

  if (newMember.brothersIds?.includes(existingMember.id!)) return "Frère/Sœur";
  if (existingMember.brothersIds?.includes(newMember.id!)) return "Frère/Sœur";

  // 🔹 Cousins germains (même grands-parents)
  const sharedParents = newMember.parentsIds?.some(pid =>
    existingMember.parentsIds?.includes(pid)
  );
  if (sharedParents) return "Frère/Sœur";

  const newParents = newMember.parentsIds || [];
  const existingParents = existingMember.parentsIds || [];
  if (newParents.length && existingParents.length) {
    const sharedGrandParents = newParents.some(p =>
      existingParents.some(ep =>
        newMember.parentsIds?.includes(ep) || existingMember.parentsIds?.includes(p)
      )
    );
    if (sharedGrandParents) return "Cousin germain";
  }

  // 🔹 Relation par âge et nom
  if (ageDiff !== null) {
    if (Math.abs(ageDiff) < 15) {
      return "Cousin éloigné";
    }
    if (ageDiff > 20) {
      return "Oncle/Tante potentiel";
    }
    if (ageDiff < -20) {
      return "Neveu/Nièce potentiel";
    }
  }

  // 🔹 Sinon fallback
  return "Lien familial possible (non défini)";
}

/**
 * Fonction principale : génère des suggestions à partir d’un membre ajouté
 */
export function generateSuggestions(newMember: MemberType, allMembers: MemberType[]) {
  return allMembers
    .filter(m => m.id !== newMember.id)
    .map(m => {
      const score = calculateMatchScore(newMember, m);
      const relation = guessRelation(newMember, m);
      return { member: m, score, relation };
    })
    .filter(s => s.score > 30) // ignorer suggestions faibles
    .sort((a, b) => b.score - a.score);
}


