const express = require('express')
const userService = require("../services/userService");
const autorizeRole = require("../middleware/autorizeRole");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");
const router = express.Router()
module.exports = router;

router.get('/api/user', cookieJwtAuth, autorizeRole('admin'), async (request, response) => {
    await userService.getAllUsers(request, response);
})