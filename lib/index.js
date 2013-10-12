/* vim: set syntax=javascript ts=8 sts=8 sw=8 noet: */

var b = require('./filelock_binding');

function
lockfd(fd, callback)
{
	b.lock_fd(fd, "write", false, function (ret, errno, errmsg) {
		if (ret === -1) {
			var err = new Error('File Locking Error: ' + errmsg);
			err.__errno = errno;

			callback(err);
			return;
		}

		callback(null);
	});
}

function
lockfdSync(fd)
{
	var cb_fired = false;
	var err;

	b.lock_fd(fd, "write", true, function (ret, errno, errmsg) {
		cb_fired = true;

		if (ret === -1) {
			err = new Error('File Locking Error: ' + errmsg);
			err.__errno = errno;
			return;
		}
	});

	if (!cb_fired) {
		throw (new Error('lockfdSync: CALLBACK NOT FIRED'));
	} else if (err) {
		throw (err);
	}

	return (null);
}

module.exports = {
	lockfd: lockfd,
	lockfdSync: lockfdSync
};
