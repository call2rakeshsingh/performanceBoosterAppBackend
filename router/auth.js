const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const express = require('express')
const router = express.Router();
const EmpRegData = require('../model/empRegModel')
const {Data} = require('../model/helpticketModel')
const authenicate = require('../middleware/authenticate')
const addEmailInHelpticket = require('../middleware/addemailinhelpticket')
const moment = require('moment-timezone');

function convertToUTC(inputDate) {
  const inputFormat = 'YYYY-MM-DD HH:mm:ss'; // format of input date string

  const utcDate = moment.tz(inputDate, inputFormat, 'Asia/Kolkata').utc();
  return utcDate.toDate();
}

const multer = require('multer');
const csvParser = require('csv-parser');
const path = require('path');
const fs = require('fs');

const upload = multer({
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  },
  dest: 'uploads/'
});

router.post('/checklistupload', upload.single('file'), async (req, res) => {
  
  const { userEmail, yearName, monthName, companyName, branchId, managerEmail, departmentId } = req.body;
  const { filename } = req.file;
  const filePath = req.file.path;
  console.log(filePath)
  try {
    const companyData = await getCompanyData(companyName);
    const branch = await getBranch(companyData, branchId);
    const manager = await getManager(branch, managerEmail);
    const department = await getDepartment(manager, departmentId);
    const user = await getUser(department, userEmail);
    const year = await getYear(user, yearName);
    const month = await getMonth(year, monthName);
    const checklistTasks = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        let { taskName, meetingType, type, planning, actual, status, remarks } = row;
        // console.log(planning)
        planning = convertToUTC(planning);
        actual = actual != "" ? convertToUTC(actual) : ""
        const task = {
          taskName,
          meetingType,
          type,
          planning,
          actual,
          status,
          remarks,
        };
        checklistTasks.push(task);
      })
      .on('end', async () => {
        month.directorsMonthlyChecklists = month.directorsMonthlyChecklists.concat(checklistTasks);
        await companyData.save();
        fs.unlinkSync(filePath); // Remove the temporary file
        res.status(200).json({ message: 'Checklist Successfully Uploaded' });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/pendingTasks', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);
    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === managerEmail)

    let department = companyData.branches[branch].managers[manager].departments.findIndex(department => department.departmentId === departmentId)
    let user = companyData.branches[branch].managers[manager].departments[department].users.findIndex(user => user.userEmail === userEmail)
    let checklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists
    let crrentChecklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months
    let checklistDatas = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months[crrentChecklist.length-1]

    
    const userHelpTickets = checklistDatas.directorsMonthlyChecklists.filter(checklistData => checklistData.status === "Pending");
       
  // console.log(userHelpTickets)

      res.status(200).json(userHelpTickets);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/completedtasks', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);
    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === managerEmail)

    let department = companyData.branches[branch].managers[manager].departments.findIndex(department => department.departmentId === departmentId)
    let user = companyData.branches[branch].managers[manager].departments[department].users.findIndex(user => user.userEmail === userEmail)
    let checklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists
    let crrentChecklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months
    let checklistDatas = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months[crrentChecklist.length-1]

    
    const userHelpTickets = checklistDatas.directorsMonthlyChecklists.filter(checklistData => checklistData.status === "Done");
       
  // console.log(userHelpTickets)

      res.status(200).json(userHelpTickets);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/alltasks', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);
    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === managerEmail)
    let department = companyData.branches[branch].managers[manager].departments.findIndex(department => department.departmentId === departmentId)
    let user = companyData.branches[branch].managers[manager].departments[department].users.findIndex(user => user.userEmail === userEmail)
    let checklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists
    let crrentChecklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months
    console.log(crrentChecklist)

    const allChecklistData = crrentChecklist.slice(0, -1).flatMap(data => data.directorsMonthlyChecklists)

      res.status(200).json(allChecklistData);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/checklistdashboard', addEmailInHelpticket, async (req, res) => {
  const oneDay = 86400000
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);
    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === managerEmail)
    let department = companyData.branches[branch].managers[manager].departments.findIndex(department => department.departmentId === departmentId)
    let user = companyData.branches[branch].managers[manager].departments[department].users.findIndex(user => user.userEmail === userEmail)
    let checklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists
    let crrentChecklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months
    // console.log(crrentChecklist)

    const counts = crrentChecklist.flatMap(({ monthName, directorsMonthlyChecklists }) => {
      const result = { monthName };
      directorsMonthlyChecklists.forEach(checklist => {
        if (checklist.status === 'Pending' && checklist.planning-oneDay*1 < Date.now() ) {
          result.pending = (result.pending || 0) + 1;
        } else if (checklist.status === 'Done') {
          const diff = checklist.planning - checklist.actual;
          if (diff > 0) {
            result.doneOnTime = (result.doneOnTime || 0) + 1;
          } else {
            result.doneWithDelay = (result.doneWithDelay || 0) + 1;
          }
        }
      });
      return result;
    });
    
    console.log(counts);
    

    


      res.status(200).json(counts);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/updatependingtask', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);
    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === managerEmail)
    let department = companyData.branches[branch].managers[manager].departments.findIndex(department => department.departmentId === departmentId)
    let user = companyData.branches[branch].managers[manager].departments[department].users.findIndex(user => user.userEmail === userEmail)
    let checklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists
    let crrentChecklist = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months
    let checklistDatas = companyData.branches[branch].managers[manager].departments[department].users[user].checklists[checklist.length-1].months[crrentChecklist.length-1]
    const userHelpTickets = checklistDatas.directorsMonthlyChecklists.filter(checklistData => checklistData.status === "Pending");
      
    const actual = new Date()
      let helpTicketFound = false;
      // console.log(userHelpTickets)

      for (const key of Object.keys(req.body)) {
        const { _id, status, remarks } = req.body[key];

        
          const index = userHelpTickets.findIndex(ticket => ticket._id.toString() === _id);
          console.log(index)
          if (index !== -1) {
            helpTicketFound = true;
            userHelpTickets[index].actual = actual;
            userHelpTickets[index].status = status;
            userHelpTickets[index].remarks = remarks;
          }
        
      }

      if (helpTicketFound) {
        await companyData.save();
        res.status(200).json({ message: "Help ticket status updated" });
      } else {
        console.log(`Help tickets not found`);
        res.status(404).json({ message: "Help ticket not found" });
      }
    } 
   catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});





