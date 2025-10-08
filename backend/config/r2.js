const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Verificar que las variables de entorno estén configuradas
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME || !process.env.R2_ENDPOINT) {
  //console.error('❌ Error: Variables de entorno de R2 no configuradas correctamente');
  //console.error('Variables requeridas: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT');
}

// Validar que el endpoint no incluya el nombre del bucket
const endpoint = process.env.R2_ENDPOINT;
if (endpoint && endpoint.includes('/')) {
  //console.warn('⚠️  Advertencia: El endpoint parece incluir el nombre del bucket. Debería ser solo: https://ACCOUNT_ID.r2.cloudflarestorage.com');
  //console.warn('Endpoint actual:', endpoint);
}

// Configurar cliente de R2 con configuración optimizada para Cloudflare
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Sube una imagen a R2
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} contentType - Tipo MIME del archivo
 * @returns {Promise<string>} - URL del archivo subido
 */
const uploadToR2 = async (fileBuffer, fileName, contentType) => {
  try {
    /*console.log('🚀 Iniciando subida a R2...');
    console.log('📁 Archivo:', fileName);
    console.log('📏 Tamaño:', fileBuffer.length, 'bytes');
    console.log('🎯 Bucket:', BUCKET_NAME);
    console.log('🌐 Endpoint:', process.env.R2_ENDPOINT);*/
    
    const key = `dpi/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    //console.log('📤 Enviando comando a R2...');
    const result = await r2Client.send(command);
    //console.log('✅ Archivo subido exitosamente a R2');
    //console.log('🔑 Key generada:', key);
    
    // Retornar la key del archivo
    return key;
  } catch (error) {
    //console.error('❌ Error uploading to R2:', error);
    /*console.error('🔍 Error details:', {
      code: error.code,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });*/
    
    // Re-lanzar el error con más contexto
    throw new Error(`Error al subir archivo a R2: ${error.message}`);
  }
};

/**
 * Obtiene una URL firmada temporal para acceder a un archivo
 * @param {string} key - Key del archivo en R2
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns {Promise<string>} - URL firmada
 */
const getSignedUrlFromR2 = async (key, expiresIn = 32400) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de R2
 * @param {string} key - Key del archivo a eliminar
 */
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw error;
  }
};

/**
 * Prueba la conectividad con R2
 */
const testR2Connection = async () => {
  try {
    /*console.log('🔍 Probando conectividad con R2...');
    console.log('🌐 Endpoint:', process.env.R2_ENDPOINT);
    console.log('🎯 Bucket:', BUCKET_NAME);*/
    
    // Intentar listar objetos del bucket (operación simple)
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    
    await r2Client.send(command);
    //console.log('✅ Conexión con R2 exitosa');
    return true;
  } catch (error) {
    //console.error('❌ Error de conectividad con R2:', error);
    /*console.error('🔍 Detalles del error:', {
      code: error.code,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode
    });*/
    return false;
  }
};

module.exports = {
  uploadToR2,
  getSignedUrlFromR2,
  deleteFromR2,
  testR2Connection,
};