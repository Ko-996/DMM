"use client"

import { useState, useEffect } from 'react'
import { apiClient, Proyecto, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

export function useProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProyectos = async () => {
    // Solo hacer la llamada si estamos autenticados
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar proyectos')
      toast.error('Debes estar autenticado para acceder a esta página')
      setProyectos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getProyectos()
      
      if (response.success && response.data) {
        setProyectos(response.data)
      } else {
        setError(response.message || 'Error al cargar proyectos')
      }
    } catch (error) {
      console.error('Error fetching proyectos:', error)
      setError('Error al cargar proyectos')
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }

  const createProyecto = async (data: Partial<Proyecto>): Promise<{ success: boolean; id?: number; message?: string }> => {
    try {
      //console.log('🚀 useProyectos: Creando proyecto con datos:', data)
      const response = await apiClient.createProyecto(data)
      //console.log('📥 useProyectos: Respuesta del API:', response)
      
      if (response.success) {
        // Obtener el ID del proyecto recién creado
        const proyectoId = response.data?.id_proyecto || (response.data as any)?.id
        //console.log('🆔 useProyectos: ID de proyecto creado:', proyectoId)
        
        if (proyectoId) {
          await fetchProyectos() // Refresh the list
          return { success: true, id: proyectoId }
        } else {
          console.error(' useProyectos: No se pudo obtener el ID del proyecto')
          return { success: false, message: 'No se pudo obtener el ID del proyecto creado' }
        }
      } else {
        console.error(' useProyectos: Error en la respuesta:', response.message)
        return { success: false, message: response.message || 'Error al crear proyecto' }
      }
    } catch (error) {
      console.error(' useProyectos: Error creating proyecto:', error)
      return { success: false, message: 'Error de conexión al crear proyecto' }
    }
  }

  const updateProyecto = async (id: number, data: Partial<Proyecto>): Promise<boolean> => {
    try {
      const response = await apiClient.updateProyecto(id, data)
      
      if (response.success) {
        //toast.success('Proyecto actualizado exitosamente')
        await fetchProyectos() // Refresh the list
        return true
      } else {
        toast.error(response.message || 'Error al actualizar proyecto')
        return false
      }
    } catch (error) {
      console.error('Error updating proyecto:', error)
      toast.error('Error al actualizar proyecto')
      return false
    }
  }

  const deleteProyecto = async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.deleteProyecto(id)
      
      if (response.success) {
        //toast.success('Proyecto eliminado exitosamente')
        await fetchProyectos() // Refresh the list
        return true
      } else {
        toast.error(response.message || 'Error al eliminar proyecto')
        return false
      }
    } catch (error) {
      console.error('Error deleting proyecto:', error)
      toast.error('Error al eliminar proyecto')
      return false
    }
  }

  const getProyecto = async (id: number): Promise<Proyecto | null> => {
    try {
      const response = await apiClient.getProyecto(id)
      
      if (response.success && response.data) {
        return response.data
      } else {
        toast.error(response.message || 'Error al obtener proyecto')
        return null
      }
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      toast.error('Error al obtener proyecto')
      return null
    }
  }

  const asignarBeneficiariosProyecto = async (proyectoId: number, beneficiariosIds: number[]): Promise<boolean> => {
    try {
      //console.log('👥 useProyectos: Asignando beneficiarios al proyecto:', proyectoId, beneficiariosIds)
      
      // Asignar cada beneficiaria individualmente
      for (const beneficiarioId of beneficiariosIds) {
        //console.log(`🔗 useProyectos: Asignando beneficiario ${beneficiarioId} al proyecto ${proyectoId}`)
        const response = await apiClient.asignarBeneficiarioProyecto(proyectoId, beneficiarioId)
        
        if (!response.success) {
          console.error(` useProyectos: Error al asignar beneficiario ${beneficiarioId}:`, response.message)
          toast.error(`Error al asignar beneficiaria ${beneficiarioId}: ${response.message}`)
          return false
        } else {
          //console.log(`✅ useProyectos: Beneficiario ${beneficiarioId} asignado exitosamente`)
        }
      }
      
      //console.log('✅ useProyectos: Todos los beneficiarios asignados exitosamente')
      return true
    } catch (error) {
      console.error(' useProyectos: Error al asignar beneficiarias:', error)
      toast.error('Error al asignar beneficiarias')
      return false
    }
  }

  const asignarSectoresProyecto = async (proyectoId: number, sectoresIds: number[]): Promise<boolean> => {
    try {
      //console.log('🏢 useProyectos: Asignando sectores al proyecto:', proyectoId, sectoresIds)
      
      // Asignar cada sector individualmente
      for (const sectorId of sectoresIds) {
        //console.log(`🔗 useProyectos: Asignando sector ${sectorId} al proyecto ${proyectoId}`)
        const response = await apiClient.asignarSectorProyecto(proyectoId, sectorId)
        
        if (!response.success) {
          console.error(` useProyectos: Error al asignar sector ${sectorId}:`, response.message)
          toast.error(`Error al asignar sector ${sectorId}: ${response.message}`)
          return false
        } else {
          //console.log(`✅ useProyectos: Sector ${sectorId} asignado exitosamente`)
        }
      }
      
      //console.log('✅ useProyectos: Todos los sectores asignados exitosamente')
      return true
    } catch (error) {
      console.error(' useProyectos: Error al asignar sectores:', error)
      toast.error('Error al asignar sectores')
      return false
    }
  }

  const removerBeneficiariosProyecto = async (proyectoId: number, beneficiariosIds: number[]): Promise<boolean> => {
    try {
      // Remover cada beneficiaria individualmente
      for (const beneficiarioId of beneficiariosIds) {
        const response = await apiClient.removerBeneficiarioProyecto(proyectoId, beneficiarioId)
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

  const removerSectoresProyecto = async (proyectoId: number, sectoresIds: number[]): Promise<boolean> => {
    try {
      // Remover cada sector individualmente
      for (const sectorId of sectoresIds) {
        const response = await apiClient.removerSectorProyecto(proyectoId, sectorId)
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

  const getProyectoBeneficiariosDetalle = async (id: number) => {
    try {
      const response = await apiClient.getProyectoBeneficiariosDetalle(id)
      return response
    } catch (error) {
      return { success: false, data: [], message: 'Error al obtener beneficiarios del proyecto' }
    }
  }

  const getProyectoSectores = async (id: number) => {
    try {
      const response = await apiClient.getProyectoSectores(id)
      return response
    } catch (error) {
      return { success: false, data: [], message: 'Error al obtener sectores del proyecto' }
    }
  }

  const getCantidadBeneficiariasProyecto = async (id: number) => {
    try {
      const response = await apiClient.getCantidadBeneficiariasProyecto(id)
      return response
    } catch (error) {
      return { success: false, data: {cantidad: 0}, message: 'Error al obtener cantidad de beneficiarias' }
    }
  }

  useEffect(() => {
    fetchProyectos()
  }, [])

  return {
    proyectos,
    loading,
    error,
    fetchProyectos,
    createProyecto,
    updateProyecto,
    deleteProyecto,
    getProyecto,
    asignarBeneficiariosProyecto,
    asignarSectoresProyecto,
    removerBeneficiariosProyecto,
    removerSectoresProyecto,
    getProyectoBeneficiariosDetalle,
    getProyectoSectores,
    getCantidadBeneficiariasProyecto,
  }
}