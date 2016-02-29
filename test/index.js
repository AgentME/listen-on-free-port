/* @flow */

import assert from 'assert';
import {EventEmitter} from 'events';
import sinon from 'sinon';
import net from 'net';

import listenOnFreePort from '../src';

describe("listenOnFreePort", function() {
  describe("integration", function() {
    it("can run one server", async function() {
      const s = await listenOnFreePort(1234, null, ()=>net.createServer());
      assert(s instanceof net.Server);
      assert.strictEqual((s:any).listenerCount('error'), 0);
    });

    it("can run two servers", async function() {
      const s = await listenOnFreePort(1234, null, ()=>net.createServer());
      assert(s instanceof net.Server);
      assert.strictEqual((s:any).listenerCount('error'), 0);
    });
  });

  describe("mock", function() {
    class ErrorCallbackMockServer extends EventEmitter {
      _port = null;
      listen(port, cb) {
        assert.strictEqual(this._port, null);
        this._port = port;
        cb({code: 'EADDRINUSE', port});
      }
    }

    class ErrorEventMockServer extends EventEmitter {
      _port = null;
      listen(port, cb) {
        assert.strictEqual(this._port, null);
        this._port = port;
        this.emit('error', {code: 'EADDRINUSE', port});
      }
    }

    class NonEADDRINUSEMockServer extends EventEmitter {
      _port = null;
      listen(port, cb) {
        assert.strictEqual(this._port, null);
        this._port = port;
        this.emit('error', new Error("Foo"));
      }
    }

    class HostnameRecorderMockServer extends EventEmitter {
      _port = null;
      _hostname = null;
      listen(port, hostname, cb) {
        assert.strictEqual(this._port, null);
        this._port = port;
        this._hostname = hostname;
        this.emit('error', {code: 'EADDRINUSE', port});
      }
    }

    it("only scans given range, with error callbacks", async function() {
      const mockServers = [];
      try {
        await listenOnFreePort([1000, 1010], null, ()=>{
          const s = new ErrorCallbackMockServer();
          mockServers.push(s);
          return s;
        });
        throw new Error("Should not reach this");
      } catch (err) {
        assert.strictEqual(err.code, 'EADDRINUSE');
        assert.strictEqual(err.port, 1010);
      }

      assert.strictEqual(mockServers.length, 11);
      mockServers.forEach((mockServer, i) => {
        assert.strictEqual(mockServer._port, i+1000);
        assert.strictEqual((mockServer:any).listenerCount('error'), 0);
      });
    });

    it("only scans given range, with error events", async function() {
      const mockServers = [];
      try {
        await listenOnFreePort([1000, 1010], null, ()=>{
          const s = new ErrorEventMockServer();
          mockServers.push(s);
          return s;
        });
        throw new Error("Should not reach this");
      } catch (err) {
        assert.strictEqual(err.code, 'EADDRINUSE');
        assert.strictEqual(err.port, 1010);
      }

      assert.strictEqual(mockServers.length, 11);
      mockServers.forEach((mockServer, i) => {
        assert.strictEqual(mockServer._port, i+1000);
        assert.strictEqual((mockServer:any).listenerCount('error'), 0);
      });
    });

    it("throws non-EADDRINUSE errors", async function() {
      const mockServers = [];
      try {
        await listenOnFreePort([1000, 1010], null, ()=>{
          const s = new NonEADDRINUSEMockServer();
          mockServers.push(s);
          return s;
        });
        throw new Error("Should not reach this");
      } catch (err) {
        assert.strictEqual(err.message, 'Foo');
      }

      assert.strictEqual(mockServers.length, 1);
      assert.strictEqual(mockServers[0]._port, 1000);
    });

    it("supports extraListenArgs", async function() {
      const mockServers = [];
      try {
        await listenOnFreePort([1000, 1010], ['localhost'], ()=>{
          const s = new HostnameRecorderMockServer();
          mockServers.push(s);
          return s;
        });
        throw new Error("Should not reach this");
      } catch (err) {
        assert.strictEqual(err.code, 'EADDRINUSE');
        assert.strictEqual(err.port, 1010);
      }

      assert.strictEqual(mockServers.length, 11);
      mockServers.forEach((mockServer, i) => {
        assert.strictEqual(mockServer._port, i+1000);
        assert.strictEqual(mockServer._hostname, 'localhost');
      });
    });

    it("throws errors from createFn", async function() {
      try {
        await listenOnFreePort([1000, 1010], null, ()=>{
          throw new Error("Bar");
        });
        throw new Error("Should not reach this");
      } catch(err) {
        assert.strictEqual(err.message, "Bar");
      }
    });
  });
});
