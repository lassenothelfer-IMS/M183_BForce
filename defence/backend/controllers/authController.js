const express = require('express')
const authService = require("../services/authService");
const router = express.Router()
module.exports = router;


router.post('/api/auth/login', async (request, response) => {
    await authService.login(request, response)
})

router.post('/api/auth/register', async (request, response) => {
    await authService.register(request, response)
})

router.post('/api/auth/logout', async (request, response) => {
    await authService.logout(request, response)
})