"use client"

import { useState, useEffect } from 'react'
import { apiClient, Sector, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

export function useSectores() {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSectores = async () => {
    // Solo hacer la llamada si estamos autenticados
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar sectores')
      setSectores([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      //console.log('Obteniendo sectores de la API...')
      const response = await apiClient.getSectores()
      //console.log('Respuesta de sectores:', response)
      
      if (response.success && response.data) {
        //console.log('Sectores obtenidos:', response.data)
        setSectores(response.data)
      } else {
        //console.log('Error en respuesta de sectores:', response.message)
        setError(response.message || 'Error al cargar sectores')
      }
    } catch (error) {
      console.error('Error fetching sectores:', error)
      setError('Error al cargar sectores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSectores()
  }, [])

  return {
    sectores,
    loading,
    error,
    refetch: fetchSectores,
  }
}
