"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderOpen, TrendingUp, Calendar, MapPin } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DashboardPage() {
  const { stats, recentActivity, sectorDistribution, loading } = useDashboard()

  const statsConfig = [
    {
      title: "Beneficiarias Activas",
      value: (stats.totalBeneficiariasActivas || 0).toLocaleString(),
      description: "En el sistema",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Beneficiarias Inactivas",
      value: (stats.totalBeneficiariasInactivas || 0).toString(),
      description: "En el sistema",
      icon: Users,
      color: "text-red-600",
    },
    {
      title: "Proyectos Completados",
      value: (stats.totalProyectosCompletados || 0).toString(),
      description: "Completados",
      icon: FolderOpen,
      color: "text-green-600",
    },
    {
      title: "Proyectos en Proceso",
      value: (stats.totalProyectosEnProceso || 0).toString(),
      description: "En desarrollo",
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Capacitaciones Completadas",
      value: (stats.totalCapacitacionesCompletadas || 0).toString(),
      description: "Completadas",
      icon: Calendar,
      color: "text-green-600",
    },
    
    {
      title: "Capacitaciones en Proceso",
      value: (stats.totalCapacitacionesEnProceso || 0).toString(),
      description: "En desarrollo",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha'
    try {
      return new Date(dateString).toLocaleDateString('es-GT')
    } catch {
      return dateString
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
      case 'en proceso':
        return <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">En Proceso</span>
      case 'completado':
        return <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completado</span>
      case 'suspendido':
        return <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Suspendido</span>
      default:
        return <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{estado || 'Sin estado'}</span>
    }
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const getTotalBeneficiarios = () => {
    return sectorDistribution.reduce((total, sector) => total + (sector.total_beneficiarios || 0), 0)
  }

  if (loading) {
      return (
        <ProtectedRoute>
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando dashboard...</p>
            </div>
          </main>
        </ProtectedRoute>
      )
    }

  return (
    <ProtectedRoute allowedRoles={["Directora", "Administrador", "Tecnica"]}>
      <div className="min-h-screen">
        <Navbar />

      <main className="w-11/12 mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600"></p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsConfig.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        

        {/* Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos proyectos y capacitaciones registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando actividad reciente...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item, index) => (
                    <div key={`${item.tipo}-${item.id}-${index}`} className="p-3 bg-gray-50 rounded-lg">
                      {/* Primera línea: Título y Estado */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <p className="font-medium text-sm sm:text-base break-words">{item.nombre}</p>
                        {getEstadoBadge(item.estado)}
                      </div>
                      
                      {/* Segunda línea: Tipo de proyecto y fecha */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.tipo === 'proyecto' ? 'bg-orange-100 w-fit text-orange-800' : 'bg-purple-100 w-fit text-purple-800'
                        }`}>
                          {item.tipo === 'proyecto' ? 'Proyecto' : 'Capacitación'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>Inicio: {formatDate(item.fecha)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Sectores</CardTitle>
              <CardDescription>Beneficiarias activas por sector</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando distribución por sectores...</p>
                </div>
              ) : sectorDistribution.length > 0 ? (
                <div className="space-y-4">
                  {sectorDistribution.map((sector, index) => {
                    const totalBeneficiarios = getTotalBeneficiarios()
                    const porcentaje = calculatePercentage(sector.total_beneficiarios || 0, totalBeneficiarios)
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{sector.sector}</span>
                          <span className="text-gray-600">
                            {sector.total_beneficiarios || 0} beneficiarias ({porcentaje}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                  
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No hay datos de sectores disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
    </ProtectedRoute>
  )
}
