const express = require("express")
const { executeStoredProcedure } = require("../config/database")
const { verifyToken } = require("../middleware/auth")
const { uploadToR2, getSignedUrlFromR2, deleteFromR2 } = require("../config/r2");
const upload = require("../middleware/upload");

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

// Get all beneficiarias
router.get("/", async (req, res) => {
  try {
    const beneficiarias = await executeStoredProcedure("obtener_beneficiarios")

    // Generar URLs firmadas para las imágenes DPI
    const beneficiariasConUrls = await Promise.all(
      beneficiarias.map(async (beneficiaria) => {
        let dpiFrenteUrl = null;
        let dpiReversoUrl = null;

        if (beneficiaria.dpi_frente) {
          try {
            dpiFrenteUrl = await getSignedUrlFromR2(beneficiaria.dpi_frente, 32400);
          } catch (error) {
            console.error('Error getting signed URL for dpi_frente:', error);
          }
        }

        if (beneficiaria.dpi_reverso) {
          try {
            dpiReversoUrl = await getSignedUrlFromR2(beneficiaria.dpi_reverso, 32400);
          } catch (error) {
            console.error('Error getting signed URL for dpi_reverso:', error);
          }
        }

        return {
          ...beneficiaria,
          dpi_frente_url: dpiFrenteUrl,
          dpi_reverso_url: dpiReversoUrl,
        };
      })
    );

    res.json({
      success: true,
      data: beneficiariasConUrls,
    })
  } catch (error) {
    console.error("Error getting beneficiarias:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarias",
    })
  }
})

// Get beneficiaria by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const beneficiaria = await executeStoredProcedure("obtener_beneficiario_byid", [id])

    if (!beneficiaria || beneficiaria.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Beneficiaria no encontrada",
      })
    }

    const beneficiariaData = beneficiaria[0];

    // Generar URLs firmadas para las imágenes
    if (beneficiariaData.dpi_frente) {
      try {
        beneficiariaData.dpi_frente_url = await getSignedUrlFromR2(beneficiariaData.dpi_frente, 32400);
      } catch (error) {
        console.error('Error getting signed URL for dpi_frente:', error);
      }
    }

    if (beneficiariaData.dpi_reverso) {
      try {
        beneficiariaData.dpi_reverso_url = await getSignedUrlFromR2(beneficiariaData.dpi_reverso, 32400);
      } catch (error) {
        console.error('Error getting signed URL for dpi_reverso:', error);
      }
    }


    res.json({
      success: true,
      data: beneficiariaData,
    })
  } catch (error) {
    console.error("Error getting beneficiaria:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiaria",
    })
  }
})

// Create new beneficiaria with image uploads
router.post("/", upload.fields([
  { name: 'dpi_frente', maxCount: 1 },
  { name: 'dpi_reverso', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      id_sector,
      nombre,
      dpi,
      fecha_nacimiento,
      edad,
      direccion,
      telefono,
      correo,
      habitantes_domicilio,
      inmuebles,
    } = req.body;

    let dpiFrenteKey = '';
    let dpiReversoKey = '';

    // Subir imagen del frente del DPI si existe
    if (req.files && req.files.dpi_frente && req.files.dpi_frente[0]) {
      const file = req.files.dpi_frente[0];
      dpiFrenteKey = await uploadToR2(
        file.buffer,
        `${dpi}-frente-${file.originalname}`,
        file.mimetype
      );
    }

    // Subir imagen del reverso del DPI si existe
    if (req.files && req.files.dpi_reverso && req.files.dpi_reverso[0]) {
      const file = req.files.dpi_reverso[0];
      dpiReversoKey = await uploadToR2(
        file.buffer,
        `${dpi}-reverso-${file.originalname}`,
        file.mimetype
      );
    }

    // Log de las keys generadas
    //console.log('🔑 Keys generadas para la beneficiaria:');
    //console.log('📷 DPI Frente Key:', dpiFrenteKey);
    //console.log('📷 DPI Reverso Key:', dpiReversoKey);
    /*console.log('📋 Datos a insertar:', {
      id_sector,
      nombre,
      dpi,
      dpiFrenteKey,
      dpiReversoKey,
      fecha_nacimiento,
      edad,
      direccion,
      telefono,
      correo: correo || '',
      habitantes_domicilio,
      inmuebles: inmuebles || '',
    });*/

    // Crear beneficiaria en la base de datos
    await executeStoredProcedure("crear_beneficiario", [
      id_sector,
      nombre,
      dpi,
      dpiFrenteKey,
      dpiReversoKey,
      fecha_nacimiento,
      edad,
      direccion,
      telefono,
      correo || '',
      habitantes_domicilio,
      inmuebles || '',
    ]);

    res.status(201).json({
      success: true,
      message: "Beneficiaria creada exitosamente",
    });
  } catch (error) {
    console.error('Error al crear beneficiaria:', error);
    
    // Manejar error de DPI duplicado
    if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
      const dpiMatch = error.sqlMessage?.match(/Duplicate entry '(\d+)'/);
      const dpi = dpiMatch ? dpiMatch[1] : 'el DPI ingresado';
      
      return res.status(409).json({
        success: false,
        error: 'DPI_DUPLICADO',
        message: `El DPI ${dpi} ya está registrado en el sistema. Por favor, verifica el número.`,
        field: 'dpi'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDACION',
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al crear beneficiaria. Intente nuevamente.'
    });
  }
});

