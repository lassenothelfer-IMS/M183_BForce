const autorizeRole = (requiredRole) => {
    return (request, response, next) => {
        if (request.user.role !== requiredRole) {
            return response.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

module.exports = autorizeRole;