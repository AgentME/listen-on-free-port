# listen-on-free-port

[![Circle CI](https://circleci.com/gh/AgentME/listen-on-free-port.svg?style=shield)](https://circleci.com/gh/AgentME/listen-on-free-port)
[![npm version](https://badge.fury.io/js/listen-on-free-port.svg)](https://badge.fury.io/js/listen-on-free-port)

This module exports a function for finding a free port and listening to on it.

This module differs from other similar modules like
[find-port](https://github.com/kessler/find-port) because this module
leaves you with a server already listening on the first free port instead of
returning a number naming a free port for you to listen to. This avoids race
conditions where another program could start listening on a port between the
time find-port tells you it's free and you start listening to it yourself.

## listenOnFreePort(portOrRange, extraListenArgs, createFn)

`portOrRange` must be a number naming the first port to try to listen on, or an
array of two numbers specifying a range by the first and last allowable port
numbers.

`extraListenArgs` argument is an optional array of extra arguments to pass to
the `.listen` call after the port number. (This can be used to pass the
`hostname` and `backlog` arguments.) `null` will be treated as an empty array.

`createFn` must be a function which returns a server object. This function may
be called multiple times until a free port is found. The returned server object
must have a `listen` method and extend EventEmitter. The server object could be
a native node `net.Server` or `http.Server` object for example.

The function returns a Promise for the listening server object. This will be
the object returned from the last call to `createFn`.

## Example

```js
var net = require('net');
var listenOnFreePort = require('listen-on-free-port');

listenOnFreePort(1234, ['localhost'], () =>
  net.createServer(c => {
    console.log('client connected from', c.address().address);
    c.on('end', () => {
      console.log('client disconnected');
    });
    c.write('hello\r\n');
    c.pipe(c);
  })
).then(server => {
  console.log("Started listening on port", server.address().port);
}, err => {
  console.error("Failed to start server", err);
});
```

## Types

Full [Flow Type](http://flowtype.org/) declarations for this module are
included!
