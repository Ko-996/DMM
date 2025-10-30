"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Users } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(usuario, password)
      
      if (!success) {
        setError("Usuario o credenciales incorrectas")
      }
      // La redirección se maneja en el hook useAuth
    } catch (error) {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }
//<div className="min-h-screen flex items-center justify-center p-4">
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/*<div className="mx-auto mb-4 w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>*/}
          <div className="mx-auto mb-4 w-22 h-22 flex items-center justify-center">
            <img
              src="/images/muni.jpg"
              alt="Logo Dirección Municipal de Mujeres de Salcajá"
              className="h-22 w-22 rounded-full object-cover shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Dirección Municipal de Mujeres de Salcajá</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input
                id="usuario"
                type="text"
                placeholder="Usuario-01"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="p-1 border-red-500" >
                <AlertDescription className=" justify-center text-red-500">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            {/*<p className="font-semibold mb-2">
            <div className="space-y-1">
              
            </div>*/}
          </div>
        </CardContent>
      </Card>
    </div>
    
    <footer className="bg-gray-900 text-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Dirección Municipal de la Mujer de Salcajá. Todos los derechos reservados.</p>
          <p>Desarrollado por: Kevin Rafael Ovalle Lemus.</p>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <img
              src="/images/logoUMG.jpg"
              alt="Logo Dirección Municipal de Mujeres de Salcajá"
              className="h-8 w-8 rounded-full object-cover shadow-lg"
            />
            <span >UMG</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
