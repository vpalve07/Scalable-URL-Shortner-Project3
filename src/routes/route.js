const express = require('express')
const { url, getUrl } = require('../controllers/urlController')
const router = express.Router()

router.get('/test-me',function(req,res){
    res.send({test:"Test-API"})
})

router.post('/url/shorten',url)
router.get('/:urlCode',getUrl)
router.all('/*',function(req,res){ return res.status(400).send({msg:"Invalid HTTP request"})})


module.exports = router