router.post('/login', async (req, res) => {
    const {userEmail, password} = req.body
    console.log(req.body)
    try {
      const userData = await EmpRegData.findOne({userEmail});
      console.log(userData)
      const isMatch = await bcryptjs.compare(password,userData.password)
      if(!isMatch){
        return res.status(401).send("user is not valid")
        console.log("not matched")
        }
    const token = await userData.generateAuthToken(userData._id);

    res.cookie("jwtoken", token, {
        expires: new Date(Date.now() + 25892000000),
        httpOnly: true,
        secure: true,
        sameSite: "None",
    })


    
    const userInfo = [userData.userName, userData.branchName]
    res.status(200).json(userInfo)

    } catch (error) {
        res.status(404).send(`Invalid Credentials ${error}`)
    }
})

router.post('/empregdata', async (req, res) => {
    const {userName, userEmail, mobile, empId, designation, level, departmentName, departmentId, branchName, branchId, managerEmail, password} = req.body;
    const userData = await EmpRegData.findOne({userEmail});
    
    if(userData === null){
    try {
        const data = await EmpRegData({userName, userEmail, mobile, empId, designation, level, departmentName, departmentId, branchName, branchId, managerEmail, password});
        await data.save()
        res.status(200).json({message: "New User Registered Successfuly"});
    } catch (error) {
        res.status(404).send(error)
        console.log(error)
    }
  } else res.status(404).send("User already registered")
})


