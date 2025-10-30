const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const { sequelize } = require("./config/database")
const { testR2Connection } = require("./config/r2")
const authRoutes = require("./routes/auth")
const beneficiariasRoutes = require("./routes/beneficiarias")
const proyectosRoutes = require("./routes/proyectos")
const capacitacionesRoutes = require("./routes/capacitaciones")
const sectoresRoutes = require("./routes/sectores")
const dashboardRoutes = require("./routes/dashboard")

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// Rate limiting 
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP 
  message: {
    success: false,
    message: "Demasiadas solicitudes, intenta de nuevo en un momento"
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin 
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || process.env.FRONTEND_URL2 || "http://localhost:3000",
      //"http://localhost:3000",
      //"http://127.0.0.1:3000"
    ]
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      //console.log('CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions))

// Handle preflight requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Max-Age', '86400') // 24 hours
    return res.status(200).end()
  }
  next()
})

// CORS debugging middleware
app.use((req, res, next) => {
  next()
})

// Body parsing middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(cookieParser())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/beneficiarias", beneficiariasRoutes)
app.use("/api/proyectos", proyectosRoutes)
app.use("/api/capacitaciones", capacitacionesRoutes)
app.use("/api/sectores", sectoresRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "DMM API is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint no encontrado",
  })
})

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log("✅ Conexión a la base de datos establecida correctamente")

    // Probar conectividad con R2
    //console.log("🔍 Verificando conectividad con Cloudflare R2...")
    const r2Connected = await testR2Connection()
    if (!r2Connected) {
      console.warn("  Advertencia: No se pudo conectar con R2. Las funciones de subida de imágenes no estarán disponibles.")
    }

    app.listen(PORT, () => {
      //console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
      //console.log(`📊 API disponible en http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error)
    process.exit(1)
  }
}

startServer()
