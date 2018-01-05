var fs = require('fs');
var filePath = 'uploads/'
const { exec } = require('child_process');

var Topo = {
  configFile: './monitor.config',
  getConfigFile: function(token) {
    return fileConfig = filePath + token + '.config'
  },
  getProbeFile: function(token) {
    return fileConfig = filePath + token + '.probe'
  },
  get: function(token, callback) {
    var file = this.getConfigFile(token)
    fs.readFile(file, 'utf-8', function(err, data){
      if (err) {
        console.log(err)
      } else {
        console.log(data)
        var status = data.match(/\nstatus=(.+)\n/)[1];
        var type = data.match(/\ntype=(.+)\n/)
        if (type) {
          type = type[1]
        }
        callback({ token: token, status: status,  type: type })
      }
    })
  },
  getNow: function(callback) {
    var file = this.configFile;
    fs.readFile(file, 'utf-8', function(err, data) {
      var ip = data.match(/ip=(.+)\n/)[1];
      var env = data.match(/env=(.+)\n/)[1];
      var port = data.match(/port=(.+)\n/)[1];
      callback({ ip: ip, env: env, port: port });
    })
  },
  setNow: function(items, callback) {
    var file = this.configFile
    this.getNow(function(res){
      for(var k in items) {
        res[k] = items[k]
      }
      var configStr = 'env=' + res.env + '\nip=' + res.ip + '\nport=' + res.port + '\n';
      fs.writeFile(file, configStr, 'utf8', callback);
    })
  },
  getAll: function(callback) {
    var ret = []
    var that = this;
    exec("find ./uploads | grep .config", function(err, stdout, stderr) {
      if (err) {
        console.log("getall error" + err)
      } else {
        var lines = stdout.split('\n');
        console.log(lines)
        var outlines = [];
        for (var k in lines) {
          var line = lines[k]
          if (line != '') {
            line = line.match(/\.\/uploads\/(.+).config/)[1];
            outlines.push(line)
          }
        }
        console.log(outlines)
        var i = 0;
        var cb = function(data) {
          ret.push(data);
          if (ret.length < outlines.length) {
            i++
            that.get(outlines[i], cb)
          } else {
            callback(ret)
          }
        }
        that.get(outlines[0], cb)
      }
    })
  },
  init: function(token, type, callback) {
    var fileConfig = this.getConfigFile(token)
    if (['VIRTUAL', 'NORMAL'].indexOf(type) >= 0) {
      callback({ status: false });
    }
    // script 4 init & calculate script
    exec("echo ok", function(err, stdout, stderr) {
      var config = 'token=' + token + '\n' + 'status=CAL_OK\n' + 'type=' + type + '\n';
      console.log(fileConfig)
      console.log(config)
      fs.appendFile(fileConfig, config, 'utf8', callback);
    })
  },
  
  /****
    CAL_OK
    BUILD_OK
    PROBE_OK
    MONINIT_OK
    MON
    MON_STOP


    VIRTUAL
    NORMAL
  ****/
  //appendType: function(token, type, callback) {
  //  var file = this.getConfigFile(token)
  //  fs.readFile(file, 'utf-8', function(err, data){  
  //    var appendConfig = 'type=' + type + '\n';
  //    fs.appendFile(file, appendConfig, 'utf8', callback);
  //  })
  //},
  updateStatus: function(token, status, callback) {
    var file = this.getConfigFile(token)
    fs.readFile(file, 'utf-8', function(err, data){  
      if(err)  
        console.log("读取文件fail " + err);  
        callback({ status: false });
      else{
        console.log(data);
        var configStr = data.replace(/status=.+\n/, 'status=' + status + '\n')
        console.log(configStr);
        fs.writeFile(file, configStr, 'utf8', function(err) {
          if(err) {
            console.log(err)
            callback({ status: false });
          } else {
            callback({ status: true });
          }
        });
      }
    })  
  },
  getProbes: function(token, callback) {
    var file = this.getProbeFile(token)
    fs.readFile(file, 'utf-8', function(err, data) {
      callback(err, JSON.parse(data))
    })
  },
  setProbes: function(token, sprobes, callback) {
    var probes = [];
    var that = this;
    for(var k in sprobes) {
      var v = sprobes[k]
      probes.push({deployid: "1", probeid: k, ip: v})
    }
    var file = this.getProbeFile(token)
    var data = JSON.stringfy(probes)
    fs.writeFile(file, data, 'utf8', function(){
      that.updateStatus(token, 'BUILD_OK', callback)
    })
  },
  build: function(token, callback) {
    var that = this;
    that.getNow(token, function(res){
      //删掉当前在build状态的拓扑
      that.removeVirtualTopo(res.env, function(){
        // script 1 build topo
        exec("echo ok", function(err, stdout, stderr) {
          var ret = { status: true }
          if (stdout == 'ok') {
            ret['status'] = true
          } else {
            ret['status'] = false
          }
          that.setNow({ env: token }, function() {
            that.updateStatus(token, 'BUILD_OK', function(){
              callback(ret)
            })
          })
        })
      });
    })
  },
  /*****BUILD_OK*********/
  removeVirtualTopo: function(token, callback) {
    // set status to CAL_OK
    if (token == '' || !token) {
      callback({ status: true, msg: 'topo is already deleted' });
    }
    var that = this
    // script 2 remove topo
    exec("echo ok", function(err, stdout, stderr) {
      var ret = { status: true }
      if (stdout == 'ok') {
        ret['status'] = true
      } else {
        ret['status'] = false
      }
      that.setNow({ env: '' }, function() {
        that.updateStatus(token, 'CAL_OK', function(){
          callback(ret)
        })
      })
    });
  },
  testProbe: function(token, callback) {
    // script 6 test probe script
    exec("echo ok", function(err, stdout, stderr) {
      var status = true
      if (status) {
        that.updateStatus(token, 'PROBE_OK', callback)
      } else {
        callback({ status: false })
      }
    })
  },
  /*****PROBE_OK*********/
  moninit: function(token, callback) {
    // script 7 init monitor script
    exec("echo ok", function(err, stdout, stderr) {
      var status = true
      if (status) {
        that.updateStatus(token, 'MONINIT_OK', callback)
      } else {
        callback({ status: false })
      }
    })
  },
  /*****MONINIT_OK*********/
  monitor: function(token, callback) {
    // script 5 monitor script
    exec("echo ok", function(err, stdout, stderr) {
      var status = true
      if (status) {
        that.updateStatus(token, 'MON', callback)
      } else {
        callback({ status: false })
      }
    })
  },
  /*****MON*********/
  stop: function(token, callback) {
    // script 3 stop script
    exec("echo ok", function(err, stdout, stderr) {
      var status = true
      if (status) {
        that.updateStatus(token, 'MONINIT_OK', callback)
      } else {
        callback({ status: false })
      }
    })
  },
}

module.exports = Topo;

