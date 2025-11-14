"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TreePine, Upload, CalendarIcon, ArrowLeft, Save, User, Heart, FileText, Globe } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { addMember } from "../controllers/membersController";
import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase/firebase"
import { addDoc, arrayUnion, doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"

export default function AddMember({ treeId }: { treeId: string }) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [deathDate, setDeathDate] = useState<Date>();
  const [isDeceased, setIsDeceased] = useState(false);
  const [isMarried, setIsMarried] = useState(false);

  type Gender = "male" | "female" | "other";
  const [selectedGender, setSelectedGender] = useState<Gender>("male");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");
  const currentUser = useSelector(selectUser);

  // relations selections (IDs)
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedSiblings, setSelectedSiblings] = useState<string[]>([]);

  // members options loaded from the tree (keeps order from tree.memberIds when possible)
  const [familyMembers, setFamilyMembers] = useState<{ id: string; firstName?: string; lastName?: string }[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const router = useRouter();

  // --- fetch tree doc and load members (by memberIds) ---

useEffect(() => {
  if (!treeId) return; // <-- sécuriser l'appel

  const fetchMembers = async () => {
    setLoadingMembers(true);

    try {
      // 1. Récupérer le document de l'arbre
      const treeRef = doc(db, "Trees", treeId);
      const treeSnap = await getDoc(treeRef);

      if (!treeSnap.exists()) {
        console.error("Arbre non trouvé !");
        setLoadingMembers(false);
        return;
      }

      const treeData = treeSnap.data();
      setOwnerId(treeData.ownerId || null);

      const memberIds: string[] = treeData.memberIds || [];
      if (memberIds.length === 0) {
        setFamilyMembers([]);
        setLoadingMembers(false);
        return;
      }

      // 2. Récupérer tous les membres par batch Firestore (max 10 IDs par "in")
      const batches: { firstName?: string; lastName?: string; id: string }[] = [];
      for (let i = 0; i < memberIds.length; i += 10) {
        const batchIds = memberIds.slice(i, i + 10);
        const membersQuery = query(
          collection(db, "members"),
          where("__name__", "in", batchIds)
        );
        const memberSnaps = await getDocs(membersQuery);
        batches.push(
          ...memberSnaps.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as { firstName?: string; lastName?: string }),
          }))
        );
      }

      // 3. Maintenir l'ordre original
      const sortedMembers = memberIds
        .map(id => batches.find(m => m.id === id))
        .filter(Boolean) as { id: string; firstName?: string; lastName?: string }[];

      setFamilyMembers(sortedMembers);
    } catch (error) {
      console.error("Erreur lors du chargement des membres :", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  fetchMembers();
}, [treeId]);

  const handleToggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => 
  (checked: boolean | "indeterminate") => {
    
    if (checked === true) {
      setter(prev => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    } else {
      setter(prev => {
        return prev.filter(i => i !== id);
      });
    }
  };

  const handleSave = async () => {
    const memberData = {
      firstName,
      lastName,
      birthDate: birthDate ? birthDate.getTime() : undefined,
      deathDate: isDeceased && deathDate ? deathDate.getTime() : undefined,
      birthPlace: birthPlace || undefined,
      deathPlace: deathPlace || undefined,
      gender: selectedGender,
      nationality: nationality || undefined,
      bio: bio || undefined,
      treeId,
      isMarried,
      parentsIds: selectedParents,
      childrenIds: selectedChildren,
      brothersIds: selectedSiblings,
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
      avatar: undefined,
      mariageId: undefined,
    };
    try {
      const newMemberRef = await addDoc(collection(db, "members"), memberData);
      // Ajoute le nouveau membre dans l'arbre
      const treeRef = doc(db, "trees", treeId);
      await updateDoc(treeRef, {
        memberIds: arrayUnion(newMemberRef.id),
      });

      router.push("/dashboard");
    } catch (e) {
      console.error("Erreur lors de l'ajout du membre :", e);
    }
  };

const renderMemberCheckboxes = (selectedList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
  if (loadingMembers) {
    return <p className="text-sm text-gray-500">Chargement des membres...</p>;
  }

  if (!familyMembers.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          Aucun membre disponible pour établir des relations.
        </p>
        <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
          Debug: currentUser = {JSON.stringify(currentUser)}<br/>
          familyMembers.length = {familyMembers.length}
        </div>
      </div>
    );
  }

  // RETURN manquant dans votre code original !
  return (
    <div className="grid gap-2 max-h-48 overflow-auto pr-2">
      {familyMembers.map(member => {
        const isSelected = selectedList.includes(member.id);
        const isCurrentUser = member.id === currentUser?.id;
        
        return (
          <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  setter(prev => [...prev.filter(id => id !== member.id), member.id]);
                } else {
                  setter(prev => prev.filter(id => id !== member.id));
                }
              }}
            />
            <span className="text-sm">
              {member.firstName} {member.lastName}
              {isCurrentUser && <span className="ml-2 text-xs text-blue-600 font-medium">(Vous)</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <TreePine className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GeneAIlogy
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>Annuler</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Ajouter un membre de la famille</h1>
            <p className="text-gray-600">
              Remplissez les informations pour ajouter un nouveau membre à votre arbre généalogique
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ---- Photo Section (conservé) ---- */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Photo de profil</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Upload className="mr-2 h-4 w-4" />
                      Télécharger une photo
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium flex items-center space-x-2 mb-3">
                        <FileText className="h-4 w-4" />
                        <span>Documents</span>
                      </Label>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Upload className="mr-2 h-4 w-4" />
                          Acte de naissance
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Upload className="mr-2 h-4 w-4" />
                          Acte de mariage
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Upload className="mr-2 h-4 w-4" />
                          Autre document
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ---- Form Section (conservé + bindings) ---- */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informations personnelles</span>
                  </CardTitle>
                  <CardDescription>Informations de base sur la personne</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {selectedGender === "female" ? "Nom de jeune fille *" : "Nom de famille *"}
                      </Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={selectedGender === "female" ? "Martin" : "Dupont"} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre</Label>
                    <Select
                      value={selectedGender}
                      onValueChange={(value) => setSelectedGender(value as Gender)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Dates et lieux */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Dates et lieux</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de naissance</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthPlace">Lieu de naissance</Label>
                      <Input id="birthPlace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Paris, France" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox checked={isDeceased} onCheckedChange={(checked) => setIsDeceased(checked === true)} className="mt-1" />
                    <Label>Cette personne est décédée</Label>
                  </div>

                  {isDeceased && (
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Label>Date de décès</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deathDate ? format(deathDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={deathDate} onSelect={setDeathDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deathPlace">Lieu de décès</Label>
                        <Input id="deathPlace" value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} placeholder="Lyon, France" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Nationalité</span>
                    </Label>
                    <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Française" />
                  </div>
                </CardContent>
              </Card>

              {/* Relations familiales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Relations familiales</span>
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez les relations de ce membre avec les autres personnes de l'arbre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block font-medium">Parents</Label>
                    <div className="text-xs text-gray-500 mb-2">
                      Sélectionnez jusqu'à 2 parents
                    </div>
                    {renderMemberCheckboxes(selectedParents, setSelectedParents)}
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">Frères et sœurs</Label>
                    <div className="text-xs text-gray-500 mb-2">
                      Sélectionnez les frères et sœurs de ce membre
                    </div>
                    {renderMemberCheckboxes(selectedSiblings, setSelectedSiblings)}
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">Enfants</Label>
                    <div className="text-xs text-gray-500 mb-2">
                      Sélectionnez les enfants de ce membre
                    </div>
                    {renderMemberCheckboxes(selectedChildren, setSelectedChildren)}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Notes supplémentaires</span>
                  </CardTitle>
                  <CardDescription>Ajoutez des informations complémentaires.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Écrivez ici toute information supplémentaire..." className="min-h-[120px]" />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/dashboard">
                  <Button variant="outline">Annuler</Button>
                </Link>
                <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer le membre
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}