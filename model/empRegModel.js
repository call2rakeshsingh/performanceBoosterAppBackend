const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')


const empRegDataSchema = mongoose.Schema({
    userName:{
        type:String,
        minlenght:3,
        required: true
    },
    userEmail:{
        type: String,
        unique : true,
        required: true,
        validate(value){
            validator.isEmail(value)
        }
    },
    mobile:{
        type:Number,
        unique : true,
        min: 4000000000,
        max: 10000000000,
        required: true
    },
    empId:{
        type:String,
        minlenght:4,
        required: true
    },
    designation:{
        type: String,
        required: true
    },

    level:{
        type: String,
        required: true,   
        minLength: 5  
    },
    departmentName:{
        type: String,
        required: true, 
    },
    departmentId:{
        type: String,
        required: true, 
    },
    branchName:{
        type: String,
        required: true, 
    },
    branchId:{
        type: String,
        required: true, 
    },
    managerEmail:{
        type: String,
        required: true,
        validate(value){
            validator.isEmail(value)
        }
    },
    companyName: {
        type: String,
        default: "sona"
    },

    password:{
        type: String,
        required: true,
        minlenght:6,

    },

    tokens:[
        {
            token:{
                type: String,
                required: true
            }
        }
    ]
})

empRegDataSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcryptjs.hash(this.password, 10)
    }
    next()
})

// we are generating token

empRegDataSchema.methods.generateAuthToken = async function (_id){
    console.log(this._id.toString())
    try {
        const token = await jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({token: token});
        await this.save();
        console.log(token)
        return token; 
    } catch (error) {
        console.log(error)
    }
}


const EmpRegData = mongoose.model("empregdata", empRegDataSchema);

module.exports = EmpRegData;