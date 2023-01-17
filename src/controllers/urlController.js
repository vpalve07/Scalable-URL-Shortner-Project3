const urlModel = require('../modules/urlModel')
const shortid = require('shortid')

const url = async function (req, res) {
    try {
        let data = req.body
        let {longUrl,shortUrl,urlCode} = data
        if(Object.keys(data).length==0) return res.status(400).send({status:false,msg:"Request Body cant be empty"})
        // if(Object.keys(data).includes()) return res.status(400).send({status:false,msg:"Request body can only contain 'longUrl','shortUrl','urlCode'"})
        if(!Object.keys(data).includes('longUrl')) return res.status(400).send({status:false,msg:"'longUrl' should be there in request body"})
        if(Object.keys(data).length>1) return res.status(400).send({status:false,msg:"Enter 'longUrl' only in request body"})
        
        // if(Object.keys(data).includes('shortUrl')) return res.status(400).send({status:false,msg:"shortUrl should not be there in request body"})
        // if(Object.keys(data).includes('urlCode')) return res.status(400).send({status:false,msg:"urlCode should not be there in request body"})
        
        let LinkFormat = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%\+.~#?&\/=]*)$/
        if (!LinkFormat.test(longUrl)) return res.status(400).send({ status: false, msg: "Please Enter Valid Url" })
        const findUrl = await urlModel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        if (findUrl) { return res.status(200).send({ status: true, data: { longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl, urlCode: findUrl.urlCode } }) };
        let shortUrlCode = shortid.generate()
        let baseUrl = `${req.protocol}://${req.get('host')}/`
        data.urlCode = shortUrlCode
        data.shortUrl = baseUrl + shortUrlCode
        let createData = await urlModel.create(data)
        return res.status(201).send({ status: true, data: { longUrl, shortUrl, urlCode } })
    } catch (error) {
        return res.send({ errorType: error.name, errorMsg: error.message })
    }

}

const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        let getData = await urlModel.findOne({ urlCode: urlCode }).select({ urlCode: 1, shortUrl: 1, longUrl: 1, _id: 0 })
        if (!getData) return res.status(400).send({ status: false, msg: "Page Not found" })
        return res.status(302).redirect(getData.longUrl)
    } catch (error) {
        return res.send({ errorType: error.name, errorMsg: error.message })
    }
}

module.exports = { url, getUrl }