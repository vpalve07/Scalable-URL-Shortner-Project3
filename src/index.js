const express = require('express')
const route = require('./routes/route')
const mongoose = require('mongoose')
const cors = require("cors")
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({origin:"*"}))
mongoose.set('strictQuery', false)
mongoose.connect(process.env.mongo_url, {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDB is connected"))
    .catch(err => console.log(err))

app.use("/", route)

app.listen(process.env.port, function () {
    console.log("Express app running")
})