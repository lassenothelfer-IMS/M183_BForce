const pool = require('../db/mysql.js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid")

async function getAllUsers(limit, offset) {
    const [response] = await pool.promise().query('SELECT * FROM users limit ? OFFSET ?', [limit, offset])
    return response
}

async function getUserByUsername(username) {
    const [response] = await pool.promise().query('SELECT * FROM users WHERE username = ?', [username])
    return response[0]
}

async function getUserByEmail(email) {
    const [response] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email])
    return response[0]
}

const defaultUserRole = 'user';
async function createUser(body) {
    const {username, email, password} = body
    const hashedPassword = await bcrypt.hash(password)
    const id = uuidv4();

    return await pool.promise().query('INSERT INTO users (id, email, username, password, role) VALUES (?, ?, ?, ?, ?)', [id, email, username, hashedPassword, defaultUserRole])
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    getUserByEmail,
    createUser
}