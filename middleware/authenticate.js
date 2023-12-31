const jwt = require('jsonwebtoken')
const EmpRegData = require('../model/empRegModel')
const express = require('express')
const app = express()
require('dotenv').config()

const authenticate = async (req, res, next) => {
    console.log(`This cookie is set ${req.signedCookies}`)
    // console.log(req)
    // await console.log(`Error in authenicate`) 
    try {
        const token = await req.cookies.jwtoken;
        // console.log(token)
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY)
        // console.log(verifyToken)

        const rootUser = await EmpRegData.findOne({_id: verifyToken._id, "tokens.token": token});

        if(!rootUser){
            throw new Error("Due to invalid token user can not register")
        }
        req.token = token;
        req.rootUser = rootUser;
        userName = rootUser.userName;
        branchName = rootUser.branchName;
        req.userId = rootUser._id
        next();
    } catch (error) {
        res.status(404).send("Unautherised")
        console.log(`Error in authenicate middleware ${error}`) 
    }
}

module.exports = authenticate;