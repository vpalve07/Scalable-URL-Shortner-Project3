const urlModel = require('../modules/urlModel')
const shortid = require('shortid')
const redis = require("redis")
const axios = require('axios')
const validator = require('validator')
const { promisify } = require("util")


//1. Connect to the redis server

const client = redis.createClient({
    url: 'redis://default:RXGCwJUfsFLEWSsJIsiiFJCjdJFNGE0m@redis-18345.c264.ap-south-1-1.ec2.cloud.redislabs.com:18345'
})
client.on('error', (err) => console.log('Redis Client Error', err))
console.log("Connected to Redis..")

//2. Prepare the functions for each command

const SET_ASYNC = promisify(client.SETEX).bind(client);
const GET_ASYNC = promisify(client.GET).bind(client);


const url = async function (req, res) {
    try {
        let data = req.body
        let { longUrl } = data

        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, msg: "Request Body cant be empty" })
        if (!Object.keys(data).includes('longUrl')) return res.status(400).send({ status: false, msg: "'longUrl' should be there in request body" })
        if (longUrl == "") return res.status(400).send({ status: false, msg: "Enter 'longUrl' in request body" })
        if (Object.keys(data).length > 1) return res.status(400).send({ status: false, msg: "Enter 'longUrl' only in request body" })
        if (!validator.isURL(longUrl)) return res.status(400).send({ status: false, msg: `The URL ${longUrl} is not valid` })


        const response = await axios.get(longUrl)
            .then(() => longUrl)
            .catch(() => null)
        if (!response) return res.status(400).send({ status: false, msg: `The URL ${longUrl} is not valid` })


        const findUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (findUrl) { return res.status(200).send({ status: true, data: { longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl, urlCode: findUrl.urlCode } }) };

        let shortUrlCode = shortid.generate()
        let baseUrl = `${req.protocol}://${req.get('host')}/`
        data.urlCode = shortUrlCode
        data.shortUrl = baseUrl + shortUrlCode
        let { shortUrl, urlCode } = data
        let createData = await urlModel.create(data)
        await SET_ASYNC(`${shortUrlCode}`, 86400, JSON.stringify(data))
        return res.status(201).send({ status: true, data: { longUrl, shortUrl, urlCode } })
    } catch (error) {
        return res.status(500).send({ errorType: error.name, errorMsg: error.message })
    }

}

const getUrl = async function (req, res) {
    try {
        let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
        if (cahcedProfileData) return res.status(302).redirect(JSON.parse(cahcedProfileData).longUrl)
        
        let getData = await urlModel.findOne({ urlCode: req.params.urlCode }).select({ urlCode: 1, shortUrl: 1, longUrl: 1, _id: 0 })
        if (!getData) return res.status(400).send({ status: false, msg: "Page Not found" })
        await SET_ASYNC(`${req.params.urlCode}`, 86400, JSON.stringify(getData))
        return res.status(302).redirect(getData.longUrl)

    } catch (error) {
        return res.status(500).send({ errorType: error.name, errorMsg: error.message })
    }
}

module.exports = { url, getUrl }