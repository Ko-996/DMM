const jwt = require("jsonwebtoken")
const { executeStoredProcedure } = require("../config/database")

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user details from database
    const userResult = await executeStoredProcedure("obtener_usuario_byid", [decoded.id])

    if (!userResult || userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no válido",
      })
    }

    req.user = userResult[0]
    next()
  } catch (error) {
    console.error("Error verifying token:", error)
    return res.status(401).json({
      success: false,
      message: "Token no válido",
    })
  }
}

// Middleware to check if user is Directora (full access)
const requireDirectora = (req, res, next) => {
  if (req.user.rol !== "Directora") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requiere rol de Directora",
    })
  }
  next()
}

// Middleware to check if user can modify projects/capacitaciones
const canModifyProjects = (req, res, next) => {
  if (req.user.rol !== "Directora") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Solo la Directora puede crear, editar o eliminar proyectos y capacitaciones",
    })
  }
  next()
}

module.exports = {
  verifyToken,
  requireDirectora,
  canModifyProjects,
}
