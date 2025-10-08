const express = require("express")
const { executeStoredProcedure } = require("../config/database")
const { verifyToken, canModifyProjects } = require("../middleware/auth")

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

// Get all capacitaciones
router.get("/", async (req, res) => {
  try {
    const capacitaciones = await executeStoredProcedure("obtener_capacitaciones")

    res.json({
      success: true,
      data: capacitaciones,
    })
  } catch (error) {
    console.error("Error getting capacitaciones:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener capacitaciones",
    })
  }
})

// Get capacitacion by ID
router.get("/:id", async (req, res) => {
  try {
    //console.log(`🔍 Getting capacitacion with ID: ${req.params.id}`)
    const { id } = req.params
    //console.log(`📊 About to call stored procedure obtener_capacitacion_byid with ID: ${id}`)
    
    const capacitacion = await executeStoredProcedure("obtener_capacitacion_byid", [id])
    //console.log(`✅ Stored procedure executed successfully. Result:`, capacitacion)

    if (!capacitacion || capacitacion.length === 0) {
      //console.log(`❌ No capacitacion found with ID: ${id}`)
      return res.status(404).json({
        success: false,
        message: "Capacitación no encontrada",
      })
    }

    //console.log(`📤 Sending response for capacitacion ID: ${id}`)
    res.json({
      success: true,
      data: capacitacion[0],
    })
    //console.log(`✅ Response sent successfully for capacitacion ID: ${id}`)
  } catch (error) {
    console.error("❌ Error getting capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener capacitación",
    })
  }
})

// Create new capacitacion (only Directora)
router.post("/", canModifyProjects, async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      tipo_capacitacion,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      fecha_inicio,
      fecha_fin,
      observaciones,
    } = req.body

    await executeStoredProcedure("crear_capacitacion", [
      nombre,
      descripcion,
      tipo_capacitacion,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      fecha_inicio,
      fecha_fin,
      observaciones,
    ])

    // Obtener el ID de la capacitación recién creada consultando la última capacitación
    let capacitacionId = null

      try {
        const todasCapacitaciones = await executeStoredProcedure("obtener_capacitaciones")
        if (todasCapacitaciones && todasCapacitaciones.length > 0) {
          // Ordenar por ID descendente y tomar la primera
          const capacitacionesOrdenadas = todasCapacitaciones.sort((a, b) => b.id_capacitacion - a.id_capacitacion)
          capacitacionId = capacitacionesOrdenadas[0].id_capacitacion
        }
      } catch (error2) {
        console.error('Error obteniendo capacitaciones:', error2)
      }
    


    res.status(201).json({
      success: true,
      message: "Capacitación creada exitosamente",
      data: { id: capacitacionId }
    })
  } catch (error) {
    console.error("Error creating capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear capacitación",
    })
  }
})

// Update capacitacion (only Directora)
router.put("/:id", canModifyProjects, async (req, res) => {
  try {
    const { id } = req.params
    const {
      nombre,
      descripcion,
      tipo_capacitacion,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      fecha_inicio,
      fecha_fin,
      observaciones,
      estado,
    } = req.body

    await executeStoredProcedure("actualizar_capacitacion", [
      id,
      nombre,
      descripcion,
      tipo_capacitacion,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      fecha_inicio,
      fecha_fin,
      observaciones,
      estado,
    ])

    res.json({
      success: true,
      message: "Capacitación actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error updating capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar capacitación",
    })
  }
})

// Delete capacitacion (only Directora)
router.delete("/:id", canModifyProjects, async (req, res) => {
  try {
    const { id } = req.params

    await executeStoredProcedure("eliminar_capacitacion", [id])

    res.json({
      success: true,
      message: "Capacitación eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error deleting capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar capacitación",
    })
  }
})

// Change capacitacion status
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    await executeStoredProcedure("cambiar_estado_capacitacion", [id, estado])

    res.json({
      success: true,
      message: "Estado de capacitación actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error changing capacitacion status:", error)
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de capacitación",
    })
  }
})

