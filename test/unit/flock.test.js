
/*
 * Copyright 2016, Joyent, Inc.
 */

var mod_child = require('child_process');
var mod_fs = require('fs');
var mod_lockfd = require('../../lib');
var test = require('tape');

var PATH_DIR = '/var/tmp/';
var PATH_FILE = '/var/tmp/.node-lockfd_lockfile';
var TIMEOUT = 1000;

mod_fs.appendFileSync(PATH_FILE, '');

function asyncTestRun(t, path, ltype, callback) {
	var fd1 = mod_fs.openSync(path, 'r');
	var fd2 = mod_fs.openSync(path, 'r');
	var results = [];
	var done = 0;

	function doWork(fd, message) {
		results.push(message);

		mod_lockfd.flock(fd, mod_lockfd.LOCK_UN, function (err) {
			t.ifErr(err, 'unlocked successfully');
			done += 1;
			if (done > 2) {
				throw new Error('callback() already called!');
			} else if (done === 2) {
				mod_fs.closeSync(fd1);
				mod_fs.closeSync(fd2);
				callback(results);
			}
		});
	}

	function getSecondLock() {
		mod_lockfd.flock(fd2, ltype, function (err) {
			t.ifErr(err, 'acquired lock successfully');
			doWork(fd2, 'workload 2');
		});
	}

	mod_lockfd.flock(fd1, ltype, function (err) {
		t.ifErr(err, 'acquired lock successfully');
		process.nextTick(getSecondLock);
		setTimeout(doWork, TIMEOUT, fd1, 'workload 1');
	});
}


function syncTestRun(_, path, ltype, callback) {
	var fd1 = mod_fs.openSync(path, 'r');
	var results = [];
	var done = 0;

	function finish() {
		done += 1;
		if (done > 2) {
			throw new Error('callback() already called!');
		} else if (done === 2) {
			mod_fs.closeSync(fd1);
			callback(results);
		}
	}

	function doWork(fd, message) {
		results.push(message);
		mod_lockfd.flockSync(fd, mod_lockfd.LOCK_UN);
		finish();
	}

	mod_lockfd.flockSync(fd1, ltype);
	var child = mod_child.fork('lock-and-reply.js',
			[ path, ltype, 'workload 2' ], { cwd: __dirname });
	child.on('message', function (message) {
		results.push(message);
		finish();
	});
	setTimeout(doWork, TIMEOUT, fd1, 'workload 1');
}


test('Bad file descriptor (async)', function (t) {
	mod_lockfd.flock(800, mod_lockfd.LOCK_EX, function (err) {
		t.ok(err, 'Bad file descriptor should call back with an error');
		t.deepEqual(err.message, 'File Locking Error: Bad file number',
		    'Error message');
		t.end();
	});
});


test('Bad file descriptor (sync)', function (t) {
	try {
		mod_lockfd.flockSync(800, mod_lockfd.LOCK_EX);
		t.ok(false, 'flockSync() with bad fd should throw');
	} catch (err) {
		t.ok(err, 'Bad file descriptor should throw an error');
		t.deepEqual(err.message, 'File Locking Error: Bad file number',
		    'Error message');
	}
	t.end();
});


test('Bad lock type (async)', function (t) {
	var fd = mod_fs.openSync(PATH_FILE, 'r');
	mod_lockfd.flock(fd, 800, function (err) {
		t.ok(err, 'Bad file descriptor should call back with an error');
		t.deepEqual(err.message, 'File Locking Error: Invalid argument',
		    'Error message');
		mod_fs.closeSync(fd);
		t.end();
	});
});


test('Bad lock type (sync)', function (t) {
	var fd = mod_fs.openSync(PATH_FILE, 'r');
	try {
		mod_lockfd.flockSync(fd, 800);
		t.ok(false, 'flockSync() with bad type should throw');
	} catch (err) {
		t.ok(err, 'Bad file descriptor should throw an error');
		t.deepEqual(err.message, 'File Locking Error: Invalid argument',
		    'Error message');
	}
	mod_fs.closeSync(fd);
	t.end();
});


test('Exclusive directory locks (async)', function (t) {
	asyncTestRun(t, PATH_DIR, mod_lockfd.LOCK_EX, function (results) {
		t.deepEqual(results, [ 'workload 1', 'workload 2' ],
		    'Correct final order');
		t.end();
	});
});


test('Exclusive file locks (async)', function (t) {
	asyncTestRun(t, PATH_FILE, mod_lockfd.LOCK_EX, function (results) {
		t.deepEqual(results, [ 'workload 1', 'workload 2' ],
		    'Correct final order');
		t.end();
	});
});


test('Exclusive directory locks (sync)', function (t) {
	syncTestRun(t, PATH_DIR, mod_lockfd.LOCK_EX, function (results) {
		t.deepEqual(results, [ 'workload 1', 'workload 2' ],
		    'Correct final order');
		t.end();
	});
});


test('Exclusive file locks (sync)', function (t) {
	syncTestRun(t, PATH_FILE, mod_lockfd.LOCK_EX, function (results) {
		t.deepEqual(results, [ 'workload 1', 'workload 2' ],
		    'Correct final order');
		t.end();
	});
});


test('Shared directory locks (async)', function (t) {
	asyncTestRun(t, PATH_DIR, mod_lockfd.LOCK_SH, function (results) {
		t.deepEqual(results, [ 'workload 2', 'workload 1' ],
		    'Correct final order');
		t.end();
	});
});


test('Shared file locks (async)', function (t) {
	asyncTestRun(t, PATH_FILE, mod_lockfd.LOCK_SH, function (results) {
		t.deepEqual(results, [ 'workload 2', 'workload 1' ],
		    'Correct final order');
		t.end();
	});
});


test('Shared directory locks (sync)', function (t) {
	syncTestRun(t, PATH_DIR, mod_lockfd.LOCK_SH, function (results) {
		t.deepEqual(results, [ 'workload 2', 'workload 1' ],
		    'Correct final order');
		t.end();
	});
});


test('Shared file locks (sync)', function (t) {
	syncTestRun(t, PATH_FILE, mod_lockfd.LOCK_SH, function (results) {
		t.deepEqual(results, [ 'workload 2', 'workload 1' ],
		    'Correct final order');
		t.end();
	});
});
