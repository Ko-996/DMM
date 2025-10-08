import { useAuth } from './useAuth'

export function usePermissions() {
  const { user } = useAuth()

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    const userRole = user.rol?.trim()
    const normalizedRoles = roles.map(role => role.trim())
    const result = normalizedRoles.includes(userRole)
    
    /*console.log('usePermissions - hasRole:', {
      userRole,
      roles,
      normalizedRoles,
      result
    })*/
    
    return result
  }

  const isDirectora = (): boolean => {
    return hasRole(['Directora'])
  }

  const isAdministrador = (): boolean => {
    return hasRole(['Administrador'])
  }

  const isTecnica = (): boolean => {
    return hasRole(['Tecnica'])
  }

  const canAccessProyectos = (): boolean => {
    return hasRole(['Directora', 'Administrador'])
  }

  const canAccessCapacitaciones = (): boolean => {
    return hasRole(['Directora', 'Administrador'])
  }

  const canAccessBeneficiarias = (): boolean => {
    return hasRole(['Directora', 'Administrador', 'Tecnica'])
  }

  const canAccessDashboard = (): boolean => {
    return hasRole(['Directora', 'Administrador', 'Tecnica'])
  }

  return {
    user,
    hasRole,
    isDirectora,
    isAdministrador,
    isTecnica,
    canAccessProyectos,
    canAccessCapacitaciones,
    canAccessBeneficiarias,
    canAccessDashboard,
  }
}
