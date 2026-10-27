const pool = require('../db/mysql.js');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid")

const saltRounds = 10;

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

async function createUser(body) {
    const {username, email, password} = body
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const date = new Date();
    const id = uuidv4();

    return await pool.promise().query('INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)', [id, email, username, hashedPassword])
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    getUserByEmail,
    createUser
}