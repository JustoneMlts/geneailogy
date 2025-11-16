"use client"

import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TreePine, ArrowLeft, Eye, EyeOff, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signUpWithEmailAndPassword } from "@/lib/firebase/firebase-authentication"
import { createUser, getUserById } from "../controllers/usersController"
import { setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { setActiveTab } from "@/lib/redux/slices/uiSlice"
import { UserType } from "@/lib/firebase/models"
import { FcGoogle } from "react-icons/fc"
import { useDispatch } from "react-redux"

export default function SignupPage() {
  interface FormData {
    firstName: '',
    lastName: '',
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
    uid: string;
  }

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const route = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    uid: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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

  const passwordRequirements = [
    { text: "Au moins 8 caractères", met: formData.password.length >= 8 },
    { text: "Une majuscule", met: /[A-Z]/.test(formData.password) },
    { text: "Une minuscule", met: /[a-z]/.test(formData.password) },
    { text: "Un chiffre", met: /\d/.test(formData.password) },
  ]

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Vous devez accepter les conditions générales');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signUpWithEmailAndPassword(formData.email, formData.password);

      const result = await createUser({
        ...formData,
        uid: userCredential.user.uid
      });

      route.push("/login");

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création du compte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:text-purple-600 font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12 animate-fade-in">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <TreePine className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Créer votre compte</CardTitle>
                <CardDescription className="text-gray-600">
                  Commencez votre voyage généalogique dès aujourd'hui
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Prénom
                    </Label>
                    <Input
                      id="firstName"
                      name='firstName'
                      placeholder="Jean"
                      className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Nom
                    </Label>
                    <Input
                      id="lastName"
                      name='lastName'
                      placeholder="Dupont"
                      className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    name='email'
                    type="email"
                    placeholder="votre@email.com"
                    className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.email}
                    onChange={handleChange}
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
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
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

                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <Check className={`h-3 w-3 ${req.met ? "text-green-500" : "text-gray-300"}`} />
                          <span className={req.met ? "text-green-600" : "text-gray-500"}>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name='confirmPassword'
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prevState) => ({
                        ...prevState,
                        agreeToTerms: checked === true,
                      }))
                    }
                    className="mt-1"
                  />                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    J'accepte les{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-purple-600">
                      Conditions d'utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-purple-600">
                      Politique de confidentialité
                    </Link>
                  </Label>
                </div>

                <Button
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                  disabled={!formData.agreeToTerms}
                >
                  Créer mon compte
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Ou s'inscrire avec</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

