const { Sequelize } = require("sequelize")

const sequelize = new Sequelize({
  host: process.env.DB_SERVER,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    //timestamps: true, 
  },
  dialectOptions: {
    charset: "utf8mb4",
  },
})

// Function to execute stored procedures
const executeStoredProcedure = async (procedureName, params = []) => {
  try {
    const paramPlaceholders = params.length > 0 ? params.map(() => "?").join(", ") : ""
    const query = `CALL ${procedureName}(${paramPlaceholders})`

    const results = await sequelize.query(query, {
      replacements: params,
      type: Sequelize.QueryTypes.RAW,
    })

    // Handle different result structures from stored procedures
    if (Array.isArray(results) && results.length > 0) {
      // If results is an array of arrays, return the first array
      if (Array.isArray(results[0])) {
        return results[0]
      }
      // If results is a single array, return it
      return results
    }
    
    // For procedures that don't return data (like INSERT, UPDATE, DELETE)
    return results
  } catch (error) {
    console.error(`Error executing stored procedure ${procedureName}:`, error)
    throw error
  }
}

module.exports = {
  sequelize,
  executeStoredProcedure,
}
