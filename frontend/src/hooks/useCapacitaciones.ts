"use client"

import { useState, useEffect } from 'react'
import { apiClient, Capacitacion, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

export function useCapacitaciones() {
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCapacitaciones = async () => {
    // Solo hace la llamada si estamos autenticados
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar capacitaciones')
      toast.error('Debes estar autenticado para acceder a esta página')
      setCapacitaciones([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getCapacitaciones()
      
      if (response.success && response.data) {
        setCapacitaciones(response.data)
      } else {
        setError(response.message || 'Error al cargar capacitaciones')
      }
    } catch (error) {
      console.error('Error fetching capacitaciones:', error)
      setError('Error al cargar capacitaciones')
      toast.error('Error al cargar capacitaciones')
    } finally {
      setLoading(false)
    }
  }

  const createCapacitacion = async (data: Partial<Capacitacion>): Promise<{ success: boolean; id?: number }> => {
    try {
      const response = await apiClient.createCapacitacion(data)
      
      if (response.success) {
        //toast.success('Capacitación creada exitosamente')
        await fetchCapacitaciones() // Refresh the list
        
        // Obtener el ID de la capacitación recién creada
        const capacitacionId = response.data?.id
        //console.log('🆔 ID de capacitación creada:', capacitacionId)
        
        return { success: true, id: capacitacionId }
      } else {
        toast.error(response.message || 'Error al crear capacitación')
        return { success: false }
      }
    } catch (error) {
      toast.error('Error al crear capacitación')
      return { success: false }
    }
  }

  const updateCapacitacion = async (id: number, data: Partial<Capacitacion>): Promise<boolean> => {
    try {
      const response = await apiClient.updateCapacitacion(id, data)
      
      if (response.success) {
        //toast.success('Capacitación actualizada exitosamente')
        await fetchCapacitaciones() // Refresh the list
        return true
      } else {
        toast.error(response.message || 'Error al actualizar capacitación')
        return false
      }
    } catch (error) {
      toast.error('Error al actualizar capacitación')
      return false
    }
  }

  const deleteCapacitacion = async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.deleteCapacitacion(id)
      
      if (response.success) {
        //toast.success('Capacitación eliminada exitosamente')
        await fetchCapacitaciones() // Refresh the list
        return true
      } else {
        //toast.error(response.message || 'Error al eliminar capacitación')
        return false
      }
    } catch (error) {
      //toast.error('Error al eliminar capacitación')
      return false
    }
  }

  const getCapacitacion = async (id: number): Promise<Capacitacion | null> => {
    try {
      const response = await apiClient.getCapacitacion(id)
      
      if (response.success && response.data) {
        return response.data
      } else {
        toast.error(response.message || 'Error al obtener capacitación')
        return null
      }
    } catch (error) {
      toast.error('Error al obtener capacitación')
      return null
    }
  }

  useEffect(() => {
    fetchCapacitaciones()
  }, [])

  const asignarBeneficiariosCapacitacion = async (capacitacionId: number, beneficiariosIds: number[]): Promise<boolean> => {
    try {
      
      // Asignar cada beneficiaria individualmente
      for (const beneficiarioId of beneficiariosIds) {
        const response = await apiClient.asignarBeneficiarioCapacitacion(capacitacionId, beneficiarioId)
        if (!response.success) {
          toast.error(`Error al asignar beneficiaria ${beneficiarioId}`)
          return false
        }
      }
      
      //toast.success(`${beneficiariosIds.length} beneficiarias asignadas exitosamente`)
      return true
    } catch (error) {
      toast.error('Error al asignar beneficiarias')
      return false
    }
  }

  const asignarSectoresCapacitacion = async (capacitacionId: number, sectoresIds: number[]): Promise<boolean> => {
    try {
      
      // Asignar cada sector individualmente
      for (const sectorId of sectoresIds) {
        const response = await apiClient.asignarSectorCapacitacion(capacitacionId, sectorId)
        if (!response.success) {
          toast.error(`Error al asignar sector ${sectorId}`)
          return false
        }
      }
      
      //toast.success(`${sectoresIds.length} sectores asignados exitosamente`)
      return true
    } catch (error) {
      toast.error('Error al asignar sectores')
      return false
    }
  }

  const removerBeneficiariosCapacitacion = async (capacitacionId: number, beneficiariosIds: number[]): Promise<boolean> => {
    try {
      // Remover cada beneficiaria individualmente
      for (const beneficiarioId of beneficiariosIds) {
        const response = await apiClient.removerBeneficiarioCapacitacion(capacitacionId, beneficiarioId)
        if (!response.success) {
          toast.error(`Error al remover beneficiaria ${beneficiarioId}`)
          return false
        }
      }
      
      return true
    } catch (error) {
      toast.error('Error al remover beneficiarias')
      return false
    }
  }

  const removerSectoresCapacitacion = async (capacitacionId: number, sectoresIds: number[]): Promise<boolean> => {
    try {
      // Remover cada sector individualmente
      for (const sectorId of sectoresIds) {
        const response = await apiClient.removerSectorCapacitacion(capacitacionId, sectorId)
        if (!response.success) {
          toast.error(`Error al remover sector ${sectorId}`)
          return false
        }
      }
      
      return true
    } catch (error) {
      toast.error('Error al remover sectores')
      return false
    }
  }

  const getSectoresCapacitacion = async (capacitacionId: number) => {
    try {
      const response = await apiClient.getSectoresCapacitacion(capacitacionId)
      return response
    } catch (error) {
      return { success: false, data: [], message: 'Error al obtener sectores' }
    }
  }

  const getBeneficiariasCapacitacion = async (capacitacionId: number) => {
    try {
      const response = await apiClient.getBeneficiariasCapacitacion(capacitacionId)
      return response
    } catch (error) {
      return { success: false, data: [], message: 'Error al obtener beneficiarias' }
    }
  }

  const getBeneficiariasDetalleCapacitacion = async (capacitacionId: number) => {
    try {
      const response = await apiClient.getBeneficiariasDetalleCapacitacion(capacitacionId)
      return response
    } catch (error) {
      return { success: false, data: [], message: 'Error al obtener beneficiarias detalle' }
    }
  }

  const getCantidadBeneficiariasCapacitacion = async (capacitacionId: number) => {
    try {
      const response = await apiClient.getCantidadBeneficiariasCapacitacion(capacitacionId)
      return response
    } catch (error) {
      return { success: false, data: {cantidad: 0}, message: 'Error al obtener cantidad de beneficiarias' }
    }
  }

  return {
    capacitaciones,
    loading,
    error,
    fetchCapacitaciones,
    createCapacitacion,
    updateCapacitacion,
    deleteCapacitacion,
    getCapacitacion,
    asignarBeneficiariosCapacitacion,
    asignarSectoresCapacitacion,
    removerBeneficiariosCapacitacion,
    removerSectoresCapacitacion,
    getSectoresCapacitacion,
    getBeneficiariasCapacitacion,
    getBeneficiariasDetalleCapacitacion,
    getCantidadBeneficiariasCapacitacion,
  }
}
