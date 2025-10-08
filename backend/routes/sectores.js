const express = require("express")
const { executeStoredProcedure } = require("../config/database")
const { verifyToken } = require("../middleware/auth")

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

// Get all sectores
router.get("/", async (req, res) => {
  try {
    const sectores = await executeStoredProcedure("obtener_sectores")

    res.json({
      success: true,
      data: sectores,
    })
  } catch (error) {
    console.error("Error getting sectores:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener sectores",
    })
  }
})

// Get beneficiarios by sector
router.get("/beneficiarios", async (req, res) => {
  try {
    const beneficiariosPorSector = await executeStoredProcedure("obtener_beneficiarios_por_sector")

    res.json({
      success: true,
      data: beneficiariosPorSector,
    })
  } catch (error) {
    console.error("Error getting beneficiarios por sector:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarios por sector",
    })
  }
})

module.exports = router
