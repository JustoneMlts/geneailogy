"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TreePine, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, User, Calendar, MapPin, Heart } from "lucide-react"
import Link from "next/link"

interface FamilyMember {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  birthPlace?: string
  avatar?: string
  spouse?: string
  children?: string[]
  parents?: string[]
  gender: "male" | "female"
}

const familyData: Record<string, FamilyMember> = {
  "jean-dupont": {
    id: "jean-dupont",
    name: "Jean Dupont",
    birthYear: 1950,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "marie-martin",
    children: ["pierre-dupont", "sophie-dupont"],
    gender: "male",
  },
  "marie-martin": {
    id: "marie-martin",
    name: "Marie Martin",
    birthYear: 1952,
    birthPlace: "Lyon, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "jean-dupont",
    children: ["pierre-dupont", "sophie-dupont"],
    gender: "female",
  },
  "pierre-dupont": {
    id: "pierre-dupont",
    name: "Pierre Dupont",
    birthYear: 1975,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["jean-dupont", "marie-martin"],
    spouse: "claire-bernard",
    children: ["lucas-dupont"],
    gender: "male",
  },
  "sophie-dupont": {
    id: "sophie-dupont",
    name: "Sophie Dupont",
    birthYear: 1978,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["jean-dupont", "marie-martin"],
    gender: "female",
  },
  "claire-bernard": {
    id: "claire-bernard",
    name: "Claire Bernard",
    birthYear: 1977,
    birthPlace: "Marseille, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "pierre-dupont",
    children: ["lucas-dupont"],
    gender: "female",
  },
  "lucas-dupont": {
    id: "lucas-dupont",
    name: "Lucas Dupont",
    birthYear: 2005,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["pierre-dupont", "claire-bernard"],
    gender: "male",
  },
  "robert-dupont": {
    id: "robert-dupont",
    name: "Robert Dupont",
    birthYear: 1920,
    deathYear: 1995,
    birthPlace: "Bordeaux, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "louise-petit",
    children: ["jean-dupont"],
    gender: "male",
  },
  "louise-petit": {
    id: "louise-petit",
    name: "Louise Petit",
    birthYear: 1925,
    deathYear: 2010,
    birthPlace: "Toulouse, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "robert-dupont",
    children: ["jean-dupont"],
    gender: "female",
  },
}

function FamilyMemberCard({ member, onClick }: { member: FamilyMember; onClick: () => void }) {
  return (
    <Card
      className={`w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <Avatar className="w-16 h-16 mx-auto mb-3">
          <AvatarImage src={member.avatar || "/placeholder.svg"} />
          <AvatarFallback className={member.gender === "male" ? "bg-blue-100" : "bg-pink-100"}>
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-sm mb-1">{member.name}</h3>
        <div className="space-y-1 text-xs text-gray-600">
          {member.birthYear && (
            <div className="flex items-center justify-center">
              <Calendar className="w-3 h-3 mr-1" />
              {member.birthYear}
              {member.deathYear && ` - ${member.deathYear}`}
            </div>
          )}
          {member.birthPlace && (
            <div className="flex items-center justify-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{member.birthPlace}</span>
            </div>
          )}
        </div>
        {member.deathYear && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Décédé(e)
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export default function FamilyTree() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [zoom, setZoom] = useState(1)

  const generations = [
    // Arrière-grands-parents
    {
      level: 0,
      members: ["robert-dupont", "louise-petit"],
    },
    // Grands-parents / Parents
    {
      level: 1,
      members: ["jean-dupont", "marie-martin"],
    },
    // Enfants
    {
      level: 2,
      members: ["pierre-dupont", "sophie-dupont", "claire-bernard"],
    },
    // Petits-enfants
    {
      level: 3,
      members: ["lucas-dupont"],
    },
  ]

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
            <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2">
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(1)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/add-member">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <User className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Arbre généalogique de la famille Dupont</h1>
          <p className="text-gray-600">Explorez votre histoire familiale de génération en génération</p>
        </div>

        {/* Tree Visualization */}
        <div className="relative overflow-auto bg-white/50 rounded-xl p-8 min-h-[600px]">
          <div
            className="relative mx-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center top",
              width: "fit-content",
            }}
          >
            {generations.map((generation, genIndex) => (
              <div key={genIndex} className="mb-16">
                <div className="text-center mb-8">
                  <Badge variant="outline" className="text-sm font-medium">
                    {genIndex === 0 && "Arrière-grands-parents"}
                    {genIndex === 1 && "Grands-parents"}
                    {genIndex === 2 && "Parents / Oncles & Tantes"}
                    {genIndex === 3 && "Enfants"}
                  </Badge>
                </div>

                <div className="flex justify-center items-center space-x-8 flex-wrap gap-4">
                  {generation.members.map((memberId) => {
                    const member = familyData[memberId]
                    if (!member) return null

                    return (
                      <div key={memberId} className="relative">
                        <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />

                        {/* Connection lines */}
                        {member.spouse && genIndex < generations.length - 1 && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="w-16 h-px bg-gray-300 -translate-x-1/2"></div>
                          </div>
                        )}

                        {/* Marriage connection */}
                        {member.spouse && (
                          <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
                            <Heart className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Vertical connection to next generation */}
                {genIndex < generations.length - 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="w-px h-8 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Member Details Panel */}
        {selectedMember && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedMember.avatar || "/placeholder.svg"} />
                  <AvatarFallback className={selectedMember.gender === "male" ? "bg-blue-100" : "bg-pink-100"}>
                    {selectedMember.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedMember.name}</h2>
                    <Button variant="ghost" onClick={() => setSelectedMember(null)}>
                      ✕
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {selectedMember.birthYear && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          Né(e) en {selectedMember.birthYear}
                          {selectedMember.deathYear && ` - Décédé(e) en ${selectedMember.deathYear}`}
                        </span>
                      </div>
                    )}

                    {selectedMember.birthPlace && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{selectedMember.birthPlace}</span>
                      </div>
                    )}

                    {selectedMember.spouse && (
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>Marié(e) à {familyData[selectedMember.spouse]?.name}</span>
                      </div>
                    )}

                    {selectedMember.children && selectedMember.children.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>
                          {selectedMember.children.length} enfant{selectedMember.children.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline">
                      Ajouter relation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
