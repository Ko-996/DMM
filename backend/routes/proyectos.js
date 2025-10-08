const express = require("express")
const { executeStoredProcedure } = require("../config/database")
const { verifyToken, canModifyProjects } = require("../middleware/auth")

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

// Get all proyectos
router.get("/", async (req, res) => {
  try {
    const proyectos = await executeStoredProcedure("obtener_proyectos")

    res.json({
      success: true,
      data: proyectos,
    })
  } catch (error) {
    console.error("Error getting proyectos:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener proyectos",
    })
  }
})

// Get proyecto by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const proyecto = await executeStoredProcedure("obtener_proyecto_byid", [id])

    if (!proyecto || proyecto.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado",
      })
    }

    res.json({
      success: true,
      data: proyecto[0],
    })
  } catch (error) {
    console.error("Error getting proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener proyecto",
    })
  }
})

// Create new proyecto (only Directora)
router.post("/", canModifyProjects, async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      tipo_proyecto,
      fecha_inicio,
      fecha_fin,
      planteamiento_problema,
      objetivos_generales,
      objetivos_especificos,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      observaciones,
    } = req.body

    await executeStoredProcedure("crear_proyecto", [
      nombre,
      descripcion,
      tipo_proyecto,
      fecha_inicio,
      fecha_fin,
      planteamiento_problema,
      objetivos_generales,
      objetivos_especificos,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      observaciones,
    ])

    // Obtener el ID del proyecto recién creado consultando la última entrada
    let proyectoId = null
    try {
      const todosProyectos = await executeStoredProcedure("obtener_proyectos")
      if (todosProyectos && todosProyectos.length > 0) {
        // Ordenar por ID descendente y tomar la primera
        const proyectosOrdenados = todosProyectos.sort((a, b) => b.id_proyecto - a.id_proyecto)
        proyectoId = proyectosOrdenados[0].id_proyecto
        //console.log('🆔 Backend: ID del proyecto creado:', proyectoId)
      }
    } catch (error2) {
      console.error('Error obteniendo proyectos:', error2)
    }

    res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      data: { 
        id_proyecto: proyectoId,
        //id: proyectoId  // También incluir 'id' para compatibilidad
      }
    })
  } catch (error) {
    console.error("Error creating proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear proyecto",
    })
  }
})

// Update proyecto (only Directora)
router.put("/:id", canModifyProjects, async (req, res) => {
  try {
    const { id } = req.params
    const {
      nombre,
      descripcion,
      tipo_proyecto,
      fecha_inicio,
      fecha_fin,
      planteamiento_problema,
      objetivos_generales,
      objetivos_especificos,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      observaciones,
      estado,
    } = req.body

    await executeStoredProcedure("actualizar_proyecto", [
      id,
      nombre,
      descripcion,
      tipo_proyecto,
      fecha_inicio,
      fecha_fin,
      planteamiento_problema,
      objetivos_generales,
      objetivos_especificos,
      alcance,
      poblacion_meta,
      recursos_materiales,
      recursos_economicos,
      observaciones,
      estado,
    ])

    res.json({
      success: true,
      message: "Proyecto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al actualizar proyecto",
    })
  }
})

// Delete proyecto (only Directora)
router.delete("/:id", canModifyProjects, async (req, res) => {
  try {
    const { id } = req.params

    await executeStoredProcedure("eliminar_proyecto", [id])

    res.json({
      success: true,
      message: "Proyecto eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error deleting proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar proyecto",
    })
  }
})

// Change proyecto status
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    await executeStoredProcedure("cambiar_estado_proyecto", [id, estado])

    res.json({
      success: true,
      message: "Estado de proyecto actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error changing proyecto status:", error)
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de proyecto",
    })
  }
})

// Get beneficiarios of a proyecto
router.get("/:id/beneficiarios", async (req, res) => {
  try {
    const { id } = req.params
    const beneficiarios = await executeStoredProcedure("obtener_beneficiarios_proyecto", [id])

    res.json({
      success: true,
      data: beneficiarios,
    })
  } catch (error) {
    console.error("Error getting proyecto beneficiarios:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarios del proyecto",
    })
  }
})