// Update beneficiaria with optional image uploads
router.put("/:id", upload.fields([
  { name: 'dpi_frente', maxCount: 1 },
  { name: 'dpi_reverso', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_sector,
      nombre,
      dpi,
      fecha_nacimiento,
      edad,
      direccion,
      telefono,
      correo,
      habitantes_domicilio,
      inmuebles,
      estado,
      dpi_frente_existente,
      dpi_reverso_existente,
    } = req.body;

    //console.log('🔄 Iniciando actualización de beneficiaria ID:', id);
    /*console.log('📋 Datos recibidos:', {
      id_sector,
      nombre,
      dpi,
      dpi_frente_existente,
      dpi_reverso_existente,
      estado
    });*/
    //console.log('📁 Archivos recibidos:', req.files ? Object.keys(req.files) : 'No hay archivos');

    let dpiFrenteKey = dpi_frente_existente || '';
    let dpiReversoKey = dpi_reverso_existente || '';

    // Si hay una nueva imagen del frente, eliminar la anterior y subir la nueva
    if (req.files && req.files.dpi_frente && req.files.dpi_frente[0]) {
      //console.log('📷 Actualizando imagen DPI frente...');
      if (dpi_frente_existente) {
        try {
          //console.log('🗑️ Eliminando imagen anterior:', dpi_frente_existente);
          await deleteFromR2(dpi_frente_existente);
        } catch (error) {
          console.error('Error deleting old dpi_frente:', error);
        }
      }
      
      const file = req.files.dpi_frente[0];
      //console.log('📤 Subiendo nueva imagen frente:', file.originalname);
      dpiFrenteKey = await uploadToR2(
        file.buffer,
        `${dpi}-frente-${file.originalname}`,
        file.mimetype
      );
      //console.log('✅ Nueva key DPI frente:', dpiFrenteKey);
    }

    // Si hay una nueva imagen del reverso, eliminar la anterior y subir la nueva
    if (req.files && req.files.dpi_reverso && req.files.dpi_reverso[0]) {
      //console.log('📷 Actualizando imagen DPI reverso...');
      if (dpi_reverso_existente) {
        try {
          //console.log('🗑️ Eliminando imagen anterior:', dpi_reverso_existente);
          await deleteFromR2(dpi_reverso_existente);
        } catch (error) {
          console.error('Error deleting old dpi_reverso:', error);
        }
      }
      
      const file = req.files.dpi_reverso[0];
      //console.log('📤 Subiendo nueva imagen reverso:', file.originalname);
      dpiReversoKey = await uploadToR2(
        file.buffer,
        `${dpi}-reverso-${file.originalname}`,
        file.mimetype
      );
      //console.log('✅ Nueva key DPI reverso:', dpiReversoKey);
    }

    /*console.log('🔑 Keys finales para actualizar:', {
      dpiFrenteKey,
      dpiReversoKey
    });*/

    // Actualizar beneficiaria en la base de datos
    await executeStoredProcedure("actualizar_beneficiario", [
      id,
      id_sector,
      nombre,
      dpi,
      dpiFrenteKey,
      dpiReversoKey,
      fecha_nacimiento,
      edad,
      direccion,
      telefono,
      correo || '',
      habitantes_domicilio,
      inmuebles || '',
      estado,
    ]);

    res.json({
      success: true,
      message: "Beneficiaria actualizada exitosamente",
    });
  } catch (error) {
    console.error('Error al crear beneficiaria:', error);
    
    // Manejar error de DPI duplicado
    if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
      const dpiMatch = error.sqlMessage?.match(/Duplicate entry '(\d+)'/);
      const dpi = dpiMatch ? dpiMatch[1] : 'el DPI ingresado';
      
      return res.status(409).json({
        success: false,
        error: 'DPI_DUPLICADO',
        message: `El DPI ${dpi} ya está registrado en el sistema. Por favor, verifica el número.`,
        field: 'dpi'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDACION',
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al crear beneficiaria. Intente nuevamente.'
    });
  }
});

