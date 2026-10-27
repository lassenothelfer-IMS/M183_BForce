const mysql = require('mysql2');

let pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

console.log(`Connecting to MySQL database at ${process.env.DB_HOST}:${process.env.DB_PORT}...`);

pool.getConnection(function (err, connection) {
    if (err) {
        console.error('Error connecting to MySQL database:', err)
        return
    }
    console.log('Connected to MySQL database')
})

module.exports = pool