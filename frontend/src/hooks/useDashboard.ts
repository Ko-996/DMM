"use client"

import { useState, useEffect } from 'react'
import { apiClient, DashboardStats, isAuthenticated } from '@/lib/api'
import { toast } from 'sonner'

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBeneficiariasActivas: 0,
    totalBeneficiariasInactivas: 0,
    totalProyectosCompletados: 0,
    totalProyectosEnProceso: 0,
    totalCapacitacionesCompletadas: 0,
    totalCapacitacionesEnProceso: 0,
    totalSectores: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [sectorDistribution, setSectorDistribution] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSectorDistribution = async () => {
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar dashboard')
      toast.error('Debes estar autenticado para acceder a esta página')
      setSectorDistribution([])
      setLoading(false)
      return
    }
    try {
      //console.log('Obteniendo distribución por sectores...')
      
      // Usar apiClient en lugar de fetch directo
      const response = await apiClient.getSectorDistribution()
      
      //console.log('Respuesta de distribución por sectores:', response)
      
      if (response.success && response.data) {
        //console.log('Distribución por sectores recibida:', response.data)
        setSectorDistribution(response.data)
      } else {
        //console.log('Error en distribución por sectores:', response.message)
        setSectorDistribution([])
      }
    } catch (error) {
      console.error('Error fetching sector distribution:', error)
      setSectorDistribution([])
    }
  }

  const fetchRecentActivity = async () => {
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar dashboard')
      toast.error('Debes estar autenticado para acceder a esta página')
      setRecentActivity([])
      setLoading(false)
      return
    }
    try {
      //console.log('Obteniendo actividad reciente...')
      
      // Usar apiClient en lugar de fetch directo
      const response = await apiClient.getRecentActivity()
      
      //console.log('Respuesta de actividad reciente:', response)
      
      if (response.success && response.data) {
        //console.log('Actividad reciente recibida:', response.data)
        setRecentActivity(response.data)
      } else {
        //console.log('Error en actividad reciente:', response.message)
        setRecentActivity([])
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      setRecentActivity([])
    }
  }

  const fetchDashboardStats = async () => {
    if (!isAuthenticated()) {
      //console.log('Usuario no autenticado, no se pueden cargar dashboard')
      toast.error('Debes estar autenticado para acceder a esta página')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      //console.log('Obteniendo estadísticas del dashboard...')
      
      // Usar apiClient en lugar de fetch directo
      const response = await apiClient.getDashboardStats()
      
      //console.log('Respuesta del dashboard:', response)
      
      if (response.success && response.data) {
        //console.log('Estadísticas recibidas:', response.data)
        
        const mappedStats = {
          totalBeneficiariasActivas: response.data.totalBeneficiariasActivas || 0,
          totalBeneficiariasInactivas: response.data.totalBeneficiariasInactivas || 0,
          totalProyectosCompletados: response.data.totalProyectosCompletados || 0,
          totalProyectosEnProceso: response.data.totalProyectosEnProceso || 0,
          totalCapacitacionesCompletadas: response.data.totalCapacitacionesCompletadas || 0,
          totalCapacitacionesEnProceso: response.data.totalCapacitacionesEnProceso || 0,
          totalSectores: response.data.totalSectores || 0,
        }
        
        //console.log('Estadísticas mapeadas:', mappedStats)
        setStats(mappedStats)
      } else {
        //console.log('Error en la respuesta:', response.message)
        setError(response.message || 'Error al cargar estadísticas')
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivity(),
        fetchSectorDistribution()
      ])
    }
    loadDashboardData()
  }, [])

  return {
    stats,
    recentActivity,
    sectorDistribution,
    loading,
    error,
    refetch: () => {
      fetchDashboardStats()
      fetchRecentActivity()
      fetchSectorDistribution()
    },
  }
}