// Delete beneficiaria
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos de la beneficiaria para eliminar imágenes
    const beneficiaria = await executeStoredProcedure("obtener_beneficiario_byid", [id]);
    
    if (beneficiaria && beneficiaria.length > 0) {
      const { dpi_frente, dpi_reverso } = beneficiaria[0];
      
      // Eliminar imágenes de R2
      if (dpi_frente) {
        try {
          await deleteFromR2(dpi_frente);
        } catch (error) {
          console.error('Error deleting dpi_frente from R2:', error);
        }
      }
      
      if (dpi_reverso) {
        try {
          await deleteFromR2(dpi_reverso);
        } catch (error) {
          console.error('Error deleting dpi_reverso from R2:', error);
        }
      }
    }

    await executeStoredProcedure("eliminar_beneficiario", [id]);

    res.json({
      success: true,
      message: "Beneficiaria eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting beneficiaria:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar beneficiaria",
    });
  }
});

// Change beneficiaria status
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    await executeStoredProcedure("cambiar_estado_beneficiario", [id, estado])

    res.json({
      success: true,
      message: "Estado de beneficiaria actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error changing beneficiaria status:", error)
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de beneficiaria",
    })
  }
})

// Get recent beneficiarias
router.get("/recientes/lista", async (req, res) => {
  try {
    const beneficiarias = await executeStoredProcedure("obtener_beneficiarios_recientes")

    res.json({
      success: true,
      data: beneficiarias,
    })
  } catch (error) {
    console.error("Error getting recent beneficiarias:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener beneficiarias recientes",
    })
  }
})

// Endpoint proxy para obtener imágenes (evita problemas de CORS)
router.get("/:id/imagen/:tipo", verifyToken, async (req, res) => {
  try {
    const { id, tipo } = req.params
    
    // Validar tipo
    if (tipo !== 'frente' && tipo !== 'reverso') {
      return res.status(400).json({ 
        success: false, 
        message: "Tipo debe ser 'frente' o 'reverso'" 
      })
    }

    // Obtener beneficiaria
    const beneficiaria = await executeStoredProcedure("obtener_beneficiario_byid", [id])
    
    if (!beneficiaria || beneficiaria.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Beneficiaria no encontrada" 
      })
    }

    // Obtener key de la imagen
    const key = tipo === 'frente' 
      ? beneficiaria[0].dpi_frente 
      : beneficiaria[0].dpi_reverso
    
    if (!key) {
      return res.status(404).json({ 
        success: false, 
        message: "Imagen no disponible" 
      })
    }

    // Obtener URL firmada de R2
    const { getSignedUrlFromR2 } = require('../config/r2')
    const signedUrl = await getSignedUrlFromR2(key, 32400)
    
    // Descargar imagen de R2
    const imageResponse = await fetch(signedUrl)
    
    if (!imageResponse.ok) {
      throw new Error('Error al descargar imagen de R2')
    }

    const buffer = await imageResponse.arrayBuffer()
    
    // Enviar imagen al cliente
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(Buffer.from(buffer))
    
  } catch (error) {
    console.error('Error getting image:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener imagen',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router
