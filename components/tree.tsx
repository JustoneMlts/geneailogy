"use client";

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
import { useEffect, useRef, useState } from "react";
import AddMemberModal from "./addMember";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { getTreeById } from "@/app/controllers/treesController";
import { getUserById } from "@/app/controllers/usersController";
import { getFamilyMembersByIds } from "@/app/controllers/membersController";
import { MariageLines } from "@/components/mariageLine"
import { DynamicFamilyTree } from "./dynamicFamilyTree";
import GeographicalOrigins from "./geographicalOrigins";

// Types et utilitaires inchangés
const getYearFromADate = (timestamp: number): number => {
    const date = new Date(timestamp)
    return date.getFullYear()
}

export const getMemberById = (familyData: MemberType[], id?: string): MemberType | undefined =>
    id ? familyData.find(member => member.id === id) : undefined;

export const getMembersByIds = (data: MemberType[], ids?: string[]): MemberType[] =>
    ids?.map(id => getMemberById(data, id)).filter((m): m is MemberType => !!m) || [];

export const getParents = (member: MemberType, data: MemberType[]): MemberType[] => {
    if (member.parentsIds?.length) return getMembersByIds(data, member.parentsIds);
    return data.filter(m => m.childrenIds?.includes(member.id!));
};

export const getChildren = (member: MemberType, data: MemberType[]): MemberType[] =>
    getMembersByIds(data, member.childrenIds);

export const getSiblings = (member: MemberType, data: MemberType[]): MemberType[] => {
    if (member.brothersIds?.length) return getMembersByIds(data, member.brothersIds);
    return data.filter(
        m => m.id !== member.id && m.parentsIds?.some(pid => member.parentsIds?.includes(pid))
    );
};

// Fonction pour obtenir les oncles et tantes
export const getUnclesAndAunts = (member: MemberType, data: MemberType[]): MemberType[] => {
    const parents = getParents(member, data);
    const unclesAndAunts: MemberType[] = [];

    parents.forEach(parent => {
        const siblings = getSiblings(parent, data);
        unclesAndAunts.push(...siblings);
    });

    // Supprimer les doublons
    return unclesAndAunts.filter((uncle, index, self) =>
        index === self.findIndex(u => u.id === uncle.id)
    );
};

// Fonction pour obtenir les cousins
export const getCousins = (member: MemberType, data: MemberType[]): MemberType[] => {
    const unclesAndAunts = getUnclesAndAunts(member, data);
    const cousins: MemberType[] = [];

    unclesAndAunts.forEach(uncleOrAunt => {
        const children = getChildren(uncleOrAunt, data);
        cousins.push(...children);
    });

    return cousins;
};

type ChildrenSection = {
    label: string;
    members: MemberType[];
    parentId: string;
};

// Ajoutez ces nouveaux types à votre fichier
export type Generation = {
    label: string;
    members: MemberType[];
    type: 'paternal-grandparents' | 'maternal-grandparents' | 'grandparents' | 'parents' | 'uncles-aunts' | 'siblings' | 'cousins' | 'children-group';
    childrenSections?: ChildrenSection[];
};

// Fonction modifiée pour obtenir les grands-parents paternels
export const getPaternalGrandparents = (member: MemberType, data: MemberType[]): MemberType[] => {
    const parents = getParents(member, data);
    const father = parents.find(parent => parent.gender === 'male');
    if (!father) return [];
    return getParents(father, data);
};

// Fonction modifiée pour obtenir les grands-parents maternels
export const getMaternalGrandparents = (member: MemberType, data: MemberType[]): MemberType[] => {
    const parents = getParents(member, data);
    const mother = parents.find(parent => parent.gender === 'female');
    if (!mother) return [];
    return getParents(mother, data);
};

