const jwt = require('jsonwebtoken');
require('dotenv').config();

function getToken(request) {
    const cookies = request?.headers?.cookie;
    if (!cookies) return undefined;
    const match = cookies.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('token='));
    return match ? match.slice('token='.length) : undefined;
}

function cookieJwtAuth(request, response, next) {
    const token = getToken(request)
    try {
        if (!token) {
            return response.status(401).json({ error: 'Currently not logged in' });
        }
        request.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        response.clearCookie('token', token);
        response.status(401).json({ error: 'Invalid token.' });
    }
}

module.exports = cookieJwtAuth;
module.exports.getToken = getToken;