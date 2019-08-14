
<!--
    Copyright 2016, Joyent, Inc.
-->

# node-lockfd

This repository is part of the Joyent Triton project. See the [contribution
guidelines](https://github.com/joyent/triton/blob/master/CONTRIBUTING.md) --
*Triton does not use GitHub PRs* -- and general documentation at the main
[Triton project](https://github.com/joyent/triton) page.

A trivial wrapper around [flock(3C)](https://illumos.org/man/3C/flock) and
`fcntl(F_SETLKW)`. The provided interfaces presently allow a synchronous or
asynchronous call to get a whole-file, exclusive, advisory write lock on a file,
or to block until one is possible. The `flock()` wrappers additionally allow
acquiring a shared lock.

This module has been crafted specifically to work on SmartOS, and may not work
anywhere else. The `flock` functions manipulate Open File Description (OFD)
style advisory locks, while the `lockfd` family of functions manipulate
POSIX-style advisory locks. Please see the `FILE LOCKING` section of
[fcntl(2)](http://illumos.org/man/2/fcntl#file-locking) for more details on the
locking semantics of each style. In general, the lock will be released when
either the file descriptor is closed, or the process exits. The manual page
contains information on exceptions to this behaviour.

Note that `flock()` was added to libc in SmartOS in the 20150219 release, so
building and running on older platforms will fail.

## Building

Experimenetal support exists for Linux with node 6.

### CentOS 7

```
$ sudo yum install -y gcc-c++ libuv-devel nodejs-devel
```

### Ubuntu 18.04

```
$ curl https://nodejs.org/dist/v6.17.1/node-v6.17.1-linux-x64.tar.gz | sudo tar xzf - -C /opt
$ export PATH=/opt/node-v6.17.1-linux-x64/bin:$PATH
```

### Common

```
$ git clone -b portable https://github.com/mgerdts/node-lockfd.git
$ cd node-lockfd
$ npm install
```

## Usage

### lockfd(fd, callback)

Will attempt to lock the open file descriptor `fd` as described above.  Once
the lock is acquired, or an error condition manifests, `callback(err)` will be
called.

### lockfdSync(fd)

Synchronous version of `lockfd(fd)`.

### flock(fd, op, callback)

This will call [flock(3C)](http://illumos.org/man/3C/flock) and perform the
specified operation, which is a bitwise inclusive OR of LOCK\_SH, LOCK\_EX,
LOCK\_UN, and LOCK\_NB. These constants are exported with this module for
convenience. Once the operation completes, the callback will be invoked.

### flockSync(fd, op, callback)

Synchronous version of `flock(fd, op)`.

## Examples

```javascript
var mod_fs = require('fs');
var mod_lockfd = require('lockfd');

var fd = mod_fs.openSync('/tmp/.lockfile', 'r+');
console.error('open fd %d', fd);

console.error('locking file...');
mod_lockfd.lockfdSync(fd);
console.log('locked.');

/*
 * Do work...
 */

mod_fs.closeSync(fd);
process.exit(0);
```

Using OFD-style locking:


```javascript
var mod_fs = require('fs');
var mod_lockfd = require('lockfd');

var lockfileA = mod_fs.openSync('/tmp/.lockfile', 'r+');
var lockfileB = mod_fs.openSync('/tmp/.lockfile', 'r+');
console.error('opened fds %d and %d', lockfileA, lockfileB);

mod_lockfd.flock(lockfileA, mod_lockfd.LOCK_EX, function (err) {
    if (err) {
        throw err;
    }

    doSomeWork(function () {
        mod_lockfd.flockSync(lockfileA, mod_lockfd.LOCK_UN);
        mod_fs.closeSync(lockfileA);
    });
});

mod_lockfd.flock(lockfileB, mod_lockfd.LOCK_EX, function (err) {
    if (err) {
        throw err;
    }

    doConflictingWork(function () {
        mod_lockfd.flockSync(lockfileB, mod_lockfd.LOCK_UN);
        mod_fs.closeSync(lockfileB);
    });
});
```

## Testing

    make clean all test CTFCONVERT=/bin/true CTFMERGE=/bin/true

## License

MIT.
