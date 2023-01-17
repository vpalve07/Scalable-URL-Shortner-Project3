const urlModel = require('../modules/urlModel')
const shortid = require('shortid')

const url = async function(req,res){
  try {
      let data = req.body
      let longUrl = data.longUrl
      let LinkFormat = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%\+.~#?&\/=]*)$/
      if (!LinkFormat.test(longUrl)) return res.status(400).send({ status: false, msg: "Please Enter Valid Url" })
      const findUrl = await urlModel.findOne({ longUrl: longUrl });

    if (findUrl) { return res.status(200).send({ status: true, data: {longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl, urlCode: findUrl.urlCode }})};
      let shortUrlCode = shortid.generate(longUrl)
      let baseUrl = "http://localhost:3000/"
      data.urlCode = shortUrlCode
      data.shortUrl = baseUrl+shortUrlCode
      let {shortUrl,urlCode} = data
      let createData = await urlModel.create(data)
      res.status(201).send({status:true,data:{longUrl,shortUrl,urlCode}})
  } catch (error) {
    res.send({errorType:error.name,errorMsg:error.message})
  }

}

const getUrl = async function(req,res){
    let urlCode = req.params.urlCode
    let getData = await urlModel.findOne({urlCode:urlCode}).select({urlCode:1,shortUrl:1,longUrl:1,_id:0})
    if(!getData) return res.status(400).send({status:false,msg:"Page Not found"})
    res.status(302).redirect(getData.longUrl)
}

module.exports = {url,getUrl}