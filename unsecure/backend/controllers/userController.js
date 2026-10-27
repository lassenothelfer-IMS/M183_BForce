const express = require('express')
const userService = require("../services/userService");
const router = express.Router()
module.exports = router;

router.get('/api/user', async (request, response) => {
    await userService.getAllUsers(request, response);
})