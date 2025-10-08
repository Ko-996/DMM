// API Configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string 
  user?: T extends User ? T : any
}

export interface User {
  id: number
  usuario: string
  nombre: string
  rol: string
}

export interface Beneficiaria {
  id_beneficiario: number
  nombre: string
  dpi: string
  edad: number
  fecha_nacimiento: string
  direccion: string
  sector: string
  telefono: string
  correo: string
  habitantes_domicilio: number
  inmuebles: string
  estado: 'A' | 'I' | 'activa' | 'inactiva' 
  fechaRegistro?: string
  id_sector: number
  dpi_frente?: string  // Key de R2 (ej: dpi/123-frente.jpg)
  dpi_reverso?: string  // Key de R2 (ej: dpi/123-reverso.jpg)
  dpi_frente_url?: string  // URL firmada temporal generada por el backend
  dpi_reverso_url?: string
}

export interface Proyecto {
  id_proyecto: number
  nombre: string
  descripcion: string
  beneficiarias: number
  fecha_inicio: string
  fecha_fin: string
  estado: string
  sector: string
  presupuesto: string
  tipo_proyecto: string
  planteamiento_problema?: string
  objetivos_generales?: string
  objetivos_especificos?: string
  alcance?: string
  poblacion_meta?: string
  cobertura_proyecto?: string
  recursos_materiales?: string
  recursos_economicos?: string
  observaciones?: string
}

export interface Capacitacion {
  id_capacitacion: number
  nombre: string
  descripcion: string
  beneficiarias?: number
  fecha_inicio: string
  fecha_fin: string
  estado: string
  presupuesto?: string
  tipo_capacitacion: string
  alcance?: string
  poblacion_meta?: string
  recursos_materiales?: string
  recursos_economicos?: string
  observaciones?: string
  id?: number;
}

export interface Sector {
  id_sector: number
  sector: string
  descripcion?: string
}

export interface DashboardStats {
  totalBeneficiariasActivas: number
  totalBeneficiariasInactivas: number
  totalProyectosCompletados: number
  totalProyectosEnProceso: number
  totalCapacitacionesCompletadas: number
  totalCapacitacionesEnProceso: number
  totalSectores: number
}

