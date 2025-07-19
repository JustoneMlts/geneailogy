"use client"

import { useState } from "react"
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

export default function AddMember() {
  const [birthDate, setBirthDate] = useState<Date>()
  const [deathDate, setDeathDate] = useState<Date>()
  const [isDeceased, setIsDeceased] = useState(false)
  const [isMarried, setIsMarried] = useState(false)
  const [selectedGender, setSelectedGender] = useState("")

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
            <Button variant="outline">Annuler</Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
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
            {/* Photo Section */}
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

            {/* Form Section */}
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
                      <Input id="firstName" placeholder="Jean" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {selectedGender === "female" ? "Nom de jeune fille *" : "Nom de famille *"}
                      </Label>
                      <Input id="lastName" placeholder={selectedGender === "female" ? "Martin" : "Dupont"} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre</Label>
                    <Select onValueChange={setSelectedGender}>
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
                      <Input id="birthPlace" placeholder="Paris, France" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={isDeceased}
                      onCheckedChange={(checked) => setIsDeceased(checked === true)}
                      className="mt-1"
                    />                    <Label htmlFor="deceased">Cette personne est décédée</Label>
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
                        <Input id="deathPlace" placeholder="Lyon, France" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Nationalité</span>
                    </Label>
                    <Input id="nationality" placeholder="Française" />
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
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Lien de parenté avec vous</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le lien de parenté" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Enfant</SelectItem>
                        <SelectItem value="sibling">Frère/Sœur</SelectItem>
                        <SelectItem value="grandparent">Grand-parent</SelectItem>
                        <SelectItem value="grandchild">Petit-enfant</SelectItem>
                        <SelectItem value="uncle-aunt">Oncle/Tante</SelectItem>
                        <SelectItem value="cousin">Cousin(e)</SelectItem>
                        <SelectItem value="spouse">Conjoint(e)</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={isMarried}
                      onCheckedChange={(checked) => setIsMarried(checked === true)}
                      className="mt-1"
                    />                    <Label htmlFor="married">Cette personne est/était mariée</Label>
                  </div>

                  {isMarried && (
                    <div className="p-4 bg-pink-50 rounded-lg space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="spouse">Conjoint(e)</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le conjoint dans l'arbre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add-new">+ Ajouter un nouveau conjoint</SelectItem>
                            <SelectItem value="marie-martin">Marie Martin</SelectItem>
                            <SelectItem value="pierre-dubois">Pierre Dubois</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de mariage</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Sélectionner une date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Notes supplémentaires</span>
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des informations complémentaires, anecdotes, profession, etc.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Écrivez ici toute information supplémentaire sur cette personne..."
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/dashboard">
                  <Button variant="outline">Annuler</Button>
                </Link>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
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
