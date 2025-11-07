"use client"

import { useState, useEffect } from 'react'
import { apiClient, Beneficiaria, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

// Interfaces para las imágenes
interface BeneficiariaImages {
  dpi_frente?: File | null
  dpi_reverso?: File | null
}

interface ExistingImages {
  dpi_frente?: string
  dpi_reverso?: string
}

export function useBeneficiarias() {
  const [beneficiarias, setBeneficiarias] = useState<Beneficiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBeneficiarias = async () => {
    // Solo hacer la llamada si estamos autenticados
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar beneficiarias')
      toast.error('Debes estar autenticado para acceder a esta página')
      setBeneficiarias([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getBeneficiarias()
      
      if (response.success && response.data) {
        setBeneficiarias(response.data)
      } else {
        setError(response.message || 'Error al cargar beneficiarias')
      }
    } catch (error) {
      setError('Error al cargar beneficiarias')
      toast.error('Error al cargar beneficiarias')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Crear beneficiaria con imágenes
   * @param data - Datos de la beneficiaria (sin imágenes)
   * @param images - Archivos de imagen (opcional)
   */

  const createBeneficiaria = async (data: Partial<Beneficiaria>, 
    images?: BeneficiariaImages): Promise<boolean> => {
    try {
      // Crear FormData para enviar datos + archivos
      const formData = new FormData()
      
      // Agregar todos los datos de texto
      Object.keys(data).forEach(key => {
        const value = data[key as keyof Beneficiaria]
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      
      // Agregar imágenes si existen
      if (images?.dpi_frente) {
        formData.append('dpi_frente', images.dpi_frente)
      }
      
      if (images?.dpi_reverso) {
        formData.append('dpi_reverso', images.dpi_reverso)
      }
      
      // Llamar a la API con FormData
      const response = await apiClient.createBeneficiariaWithImages(formData)
      
      if (response.success) {
      //toast.success('Beneficiaria creada exitosamente')
      await fetchBeneficiarias()
      return true
    } else {
      toast.error(response.message || 'Error al crear beneficiaria')
      return false
    }
  } catch (error: any) {
    console.error('Error creating beneficiaria:', error)
    
    // Manejar errores específicos
    if (error.code === 'DPI_DUPLICADO') {
      toast.error('El DPI ingresado ya existe en el sistema'
      )
    } else if (error.code === 'VALIDACION') {
      toast.error(error.message)
    } else {
      toast.error(error.message || 'Error al crear beneficiaria')
    }
    
    return false
  }
  }

    /**
   * Actualizar beneficiaria con imágenes opcionales
   * @param id - ID de la beneficiaria
   * @param data - Datos actualizados
   * @param images - Nuevas imágenes (opcional)
   * @param existingImages - Keys de imágenes existentes en R2 (opcional)
   */

  const updateBeneficiaria = async (
    id: number, 
    data: Partial<Beneficiaria>,
    images?: BeneficiariaImages,
    existingImages?: ExistingImages
  ): Promise<boolean> => {
    try {
      const formData = new FormData()
      
      // Agregar datos de texto
      Object.keys(data).forEach(key => {
        const value = data[key as keyof Beneficiaria]
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      
      // Agregar keys de imágenes existentes (para que el backend sepa cuáles son)
      if (existingImages?.dpi_frente) {
        formData.append('dpi_frente_existente', existingImages.dpi_frente)
      }
      
      if (existingImages?.dpi_reverso) {
        formData.append('dpi_reverso_existente', existingImages.dpi_reverso)
      }
      
      // Agregar nuevas imágenes si se proporcionan
      if (images?.dpi_frente) {
        formData.append('dpi_frente', images.dpi_frente)
      }
      
      if (images?.dpi_reverso) {
        formData.append('dpi_reverso', images.dpi_reverso)
      }
      
      const response = await apiClient.updateBeneficiariaWithImages(id, formData)
      
      if (response.success) {
      //toast.success('Beneficiaria actualizada exitosamente')
      await fetchBeneficiarias()
      return true
    } else {
      toast.error(response.message || 'Error al actualizar beneficiaria')
      return false
    }
  } catch (error: any) {
    //console.error('Error updating beneficiaria:', error)
    
    // Manejar errores específicos
    if (error.code === 'DPI_DUPLICADO') {
      toast.error( 'El DPI ingresado ya existe en el sistema'
      )
    } else if (error.code === 'VALIDACION') {
      toast.error(error.message)
    } else {
      toast.error(error.message || 'Error al actualizar beneficiaria')
    }
    
    return false
  }
  }

  const deleteBeneficiaria = async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.deleteBeneficiaria(id)
      
      if (response.success) {
        toast.success('Beneficiaria eliminada exitosamente')
        await fetchBeneficiarias() 
        return true
      } else {
        toast.error(response.message || 'Error al eliminar beneficiaria')
        return false
      }
    } catch (error) {
      console.error('Error deleting beneficiaria:', error)
      toast.error('Error al eliminar beneficiaria')
      return false
    }
  }

  const getBeneficiaria = async (id: number): Promise<Beneficiaria | null> => {
    try {
      const response = await apiClient.getBeneficiaria(id)
      
      if (response.success && response.data) {
        return response.data
      } else {
        toast.error(response.message || 'Error al obtener beneficiaria')
        return null
      }
    } catch (error) {
      console.error('Error fetching beneficiaria:', error)
      toast.error('Error al obtener beneficiaria')
      return null
    }
  }

  useEffect(() => {
    fetchBeneficiarias()
  }, [])

  return {
    beneficiarias,
    loading,
    error,
    fetchBeneficiarias,
    createBeneficiaria,
    updateBeneficiaria,
    deleteBeneficiaria,
    getBeneficiaria,
  }
}
