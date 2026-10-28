const mysql = require('mysql2');

let pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

pool.getConnection(function (err) {
    if (err) {
        console.error('Error connecting to MySQL database:', err)
        return
    }
    console.log('Connected to MySQL database')
})

module.exports = pool