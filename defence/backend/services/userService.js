const userRepository = require('../repositories/userRepository');
const {registerLimiter} = require("../middleware/rateLimiter");
const logger = require("../log/logger");

async function getAllUsers(request, response) {
    try {
        const limit = parseInt(request.query.limit, 10) || 15;
        const offset = (parseInt(request.query.page, 10) - 1) * limit || 0;
        const users = await userRepository.getAllUsers(limit, offset);
        return response.status(200).json(users);
    } catch (error) {
        console.error('Error during user retrieval:', error);
        response.status(500).json({error: 'Failed to retrieve users'});
    }
}

async function createUser(request, response) {
    try {
        const ipKey = request.ip;
        try {
            await registerLimiter.consume(ipKey);
        } catch (error) {
            logger.warn(`Too many registration attempts from IP: ${ipKey}. Blocked for 1 hour.`);
            console.error(error);
            return response.status(429).json({error: 'Too many registration attempts. Please try again later.'});
        }
        const errors = await validateUser(request.body, response);
        if (errors.length > 0) {
            return response.status(400).json({errors: errors});
        }
        const username = request.body.username.trim().toLowerCase()
        const email = request.body.email.trim().toLowerCase()
        const password = request.body.password

        let conflicts = [];

        const [emailExists, usernameExists] = await Promise.all([
            userRepository.getUserByEmail(email),
            userRepository.getUserByUsername(username)
        ]);

        if (usernameExists) conflicts.push({error: "Username already taken", param: "username"})
        if (emailExists)  conflicts.push({error: "Email already registered", param: "email"})
        if (conflicts.length > 0) {
            return response.status(422).json({errors: conflicts});
        }
        try {
            await userRepository.createUser({username, email, password});
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                return response.status(409).json({error: "Username or email already exists"});
            } throw error;
        }
        logger.info(`User registration successful for username: ${username} from IP: ${ipKey}.`);
        return response.status(201).json({message: "User created successfully"});
    } catch (error) {
        console.error('Error during user creation:', error);
        response.status(500).json({error: 'Failed to create user'});
    }
}

function validatePassword(password) {
    if (password.length < 8) return {error: "Password must be at least 8 characters long", param: "password"};
    if (password.length > 64) return {error: "Password must be no more than 64 characters long", param: "password"};
    if (!/[A-Z]/.test(password)) return {
        error: "Password must contain at least one uppercase letter",
        param: "password"
    };
    if (!/[a-z]/.test(password)) return {
        error: "Password must contain at least one lowercase letter",
        param: "password"
    };
    if (!/[0-9]/.test(password)) return {error: "Password must contain at least one digit", param: "password"};
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return {
        error: "Password must contain at least one special character",
        param: "password"
    };
    return null;
}

function validateEmail(email) {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

function validateUsername(username) {
    let regex = /^[a-zA-Z0-9_]{3,30}$/;
    return regex.test(username.trim());
}

async function validateUser(body) {
    if (!body || typeof body !== "object") {
        return [{error: "Invalid request", param: "body"}];
    }
    const {username, email, password} = body;
    let errors = [];

    for (const [key, value] of Object.entries({username, email, password})) {
        if (!value || value === "") {
            errors.push({error: `${key} is required`, param: key});
        } else if (typeof value !== "string") {
            errors.push({error: `${key} must be a string`, param: key});
        }
    }

    if (errors.length) return errors

    if (!validateUsername(username)) {
        errors.push({
            error: "Username must be 3-30 characters long and can only contain letters, numbers, and underscores",
            param: "username"
        });
    }

    if (!validateEmail(email)) {
        errors.push({error: "Invalid email format", param: "email"});
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        errors.push(passwordError);
    }
    return errors
}

module.exports = {
    getAllUsers,
    createUser,
    validateUsername
}