const { RateLimiterMemory } = require('rate-limiter-flexible');

const byIpAndUsername = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15,
    blockDuration: 60 * 15,
    keyPrefix: 'ip_username', // Prefix for the key
});

const byIp = new RateLimiterMemory({
    points: 10,
    duration: 60 * 60,
    blockDuration: 60 * 60,
    keyPrefix: 'ip', // Prefix for the key
});

const byUsername = new RateLimiterMemory({
    points: 5,
    duration: 60 * 60,
    blockDuration: 60 * 60,
    keyPrefix: 'username', // Prefix for the key
});

async function blockedFor(limiter, key) {
    const res = await limiter.get(key);
    return res && res.remainingPoints <= 0 ? Math.ceil(res.msBeforeNext / 1000) : 0
}

const registerLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 60,
    blockDuration: 60 * 60,
    message: {error: 'Too many registration attempts. Please try again later.'},
    keyPrefix: 'register', // Prefix for the key
});

module.exports = {
    byIpAndUsername,
    byIp,
    byUsername,
    registerLimiter,
    blockedFor
}

