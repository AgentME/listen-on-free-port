/* @flow */

type Server = {
  listen: Function;
  addListener: Function;
  removeListener: Function;
};

const MAX_PORT = 65535;

export default async function listenOnFreePort<S: Server>(
  portOrRange: number|[number, number],
  extraListenArgs: ?Array<any>,
  createFn: ()=>S
): Promise<S> {
  let lowPort, highPort;
  if (typeof portOrRange === 'number') {
    lowPort = portOrRange;
    highPort = MAX_PORT;
  } else {
    lowPort = portOrRange[0];
    highPort = Math.min(MAX_PORT, portOrRange[1]);
  }

  let lastErr = null;
  for (let port=lowPort; port<=highPort; port++) {
    const server = createFn();
    let errorHandler;
    try {
      await new Promise((resolve, reject) => {
        errorHandler = reject;
        server.addListener('error', errorHandler);
        server.listen(port, ...(extraListenArgs || []), err => {
          if (err)
            reject(err);
          else
            resolve();
        });
      });
      server.removeListener('error', errorHandler);
      return server;
    } catch(err) {
      server.removeListener('error', errorHandler);
      if (!err || err.code !== 'EADDRINUSE') {
        throw err;
      }
      lastErr = err;
    }
  }
  throw lastErr || new Error("Failed to find free port");
}