// Assign beneficiario to proyecto
router.post("/:id/beneficiarios/:beneficiarioId", canModifyProjects, async (req, res) => {
  try {
    const { id, beneficiarioId } = req.params

    await executeStoredProcedure("asignar_beneficiario_proyecto", [id, beneficiarioId])

    res.json({
      success: true,
      message: "Beneficiario asignado al proyecto exitosamente",
    })
  } catch (error) {
    console.error("Error assigning beneficiario to proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al asignar beneficiario al proyecto",
    })
  }
})

// Remove beneficiario from proyecto
router.delete("/:id/beneficiarios/:beneficiarioId", canModifyProjects, async (req, res) => {
  try {
    const { id, beneficiarioId } = req.params

    await executeStoredProcedure("remover_beneficiario_proyecto", [id, beneficiarioId])

    res.json({
      success: true,
      message: "Beneficiario removido del proyecto exitosamente",
    })
  } catch (error) {
    console.error("Error removing beneficiario from proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al remover beneficiario del proyecto",
    })
  }
})

// Get sectores of a proyecto
router.get("/:id/sectores", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo sectores para proyecto ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_sectores_proyecto_byid')
    
    const sectores = await executeStoredProcedure("obtener_sectores_proyecto_byid", [id])
    //console.log('📊 Backend: Resultado de sectores:', sectores)

    res.json({
      success: true,
      data: sectores,
    })
  } catch (error) {
    console.error(" Backend: Error getting proyecto sectores:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener sectores del proyecto",
      error: error.message
    })
  }
})

// Get beneficiarios of a proyecto with detailed info
router.get("/:id/beneficiarios-detalle", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo beneficiarios detalle para proyecto ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_beneficiario_proyecto_byid')
    
    const beneficiarios = await executeStoredProcedure("obtener_beneficiario_proyecto_byid", [id])
    //console.log('📊 Backend: Resultado de beneficiarios detalle:', beneficiarios)

    res.json({
      success: true,
      data: beneficiarios,
    })
  } catch (error) {
    console.error(" Backend: Error getting proyecto beneficiarios detalle:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarios detalle del proyecto",
      error: error.message
    })
  }
})

// Get cantidad de beneficiarios de un proyecto
router.get("/:id/beneficiarios/cantidad", async (req, res) => {
  try {
    const { id } = req.params
    //console.log('🎯 Backend: Obteniendo cantidad de beneficiarios para proyecto ID:', id)
    //console.log('🔧 Backend: Llamando stored procedure: obtener_cantidad_beneficiarios_proyectos')
    
    const resultado = await executeStoredProcedure("obtener_cantidad_beneficiarios_proyectos", [id])
    //console.log('📊 Backend: Resultado de cantidad beneficiarios:', resultado)

    const cantidad = resultado[0]?.cantidad_beneficiarios || 0

    res.json({
      success: true,
      data: {
        cantidad: cantidad
      },
    })
  } catch (error) {
    console.error(" Backend: Error getting cantidad beneficiarios proyecto:", error)
    console.error(" Backend: Error details:", error.message)
    res.status(500).json({
      success: false,
      message: "Error al obtener cantidad de beneficiarios del proyecto",
      error: error.message
    })
  }
})

// Assign sector to proyecto
router.post("/:id/sectores/:sectorId", canModifyProjects, async (req, res) => {
  try {
    const { id, sectorId } = req.params

    await executeStoredProcedure("asignar_sector_proyecto", [id, sectorId])

    res.json({
      success: true,
      message: "Sector asignado al proyecto exitosamente",
    })
  } catch (error) {
    console.error("Error assigning sector to proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al asignar sector al proyecto",
    })
  }
})

// Remove sector from proyecto
router.delete("/:id/sectores/:sectorId", canModifyProjects, async (req, res) => {
  try {
    const { id, sectorId } = req.params

    await executeStoredProcedure("remover_sector_proyecto", [id, sectorId])

    res.json({
      success: true,
      message: "Sector removido del proyecto exitosamente",
    })
  } catch (error) {
    console.error("Error removing sector from proyecto:", error)
    res.status(500).json({
      success: false,
      message: "Error al remover sector del proyecto",
    })
  }
})

module.exports = router
