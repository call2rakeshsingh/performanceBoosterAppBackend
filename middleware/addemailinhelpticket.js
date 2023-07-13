const jwt = require('jsonwebtoken')
const EmpRegData = require('../model/empRegModel')



const addEmailInHelpticket = async (req, res, next) => {
    console.log(req.cookies)

    
    try {
        const token = await req.cookies.jwtoken;
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY)
        const rootUser = await EmpRegData.findOne({_id: verifyToken._id, "tokens.token": token});
        if(!rootUser){
            throw new Error("Due to invalid token user can not register")
        }
        console.log(`rootUser ${rootUser.userName}`)
        userName = rootUser.userName;
        branchName = rootUser.branchName;
        managerEmail = rootUser.managerEmail
        userEmail = rootUser.userEmail
        departmentId = rootUser.departmentId
        departmentName = rootUser.departmentName
        branchId = rootUser.branchId
        companyName = rootUser.companyName
        next();
    } catch (error) {
        res.status(404).send("Unautherised")
        console.log(`Error in authenicate middleware. it provided by me in addemailinhelpticket ${error}`) 
    }
}

module.exports = addEmailInHelpticket;