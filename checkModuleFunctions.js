var fs     = require('fs')
  , async  = require('async')
  , concat = require('concat-stream')
  , spawn  = require('child_process').spawn
  , newModule
  , oldModule
  ;

function goThroughRepo(moduleName, repoLocation, cb) {
  var ag   = spawn('ag', ['--nofilename', moduleName+'\\.', repoLocation])
    , sed  = spawn('sed', ['s/^.*' + moduleName + '.\\([[:alpha:]]*\\)[.(].*/\\1/'])
    , sort = spawn('sort')
    , uniq = spawn('uniq')
    , sink = concat({ encoding: 'string' }, function(data) {cb(null, data) });
    ;

  ag.stdout.pipe(sed.stdin);
  sed.stdout.pipe(sort.stdin);
  sort.stdout.pipe(uniq.stdin);
  uniq.stdout.pipe(sink);
  ag.stdout.on('error', cb);
};

function checkFunctionsExist(data, cb) {
  var oldFunctions = [];
  if(data) {
    data = data.toString().split('\n');
    oldFunctions = data.filter(function(d) {return d});
  }
  async.concat(oldFunctions, function(functionName, next) {
    var result = (async[functionName] === undefined) ? functionName : null;
    next(null, result);
  }, function(err, missingFunctions) {
    if (!err && missingFunctions.length > 0) err = 'The following functions are missing ' + missingFunctions.join(', ');
    cb(err, oldFunctions); 
  });

};


function compareModules(oldFunctions, cb) {
  async.concat(oldFunctions, function(functionName, next) {
    var args = /\(\s*([^)]+?)\s*\)/.exec(newModule[functionName].toString())
      , argsOld = /\(\s*([^)]+?)\s*\)/.exec(oldModule[functionName].toString())
      ;

    args = (args[1]) ? args[1].split(/\s*,\s*/) : [];
    argsOld = (argsOld[1]) ? argsOld[1].split(/\s*,\s*/) : [];

    compareSignatures(functionName, argsOld, args, next);
  }, cb);
};

function compareSignatures(functionName, oldSignature, newSignature, cb) {
  var i = 0;
  async.concatSeries(oldSignature, function(param, next) {
    var res = (param !== newSignature[i]) ? ' - Signature mismatch at ' + functionName + ', param ' + i + '. ' + param  + ' vs. ' + newSignature[i] : null;
    i++;
    next(null, res);
  }, function(err, messages){
    var output = '';
    if (oldSignature.length !== newSignature.length) output += ' - Signature length does not match. (' + oldSignature.join(', ') + ') vs. (' + newSignature.join(', ') + ')\n';
    if (messages.length > 0) output += messages.join('\n');
    output = (output) ? functionName + ':\n' + output : null;
    
    cb(null, output);
  });
};


function checkSignatures(moduleName, repoLocation, oldModulePath, newModulePath) {
  oldModule = require(oldModulePath);
  newModule = require(newModulePath);
  async.waterfall([
      function(cb) {cb(null, moduleName, repoLocation)},
      goThroughRepo,
      checkFunctionsExist,
      compareModules
    ], function(err, mismatches) {
      if(mismatches.length > 0) console.log(mismatches.join('\n'));
      if(err) console.log(err);
      var exitCode = (err) ? 1 : 0;
      process.exit(exitCode);

  });
};

checkSignatures(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
