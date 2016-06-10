/*
 * Copyright 2016, Joyent, Inc.
 */

var mod_fs = require('fs');
var mod_lockfd = require('../../lib');

var lpath = process.argv[2];
var ltype = Number(process.argv[3]);
var message = process.argv[4];

var fd = mod_fs.openSync(lpath, 'r');

mod_lockfd.flockSync(fd, ltype);
process.send(message);
mod_fs.closeSync(fd);
