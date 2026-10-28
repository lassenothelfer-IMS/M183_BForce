const jwt = require('jsonwebtoken');

function getToken(request) {
    const cookies = request?.headers?.cookie;
    if (!cookies) return null;
    const match = cookies.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith('token='));
    return match ? match.slice('token='.length) : undefined;
}

function cookieJwtAuth(request, response, next) {
    const token = getToken(request)
    try {
        if (!token) {
            return response.status(401).json({ error: 'Currently not logged in' });
        }
        request.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        next();
    } catch (err) {
        response.clearCookie('token', token);
        console.error('Error during JWT verification:', err);
        response.status(400).json({ error: 'Invalid token.' });
    }
}

module.exports = cookieJwtAuth;
module.exports.getToken = getToken;