import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { AuthProvider } from "@/hooks/useAuth"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dirección Municipal de Mujeres de Salcajá",
  description: "Sistema de gestión de beneficiarias, proyectos y actividades",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/*
        <div className="min-h-screen" style={{ backgroundColor: "rgba(182, 227, 212, 0.1)" }}>
        <div className="min-h-screen" style={{ backgroundColor: "rgba(241, 199, 255, 0.1 )" }}>
        <div className="min-h-screen" style={{ backgroundColor: "rgba(200, 194, 255, 0.1 )" }}>
        */}
        <div className="min-h-screen" style={{ backgroundColor: "rgba(200, 194, 255, 0.1 )" }}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
