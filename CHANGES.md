# node-lockfd changelog

## not yet released

(nothing yet)

## 1.2.0

- joyent/node-lockfd#7: Node v4 support
- joyent/node-lockfd#6: *Removes* the flock(3C) support added in
  joyent/node-lockfd#5. See the master branch and 2.x releases for
  that functionality.

## 1.1.0

*WARNING*: This release has been re-branded "2.0.0" because it broke
compatibility by raising the mininum SmartOS platform requirement to one
that includes flock(3C) -- OS-2868, platform versions after 20150218.

- joyent/node-lockfd#5 Add support for flock(3C) 

## 1.0.1

- Allow `require('lockfd')` import to work.

## 1.0.0

- Bump v8plus dep to 0.3.1.

## 0.0.3

- Improved error handling.

## earlier

See the commit log.
