const userRepository = require('../repositories/userRepository.js');
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const userService = require("../services/userService.js");
const jwt = require("jsonwebtoken");
const {getToken} = require("../../../secure/backend/middleware/cookieJwtAuth");

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvKX8h1J5vQ3nF7yZ9mR2sT6wL4pC1dOe'

async function login(request, response) {
    try {
        if (getToken(request)) {
            return response.status(400).json({error: "Already logged in"})
        }
        if (!request.body || !request.body.username || !request.body.password) {
            return response.status(400).json({error: "Invalid request"})
        }
        const {username, password} = request.body
        const user = await userRepository.getUserByUsername(username)
        const pass = user ? user.password : DUMMY_HASH
        const isMatch = crypto.createHash('SHA256').update(password).digest('hex') === pass
        if (!user || !isMatch) {
            return response.status(401).json({error: "Invalid username or password"})
        }
        const expiresInSeconds = 3600
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET, {expiresIn: expiresInSeconds})

        response.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: expiresInSeconds * 1000,
        })
        return response.status(200).json({message: "Login successful", response: { user: {id: user.id, username: user.username, role: user.role}, expiresIn: expiresInSeconds, accessToken: token }})

    } catch (error) {
        console.error('Error during login:', error)
        response.status(500).json({error: 'Failed to login'})
    }
}

async function register(request, response) {
    try {
        if (getToken(request)) {
            return response.status(400).json({error: "Already logged in"})
        }
        return await userService.createUser(request, response)
    } catch (error) {
        console.error('Error during registration:', error)
        response.status(500).json({error: 'Failed to register'})
    }
}

async function logout(request, response) {
    try {
        response.clearCookie('token')
        return response.status(200).json({message: "Logout successful"})
    } catch (error) {
        console.error('Error during logout:', error)
        response.status(500).json({error: 'Failed to logout'})
    }
}

module.exports = {
    login,
    register,
    logout
}