// API Client class
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      // Verificar si hay un usuario guardado para determinar si estamos autenticados
      const user = localStorage.getItem('user')
      this.token = user ? 'authenticated' : null
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const maxRetries = 2
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors', // Explicitly set CORS mode
    }

    try {
      //console.log(`🌐 Frontend: Making request to ${url} (attempt ${retryCount + 1})`)
      //console.log(`🍪 Frontend: Credentials include: ${config.credentials}`)
      
      const response = await fetch(url, config)
      
      //console.log(`📊 Frontend: Response status: ${response.status}`)
      //console.log(`📊 Frontend: Response headers:`, Object.fromEntries(response.headers.entries()))
      
      // Manejar error 401 globalmente
      if (response.status === 401) {
        //console.log('API Client: Token inválido, limpiando sesión')
        if ((window as any).handleUnauthorized) {
          (window as any).handleUnauthorized()
        }
        //throw new Error('Token de acceso requerido')
        return{
          success: false,
          message: 'Token de acceso requerido',
        }
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Error en la solicitud')
        }

        return data
      } else {
        // Handle non-JSON responses
        const text = await response.text()
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text}`)
        }
        return { success: true, data: text } as ApiResponse<T>
      }
    } catch (error) {
      console.error(` Frontend: Request failed for ${url} (attempt ${retryCount + 1}):`, error)
      
      // Retry logic for network errors or CORS issues
      if (retryCount < maxRetries && (
        error instanceof TypeError || // Network error
        (error instanceof Error && error.message.includes('Failed to fetch')) || // CORS error
        (error instanceof Error && error.message.includes('ERR_FAILED'))
      )) {
        //console.log(`🔄 Frontend: Retrying request in ${(retryCount + 1) * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
        return this.request<T>(endpoint, options, retryCount + 1)
      }
      
      throw error
    }
  }

  // Auth methods
  async login(usuario: string, contrasena: string): Promise<ApiResponse<User>> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, contrasena }),
    })

    //console.log('Respuesta completa del API client:', response)

    // El backend devuelve {success: true, message: 'Login exitoso', user: {...}}
    if (response.success && response.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user))
        this.token = 'authenticated' 
      }
      
      // Retornar la respuesta con la estructura esperada por el hook
      return {
        success: response.success,
        message: response.message,
        error: response.error,
        user: response.user
      }
    }

    return {
      success: response.success,
      message: response.message,
      error: response.error
    }
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })

    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }

    return response
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/me')
  }

  // Beneficiarias methods
  async getBeneficiarias(): Promise<ApiResponse<Beneficiaria[]>> {
    return this.request<Beneficiaria[]>('/beneficiarias')
  }

  async getBeneficiaria(id: number): Promise<ApiResponse<Beneficiaria>> {
    return this.request<Beneficiaria>(`/beneficiarias/${id}`)
  }

  async createBeneficiaria(data: Partial<Beneficiaria>): Promise<ApiResponse<Beneficiaria>> {
    return this.request<Beneficiaria>('/beneficiarias', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createBeneficiariaWithImages(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/beneficiarias`, {
      method: 'POST',
      credentials: 'include',
      // NO incluir Content-Type header
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = 'Error al crear beneficiaria'
    let errorCode = 'ERROR_DESCONOCIDO'
    
    try {
      const errorData = await response.json()
      errorCode = errorData.error || errorCode
      errorMessage = errorData.message || errorMessage
      
      // Lanzar error con código y mensaje
      const error: any = new Error(errorMessage)
      error.code = errorCode
      error.field = errorData.field
      error.status = response.status
      throw error
      
    } catch (e) {
      if (e instanceof Error && 'code' in e) {
        // Re-lanzar el error estructurado
        throw e
      }
      // Si no se pudo parsear el JSON
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
  }

  return response.json()
  }

  async updateBeneficiaria(id: number, data: Partial<Beneficiaria>): Promise<ApiResponse<Beneficiaria>> {
    return this.request<Beneficiaria>(`/beneficiarias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateBeneficiariaWithImages(id: number, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/beneficiarias/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    let errorMessage = 'Error al actualizar beneficiaria'
    let errorCode = 'ERROR_DESCONOCIDO'
    
    try {
      const errorData = await response.json()
      errorCode = errorData.error || errorCode
      errorMessage = errorData.message || errorMessage
      
      // Lanzar error con código y mensaje
      const error: any = new Error(errorMessage)
      error.code = errorCode
      error.field = errorData.field
      error.status = response.status
      throw error
      
    } catch (e) {
      if (e instanceof Error && 'code' in e) {
        // Re-lanzar el error estructurado
        throw e
      }
      // Si no se pudo parsear el JSON
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
  }

  return response.json()
}

  async deleteBeneficiaria(id: number): Promise<ApiResponse> {
    return this.request(`/beneficiarias/${id}`, {
      method: 'DELETE',
    })
  }

  // Proyectos methods
  async getProyectos(): Promise<ApiResponse<Proyecto[]>> {
    return this.request<Proyecto[]>('/proyectos')
  }

  async getProyecto(id: number): Promise<ApiResponse<Proyecto>> {
    return this.request<Proyecto>(`/proyectos/${id}`)
  }

  async createProyecto(data: Partial<Proyecto>): Promise<ApiResponse<Proyecto>> {
    return this.request<Proyecto>('/proyectos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProyecto(id: number, data: Partial<Proyecto>): Promise<ApiResponse<Proyecto>> {
    return this.request<Proyecto>(`/proyectos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProyecto(id: number): Promise<ApiResponse> {
    return this.request(`/proyectos/${id}`, {
      method: 'DELETE',
    })
  }

  // Proyecto-Beneficiarias relations
  async asignarBeneficiarioProyecto(proyectoId: number, beneficiarioId: number): Promise<ApiResponse> {
    return this.request(`/proyectos/${proyectoId}/beneficiarios/${beneficiarioId}`, {
      method: 'POST',
    })
  }

  async removerBeneficiarioProyecto(proyectoId: number, beneficiarioId: number): Promise<ApiResponse> {
    return this.request(`/proyectos/${proyectoId}/beneficiarios/${beneficiarioId}`, {
      method: 'DELETE',
    })
  }

  // Proyecto-Sectores relations
  async asignarSectorProyecto(proyectoId: number, sectorId: number): Promise<ApiResponse> {
    return this.request(`/proyectos/${proyectoId}/sectores/${sectorId}`, {
      method: 'POST',
    })
  }

  async removerSectorProyecto(proyectoId: number, sectorId: number): Promise<ApiResponse> {
    return this.request(`/proyectos/${proyectoId}/sectores/${sectorId}`, {
      method: 'DELETE',
    })
  }

  // Get beneficiarios of a proyecto
  async getProyectoBeneficiarios(id: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/proyectos/${id}/beneficiarios`)
  }

  // Get beneficiarios detalle of a proyecto
  async getProyectoBeneficiariosDetalle(id: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/proyectos/${id}/beneficiarios-detalle`)
  }

  // Get sectores of a proyecto
  async getProyectoSectores(id: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/proyectos/${id}/sectores`)
  }

  // Get cantidad de beneficiarias de un proyecto
  async getCantidadBeneficiariasProyecto(id: number): Promise<ApiResponse<{cantidad: number}>> {
    return this.request<{cantidad: number}>(`/proyectos/${id}/beneficiarios/cantidad`)
  }

  // Capacitaciones methods
  async getCapacitaciones(): Promise<ApiResponse<Capacitacion[]>> {
    return this.request<Capacitacion[]>('/capacitaciones')
  }

  async getCapacitacion(id: number): Promise<ApiResponse<Capacitacion>> {
    return this.request<Capacitacion>(`/capacitaciones/${id}`)
  }

  async createCapacitacion(data: Partial<Capacitacion>): Promise<ApiResponse<Capacitacion>> {
    return this.request<Capacitacion>('/capacitaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCapacitacion(id: number, data: Partial<Capacitacion>): Promise<ApiResponse<Capacitacion>> {
    return this.request<Capacitacion>(`/capacitaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCapacitacion(id: number): Promise<ApiResponse> {
    return this.request(`/capacitaciones/${id}`, {
      method: 'DELETE',
    })
  }

  // Capacitacion-Beneficiarias relations
  async getCapacitacionBeneficiarios(id: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/capacitaciones/${id}/beneficiarios`)
  }

  async asignarBeneficiarioCapacitacion(capacitacionId: number, beneficiarioId: number): Promise<ApiResponse> {
    return this.request(`/capacitaciones/${capacitacionId}/beneficiarios/${beneficiarioId}`, {
      method: 'POST',
    })
  }

  async removerBeneficiarioCapacitacion(capacitacionId: number, beneficiarioId: number): Promise<ApiResponse> {
    return this.request(`/capacitaciones/${capacitacionId}/beneficiarios/${beneficiarioId}`, {
      method: 'DELETE',
    })
  }

  // Capacitacion-Sectores relations
  async asignarSectorCapacitacion(capacitacionId: number, sectorId: number): Promise<ApiResponse> {
    return this.request(`/capacitaciones/${capacitacionId}/sectores/${sectorId}`, {
      method: 'POST',
    })
  }

  async removerSectorCapacitacion(capacitacionId: number, sectorId: number): Promise<ApiResponse> {
    return this.request(`/capacitaciones/${capacitacionId}/sectores/${sectorId}`, {
      method: 'DELETE',
    })
  }

  async getSectoresCapacitacion(capacitacionId: number): Promise<ApiResponse<any[]>> {
    //console.log('🔗 API Client: getSectoresCapacitacion llamado con ID:', capacitacionId)
    //console.log('🌐 API Client: URL:', `/capacitaciones/${capacitacionId}/sectores`)
    return this.request<any[]>(`/capacitaciones/${capacitacionId}/sectores`)
  }

  async getBeneficiariasCapacitacion(capacitacionId: number): Promise<ApiResponse<any[]>> {
    //console.log('🔗 API Client: getBeneficiariasCapacitacion llamado con ID:', capacitacionId)
    //console.log('🌐 API Client: URL:', `/capacitaciones/${capacitacionId}/beneficiarios`)
    return this.request<any[]>(`/capacitaciones/${capacitacionId}/beneficiarios`)
  }

  async getBeneficiariasDetalleCapacitacion(capacitacionId: number): Promise<ApiResponse<any[]>> {
    //console.log('🔗 API Client: getBeneficiariasDetalleCapacitacion llamado con ID:', capacitacionId)
    //console.log('🌐 API Client: URL:', `/capacitaciones/${capacitacionId}/beneficiarios-detalle`)
    return this.request<any[]>(`/capacitaciones/${capacitacionId}/beneficiarios-detalle`)
  }

  async getCantidadBeneficiariasCapacitacion(capacitacionId: number): Promise<ApiResponse<{cantidad: number}>> {
    //console.log('🔗 API Client: getCantidadBeneficiariasCapacitacion llamado con ID:', capacitacionId)
    //console.log('🌐 API Client: URL:', `/capacitaciones/${capacitacionId}/beneficiarios/cantidad`)
    return this.request<{cantidad: number}>(`/capacitaciones/${capacitacionId}/beneficiarios/cantidad`)
  }

  // Sectores methods
  async getSectores(): Promise<ApiResponse<Sector[]>> {
    return this.request<Sector[]>('/sectores')
  }

  async getBeneficiariosPorSector(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/sectores/beneficiarios')
  }

  // Dashboard methods
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/estadisticas')
  }

  async getRecentActivity(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/dashboard/actividad-reciente')
  }

  async getSectorDistribution(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/sectores/beneficiarios')
  }
}

  

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL)

// Utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('user')
}

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const logout = async (): Promise<void> => {
  await apiClient.logout()
}
