'use strict';
var fs = require('fs');
var args = require('optimist').argv;
var sys = require('sys');
var exec = require('child_process').exec;
var events = require('events');

var version = args.hasOwnProperty('v') ? args.v : args.hasOwnProperty('Version') ? args.Version : conf.default;
var phpversion = args.hasOwnProperty('v') ? args.v : args.hasOwnProperty('Version') ? args.Version : conf.default;
var conf = JSON.parse(fs.readFileSync(__dirname + '/conf.json', 'utf8'));

function Application() {
  this.setup();
}

Application.prototype = new events.EventEmitter();
Application.prototype.run = function () {
  var cmd = 'php -r \'echo phpversion();\' 2>&1| tail -1',
  that = this;

  exec(cmd, function (error, stdout, stderr) {
    console.log(stdout);
    var phpversion = stdout.replace(/\./, '').substring(0, 2);
    console.log('current php version: ' + phpversion);
    that.unlink(phpversion);
  });
};

Application.prototype.sysputs = function (name, error, stdout, stderr) {
  if (error) {
    console.log(error);
    return false;
  }
  sys.puts(stdout);
  this.emit(name);
}
Application.prototype.link = function () {
  var cmd = 'brew link php' + version;
  exec(cmd, this.sysputs.bind(this, 'link'));
};

Application.prototype.getcurrentversion = function () {
  exec(cmd, this.sysputs.bind(this, 'unlink'));
};

Application.prototype.configure = function () {
  var cmd = 'rm ' + conf.apachephp + '\n';
  cmd += 'ln -s ' + conf[version].conf + ' ' + conf.apachephp;
  console.log('removing symlink ' + conf.apachephp);
  console.log('creating symlink ' + conf.apachephp + ' --> ' + conf[version].conf);
  exec(cmd, this.sysputs.bind(this, 'configure'));
};

Application.prototype.reloadServer = function () {
  console.log('reload server');
  var cmd = 'sudo apachectl restart';
  exec(cmd, this.sysputs.bind(this, 'reload'));
};

Application.prototype.unlink = function (ver) {
  var cmd = 'brew unlink php' + ver;
  console.log('unlinking php' + ver);
  exec(cmd, this.sysputs.bind(this, 'unlink'));
};

Application.prototype.setup = function () {
  this.on('unlink', this.link.bind(this));
  this.on('link', this.configure.bind(this));
  this.on('configure', this.reloadServer.bind(this));
};

exports.phpswitch = new Application();
exports.phpswitch.run();
return;
