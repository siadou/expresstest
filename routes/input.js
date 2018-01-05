var express = require('express');
var router = express.Router();
var util = require('util');
var fs = require('fs');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('try post method');
});


/****************getTopo*****************
output: topo ntfl file
output: topo result file
output: probe result  => show on screen
*****************************************/
/****************getTopo*****************
queryinput: token
postinput:  probe result

*****************************************/
router.get('/probe', function(req, res, next) {
})

router.post('/probe', function(req, res, next) {
})

/****测试网络监控*****/

router.get('/monitor', function(req, res, next) {
})

router.post('/testprobe', function(req, res, next) {
})

module.exports = router;

