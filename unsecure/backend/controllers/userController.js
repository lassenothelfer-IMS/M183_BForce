const express = require('express')
const userService = require("../services/userService");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");
const autorizeRole = require("../middleware/autorizeRole");
const router = express.Router()
module.exports = router;

router.get('/api/user', cookieJwtAuth, autorizeRole('admin'), async (request, response) => {
    await userService.getAllUsers(request, response);
})