const userRepository = require('../repositories/userRepository.js');
const bcrypt = require("bcrypt");
const userService = require("../services/userService.js");
const jwt = require("jsonwebtoken");
const logger = require("../log/logger.js");
const {blockedFor, byIp, byIpAndUsername, byUsername} = require("../middleware/rateLimiter");
const {getToken} = require("../middleware/cookieJwtAuth");


const tryObject = {
    1: 10 * 1000,
    2: 60 * 1000,
    3: 5 * 60 * 1000,
    4: 15 * 60 * 1000,
}

const nextAttemptAt = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of nextAttemptAt.entries()) {
        if (now >= timestamp) {
            nextAttemptAt.delete(key);
        } else {
            nextAttemptAt.set(key, timestamp);
        }
    }
}, 60 * 1000); // Check every minute

const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuvKX8h1J5vQ3nF7yZ9mR2sT6wL4pC1dOe'

const ALARM_IP_ATTEMPTS = 5;

async function login(request, response) {
    try {
        if (getToken(request)) {
            return response.status(400).json({error: "Already logged in"})
        }
        if (!request.body || !request.body.username || !request.body.password ||
            typeof request.body.username !== 'string' ||
            typeof request.body.password !== 'string') {
            return response.status(400).json({error: "Invalid request"})
        }

        const username = request.body.username.trim().toLowerCase()
        const password = request.body.password

        const validUsername = userService.validateUsername(username);
        if (!validUsername) {
            return response.status(400).json({
                error: "Username must be 3-30 characters long and can only contain letters, numbers, and underscores",
                param: "username"});
        }

        const ipKey = request.ip;
        const ipUserKey = `${ipKey}_${username}`;

        const waits = await Promise.all([
            blockedFor(byIp, ipKey),
            blockedFor(byIpAndUsername, ipUserKey),
            blockedFor(byUsername, username)
        ]);

        const delays = Math.ceil(((nextAttemptAt.get(ipUserKey) || 0) - Date.now()) / 1000);
        const waitTime = Math.max(...waits, delays);

        if (waitTime > 0) {
            return response.status(429).json({error: `Too many failed login attempts. Please try again in ${waitTime} seconds.`});
        }

        try {
            await Promise.all([
                byIp.consume(ipKey),
                byIpAndUsername.consume(ipUserKey),
                byUsername.consume(username)
            ]);
        } catch (rateLimiterRes) {
            if (rateLimiterRes.consumedPoints >= ALARM_IP_ATTEMPTS) {
                return logger.error(`ALARM: ${ALARM_IP_ATTEMPTS} failed login attempts from IP: ${ipKey}. Consider investigating for potential brute-force attacks.`);
            }
            return response.status(429).json({error: "Too many failed login attempts. Please try again later."});
        }
        const resPairs = await byIpAndUsername.get(ipUserKey);
        const failedAttempts = resPairs ? resPairs.consumedPoints : 0;
        const delay = tryObject[Math.min(failedAttempts, 4)];
        nextAttemptAt.set(ipUserKey, Date.now() + delay);
        const user = await userRepository.getUserByUsername(username)
        const pass = user ? user.password : DUMMY_HASH;
        const isMatch = await bcrypt.compare(password, pass)
        if (!user || !isMatch) {
            if (failedAttempts < ALARM_IP_ATTEMPTS) {
                logger.warn(`Failed login attempt for username: ${username} from IP: ${request.ip}. Failed attempts: ${resPairs ? resPairs.consumedPoints : 0}`);
            }

            const [resIp, resUsername] = await Promise.all([
                byIp.get(ipKey),
                byUsername.get(username)
            ]);
            if (resIp && resIp.consumedPoints >= ALARM_IP_ATTEMPTS) {
                logger.error(`ALARM: ${ALARM_IP_ATTEMPTS} failed login attempts from IP: ${ipKey}. Consider investigating for potential brute-force attacks.`);
            }
            if (resUsername && resUsername.consumedPoints >= ALARM_IP_ATTEMPTS) {
                logger.error(`ALARM: ${ALARM_IP_ATTEMPTS} failed login attempts for username: ${username}. Consider investigating for potential brute-force attacks.`);
            }

            response.set('Retry-After', Math.ceil(delay / 1000));
            return response.status(401).json({error: "Invalid username or password", retryAfter: delay / 1000});
        }
        logger.info(`Login attempt successful for username: ${username} from IP: ${ipKey}.`);
        nextAttemptAt.delete(ipUserKey);
        await Promise.all([
            byIp.delete(ipKey),
            byIpAndUsername.reward(ipUserKey, 1),
            byUsername.reward(username, 1)
        ]);
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