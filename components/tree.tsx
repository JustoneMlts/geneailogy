import { Calendar, Camera, Crown, FileText, Globe, Heart, MapPin, Plus, RotateCcw, Save, Search, Settings, Trash2, User, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { UserType, TreeType, MemberType } from "../lib/firebase/models"
import { useState } from "react";

const getYearFromADate = (timestamp: number): number => {
    const date = new Date(timestamp)
    return date.getFullYear()
}

const getMemberById = (data: Record<string, MemberType>, id?: string) => {
    return id ? Object.values(data).find((m) => m.id === id) || null : null
}

const getMembersByIds = (data: Record<string, MemberType>, ids?: string[]) => {
    return (ids || []).map((id) => getMemberById(data, id)).filter(Boolean) as MemberType[]
}

const getParents = (member: MemberType, data: Record<string, MemberType>) => {
    return getMembersByIds(data, member.parentsIds)
}

const getSiblings = (member: MemberType, data: Record<string, MemberType>) => {
    if (!member.parentsIds) return []
    return Object.values(data).filter(
        (m) =>
            m.id !== member.id &&
            m.parentsIds?.some((pid) => member.parentsIds?.includes(pid))
    )
}

const getChildren = (member: MemberType, data: Record<string, MemberType>) => {
    return getMembersByIds(data, member.childrenIds)
}

const Section = ({
    title,
    members,
    setSelectedMember,
}: {
    title: string
    members: MemberType[]
    setSelectedMember: (member: MemberType) => void
}) => {
    if (!members.length) return null
    const currentUserId = "id-lucas"
    const treeOwner = "Jean Dupont"
    const isOwner = true
    return (
        <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            <div className="flex justify-center gap-10 flex-wrap">
                {members.map((member) => (
                    <div key={member.id}>
                        <FamilyMemberCard
                            member={member}
                            highlight={isOwner && member.id === currentUserId}
                            onClick={() => setSelectedMember(member)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export const renderFullFamilyTree = (
    familyData: Record<string, MemberType>,
    currentUserId: string,
    isOwner: boolean,
    treeOwner: string,
    setSelectedMember: (m: MemberType) => void
) => {
    const current = getMemberById(familyData, currentUserId)
    if (!current) return null

    const generations: MemberType[][] = []
    let currentGen: MemberType[] = [current]
    let visited = new Set<string | undefined>()

    while (currentGen.length > 0) {
        generations.unshift(currentGen)
        visited = new Set([...visited, ...currentGen.map((m) => m.id)])

        const nextGen: MemberType[] = []
        currentGen.forEach((member) => {
            const parents = getParents(member, familyData)
            parents.forEach((p) => {
                if (!visited.has(p.id)) {
                    nextGen.push(p)
                }
            })
        })

        currentGen = nextGen
    }

    const generationLabels = [
        "Votre génération", // index 0
        "Vos parents",
        "Vos grands-parents",
        "Vos arrière-grands-parents",
        "Vos arrière-arrière-grands-parents",
        "Vos ancêtres (G+5)",
        "Vos ancêtres (G+6)",
        "Vos ancêtres (G+7)",
        "Vos ancêtres (G+8)",
        "Vos ancêtres (G+9)",
    ]

    return (
        <div className="space-y-8">
            {generations.map((generation, index) => {
                const reversedIndex = generations.length - 1 - index
                const rawLabel = generationLabels[reversedIndex] || "Ancêtres"
                const title = isOwner
                    ? rawLabel
                    : rawLabel.replace("Vos", `Les de ${treeOwner}`)

                return (
                    <div key={index}>
                         {reversedIndex !== 1 && (
                            <Section
                                title={title}
                                members={generation}
                                setSelectedMember={setSelectedMember}
                            />
                        )}

                        {/* Ajout spécial Oncles/Tantes + Cousins à la génération des parents */}
                        {reversedIndex === 1 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Section
                                        title={
                                            isOwner ? "Vos parents" : `Les parents de ${treeOwner}`
                                        }
                                        members={generation}
                                        setSelectedMember={setSelectedMember}
                                    />
                                    <Section
                                        title={
                                            isOwner ? "Vos oncles et tantes" : `Les oncles et tantes de ${treeOwner}`
                                        }
                                        members={generation
                                            .flatMap((parent) => getSiblings(parent, familyData))
                                            .filter((v, i, a) => a.findIndex(m => m.id === v.id) === i)}
                                        setSelectedMember={setSelectedMember}
                                    />
                                </div>

                                {/* Trait entre ligne parents/oncles et cousins */}
                                <div className="flex justify-center">
                                    <div className="w-px h-8 bg-gray-300"></div>
                                </div>

                                <Section
                                    title={isOwner ? "Vos cousins" : `Les cousins de ${treeOwner}`}
                                    members={generation
                                        .flatMap((parent) => getSiblings(parent, familyData))
                                        .flatMap((uncle) => getChildren(uncle, familyData))
                                        .filter((v, i, a) => a.findIndex(m => m.id === v.id) === i)}
                                    setSelectedMember={setSelectedMember}
                                />
                            </>
                        )}

                        {index < generations.length - 1 && (
                            <div className="flex justify-center">
                                <div className="w-px h-8 bg-gray-300"></div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function FamilyMemberCard({ member, onClick, highlight }: { member: MemberType; onClick: () => void, highlight: boolean }) {

    return (
        <div>
            <Card
                className={`w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"
                    }`}
                onClick={onClick}
            >
                <CardContent className="p-4 text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback className={member.gender === "male" ? "bg-blue-100" : "bg-pink-100"}>
                            {member.firstName
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("") + member.lastName
                                    .split(" ")
                                    .map((n: any) => n[0])
                                    .join("")
                            }
                        </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-sm mb-2">{member.firstName + " " + member.lastName}</h3>
                    <div className="space-y-1 text-xs text-gray-600">
                        {member.birthDate && (
                            <div className="flex items-center justify-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {getYearFromADate(member.birthDate)}
                                    {member.deathDate && ` - ${getYearFromADate(member.deathDate)}`}
                                </span>
                            </div>
                        )}
                        {member.birthPlace && (
                            <div className="flex items-center justify-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{member.birthPlace}</span>
                            </div>
                        )}
                    </div>
                    {member.deathDate && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                            Décédé(e)
                        </Badge>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export const Tree = () => {
    const familyData: Record<string, MemberType> = {
        "0": {
            id: "id-jean",
            firstName: "Jean",
            lastName: "Dupont",
            birthDate: new Date("1950-01-01").getTime(),
            birthPlace: "Paris, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "male",
            childrenIds: ["id-pierre", "id-sophie"],
            isMarried: true,
            mariageId: "id-marie",
            treeId: "tree-dupont",
        },
        "1": {
            id: "id-marie",
            firstName: "Marie",
            lastName: "Martin",
            birthDate: new Date("1952-01-01").getTime(),
            birthPlace: "Lyon, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "female",
            childrenIds: ["id-pierre", "id-sophie"],
            isMarried: true,
            mariageId: "id-jean",
            treeId: "tree-dupont",
        },
        "2": {
            id: "id-pierre",
            firstName: "Pierre",
            lastName: "Dupont",
            birthDate: new Date("1975-01-01").getTime(),
            birthPlace: "Paris, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "male",
            parentsIds: ["id-jean", "id-marie"],
            childrenIds: ["id-lucas"],
            isMarried: true,
            mariageId: "id-claire",
            treeId: "tree-dupont",
        },
        "3": {
            id: "id-sophie",
            firstName: "Sophie",
            lastName: "Dupont",
            birthDate: new Date("1978-01-01").getTime(),
            birthPlace: "Paris, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "female",
            parentsIds: ["id-jean", "id-marie"],
            isMarried: false,
            treeId: "tree-dupont",
        },
        "4": {
            id: "id-claire",
            firstName: "Claire",
            lastName: "Bernard",
            birthDate: new Date("1977-01-01").getTime(),
            birthPlace: "Marseille, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "female",
            childrenIds: ["id-lucas"],
            isMarried: true,
            mariageId: "id-pierre",
            treeId: "tree-dupont",
        },
        "5": {
            id: "id-lucas",
            firstName: "Lucas",
            lastName: "Dupont",
            birthDate: new Date("2005-01-01").getTime(),
            birthPlace: "Paris, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "male",
            parentsIds: ["id-pierre", "id-claire"],
            isMarried: false,
            treeId: "tree-dupont",
        },
        "6": {
            id: "id-robert",
            firstName: "Robert",
            lastName: "Dupont",
            birthDate: new Date("1920-01-01").getTime(),
            deathDate: new Date("1995-01-01").getTime(),
            birthPlace: "Bordeaux, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "male",
            childrenIds: ["id-jean"],
            isMarried: true,
            mariageId: "id-louise",
            treeId: "tree-dupont",
        },
        "7": {
            id: "id-louise",
            firstName: "Louise",
            lastName: "Petit",
            birthDate: new Date("1925-01-01").getTime(),
            deathDate: new Date("2010-01-01").getTime(),
            birthPlace: "Toulouse, France",
            avatar: "/placeholder.svg?height=60&width=60",
            gender: "female",
            childrenIds: ["id-jean"],
            isMarried: true,
            mariageId: "id-robert",
            treeId: "tree-dupont",
        },
    }

    const [zoom, setZoom] = useState(1)
    const [showFamilySettings, setShowFamilySettings] = useState(false)
    const [selectedMember, setSelectedMember] = useState<MemberType | null>(null)
    const [locations, setLocations] = useState([
        { id: 1, place: "Paris, France", period: "1950 - Présent", type: "Résidence principale" },
        { id: 2, place: "Lyon, France", period: "1920 - 1950", type: "Résidence familiale" },
        { id: 3, place: "Bordeaux, France", period: "1890 - 1920", type: "Lieu de naissance" },
    ])
    const addOrigin = () => {
        const newOrigin = {
            id: Date.now(),
            country: "",
            region: "",
            percentage: 0,
        }
        setOrigins([...origins, newOrigin])
    }

    const removeOrigin = (id: number) => {
        setOrigins(origins.filter((origin) => origin.id !== id))
    }

    const addLocation = () => {
        const newLocation = {
            id: Date.now(),
            place: "",
            period: "",
            type: "",
        }
        setLocations([...locations, newLocation])
    }

    const removeLocation = (id: number) => {
        setLocations(locations.filter((location) => location.id !== id))
    }
    const [origins, setOrigins] = useState([
        { id: 1, country: "France", region: "Normandie", percentage: 60 },
        { id: 2, country: "Italie", region: "Toscane", percentage: 30 },
        { id: 3, country: "Espagne", region: "Andalousie", percentage: 10 },
    ])
    const countries = [
        "France",
        "Italie",
        "Espagne",
        "Allemagne",
        "Royaume-Uni",
        "Portugal",
        "Brésil",
        "Argentine",
        "Mexique",
        "États-Unis",
        "Canada",
        "Japon",
        "Chine",
        "Inde",
        "Maroc",
        "Algérie",
        "Tunisie",
        "Sénégal",
        "Côte d'Ivoire",
        "Cameroun",
        "Autre",
    ]

    const locationTypes = ["Résidence principale", "Résidence familiale", "Lieu de naissance", "Lieu de travail", "Autre"]


    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("fr-FR");
    };


    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Mon arbre généalogique</h1>
                    <p className="text-gray-600">Explorez votre histoire familiale de génération en génération</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(1)}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFamilySettings(true)}
                        className="bg-white/50 w-full sm:w-auto"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres famille
                    </Button>
                    <Link href="/add-member">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter membre
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tree Visualization */}
            <div className="py-4">
                {renderFullFamilyTree(familyData, "id-lucas", true, "Lucas", setSelectedMember)}
            </div>


            {/* Member Details Panel - Version améliorée */}
            {selectedMember && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedMember(null)}
                >
                    <Card
                        className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-8 w-8"
                                onClick={() => setSelectedMember(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 pt-2">
                                <Avatar className="w-24 h-24 flex-shrink-0">
                                    <AvatarImage src={selectedMember.avatar || "/placeholder.svg"} />
                                    <AvatarFallback
                                        className={`text-2xl ${selectedMember.gender === "male" ? "bg-blue-100" : "bg-pink-100"}`}
                                    >
                                        {selectedMember.firstName
                                            .split(" ")
                                            .map((n: any) => n[0])
                                            .join("") + selectedMember.lastName
                                                .split(" ")
                                                .map((n: any) => n[0])
                                                .join("")
                                        }
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-center md:text-left flex-1">
                                    <CardTitle className="text-3xl font-bold text-gray-800 mb-2">{selectedMember.firstName + ' ' + selectedMember.lastName}</CardTitle>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                                        <Badge
                                            variant="outline"
                                            className={
                                                selectedMember.gender === "male"
                                                    ? "border-blue-200 text-blue-700"
                                                    : "border-pink-200 text-pink-700"
                                            }
                                        >
                                            {selectedMember.gender === "male" ? "Homme" : "Femme"}
                                        </Badge>
                                        {selectedMember.deathDate && <Badge variant="secondary">Décédé(e)</Badge>}
                                        {selectedMember.mariageId && (
                                            <Badge variant="outline" className="border-red-200 text-red-700">
                                                Marié(e)
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Informations personnelles */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Informations personnelles
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {selectedMember.birthDate && (
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-600">Date de naissance</p>
                                                <p className="font-medium">
                                                    {selectedMember.birthDate ? formatDate(selectedMember.birthDate) : "Non renseignée"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMember.deathDate && (
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-600">Date de décès</p>
                                                <p className="font-medium">
                                                    {selectedMember.birthDate ? formatDate(selectedMember.deathDate) : "Non renseignée"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMember.birthPlace && (
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                                            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-gray-600">Lieu de naissance</p>
                                                <p className="font-medium">{selectedMember.birthPlace}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Relations familiales */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Heart className="w-5 h-5 mr-2" />
                                    Relations familiales
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-3">
                                        {selectedMember.mariageId && (
                                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Heart className="w-5 h-5 text-red-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Conjoint(e)</p>
                                                        <p className="font-medium">
                                                            {familyData[selectedMember.mariageId]?.firstName}{" "}
                                                            {familyData[selectedMember.mariageId]?.lastName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (selectedMember?.mariageId) {
                                                            setSelectedMember(familyData[selectedMember.mariageId]);
                                                        }
                                                    }}
                                                >
                                                    Voir le profil
                                                </Button>
                                            </div>
                                        )}

                                        {selectedMember.parentsIds && selectedMember.parentsIds?.length > 0 && (
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <User className="w-5 h-5 text-blue-500" />
                                                    <p className="text-sm text-gray-600">Parents</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedMember.parentsIds.map((parentId) => {
                                                        const parent = familyData[parentId];
                                                        if (!parent) return null;
                                                        return (
                                                            <div key={parentId} className="flex items-center justify-between">
                                                                <p className="font-medium">
                                                                    {parent.firstName} {parent.lastName}
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedMember(parent)}
                                                                >
                                                                    Voir
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {selectedMember.childrenIds && selectedMember.childrenIds?.length > 0 && (
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <User className="w-5 h-5 text-green-500" />
                                                    <p className="text-sm text-gray-600">
                                                        Enfant{selectedMember.childrenIds.length > 1 ? "s" : ""} (
                                                        {selectedMember.childrenIds.length})
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    {selectedMember.childrenIds.map((childId) => {
                                                        const child = familyData[childId];
                                                        if (!child) return null;
                                                        return (
                                                            <div key={childId} className="flex items-center justify-between">
                                                                <p className="font-medium">
                                                                    {child.firstName} {child.lastName}
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedMember(child)}
                                                                >
                                                                    Voir
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>


                                    {selectedMember.parentsIds && selectedMember.parentsIds.length > 0 && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <User className="w-5 h-5 text-blue-500" />
                                                <p className="text-sm text-gray-600">Parents</p>
                                            </div>
                                            <div className="space-y-2">
                                                {selectedMember.parentsIds.map((parentId: string) => {
                                                    const parent = familyData[parentId]
                                                    if (!parent) return null
                                                    return (
                                                        <div key={parentId} className="flex items-center justify-between">
                                                            <p className="font-medium">{parent.firstName + " " + parent.lastName}</p>
                                                            <Button variant="outline" size="sm" onClick={() => setSelectedMember(parent)}>
                                                                Voir
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {selectedMember.childrenIds && selectedMember.childrenIds.length > 0 && (
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <User className="w-5 h-5 text-green-500" />
                                                <p className="text-sm text-gray-600">
                                                    Enfant{selectedMember.childrenIds.length > 1 ? "s" : ""} (
                                                    {selectedMember.childrenIds.length})
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {selectedMember.childrenIds.map((childId: string) => {
                                                    const child = familyData[childId]
                                                    if (!child) return null
                                                    return (
                                                        <div key={childId} className="flex items-center justify-between">
                                                            <p className="font-medium">{child.firstName + " " + child.lastName}</p>
                                                            <Button variant="outline" size="sm" onClick={() => setSelectedMember(child)}>
                                                                Voir
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                                        <User className="mr-2 h-4 w-4" />
                                        Modifier les informations
                                    </Button>
                                    <Button variant="outline" className="flex-1 bg-transparent">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter une relation
                                    </Button>
                                    <Button variant="outline" className="flex-1 bg-transparent">
                                        <Camera className="mr-2 h-4 w-4" />
                                        Ajouter une photo
                                    </Button>
                                </div>
                            </div>

                            {/* Statistiques rapides */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {selectedMember.birthDate && selectedMember.deathDate
                                                ? getYearFromADate(selectedMember.deathDate) - getYearFromADate(selectedMember.birthDate)
                                                : selectedMember.birthDate && getYearFromADate(selectedMember.birthDate)
                                                    ? new Date().getFullYear() - getYearFromADate(selectedMember.birthDate)
                                                    : "?"}
                                        </p>
                                        <p className="text-xs text-gray-600">Âge{selectedMember.deathDate && getYearFromADate(selectedMember.deathDate) ? " au décès" : ""}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">{selectedMember.childrenIds?.length || 0}</p>
                                        <p className="text-xs text-gray-600">
                                            Enfant{(selectedMember.childrenIds?.length || 0) > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {(selectedMember.parentsIds?.length || 0) + (selectedMember.childrenIds?.length || 0)}
                                        </p>
                                        <p className="text-xs text-gray-600">Relations</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Family Settings Modal */}
            {showFamilySettings && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowFamilySettings(false)}
                >
                    <div
                        className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                        <Settings className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">Paramètres de la famille</h2>
                                        <p className="text-gray-600">Gérez les informations globales de votre famille</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowFamilySettings(false)}
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Informations générales */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Crown className="h-5 w-5 text-yellow-600" />
                                        <span>Informations générales</span>
                                    </CardTitle>
                                    <CardDescription>Nom de famille et informations de base</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="familyName">Nom de famille principal</Label>
                                            <Input id="familyName" defaultValue="Dupont" placeholder="Nom de famille" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="familyMotto">Devise familiale (optionnel)</Label>
                                            <Input id="familyMotto" placeholder="Ex: Honneur et Courage" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="familyDescription">Description de la famille</Label>
                                        <Textarea
                                            id="familyDescription"
                                            placeholder="Décrivez l'histoire et les caractéristiques de votre famille..."
                                            defaultValue="La famille Dupont est une famille française avec des racines remontant au 18ème siècle. Originaire de Normandie, elle s'est ensuite installée dans différentes régions de France."
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Origines et nationalités */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Globe className="h-5 w-5 text-green-600" />
                                        <span>Origines et nationalités</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Précisez les origines de votre famille pour améliorer les suggestions de recherche
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {origins.map((origin, index) => (
                                            <div key={origin.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label>Pays</Label>
                                                        <Select defaultValue={origin.country}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionner un pays" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {countries.map((country) => (
                                                                    <SelectItem key={country} value={country}>
                                                                        {country}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Région/Province</Label>
                                                        <Input defaultValue={origin.region} placeholder="Ex: Normandie" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Pourcentage estimé</Label>
                                                        <div className="flex items-center space-x-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                defaultValue={origin.percentage}
                                                                className="w-20"
                                                            />
                                                            <span className="text-sm text-gray-500">%</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeOrigin(origin.id)}
                                                        className="bg-transparent hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button variant="outline" onClick={addOrigin} className="w-full bg-transparent">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter une origine
                                    </Button>

                                    {/* Visualisation des pourcentages */}
                                    <div className="space-y-3">
                                        <Label>Répartition des origines</Label>
                                        <div className="space-y-2">
                                            {origins.map((origin) => (
                                                <div key={origin.id} className="flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>
                                                                {origin.country} {origin.region && `(${origin.region})`}
                                                            </span>
                                                            <span>{origin.percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                                                style={{ width: `${origin.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lieux de résidence */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MapPin className="h-5 w-5 text-red-600" />
                                        <span>Lieux de résidence historiques</span>
                                    </CardTitle>
                                    <CardDescription>Ajoutez les différents lieux où votre famille a vécu</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {locations.map((location, index) => (
                                            <div key={location.id} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                                    <div className="space-y-2">
                                                        <Label>Lieu</Label>
                                                        <Input defaultValue={location.place} placeholder="Ex: Paris, France" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Période</Label>
                                                        <Input defaultValue={location.period} placeholder="Ex: 1950 - Présent" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Type</Label>
                                                        <Select defaultValue={location.type}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Type de lieu" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {locationTypes.map((type) => (
                                                                    <SelectItem key={type} value={type}>
                                                                        {type}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeLocation(location.id)}
                                                        className="bg-transparent hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button variant="outline" onClick={addLocation} className="w-full bg-transparent">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter un lieu
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Traditions et faits marquants */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        <span>Traditions et faits marquants</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Documentez les traditions familiales, métiers récurrents, et événements importants
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="traditions">Traditions familiales</Label>
                                            <Textarea
                                                id="traditions"
                                                placeholder="Ex: Réunion familiale annuelle à Noël, recettes traditionnelles..."
                                                className="min-h-[100px]"
                                                defaultValue="Réunion familiale annuelle le 15 août, transmission de la recette du coq au vin de génération en génération."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="professions">Métiers récurrents</Label>
                                            <Textarea
                                                id="professions"
                                                placeholder="Ex: Artisans, agriculteurs, enseignants..."
                                                className="min-h-[100px]"
                                                defaultValue="Nombreux artisans menuisiers, quelques instituteurs, tradition militaire côté paternel."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="events">Événements marquants</Label>
                                        <Textarea
                                            id="events"
                                            placeholder="Ex: Participation à des événements historiques, migrations importantes..."
                                            className="min-h-[100px]"
                                            defaultValue="Migration de Normandie vers Paris en 1920 suite à la Première Guerre mondiale. Participation de plusieurs membres à la Résistance."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="characteristics">Caractéristiques physiques récurrentes</Label>
                                            <Textarea
                                                id="characteristics"
                                                placeholder="Ex: Yeux bleus, grande taille, cheveux roux..."
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="languages">Langues parlées dans la famille</Label>
                                            <Input id="languages" placeholder="Ex: Français, Italien, Espagnol..." />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Paramètres de recherche */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Search className="h-5 w-5 text-blue-600" />
                                        <span>Paramètres de recherche</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Ces informations aideront l'IA à vous proposer des suggestions plus pertinentes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="searchRadius">Rayon de recherche géographique</Label>
                                            <Select defaultValue="national">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="local">Local (même région)</SelectItem>
                                                    <SelectItem value="national">National (même pays)</SelectItem>
                                                    <SelectItem value="continental">Continental (même continent)</SelectItem>
                                                    <SelectItem value="global">Mondial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timeRange">Période de recherche prioritaire</Label>
                                            <Select defaultValue="19th-20th">
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="18th">18ème siècle</SelectItem>
                                                    <SelectItem value="19th">19ème siècle</SelectItem>
                                                    <SelectItem value="19th-20th">19ème-20ème siècle</SelectItem>
                                                    <SelectItem value="20th">20ème siècle</SelectItem>
                                                    <SelectItem value="all">Toutes périodes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-2">💡 Conseil</h4>
                                        <p className="text-sm text-blue-700">
                                            Plus vous renseignez d'informations précises, plus l'IA pourra vous proposer des
                                            suggestions de liens familiaux pertinentes et vous connecter avec d'autres familles ayant
                                            des origines similaires.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Footer avec actions */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
                            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                                <div className="flex space-x-3">
                                    <Button variant="outline" className="bg-transparent">
                                        Réinitialiser
                                    </Button>
                                    <Button variant="outline" className="bg-transparent">
                                        Aperçu
                                    </Button>
                                </div>
                                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    Enregistrer les paramètres
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up animate-stagger-3">
                <Card className="shadow-md border-0 card-hover">
                    <CardHeader>
                        <CardTitle className="text-lg">Origines géographiques</CardTitle>
                        <CardDescription>Répartition des origines de votre famille</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg mb-4 animate-scale-in">
                            <div className="text-center text-gray-500">
                                <Globe className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                <p>Carte des origines</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {origins.map((origin, index) => (
                                <div
                                    key={origin.id}
                                    className="flex items-center space-x-2 animate-slide-up"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div
                                        className="h-3 rounded-full"
                                        style={{
                                            width: `${origin.percentage}%`,
                                            backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`,
                                        }}
                                    ></div>
                                    <div className="text-sm">
                                        {origin.country}, {origin.region} ({origin.percentage}%)
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-0 card-hover">
                    <CardHeader>
                        <CardTitle className="text-lg">Lieux importants</CardTitle>
                        <CardDescription>Lieux significatifs dans l'histoire de votre famille</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {locations.map((location, index) => (
                                <div
                                    key={location.id}
                                    className="flex items-start space-x-3 animate-slide-up"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium">{location.place}</div>
                                        <div className="text-sm text-gray-500">
                                            {location.period} • {location.type}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}