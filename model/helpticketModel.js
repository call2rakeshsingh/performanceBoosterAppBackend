const mongoose = require('mongoose');

const directorMonthlyChecklistSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  meetingType: {
    type: String,
    required: true,
  },
  planning: {
    type: Date,
    required: true,
  },
  actual: {
    type: Date,
  },
  status:{
    type: String,
    default: "Pending"
  },
  remarks:{
    type: String,
    default: ""
  }
});


const monthSchema = new mongoose.Schema({
  monthName: {
    type: String,
    required: true,
    unique: true,
  },
  directorsMonthlyChecklists: [directorMonthlyChecklistSchema],
});

const yearSchema = new mongoose.Schema({
  yearName: {
    type: String,
    required: true,
    unique: true,
  },
  months: [monthSchema],
});


const helpTicketSchema = new mongoose.Schema({
  userName: {
    type: String,

  },
  branchName: {
    type: String,

  },
  helpWithDepartmentName: {
    type: String,
  
  },
  issueType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userTimestamp: {
    type: Date,
    default: Date.now,
  },
  managerTimestamp: {
    type: Date,
    default: "",
  },
  
  managerApproval: {
    type: String,
    default: "Pending"
    
  },
  managerRemarks: {
    type: String,
    default: ""
  },
  finalTimestamp: {
    type: Date,
    default: "",
  },
  
  finalStatus: {
    type: String,
    default: "Pending"
    
  },
  finalRemarks: {
    type: String,
    default: ""
  },
  
});

const userSchema = new mongoose.Schema({

  userEmail: {
    type: String,
    required: true,
    unique: true,
  },
  helpTickets: [helpTicketSchema],
  checklists: [yearSchema],
});

const departmentSchema = new mongoose.Schema({
 
  departmentId: {
    type: String,
    required: true,
    unique: true,
  },
  users: [userSchema],
  
});

const managerSchema = new mongoose.Schema({
 
  managerEmail: {
    type: String,
    required: true,
    unique: true,
  },
  departments: [departmentSchema],
});

const branchSchema = new mongoose.Schema({

  branchId: {
    type: String,
    required: true,
    unique: true,
  },
  
  managers: [managerSchema],
});

const dataSchema = new mongoose.Schema({
  companyName: {
    type: String,
  require: true,
  unique: true,
},

branches: [branchSchema],

})

const DirectorMonthlyChecklist = mongoose.model('DirectorMonthlyChecklist', directorMonthlyChecklistSchema);
const ChecklistMonth = mongoose.model('ChecklistMonth', monthSchema);
const ChecklistYear = mongoose.model('ChecklistYear', yearSchema);
const HelpTicket = mongoose.model('HelpTicket', helpTicketSchema);
const User = mongoose.model('User', userSchema);
const Manager = mongoose.model('Manager', managerSchema);
const Department = mongoose.model('Department', departmentSchema);
const Branch = mongoose.model('Branch', branchSchema);
const Data = mongoose.model('Data', dataSchema);

module.exports = { DirectorMonthlyChecklist, ChecklistMonth, ChecklistYear, HelpTicket, User, Manager, Department, Branch, Data };
