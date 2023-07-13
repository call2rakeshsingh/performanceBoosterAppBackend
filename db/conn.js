const mongoose = require('mongoose')

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  }).then(
    console.log("Database is connected now")
).catch((err) => {
    console.log(`Facing problem to connect database and this is the ${err}`)
})