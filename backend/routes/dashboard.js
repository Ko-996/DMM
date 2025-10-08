const express = require("express")
const { executeStoredProcedure, sequelize } = require("../config/database")
const { verifyToken } = require("../middleware/auth")
const { Sequelize } = require("sequelize")

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

// Get dashboard statistics
router.get("/estadisticas", async (req, res) => {
  try {
    //console.log("Obteniendo estadísticas del dashboard...")
    
    const estadisticas = await executeStoredProcedure("obtener_estadisticas_dashboard")
    //console.log("Estadísticas del stored procedure:", estadisticas)

    // El stored procedure devuelve un array, tomar el primer elemento
    const data = estadisticas[0] || {}
    
    const estadisticasFormateadas = {
      totalBeneficiariasActivas: data.total_beneficiarios_activos || 0,
      totalBeneficiariasInactivas: data.total_beneficiarios_inactivos || 0,
      totalProyectosCompletados: data.total_proyectos_completados || 0,
      totalProyectosEnProceso: data.total_proyectos_en_proceso || 0,
      totalCapacitacionesCompletadas: data.total_capacitaciones_completadas || 0,
      totalCapacitacionesEnProceso: data.total_capacitaciones_en_proceso || 0,
      totalSectores: data.total_sectores || 0,
    }

    //console.log("Estadísticas formateadas:", estadisticasFormateadas)

    res.json({
      success: true,
      data: estadisticasFormateadas,
    })
  } catch (error) {
    console.error("Error getting dashboard statistics:", error)
    // Si hay error, devolver datos por defecto
    res.json({
      success: true,
      data: {
        totalBeneficiariasActivas: 0,
        totalBeneficiariasInactivas: 0,
        totalProyectosCompletados: 0,
        totalProyectosEnProceso: 0,
        totalCapacitacionesCompletadas: 0,
        totalCapacitacionesEnProceso: 0,
        totalSectores: 0,
      },
    })
  }
})

// Get projects by status
router.get("/proyectos-estado", async (req, res) => {
  try {
    const proyectosPorEstado = await executeStoredProcedure("obtener_proyectos_por_estado")

    res.json({
      success: true,
      data: proyectosPorEstado,
    })
  } catch (error) {
    console.error("Error getting projects by status:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener proyectos por estado",
    })
  }
})

// Get capacitaciones by status
router.get("/capacitaciones-estado", async (req, res) => {
  try {
    const capacitacionesPorEstado = await executeStoredProcedure("obtener_capacitaciones_por_estado")

    res.json({
      success: true,
      data: capacitacionesPorEstado,
    })
  } catch (error) {
    console.error("Error getting capacitaciones by status:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener capacitaciones por estado",
    })
  }
})

// Get recent activity
router.get("/actividad-reciente", async (req, res) => {
  try {
    const actividadReciente = await executeStoredProcedure("obtener_actividad_reciente")

    res.json({
      success: true,
      data: actividadReciente,
    })
  } catch (error) {
    console.error("Error getting recent activity:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener actividad reciente",
    })
  }
})

module.exports = router