// Fonction principale modifiée pour construire l'arbre centré sur une personne
export const buildDynamicTree = (
    familyData: MemberType[],
    centralPersonId: string,
    currentUserId?: string,
    isOwner?: boolean
): Generation[] => {
    const generations: Generation[] = [];
    const renderedMembers = new Set<string>();

    const centralMember = getMemberById(familyData, centralPersonId);
    if (!centralMember) return generations;

    // 1. Grands-parents paternels
    const paternalGrandparents = getPaternalGrandparents(centralMember, familyData);
    if (paternalGrandparents.length > 0) {
        paternalGrandparents.forEach(gp => renderedMembers.add(gp.id!));
        generations.push({
            label: "Grands-parents paternels",
            members: paternalGrandparents,
            type: 'paternal-grandparents'
        });
    }

    // 2. Grands-parents maternels
    const maternalGrandparents = getMaternalGrandparents(centralMember, familyData);
    if (maternalGrandparents.length > 0) {
        maternalGrandparents.forEach(gp => renderedMembers.add(gp.id!));
        generations.push({
            label: "Grands-parents maternels",
            members: maternalGrandparents,
            type: 'maternal-grandparents'
        });
    }

    // 3. Parents
    const parents = getParents(centralMember, familyData);
    if (parents.length > 0) {
        parents.forEach(p => renderedMembers.add(p.id!));
        generations.push({
            label: "Parents",
            members: parents,
            type: 'parents'
        });
    }

    // 4. Oncles et tantes avec leurs enfants (cousins)
    const unclesAndAunts = getUnclesAndAunts(centralMember, familyData)
        .filter(ua => !renderedMembers.has(ua.id!));

    if (unclesAndAunts.length > 0) {
        unclesAndAunts.forEach(ua => renderedMembers.add(ua.id!));

        const cousinsSections: ChildrenSection[] = [];
        unclesAndAunts.forEach(uncleOrAunt => {
            const cousins = getChildren(uncleOrAunt, familyData)
                .filter(c => !renderedMembers.has(c.id!));

            if (cousins.length > 0) {
                cousins.forEach(c => renderedMembers.add(c.id!));
                cousinsSections.push({
                    label: `Enfants de ${uncleOrAunt.firstName}`,
                    members: cousins,
                    parentId: uncleOrAunt.id!
                });
            }
        });
    }

    // 5. Génération centrale : la personne + ses frères et sœurs avec leurs enfants
    const siblings = getSiblings(centralMember, familyData)
        .filter(s => !renderedMembers.has(s.id!));
    const centralGenMembers = [centralMember, ...siblings];

    centralGenMembers.forEach(m => renderedMembers.add(m.id!));

    const childrenSections: ChildrenSection[] = [];
    centralGenMembers.forEach(parent => {
        const children = getChildren(parent, familyData)
            .filter(c => !renderedMembers.has(c.id!));

        if (children.length > 0) {
            children.forEach(c => renderedMembers.add(c.id!));

            const parentName = parent.id === centralPersonId
                ? (parent.id === currentUserId ? 'Vos enfants' : 'Ses enfants')
                : `Enfants de ${parent.firstName}`;

            childrenSections.push({
                label: parentName,
                members: children,
                parentId: parent.id!
            });
        }
    });

    const centralLabel = centralPersonId === currentUserId
        ? "Vous et vos frères et sœurs"
        : `${centralMember.firstName} et ses frères et sœurs`;

    generations.push({
        label: centralLabel,
        members: centralGenMembers,
        type: 'siblings',
        childrenSections
    });

    return generations;
};

