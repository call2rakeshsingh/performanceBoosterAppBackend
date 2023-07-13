require('dotenv').config()
require("../db/conn")
const jwt = require('jsonwebtoken')
const express = require('express')
const mongoose = require('mongoose')
const bcryptjs = require("bcryptjs")
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT || 7000
const app = express()

// const allowedOrigins = ['http://localhost:3000','http://192.168.1.106:3000'];
const allowedOrigins = ['https://userperformancebooster.netlify.app/'];

app.use(cors({
    origin: function(origin, callback) {
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            console.log("cors error for this url")
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));



app.use(cookieParser())
app.use(express.json())
app.use(require("../router/auth"))

app.listen(PORT, () => {
    console.log(`Server is listening at ${PORT}`)
})

