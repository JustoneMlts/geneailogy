"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TreePine, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useRouter } from 'next/navigation';
import Link from "next/link"
import { logInWithEmailAndPassword, signInWithGoogle } from "@/lib/firebase/firebase-authentication"
import { useDispatch } from "react-redux"
import { createUser, getUserById } from "../controllers/usersController"
import { setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { setActiveTab } from "@/lib/redux/slices/uiSlice"
import { FcGoogle } from "react-icons/fc";
import { UserType } from "@/lib/firebase/models"

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState<boolean>(false);
  const route = useRouter()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [error, setError] = useState<string>('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      const userId = user.uid;

      // Vérifie si l'utilisateur existe déjà dans ta base
      let currentUser = await getUserById(userId);

      // Si l'utilisateur n'existe pas encore, on le crée
      if (!currentUser) {
        const [firstName = "", lastName = ""] = (user.displayName || "").split(" ");

        const newUserData: UserType = {
          email: user.email || "",
          firstName,
          lastName,
          firstNameLower: firstName.toLowerCase(),
          lastNameLower: lastName.toLowerCase(),
          bio: "",
          avatarUrl: user.photoURL || "",
          localisation: "",
          nationality: "",
          familyOrigin: "",
          researchInterests: "",
          friends: [],
          createdDate: Date.now(),
          updatedDate: Date.now(),
          isActive: true,
        };

        await createUser({
          email: newUserData.email,
          firstName: newUserData.firstName,
          lastName: newUserData.lastName,
          avatarUrl: newUserData.avatarUrl ? newUserData.avatarUrl : "",
          uid: user.uid,
        });

        // 🔹 Ensuite, récupère le User créé :
        currentUser = await getUserById(user.uid);
      }

      // Enregistre dans Redux + redirige
      dispatch(setCurrentUser(currentUser));
      dispatch(setActiveTab("feed"));
      route.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion avec Google");
      console.error("Erreur Google Sign-In:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await logInWithEmailAndPassword(formData.email, formData.password)
      const userId = userCredential.user.uid
      const currentUser = await getUserById(userId);
      dispatch(setCurrentUser(currentUser))
      dispatch(setActiveTab("feed"))
      route.push("/dashboard")
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full border-b bg-white/70 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
            <div className="flex items-center space-x-2">
              <TreePine className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GeneAIlogy
              </span>
            </div>
          </Link>
          <div className="text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-purple-600 font-medium">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 mt-20">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <TreePine className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Bon retour !</CardTitle>
                <CardDescription className="text-gray-600">
                  Connectez-vous pour accéder à votre arbre généalogique
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Se souvenir de moi
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-purple-600">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-11 bg-white/50 border-gray-200"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle size={4} />
                  Google
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                En vous connectant, vous acceptez nos{" "}
                <Link href="/terms" className="text-blue-600 hover:text-purple-600">
                  Conditions d'utilisation
                </Link>{" "}
                et notre{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-purple-600">
                  Politique de confidentialité
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