// Nouveau composant pour afficher les grands-parents côte à côte
export const GrandparentsSection = ({
    paternalGrandparents,
    maternalGrandparents,
    setSelectedMember,
    currentUserId,
    centralPersonId,
    onNavigateToPerson
}: {
    paternalGrandparents: MemberType[];
    maternalGrandparents: MemberType[];
    setSelectedMember: (member: MemberType) => void;
    currentUserId: string;
    centralPersonId: string;
    onNavigateToPerson: (personId: string) => void;
}) => {
    // Si aucun grand-parent, ne rien afficher
    if (paternalGrandparents.length === 0 && maternalGrandparents.length === 0) {
        return null;
    }

    return (
        <div className="relative text-center space-y-6">
            {/* Container avec scroll horizontal */}
            <div className="overflow-x-auto overflow-y-visible pb-4">
                <div className="flex justify-center items-start gap-16 min-w-max">
                    {/* Section Grands-parents paternels */}
                    <div className="flex flex-col items-center space-y-6 flex-shrink-0">
                        {paternalGrandparents.length > 0 && (
                            <>
                                <div className="relative">
                                    <h2 className="text-sm font-bold text-gray-800 bg-white px-4 py-2 rounded-full border-2 border-gray-200 inline-block relative z-10">
                                        Grands-parents paternels
                                    </h2>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    {paternalGrandparents.map((member) => (
                                        <div key={member.id!} className="flex-shrink-0">
                                            <CompactFamilyMemberCard
                                                member={member}
                                                highlight={member.id === centralPersonId}
                                                isCurrentUser={member.id === currentUserId}
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    onNavigateToPerson(member.id!);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Section Grands-parents maternels */}
                    <div className="flex flex-col items-center space-y-6 flex-shrink-0">
                        {maternalGrandparents.length > 0 && (
                            <>
                                <div className="relative">
                                    <h2 className="text-sm font-bold text-gray-800 bg-white px-4 py-2 rounded-full border-2 border-gray-200 inline-block relative z-10">
                                        Grands-parents maternels
                                    </h2>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    {maternalGrandparents.map((member) => (
                                        <div key={member.id!} className="flex-shrink-0">
                                            <CompactFamilyMemberCard
                                                member={member}
                                                highlight={member.id === centralPersonId}
                                                isCurrentUser={member.id === currentUserId}
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    onNavigateToPerson(member.id!);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant GenerationSection mis à jour avec les nouveaux types
export const GenerationSection = ({
    title,
    members,
    setSelectedMember,
    currentUserId,
    centralPersonId,
    onNavigateToPerson,
    isOwner,
    type,
    childrenSections
}: {
    title: string;
    members: MemberType[];
    setSelectedMember: (member: MemberType) => void;
    currentUserId: string;
    centralPersonId: string;
    onNavigateToPerson: (personId: string) => void;
    isOwner: boolean;
    type: 'paternal-grandparents' | 'maternal-grandparents' | 'grandparents' | 'parents' | 'uncles-aunts' | 'siblings' | 'cousins' | 'children-group';
    childrenSections?: ChildrenSection[];
}) => {
    // Pour les grands-parents paternels/maternels -> gérés par GrandparentsSection
    if (type === 'paternal-grandparents' || type === 'maternal-grandparents') {
        return null;
    }

    // === CAS : sections avec enfants (siblings, uncles-aunts) ===
    if ((type === 'siblings' || type === 'uncles-aunts') && childrenSections) {
        return (
            <div className="relative text-center space-y-8">
                {/* Titre */}
                <div className="relative">
                    <h2 className="text-sm font-bold text-gray-800 bg-white px-4 py-2 rounded-full border-2 border-gray-200 inline-block relative z-10">
                        {title}
                    </h2>
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                </div>

                {/* Scroll horizontal */}
                <div className="pb-6">
                    <div className="flex gap-12 items-start min-w-max">
                        {members.map((parent) => {
                            const parentChildrenSection = childrenSections?.find(section => section.parentId === parent.id);
                            const childrenCount = parentChildrenSection?.members.length || 1;
                            const columnWidth = Math.max(150, childrenCount * 120 + (childrenCount - 1) * 16);

                            return (
                                <div
                                    key={parent.id!}
                                    className="flex flex-col items-center space-y-6 flex-shrink-0"
                                    style={{ minWidth: `${columnWidth}px` }}
                                >
                                    {/* Carte parent */}
                                    <div className="flex justify-center w-full">
                                        <CompactFamilyMemberCard
                                            member={parent}
                                            highlight={parent.id === centralPersonId}
                                            isCurrentUser={parent.id === currentUserId}
                                            onClick={() => {
                                                setSelectedMember(parent);
                                                onNavigateToPerson(parent.id!);
                                            }}
                                        />
                                    </div>

                                    {/* Enfants */}
                                    {parentChildrenSection && (
                                        <div className="text-center space-y-4 w-full">
                                            <div className="relative">
                                                <h3 className="text-xs font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200 inline-block relative z-10">
                                                    {parentChildrenSection.label}
                                                </h3>
                                                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                                                </div>
                                            </div>

                                            {/* Scroll enfants du parent */}
                                            <div className="">
                                                <div className="flex gap-4 justify-start min-w-max">
                                                    {parentChildrenSection.members.map((member) => (
                                                        <CompactFamilyMemberCard
                                                            key={member.id!}
                                                            member={member}
                                                            highlight={member.id === centralPersonId}
                                                            isCurrentUser={member.id === currentUserId}
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                onNavigateToPerson(member.id!);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!parentChildrenSection && <div className="h-32"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // === CAS : autres types (parents, grandparents, cousins, etc.) ===
    if (!members.length) return null;

    return (
        <div className="relative text-center space-y-6">
            {/* Titre */}
            <div className="relative">
                <h2 className="text-sm font-bold text-gray-800 bg-white px-4 py-2 rounded-full border-2 border-gray-200 inline-block relative z-10">
                    {title}
                </h2>
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
            </div>

            {/* Scroll horizontal */}
            <div className="overflow-visible pb-4">
                <div className="flex gap-16 justify-center min-w-max overflow-visible">
                    {members.map((member) => (
                        <CompactFamilyMemberCard
                            key={member.id!}
                            member={member}
                            highlight={member.id === centralPersonId}
                            isCurrentUser={member.id === currentUserId}
                            onClick={() => {
                                setSelectedMember(member);
                                onNavigateToPerson(member.id!);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// CompactFamilyMemberCard mise à jour avec indicateurs visuels
function CompactFamilyMemberCard({
    member,
    onClick,
    highlight,
    isCurrentUser
}: {
    member: MemberType;
    onClick: () => void;
    highlight: boolean;
    isCurrentUser: boolean;
}) {
    return (
        <Card
            className={`w-40 overflow-visible cursor-pointer transition-all duration-300 
            hover:shadow-lg hover:scale-105 relative 
            ${member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"} 
            ${highlight ? "ring-4 ring-green-400 ring-offset-2" : ""} 
            ${isCurrentUser ? "ring-2 ring-yellow-400 ring-offset-1" : ""}`}
            onClick={onClick}
        >
            {/* Indicateur "personne centrale" */}
            {highlight && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎯</span>
                </div>
            )}

            {/* Indicateur "vous" */}
            {isCurrentUser && !highlight && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">👤</span>
                </div>
            )}

            <CardContent className="p-3 text-center">
                <Avatar className="w-12 h-12 mx-auto mb-2">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback className={member.gender === "male" ? "bg-blue-100 text-xs" : "bg-pink-100 text-xs"}>
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

                <h3 className="font-semibold text-xs mb-1 leading-tight">
                    {member.firstName} {member.lastName}
                </h3>

                <div className="space-y-1 text-xs text-gray-600">
                    {member.birthDate && (
                        <div className="flex items-center justify-center space-x-1">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="text-xs">
                                {getYearFromADate(member.birthDate)}
                                {member.deathDate && ` - ${getYearFromADate(member.deathDate)}`}
                            </span>
                        </div>
                    )}
                    {/* {member.birthPlace && (
                        <div className="flex items-center justify-center space-x-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate text-xs max-w-24">
                                {member.birthPlace.split(',')[0]}
                            </span>
                        </div>
                    )} */}
                </div>

                {member.deathDate && (
                    <Badge variant="secondary" className="mt-1 text-xs px-1 py-0">
                        Décédé(e)
                    </Badge>
                )}
            </CardContent>
        </Card>
    )
}

export const Tree = ({ userId }: { userId?: string }) => {
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [treeId, setTreeId] = useState("")
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const currentUser = useSelector(selectUser)
    const [mainUser, setMainUser] = useState<UserType | null>(null)

    // Récupérer l'utilisateur principal
    useEffect(() => {
        if (userId) {
            getUserById(userId)
                .then(setMainUser)
                .catch((err) => console.error("Erreur récupération user:", err))
        } else {
            setMainUser(currentUser)
        }
    }, [userId, currentUser])

    // Charger l'arbre du mainUser
    useEffect(() => {
        const loadTree = async () => {
            if (!mainUser) return
            if (mainUser.treesIds?.length) {
                setTreeId(mainUser.treesIds[0])
            }
        }
        loadTree()
    }, [mainUser])

    const refreshTree = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const [zoom, setZoom] = useState(1)
    const [showFamilySettings, setShowFamilySettings] = useState(false)
    const [selectedMember, setSelectedMember] = useState<MemberType | null>(null)
    const [origins, setOrigins] = useState([
        { id: 1, country: "France", region: "Normandie", percentage: 60 },
        { id: 2, country: "Italie", region: "Toscane", percentage: 30 },
        { id: 3, country: "Espagne", region: "Andalousie", percentage: 10 },
    ])
    const [locations, setLocations] = useState([
        { id: 1, place: "Paris, France", period: "1950 - Présent", type: "Résidence principale" },
        { id: 2, place: "Lyon, France", period: "1920 - 1950", type: "Résidence familiale" },
        { id: 3, place: "Bordeaux, France", period: "1890 - 1920", type: "Lieu de naissance" },
    ])

    const addOrigin = () => {
        const newOrigin = { id: Date.now(), country: "", region: "", percentage: 0 }
        setOrigins([...origins, newOrigin])
    }
    const removeOrigin = (id: number) => setOrigins(origins.filter((o) => o.id !== id))

    const addLocation = () => {
        const newLocation = { id: Date.now(), place: "", period: "", type: "" }
        setLocations([...locations, newLocation])
    }
    const removeLocation = (id: number) => setLocations(locations.filter((l) => l.id !== id))

    const locationTypes = ["Résidence principale", "Résidence familiale", "Lieu de naissance", "Lieu de travail", "Autre"]
    const countries = ["France", "Italie", "Espagne", "Allemagne", "Royaume-Uni", "Portugal", "Brésil", "Argentine", "Mexique", "États-Unis", "Canada", "Japon", "Chine", "Inde", "Maroc", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire", "Cameroun", "Autre"]

    const handleAddMemberClose = (memberAdded?: boolean) => {
        setIsAddMemberOpen(false)
        if (memberAdded) refreshTree()
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {mainUser && userId
                            ? `Arbre généalogique de ${mainUser.firstName} ${mainUser.lastName}`
                            : "Mon arbre généalogique"}
                    </h1>
                    <p className="text-gray-600">
                        Explorez {mainUser && userId ? `l’histoire familiale de ${mainUser.firstName}` : "votre histoire familiale"} de génération en génération
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                    {/* Zoom */}
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
                    {/* Settings */}
                    <Button variant="outline" onClick={() => setShowFamilySettings(true)} className="bg-white/50 w-full sm:w-auto">
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres famille
                    </Button>
                    {/* Add member */}
                    <div>
                        <Button onClick={() => setIsAddMemberOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter membre
                        </Button>
                        <AddMemberModal treeId={treeId} isOpen={isAddMemberOpen} onClose={handleAddMemberClose} />
                    </div>
                </div>
            </div>

            {/* Tree Visualization - Utilisation du nouveau composant dynamique */}
            <div className="py-4" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
                {treeId && mainUser && (
                    <DynamicFamilyTree treeId={treeId} userId={mainUser.id} refreshTrigger={refreshTrigger} />
                )}
            </div>

            {/* Family Settings Modal - Reste inchangé */}
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
                                        <h4 className="font-semibold text-blue-800 mb-2">Conseil</h4>
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

            {/* Cards des origines et lieux - Reste inchangé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up animate-stagger-3">
                <div>
                    <GeographicalOrigins />
                </div>

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

// function FamilyMemberCard({ member, onClick, highlight }: { member: MemberType; onClick: () => void, highlight: boolean }) {

//     return (
//         <div>
//             <Card
//                 className={`w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"
//                     }`}
//                 onClick={onClick}
//             >
//                 <CardContent className="p-4 text-center">
//                     <Avatar className="w-16 h-16 mx-auto mb-3">
//                         <AvatarImage src={member.avatar || "/placeholder.svg"} />
//                         <AvatarFallback className={member.gender === "male" ? "bg-blue-100" : "bg-pink-100"}>
//                             {member.firstName
//                                 .split(" ")
//                                 .map((n: any) => n[0])
//                                 .join("") + member.lastName
//                                     .split(" ")
//                                     .map((n: any) => n[0])
//                                     .join("")
//                             }
//                         </AvatarFallback>
//                     </Avatar>
//                     <h3 className="font-semibold text-sm mb-2">{member.firstName + " " + member.lastName}</h3>
//                     <div className="space-y-1 text-xs text-gray-600">
//                         {member.birthDate && (
//                             <div className="flex items-center justify-center space-x-1">
//                                 <Calendar className="w-3 h-3" />
//                                 <span>
//                                     {getYearFromADate(member.birthDate)}
//                                     {member.deathDate && ` - ${getYearFromADate(member.deathDate)}`}
//                                 </span>
//                             </div>
//                         )}
//                         {member.birthPlace && (
//                             <div className="flex items-center justify-center space-x-1">
//                                 <MapPin className="w-3 h-3" />
//                                 <span className="truncate">{member.birthPlace}</span>
//                             </div>
//                         )}
//                     </div>
//                     {member.deathDate && (
//                         <Badge variant="secondary" className="mt-2 text-xs">
//                             Décédé(e)
//                         </Badge>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }