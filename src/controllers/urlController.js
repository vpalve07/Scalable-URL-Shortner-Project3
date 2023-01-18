const urlModel = require('../modules/urlModel')
const shortid = require('shortid')
const redis = require("redis")
const validUrl = require('validator')
const { promisify } = require("util")


//1. Connect to the redis server

const redisClient = redis.createClient(
    18345,
    "redis-18345.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("RXGCwJUfsFLEWSsJIsiiFJCjdJFNGE0m", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});


//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const url = async function (req, res) {
    try {
        let data = req.body
        let { longUrl } = data
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "Request Body cant be empty" })

        if (!Object.keys(data).includes('longUrl')) return res.status(400).send({ status: false, msg: "'longUrl' should be there in request body" })
        if (Object.keys(data).length > 1) return res.status(400).send({ status: false, msg: "Enter 'longUrl' only in request body" })

        // let LinkFormat = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%\+.~#?&\/=]*)$/
        if (!validUrl.isURL(longUrl)) return res.status(400).send({ status: false, msg: "Please Enter Valid Url" })
        const findUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (findUrl) { return res.status(200).send({ status: true, data: { longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl, urlCode: findUrl.urlCode } }) };
        
        let shortUrlCode = shortid.generate()
        let baseUrl = `${req.protocol}://${req.get('host')}/`
        data.urlCode = shortUrlCode
        data.shortUrl = baseUrl + shortUrlCode
        let { shortUrl, urlCode } = data
        let createData = await urlModel.create(data)
        await SET_ASYNC(`${shortUrlCode}`, 50,  JSON.stringify(data))
        return res.status(201).send({ status: true, data: { longUrl, shortUrl, urlCode } })
    } catch (error) {
        return res.send({ errorType: error.name, errorMsg: error.message })
    }

}

const getUrl = async function (req, res) {
    try {
        let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
        if (cahcedProfileData) {
            return res.status(302).redirect(JSON.parse(cahcedProfileData).shortUrl)
        }
        else {
            let getData = await urlModel.findOne({ urlCode: req.params.urlCode }).select({ urlCode: 1, shortUrl: 1, longUrl: 1, _id: 0 })
            if (!getData) return res.status(400).send({ status: false, msg: "Page Not found" })
            await SET_ASYNC(`${req.params.urlCode}`, 10,  JSON.stringify(getData))
            return res.status(302).redirect(JSON.parse(getData).shortUrl)
        }
    } catch (error) {
        return res.send({ errorType: error.name, errorMsg: error.message })
    }
}

module.exports = { url, getUrl }