// Get sectores of a capacitacion
router.get("/:id/sectores", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo sectores para capacitación ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_sectores_capacitacion_byid')
    
    const sectores = await executeStoredProcedure("obtener_sectores_capacitacion_byid", [id])
    //console.log('📊 Backend: Resultado de sectores:', sectores)

    res.json({
      success: true,
      data: sectores,
    })
  } catch (error) {
    console.error(" Backend: Error getting capacitacion sectores:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener sectores de la capacitación",
      error: error.message
    })
  }
})

// Get beneficiarios of a capacitacion
router.get("/:id/beneficiarios", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo beneficiarios para capacitación ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_beneficiarios_capacitacion')
    
    const beneficiarios = await executeStoredProcedure("obtener_beneficiarios_capacitacion", [id])
    //console.log('📊 Backend: Resultado de beneficiarios:', beneficiarios)

    res.json({
      success: true,
      data: beneficiarios,
    })
  } catch (error) {
    console.error(" Backend: Error getting capacitacion beneficiarios:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarios de la capacitación",
      error: error.message
    })
  }
})

// Get beneficiarios of a capacitacion with detailed info
router.get("/:id/beneficiarios-detalle", async (req, res) => {
  try {
    const { id } = req.params
    const beneficiarios = await executeStoredProcedure("obtener_beneficiario_capacitacion_byid", [id])

    res.json({
      success: true,
      data: beneficiarios,
    })
  } catch (error) {
    console.error("Error getting capacitacion beneficiarios detalle:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarios detalle de la capacitación",
    })
  }
})

// Get cantidad de beneficiarios de una capacitacion
router.get("/:id/beneficiarios/cantidad", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo cantidad de beneficiarios para capacitación ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_cantidad_beneficiarios_capacitacion')
    
    const resultado = await executeStoredProcedure("obtener_cantidad_beneficiarios_capacitacion", [id])
    //console.log('📊 Backend: Resultado de cantidad beneficiarios:', resultado)

    const cantidad = resultado[0]?.cantidad_beneficiarios || 0

    res.json({
      success: true,
      data: {
        cantidad: cantidad
      },
    })
  } catch (error) {
    console.error(" Backend: Error getting cantidad beneficiarios capacitacion:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener cantidad de beneficiarios de la capacitación",
      error: error.message
    })
  }
})

// Assign beneficiario to capacitacion
router.post("/:id/beneficiarios/:beneficiarioId", canModifyProjects, async (req, res) => {
  try {
    const { id, beneficiarioId } = req.params

    await executeStoredProcedure("asignar_beneficiario_capacitacion", [id, beneficiarioId])

    res.json({
      success: true,
      message: "Beneficiario asignado a la capacitación exitosamente",
    })
  } catch (error) {
    console.error("Error assigning beneficiario to capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al asignar beneficiario a la capacitación",
    })
  }
})

// Remove beneficiario from capacitacion
router.delete("/:id/beneficiarios/:beneficiarioId", canModifyProjects, async (req, res) => {
  try {
    const { id, beneficiarioId } = req.params

    await executeStoredProcedure("remover_beneficiario_capacitacion", [id, beneficiarioId])

    res.json({
      success: true,
      message: "Beneficiario removido de la capacitación exitosamente",
    })
  } catch (error) {
    console.error("Error removing beneficiario from capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al remover beneficiario de la capacitación",
    })
  }
})

// Assign sector to capacitacion
router.post("/:id/sectores/:sectorId", canModifyProjects, async (req, res) => {
  try {
    const { id, sectorId } = req.params

    await executeStoredProcedure("asignar_sector_capacitacion", [id, sectorId])

    res.json({
      success: true,
      message: "Sector asignado a la capacitación exitosamente",
    })
  } catch (error) {
    console.error("Error assigning sector to capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al asignar sector a la capacitación",
    })
  }
})

// Remove sector from capacitacion
router.delete("/:id/sectores/:sectorId", canModifyProjects, async (req, res) => {
  try {
    const { id, sectorId } = req.params

    await executeStoredProcedure("remover_sector_capacitacion", [id, sectorId])

    res.json({
      success: true,
      message: "Sector removido de la capacitación exitosamente",
    })
  } catch (error) {
    console.error("Error removing sector from capacitacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al remover sector de la capacitación",
    })
  }
})

module.exports = router
