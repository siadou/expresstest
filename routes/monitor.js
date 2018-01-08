var express = require('express');
var router = express.Router();
var multer = require('multer');
var Topo = require('../lib/Topo');
const { exec } = require('child_process');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.query)
  if(req.query.token) {
    Topo.get(req.query.token, function(topo) {
      res.render('monitor_item', { topo: topo });
    })
  } else {
    Topo.getAll(function(topos) {
      Topo.getNow(function(now) {
        res.render('monitor_list', { topos: topos, now: now });
      })
    })
  }
});

router.get('/add', function(req, res, next) {
  res.render('index', { title: 'topo' });
})


var upload = multer({ dest: 'uploads/' })
cpUpload = upload.fields([{ name: 'segment'}, {
  name: 'top'
}]);

router.post('/add', cpUpload, function(req, res, next) {
// get params : req.query.id
// get post params : req.body.segment
  var segment = req.body.segment
  var file = req.files.top[0]
  var top = file.originalname
  var token = file.filename
  var filepath = file.path

  console.log(file)
  Topo.init(token, function(err) {
    console.log(err)
    res.render('input', { segment: segment, top: top, token: token })
  })
})

router.post('/build', function(req, res, next) {
  var token = req.query.token
  Topo.build(token, function(result){
    res.json(result);
  })
})

router.get('/setprobe', function(req, res, next) {
  var token = req.query.token
  Topo.getProbes(token, function(probes){
    res.render('setprobe', { probes: probes})
  })
})

router.post('/setprobe', function(req, res, next) {
  var token = req.query.token
  var probes = []
  for (var k in req.body) {
    var v = req.body[k]
    k = k.replace('probe', '');
    probes.push({deployid: k, ip: v}) 
  }
  Topo.setProbes(token, probes, function() {
    res.json({ token: token, status: true})
  })
})

router.post('/testprobe', function(req, res, next){
  var token = req.query.token
  console.log(token)
  Topo.testProbe(token, function() {
    res.json({ token: token, status: true})
  })
})

router.post('/initial', function(req, res, next) {
  var token = req.query.token
  Topo.moninit(token, function() {
    res.json({ token: token, status: true})
  })
})

router.post('/start', function(req, res, next) {
  var token = req.query.token
  Topo.monitor(token, function() {
    res.json({ token: token, status: true})
  })
})

router.post('/stop', function(req, res, next) {
  var token = req.query.token
  Topo.stop(token, function() {
    res.json({ token: token, status: true})
  })
})

//从虚拟环境中移除当前拓扑
router.post('/remove', function(req, res, next) {
  var token = req.query.token
  Topo.removeVirtualTopo(token, function(res) {
    res.json(res)
  })
})

module.exports = router;
