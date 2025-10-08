"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, User, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (usuario: string, contrasena: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  // Función para limpiar sesión y redirigir al login
  const clearSessionAndRedirect = () => {
    //console.log('useAuth: Limpiando sesión y redirigiendo al login')
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  // Exponer función para manejar errores 401 globalmente
  useEffect(() => {
    // Agregar listener global para errores 401
    const handleUnauthorized = () => {
      clearSessionAndRedirect()
    }
    
    // Exponer función globalmente para que otros hooks puedan usarla
    ;(window as any).handleUnauthorized = handleUnauthorized
    
    return () => {
      delete (window as any).handleUnauthorized
    }
  }, [router])

  const checkAuth = async () => {
    try {
      //console.log('useAuth: Iniciando verificación de autenticación')
      
      // Siempre verificar con el backend si hay datos en localStorage
      if (isAuthenticated()) {
        //console.log('useAuth: Datos encontrados en localStorage, validando con backend')
        try {
          // Usar apiClient para verificar el token
          const response = await apiClient.getCurrentUser()
          
          if (response.success && response.user) {
            //console.log('useAuth: Token válido, usuario autenticado:', response.user)
            setUser(response.user)
            localStorage.setItem('user', JSON.stringify(response.user))
            setLoading(false)
            return
          }
          
          // Si llegamos aquí, el token no es válido
          //console.log('useAuth: Token inválido, limpiando datos locales')
          localStorage.removeItem('user')
          localStorage.removeItem('auth_token')
          setUser(null)
        } catch (apiError) {
          console.error('useAuth: Error validando token:', apiError)
          localStorage.removeItem('user')
          localStorage.removeItem('auth_token')
          setUser(null)
        }
      } else {
        //console.log('useAuth: No hay datos en localStorage')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear invalid auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (usuario: string, contrasena: string): Promise<boolean> => {
    try {
      //console.log('Iniciando login para usuario:', usuario)
      
      // Usar apiClient para login
      const response = await apiClient.login(usuario, contrasena)
      
      //console.log('Respuesta del backend:', response)
      
      if (response.success && response.user) {
        //console.log('Login exitoso, estableciendo usuario:', response.user)
        setUser(response.user)
        localStorage.setItem('user', JSON.stringify(response.user))
        toast.success('Inicio de sesión exitoso')
        
        // Redirigir después de un pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          //console.log('Redirigiendo al dashboard...')
          router.push('/dashboard')
        }, 500)
        
        return true
      } else {
        //console.log('Login falló:', response.message)
        toast.error(response.message || 'Error al iniciar sesión')
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Error de conexión con el servidor')
      return false
    }
  }

  const logout = async () => {
    try {
      // Usar apiClient para logout
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local data regardless of API call result
      setUser(null)
      localStorage.removeItem('user')
      toast.success('Sesión cerrada exitosamente')
      router.push('/login')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}