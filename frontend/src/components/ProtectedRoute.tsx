"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Evitar múltiples redirecciones
    if (hasRedirected.current) return

    /*console.log('ProtectedRoute: Verificando acceso', { 
      loading, 
      isAuthenticated, 
      userRole: user?.rol, 
      allowedRoles
    })*/

    if (!loading && !isAuthenticated) {
      //console.log('ProtectedRoute: Usuario no autenticado, redirigiendo a login')
      hasRedirected.current = true
      router.push('/login')
      return
    }

    // Si hay roles específicos requeridos, verificar que el usuario tenga uno de esos roles
    if (!loading && isAuthenticated && allowedRoles && user) {
      // Normalizar roles para comparación (trim y case insensitive)
      const userRole = user.rol?.trim()
      const normalizedAllowedRoles = allowedRoles.map(role => role.trim())
      
      /*console.log('ProtectedRoute: Comparando roles', {
        userRole,
        normalizedAllowedRoles,
        includes: normalizedAllowedRoles.includes(userRole)
      })*/
      
      if (!normalizedAllowedRoles.includes(userRole)) {
        /*console.log('ProtectedRoute: Usuario sin permisos para esta página', { 
          userRole: user.rol, 
          allowedRoles
        })*/
        // En lugar de redirigir al dashboard, mostrar mensaje de error
        hasRedirected.current = true
        return
      }
    }
  }, [isAuthenticated, loading, router, allowedRoles, user])

  // Reset redirect flag when dependencies change significantly
  useEffect(() => {
    hasRedirected.current = false
  }, [isAuthenticated, loading])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Si no está autenticado, no renderizar nada (la redirección se maneja en useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Si hay roles específicos requeridos y el usuario no tiene permisos, mostrar mensaje de error
  if (allowedRoles && user) {
    const userRole = user.rol?.trim()
    const normalizedAllowedRoles = allowedRoles.map(role => role.trim())
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500">
              Tu rol actual: <span className="font-semibold">{user.rol}</span>
            </p>
            <p className="text-sm text-gray-500">
              Roles permitidos: <span className="font-semibold">{allowedRoles.join(', ')}</span>
            </p>
          </div>
        </div>
      )
    }
  }

  // Si está autenticado y tiene permisos, renderizar el contenido
  return <>{children}</>
}
