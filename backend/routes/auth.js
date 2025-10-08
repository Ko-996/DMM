const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { executeStoredProcedure } = require("../config/database")
const { verifyToken } = require("../middleware/auth")

const router = express.Router()

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body

    if (!usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos",
      })
    }

    // Get user from database using stored procedure
    const userResult = await executeStoredProcedure("obtener_usuario_por_nombre", [usuario])

    if (!userResult || userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    const user = userResult[0]

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id_usuario,
        usuario: user.usuario,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "9h" },
    )

    // Set cookie with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 9 * 60 * 60 * 1000, // 9 hours
    })

    res.json({
      success: true,
      message: "Login exitoso",
      user: {
        id: user.id_usuario,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("token")
  res.json({
    success: true,
    message: "Logout exitoso",
  })
})

// Get current user endpoint
router.get("/me", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id_usuario,
      usuario: req.user.usuario,
      nombre: req.user.nombre,
      rol: req.user.rol,
    },
  })
})

// Get all roles
router.get("/roles", verifyToken, async (req, res) => {
  try {
    const roles = await executeStoredProcedure("obtener_roles")

    res.json({
      success: true,
      data: roles,
    })
  } catch (error) {
    console.error("Error getting roles:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener roles",
    })
  }
})

// Public user registration endpoint (no token required)
router.post("/registro", async (req, res) => {
  try {
    const { id_usuario, id_rol, usuario, contrasena, nombre } = req.body

    // Validate required fields
    if (!id_usuario || !id_rol || !usuario || !contrasena || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos: id_usuario, id_rol, usuario, contrasena, nombre",
      })
    }

    // Validate password strength (minimum 6 characters)
    if (contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      })
    }

    // Validate username format (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(usuario)) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario solo puede contener letras, números y guiones bajos",
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(contrasena, 10)

    // Create user using stored procedure
    await executeStoredProcedure("crear_usuario", [
      id_usuario,
      id_rol,
      usuario,
      hashedPassword,
      nombre,
    ])

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id_usuario,
        usuario,
        nombre,
        id_rol,
      },
    })
  } catch (error) {
    console.error("Error registering user:", error)
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: "El usuario ya existe",
      })
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Create new user endpoint (requires authentication)
router.post("/crear-usuario", verifyToken, async (req, res) => {
  try {
    const { id_usuario, id_rol, usuario, contrasena, nombre } = req.body

    // Validate required fields
    if (!id_usuario || !id_rol || !usuario || !contrasena || !nombre) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos: id_usuario, id_rol, usuario, contrasena, nombre",
      })
    }

    // Validate password strength (minimum 6 characters)
    if (contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(contrasena, 10)

    // Create user using stored procedure
    await executeStoredProcedure("crear_usuario", [
      id_usuario,
      id_rol,
      usuario,
      hashedPassword,
      nombre,
    ])

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      data: {
        id_usuario,
        usuario,
        nombre,
        id_rol,
      },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: "El usuario ya existe",
      })
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router
