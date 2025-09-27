"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, CalendarIcon, Save, User, Heart, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { MemberType } from "@/lib/firebase/models";
import { getMembersByTreeId } from "@/app/controllers/treesController";
import MemberSearch from "./memberSearch";
import { addMember } from "@/app/controllers/membersController";
import { NationalitySelector } from "./nationalitySelector";
import { LocationData, LocationSelector } from "./LocationSelector";
import { Avatar, AvatarImage } from "./ui/avatar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


type AddMemberModalProps = {
    treeId: string;
    isOpen: boolean;
    onClose: () => void;
    isEdit?: boolean;
    memberId?: string;
};

export default function AddMemberModal({
    treeId,
    isOpen,
    onClose,
    isEdit = false,
    memberId,
}: AddMemberModalProps) {
    if (!isOpen) return null;

    type Gender = "male" | "female" | "other";

    const [birthDate, setBirthDate] = useState<Date>();
    const [deathDate, setDeathDate] = useState<Date>();
    const [isDeceased, setIsDeceased] = useState(false);
    const [isMarried, setIsMarried] = useState(false);
    const [selectedGender, setSelectedGender] = useState<Gender>("male");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthPlace, setBirthPlace] = useState<LocationData | null>(null);
    const [deathPlace, setDeathPlace] = useState("");
    const [nationality, setNationality] = useState<string[]>([]);
    const [bio, setBio] = useState("");
    const [selectedSpouse, setSelectedSpouse] = useState<string[]>([]);
    const [selectedParents, setSelectedParents] = useState<string[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [selectedSiblings, setSelectedSiblings] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState("")
    const [error, setError] = useState<string>("");

    const currentUser = useSelector(selectUser);
    const [members, setMembers] = useState<MemberType[]>([]);

    // Charger tous les membres de l'arbre
    useEffect(() => {
        if (!treeId) return;
        const fetchMembers = async () => {
            try {
                const data = await getMembersByTreeId(treeId);
                setMembers(data);
            } catch {
                console.log("❌ Erreur récupération des membres");
            }
        };
        fetchMembers();
    }, [treeId]);

    // Charger les infos si édition
    useEffect(() => {
        const fetchMember = async () => {
            if (isEdit && memberId) {
                try {
                    const ref = doc(db, "Members", memberId);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const data = snap.data() as MemberType;
                        setAvatarUrl(data.avatar || "")
                        setFirstName(data.firstName || "");
                        setLastName(data.lastName || "");
                        setSelectedGender((data.gender as Gender) || "male");
                        setIsMarried(data.isMarried || false);
                        setSelectedParents(data.parentsIds || []);
                        setSelectedChildren(data.childrenIds || []);
                        setSelectedSiblings(data.brothersIds || []);
                        setSelectedSpouse(data.mariageId ? [data.mariageId] : []);
                        setBirthDate(data.birthDate ? new Date(data.birthDate) : undefined);
                        setDeathDate(data.deathDate ? new Date(data.deathDate) : undefined);
                        setIsDeceased(!!data.deathDate);
                        setBirthPlace(data.birthPlace || null);
                        setNationality(
                            Array.isArray(data.nationality) ? data.nationality : data.nationality ? [data.nationality] : []
                        );
                        setBio(data.bio || "");
                        setDeathPlace(data.deathPlace || "");
                    }
                } catch (err) {
                    console.error("❌ Erreur chargement membre :", err);
                }
            }
        };
        fetchMember();
    }, [isEdit, memberId]);

    function deepRemoveUndefined<T>(obj: T): T {
        if (Array.isArray(obj)) {
            return obj.map((item) => deepRemoveUndefined(item)) as T;
        } else if (obj && typeof obj === "object") {
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, deepRemoveUndefined(v)])
            ) as T;
        }
        return obj;
    }

    const handleNationalityChange = useCallback(
        (newNationalities: string[]): void => {
            setNationality(newNationalities);
            if (error) setError("");
        },
        [error]
    );

    const handleSave = async () => {
        try {
            const memberData: Omit<MemberType, "id"> = deepRemoveUndefined({
                firstName,
                lastName,
                gender: selectedGender,
                treeId,
                isMarried,
                parentsIds: selectedParents,
                childrenIds: selectedChildren,
                brothersIds: selectedSiblings,
                createdDate: Date.now(),
                updatedDate: Date.now(),
                isActive: true,
                birthDate: birthDate?.getTime(),
                deathDate: isDeceased ? deathDate?.getTime() : undefined,
                birthPlace: birthPlace ?? undefined,
                deathPlace,
                nationality,
                bio,
                mariageId: selectedSpouse[0],
            });

            if (isEdit && memberId) {
                // 🔄 Mode édition → update
                await updateDoc(doc(db, "Members", memberId), memberData);
            } else {
                // ➕ Mode ajout → add
                const newMemberId = await addMember(memberData);
                await updateDoc(doc(db, "Trees", treeId), {
                    memberIds: arrayUnion(newMemberId),
                });
            }

            onClose();
        } catch (error) {
            console.error("❌ Erreur sauvegarde :", error);
        }
    };

    return (
        <div className="fixed inset-0 overflow-auto bg-black/50 flex justify-center items-start pt-12" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                        {isEdit ? "Modifier un membre" : "Ajouter un membre"}
                    </h2>
                    <Button variant="ghost" onClick={onClose}>Fermer</Button>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Photo */}
                    <div className="lg:col-span-1">
                        <Card className=" top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" /> Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!avatarUrl ?
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <User className="h-12 w-12 text-gray-400" />
                                        </div>
                                        <Button variant="outline" className="w-full bg-transparent">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Télécharger une photo
                                        </Button>
                                    </div>
                                    : 
                                    <div className="flex flex-col items-center space-y-4">
                                        <Avatar className="w-32 h-32">
                                            <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                                        </Avatar>
                                    </div>
                                }

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

                    {/* Formulaire, Relations et Notes */}
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" /> Dates et lieux
                                </CardTitle>
                                <CardDescription>Dates et lieux principaux de la personne</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date de naissance</Label>
                                        <DatePicker
                                            selected={birthDate}
                                            onChange={(date: Date | null) => setBirthDate(date ?? undefined)}
                                            dateFormat="dd/MM/yyyy"
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            placeholderText="Sélectionner une date"
                                            className="w-full border rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <LocationSelector
                                        value={birthPlace}
                                        onChange={setBirthPlace}
                                        label="Lieu de naissance"
                                    />
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
                                    <NationalitySelector
                                        value={nationality}
                                        onChange={handleNationalityChange}
                                        placeholder="Sélectionnez une nationalité"
                                        error={error}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Relations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Heart className="h-5 w-5" /> Relations familiales
                                </CardTitle>
                                <CardDescription>
                                    Utilisez la barre de recherche pour trouver et sélectionner les membres de la famille
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* Parents */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-3">
                                        Parents
                                    </Label>
                                    <MemberSearch
                                        members={members}
                                        selectedMembers={selectedParents}
                                        onSelectionChange={setSelectedParents}
                                        placeholder="Rechercher un parent..."
                                        maxSelections={2}
                                        currentUserId={currentUser?.id}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Maximum 2 parents peuvent être sélectionnés
                                    </p>
                                </div>

                                {/* Frères et sœurs */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-3">
                                        Frères et sœurs
                                    </Label>
                                    <MemberSearch
                                        members={members}
                                        selectedMembers={selectedSiblings}
                                        onSelectionChange={setSelectedSiblings}
                                        placeholder="Rechercher un frère ou une sœur..."
                                        excludeIds={selectedParents}
                                        currentUserId={currentUser?.id}
                                    />
                                </div>

                                {/* Enfants */}
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-3">
                                        Enfants
                                    </Label>
                                    <MemberSearch
                                        members={members}
                                        selectedMembers={selectedChildren}
                                        onSelectionChange={setSelectedChildren}
                                        placeholder="Rechercher un enfant..."
                                        excludeIds={[...selectedParents, ...selectedSiblings]}
                                        currentUserId={currentUser?.id}
                                    />
                                </div>

                                {/* Conjoint(e) */}
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Checkbox
                                            checked={isMarried}
                                            onCheckedChange={(checked) => {
                                                setIsMarried(checked === true);
                                                if (checked !== true) {
                                                    setSelectedSpouse([]);
                                                }
                                            }}
                                        />
                                        <Label>Cette personne est-elle mariée ?</Label>
                                    </div>

                                    {isMarried && (
                                        <div className="ml-7">
                                            <Label className="block text-sm font-medium text-gray-700 mb-3">
                                                Conjoint(e)
                                            </Label>
                                            <MemberSearch
                                                members={members}
                                                selectedMembers={selectedSpouse}
                                                onSelectionChange={setSelectedSpouse}
                                                placeholder="Rechercher le/la conjoint(e)..."
                                                maxSelections={1}
                                                excludeIds={[
                                                    ...selectedParents,
                                                    ...selectedSiblings,
                                                    ...selectedChildren
                                                ]}
                                                currentUserId={currentUser?.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5" /> Notes supplémentaires
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Écrivez ici toute information supplémentaire..." className="min-h-[120px]" />
                            </CardContent>
                        </Card>
                        {/* Actions */}
                        <div className="flex justify-end space-x-4 pt-4">
                            <Button variant="outline" onClick={onClose}>Annuler</Button>
                            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
                                <Save className="mr-2 h-4 w-4" /> Enregistrer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
