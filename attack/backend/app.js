require('dotenv').config();
const express = require('express');
const app = express();
const authController = require('./controllers/authController.js');
const userController = require('./controllers/userController.js');

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
    res.send('Hello World! This is the backend server.');
});

app.use(authController)
app.use(userController)

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});