router.get('/validateuser', addEmailInHelpticket, async (req, res) => {
  try {
    console.log(`User is validated ${userName}`)
    res.status(200).json([userName, branchName]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/yourhelpticket', addEmailInHelpticket, async (req, res) => {
  try {
    const companyData = await getCompanyData(companyName);
    const branch = await getBranch(companyData, branchId);
    const manager = await getManager(branch, managerEmail);
    const department = await getDepartment(manager, departmentId);
    const user = await getUser(department, userEmail);

    const userHelpTickets = user.helpTickets;
    console.log(userHelpTickets)
    res.status(200).json(userHelpTickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


router.get('/helptickettoapproval', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);

    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === userEmail);
    
    if (userEmail === companyData.branches[branch].managers[manager].managerEmail) {
      console.log("userEmail matched with managerEmail");

      const helpTickets = [];

      // Fetch all departments under the current manager's branch
      const departments = companyData.branches[branch].managers[manager].departments;

      // Flatten the users of all departments into a single array
      const users = departments.flatMap(department => department.users);
      console.log(users)

      // Push the help tickets of all users into the helpTickets array
      for (const user of users) {
        const userHelpTickets = user.helpTickets.filter(helpTicket => helpTicket.managerApproval === "Pending");
        helpTickets.push(...userHelpTickets);
      }


      res.status(200).json(helpTickets);
    } else {
      // If user is not a manager, return an error message
      res.status(200).json({ message: "User is not a manager" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/helpticketapproved', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    let branch = companyData.branches.findIndex(branch => branch.branchId === branchId);

    let manager = companyData.branches[branch].managers.findIndex(manager => manager.managerEmail === userEmail);
    
    if (userEmail === companyData.branches[branch].managers[manager].managerEmail) {
      console.log("userEmail matched with managerEmail");

      const helpTickets = [];

      // Fetch all departments under the current manager's branch
      const departments = companyData.branches[branch].managers[manager].departments;

      // Flatten the users of all departments into a single array
      const users = departments.flatMap(department => department.users);

      // Push the help tickets of all users into the helpTickets array
      for (const user of users) {
        const userHelpTickets = user.helpTickets.filter(helpTicket => helpTicket.managerApproval !== "Pending");
        helpTickets.push(...userHelpTickets);
      }

      // console.log(helpTickets);
      res.status(200).json(helpTickets);
    } else {
      // If user is not a manager, return an error message
      res.status(200).json({ message: "User is not a manager" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/helpticketresolved', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });

    const helpTickets = [];

    // Find all departments in the company
    const departments = companyData.branches.flatMap(branch => branch.managers.flatMap(manager => manager.departments));
    console.log(departments)

    // Flatten the users of all departments into a single array
    const users = departments.flatMap(department => department.users);

    // Push the help tickets of all users into the helpTickets array
    for (const user of users) {
      const userHelpTickets = user.helpTickets.filter(helpTicket => helpTicket.managerApproval === "Approved" && helpTicket.finalStatus !== "Pending");
      const filteredHelpTickets = filterHelpTickets(userEmail, userHelpTickets);
      console.log(userHelpTickets)
      filteredHelpTickets != undefined ? helpTickets.push(...filteredHelpTickets): ""
      
    }

    console.log(helpTickets);
    res.status(200).json(helpTickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/helptickettoresolve', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });

    const helpTickets = [];

    // Find all departments in the company
    const departments = companyData.branches.flatMap(branch => branch.managers.flatMap(manager => manager.departments));
    console.log(departments)

    // Flatten the users of all departments into a single array
    const users = departments.flatMap(department => department.users);

    // Push the help tickets of all users into the helpTickets array
    for (const user of users) {
      const userHelpTickets = user.helpTickets.filter(helpTicket => helpTicket.managerApproval === "Approved" && helpTicket.finalStatus === "Pending");
      const filteredHelpTickets = filterHelpTickets(userEmail, userHelpTickets);
      console.log(userHelpTickets)
      filteredHelpTickets != undefined ? helpTickets.push(...filteredHelpTickets): ""
      
    }

    console.log(helpTickets);
    res.status(200).json(helpTickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

function filterHelpTickets(userEmail, userHelpTickets) {
  switch (userEmail) {
    case "techsupport@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "IT");
    case "santosh.jha@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "Accounts");
    case "pushpendra.goel@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "Logistics");
    case "ritu.virmani@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "Collections");
    case "sharmistha.swain@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "HR");
    case "rakesh.singh@sonacommercial.com":
      return userHelpTickets.filter(helpTicket => helpTicket.helpWithDepartmentName === "FMS");
  }
}

router.post('/updatehelptickettoresolve', addEmailInHelpticket, async (req, res) => {
  try {
    let companyData = await Data.findOne({ companyName });
    // Find all departments in the company
    const departments = companyData.branches.flatMap(branch => branch.managers.flatMap(manager => manager.departments));
    console.log(departments)

        // Flatten the users of all departments into a single array
        const users = departments.flatMap(department => department.users);

        // Push the help tickets of all users into the helpTickets array

      let helpTicketFound = false;

      for (const key of Object.keys(req.body)) {
        const { _id, finalStatus, finalRemarks, finalTimestamp } = req.body[key];

        for (const user of users) {
          const userHelpTickets = user.helpTickets;
        
          const index = userHelpTickets.findIndex(ticket => ticket._id.toString() === _id);
          console.log(index)
          if (index !== -1) {
            helpTicketFound = true;
            userHelpTickets[index].finalStatus = finalStatus;
            userHelpTickets[index].finalRemarks = finalRemarks;
            userHelpTickets[index].finalTimestamp = finalTimestamp;
          }
        }
      }

      if (helpTicketFound) {
        await companyData.save();
        res.status(200).json({ message: "Help ticket status updated" });
      } else {
        console.log(`Help tickets not found`);
        res.status(404).json({ message: "Help ticket not found" });
      }
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


router.post('/updatehelpticketstatus', addEmailInHelpticket, async (req, res) => {
  try {
    const companyData = await Data.findOne({ companyName });
    const branchIndex = companyData.branches.findIndex(branch => branch.branchId === branchId);
    const managerIndex = companyData.branches[branchIndex].managers.findIndex(manager => manager.managerEmail === userEmail);

    if (managerIndex !== -1) {
      console.log("User is a manager");
      const departments = companyData.branches[branchIndex].managers[managerIndex].departments;
      const users = departments.flatMap(department => department.users);

      let helpTicketFound = false;

      for (const key of Object.keys(req.body)) {
        const { _id, managerApproval, managerRemarks, managerTimestamp } = req.body[key];

        for (const user of users) {
          const userHelpTickets = user.helpTickets;
        
          const index = userHelpTickets.findIndex(ticket => ticket._id.toString() === _id);
          console.log(index)
          if (index !== -1) {
            helpTicketFound = true;
            userHelpTickets[index].managerApproval = managerApproval;
            userHelpTickets[index].managerRemarks = managerRemarks;
            userHelpTickets[index].managerTimestamp = managerTimestamp;
          }
        }
      }

      if (helpTicketFound) {
        await companyData.save();
        res.status(200).json({ message: "Help ticket status updated" });
      } else {
        console.log(`Help tickets not found`);
        res.status(404).json({ message: "Help ticket not found" });
      }
    } else {
      // If user is not a manager, return an error message
      console.log("User is not a manager");
      res.status(403).json({ message: "User is not a manager" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


router.get('/helpticket', authenicate, async (req, res) => {
    console.log('we are inside first helpticket')
    console.log(`This cookie is set ${req.signedCookies}`)
    res.send(req.rootUser)
})
router.post('/helpticket', addEmailInHelpticket, async (req, res) => {
    const { helpWithDepartmentName, issueType, description } = req.body;
  
    try {
      const companyData = await getCompanyData(companyName);
      const branch = await getBranch(companyData, branchId);
      const manager = await getManager(branch, managerEmail);
      const department = await getDepartment(manager, departmentId);
      const user = await getUser(department, userEmail);
  
      const helpTicket = {
        userName,
        branchName,
        helpWithDepartmentName,
        issueType,
        description,
        timestamp: new Date(),
      };
  
      user.helpTickets.push(helpTicket);
      await companyData.save();
  
      res.status(200).json({ message: 'Help Ticket Successfully Submitted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });
  
  async function getCompanyData(companyName) {
    let companyData = await Data.findOne({ companyName });
  
    if (!companyData) {
      const newData = await new Data({ companyName }).save();
      companyData = newData;
    }
  
    return companyData;
  }
  
  async function getBranch(companyData, branchId) {
    let branchIndex = companyData.branches.findIndex(branch => branch.branchId === branchId);
  
    if (branchIndex === -1) {
      companyData.branches.push({branchId});
      await companyData.save();
      branchIndex = companyData.branches.length - 1;
    }
  
    return companyData.branches[branchIndex];
  }
  
  async function getManager(branch, managerEmail) {
    let managerIndex = branch.managers.findIndex(manager => manager.managerEmail === managerEmail);
  
    if (managerIndex === -1) {
      branch.managers.push({managerEmail});
      await branch.save();
      managerIndex = branch.managers.length - 1;
    }
  
    return branch.managers[managerIndex];
  }
  
  async function getDepartment(manager, departmentId) {
    let departmentIndex = manager.departments.findIndex(department => department.departmentId === departmentId);
  
    if (departmentIndex === -1) {
      manager.departments.push({departmentId});
      await manager.save();
      departmentIndex = manager.departments.length - 1;
    }
  
    return manager.departments[departmentIndex];
  }
  
  async function getUser(department, userEmail) {
    let userIndex = department.users.findIndex(user => user.userEmail === userEmail);
  
    if (userIndex === -1) {
      department.users.push({userEmail});
      await department.save();
      userIndex = department.users.length - 1;
    }
  
    return department.users[userIndex];
  }

  async function getYear(user, yearName) {
    let yearIndex = user.checklists.findIndex(checklist => checklist.yearName === yearName);
  
    if (yearIndex === -1) {
      user.checklists.push({yearName});
      await user.save();
      yearIndex = user.checklists.length - 1;
    }
  
    return user.checklists[yearIndex];
  }

  async function getMonth(year, monthName) {
    let monthIndex = year.months.findIndex(month => month.monthName === monthName);
  
    if (monthIndex === -1) {
      year.months.push({monthName});
      await year.save();
      monthIndex = year.months.length - 1;
    }
  
    return year.months[monthIndex];
  }




router.get('/logout', async (req, res) => {
    try {
        res.clearCookie('jwtoken')
        res.status(200).send("You are logouted")   
        const token = await req.cookies.jwtoken;
        const rootUser = await EmpRegData.findOne({"tokens.token": token});
        console.log(`This is token before removing cookie ${token}`)
        rootUser.tokens = rootUser.tokens.filter((currentElm) => {return currentElm.token != token})
        await rootUser.save()    
        // console.log(`Server try to clear the cookie .................`)
        // res.clearCookie('jwtoken')
        // res.status(200).send("You are logouted")    
        // console.log(rootUser)
        // console.log(`This is token after removing cookie ${token}`)
        // console.log(`This is token after clearing the cookie ${token}`)
    } catch (error) {
        console.log(`Error in logout ${error}`)        
    }
 
}
)


module.exports = router;







// router.post('/helpticket', addEmailInHelpticket, async (req, res) => {
//     console.log('we are inside second helpticket')
//     console.log(req.body)
  

  
//     try {
//       // Get the user's details
//       const user = await EmpRegData.findById(userEmail).populate('department').exec();
//       const department = user.departmentName;
//       const manager = await Manager.findById(department.manager).populate('branch').exec();
//       const branch = manager.branch;
  
//       // Create the help ticket
//       const helpTicket = new Helpticketdata({
//         user: userId,
//         branch: branch._id,
//         manager: manager._id,
//         department: department._id,
//         helpWithDepartmentName: req.body.helpWithDepartmentName,
//         issueType: req.body.issueType,
//         description: req.body.description
//       });
  
//       // Save the help ticket
//       await helpTicket.save();
  
//       res.status(201).json({message: "Help Ticket Succesfully Submitted"});
//     } catch (error) {
//       res.status(404).send(error)
//     }
//   })

// router.get('/yourticket', addEmailInHelpticket, async (req, res) => {
//     try {
//         const userData = await Helpticketdata.find({email}).sort({"entryDate": -1});
//         await res.json(userData)
//     } catch (error) {
//         res.status(404).send(error)
//     }
// })

// router.post('/helpticket', addEmailInHelpticket,  async (req, res) => {
//     console.log('we are inside second helpticket')
//     console.log(req.body)
//     const {helpWithDepartmentName,issueType,description} = req.body;
    
    
//     try {
//         const data = await Branch({userEmail,departmentId,managerEmail,branchId,userName,branchName,helpWithDepartmentName,issueType,description});
//         console.log(data)
//         await data.save()
//         res.status(201).json({message: "Help Ticket Succesfully Submitted"});
//     } catch (error) {
//         res.status(404).send(error)
//     }
// })


// router.post('/helpticket', addEmailInHelpticket, async (req, res) => {
//     const { helpWithDepartmentName, issueType, description } = req.body;
    
//     try {
//         let companyData = await Data.findOne({ companyName: companyName }); 
//         if (!companyData) {
 
//           const newData = await new Data({ companyName: companyName }).save();
//           companyData = newData;
//         }
        
//         let branchIndex = companyData.branches.findIndex(branch => branch.branchId === branchId);
//         if (branchIndex === -1) {

//             companyData.branches.push({branchId: branchId})
//           await companyData.save();
//           branchIndex = companyData.branches.length - 1;
//         }
//         const branch = companyData.branches[branchIndex];

//         let managerIndex = branch.managers.findIndex(manager => manager.managerEmail === managerEmail);
//         if (managerIndex === -1) {
 
//         branch.managers.push({managerEmail: managerEmail});
//         await companyData.save();
//         managerIndex = branch.managers.length - 1;
//         }
//         const manager = branch.managers[managerIndex];


//         let departmentIndex = manager.departments.findIndex(department => department.departmentId === departmentId);
//         if (departmentIndex === -1) {
//             console.log(`This is department index ${managerIndex}`)
//         manager.departments.push({departmentId: departmentId});
//         await companyData.save();
//         departmentIndex = manager.departments.length - 1;
//         }
//         const department = manager.departments[departmentIndex];


//         let userIndex = department.users.findIndex(user => user.userEmail === userEmail);
//         if (userIndex === -1) {
    
//         department.users.push({userEmail: userEmail});
//         await companyData.save();
//         userIndex = department.users.length - 1;
//         }

//         const user = department.users[userIndex];

//         const helpTicket = {
//         helpWithDepartmentName,
//         issueType,
//         description,
//         timestamp: new Date(),
//         };
//         console.log(user.helpTickets)
//         user.helpTickets.push(helpTicket);
//         await companyData.save();
  
//       res.status(201).json({ message: 'Help Ticket Successfully Submitted' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Something went wrong' });
//     }
//   });


// const multer = require('multer');
// const csvParser = require('csv-parser');

// const path = require('path');
// const fs = require('fs');


// const upload = multer({
//   fileFilter: (req, file, cb) => {
//     const allowedFileTypes = ['text/csv', 'application/vnd.ms-excel'];
//     if (allowedFileTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only CSV files are allowed.'));
//     }
//   },
//   dest: 'uploads/'
// });

// async function updateMonthWithTasks(month, tasks) {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     tasks.forEach(task => {
//       month.directorsMonthlyChecklists.push(task);
//     });
//     await month.save({ session });
//     await session.commitTransaction();
//   } catch (error) {
//     console.error(error);
//     await session.abortTransaction();
//   } finally {
//     session.endSession();
//   }
// }

// router.post('/uploadcsv', upload.single('file'), async (req, res) => {
//   console.log('inside upload server');

//   const results = [];
//   const filePath = path.join(__dirname, '..', req.file.path); // join parent directory and file path
//   const stream = fs.createReadStream(filePath);
//   let hasError = false; // flag to track if there was an error
//   stream.on('error', (error) => {
//     console.error(error);
//     hasError = true;
//     res.status(500).send('Internal server error');
//   });

//   try {
//     await new Promise((resolve, reject) => {
//       stream.pipe(csvParser())
//       .on('data', async (data) => {
//         try {
//           const { companyName, branchId, managerEmail, departmentId, userEmail, checklistName, yearName, monthName, taskName, planning, actual, status, remarks } = data;
//           console.log(companyName, managerEmail);
//           const companyData = await getCompanyData(companyName);
//           const branch = await getBranch(companyData, branchId);
//           const manager = await getManager(branch, managerEmail);
//           const department = await getDepartment(manager, departmentId);
//           const user = await getUser(department, userEmail);
//           const checklist = await getChecklist(user, checklistName);
//           const year = await getYear(checklist, yearName);
//           const month = await getMonth(year, monthName);
      
//           const directorsMonthlyTasks = { taskName, planning, actual, status, remarks };
//           console.log(directorsMonthlyTasks);
      
//           await updateMonthWithTasks(month, [directorsMonthlyTasks]); // await the function call
//         } catch (error) {
//           console.error(error);
//           hasError = true;
//         }
//       })
      
//         .on('error', (error) => {
//           console.error(error);
//           // hasError = true;
//           reject(error);
//         })
//         .on('end', () => {
//           console.log('File uploaded successfully');
//           resolve();
//         });
//     });
//   } catch (error) {
//     console.error(error);
//     // hasError = true;
//   }

//   if (hasError) {
//     res.status(500).json({ message: 'Something went wrong' });
//   } else {
//     res.status(200).json({ message: 'CSV file successfully uploaded and parsed' });
//   }
// });
  
  