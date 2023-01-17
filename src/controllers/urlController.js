const urlModel = require('../modules/urlModel')
const shortid = require('shortid')
const validUrl = require('valid-url')

const url = async function (req, res) {
    try {
        let data = req.body
        let longUrl = data.longUrl
        if (!validUrl.isWebUri(longUrl)) return res.status(400).send({ status: false, msg: "Please Enter Valid Url" })
        const findUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        if (findUrl) { return res.status(200).send({ status: true, data: { longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl, urlCode: findUrl.urlCode } }) };
        let shortUrlCode = shortid.generate()
        let baseUrl = `${req.protocol}://${req.get('host')}/`
        data.urlCode = shortUrlCode
        data.shortUrl = baseUrl + shortUrlCode
        let { shortUrl, urlCode } = data
        let createData = await urlModel.create(data)
        return res.status(201).send({ status: true, data: { longUrl, shortUrl, urlCode } })
    } catch (error) {
        return res.send({ errorType: error.name, errorMsg: error.message })
    }

}

const getUrl = async function (req, res) {
    let urlCode = req.params.urlCode
    let getData = await urlModel.findOne({ urlCode: urlCode }).select({ urlCode: 1, shortUrl: 1, longUrl: 1, _id: 0 })
    if (!getData) return res.status(400).send({ status: false, msg: "Page Not found" })
    return res.status(302).redirect(getData.longUrl)
}

module.exports = { url, getUrl }