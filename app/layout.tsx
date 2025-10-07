// app/layout.tsx (Server Component - garde les metadata)
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ReduxProvider } from "./ReduxProvider"
import { NotificationsProvider } from "./NotificationsProvider"
import { LayoutContent } from "@/components/layoutContent"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GeneAIlogy - Découvrez votre histoire familiale",
  description:
    "Créez votre arbre généalogique, connectez-vous avec votre famille et laissez l'IA vous suggérer de nouveaux liens familiaux",
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ReduxProvider>
          <NotificationsProvider>
            <LayoutContent>{children}</LayoutContent>
          </NotificationsProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}