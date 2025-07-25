import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input";
import {
  Search,
} from "lucide-react"

export const SearchPage = () => {
    return (
        <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Recherche de familles</h1>
                <p className="text-gray-600">Trouvez d'autres familles et découvrez des connexions potentielles</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input placeholder="Nom de famille" />
                    <Input placeholder="Prénom" />
                    <Input placeholder="Lieu de naissance" />
                    <Input placeholder="Période (ex: 1800-1900)" />
                    <Input placeholder="Nationalité" />
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 lg:col-span-1">
                      <Search className="mr-2 h-4 w-4" />
                      Rechercher
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((family) => (
                  <Card key={family} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src="/placeholder.svg?height=48&width=48" />
                          <AvatarFallback>FM</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">Famille Martin</CardTitle>
                          <CardDescription>Lyon, France • 15 membres</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        Famille originaire de Lyon avec des racines remontant au 18ème siècle...
                      </p>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                        <Badge variant="outline">Public</Badge>
                        <div className="flex space-x-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                            Voir l'arbre
                          </Button>
                          <Button size="sm" className="flex-1 sm:flex-none">
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
    )
}