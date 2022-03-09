import https from 'https';
import http from 'http';
import logger from './logger.js';

class Request {
  constructor() {}

  async request(method, url, opts, body) {
    return new Promise((resolve, reject) => {
      try {
        logger.debug('Making request', { method, url, body });

        // Add default Content-Type header
        if (body) {
          opts.headers = opts.headers || {};
          opts.headers['Content-Type'] = 'application/json';
        }

        const httpLib = url.slice(0, 5) === 'https' ? https : http;

        const req = httpLib.request(url, { method, ...opts }, (res) => {
          try {
            const chunks = [];
            
            res.on('data', (chunk) => {
              chunks.push(...chunk);
            });

            res.on('end', () => {
              res.rawBody = Buffer.from(chunks);
              try {
                res.body = JSON.parse(res.rawBody.toString());
              } catch {
                res.body = res.rawBody ? res.rawBody.toString() : '';
              }

              const result = { statusCode: res.statusCode, message: res.body };

              if (res.statusCode >= 200 && res.statusCode < 300) {
                logger.debug('Successful request', { url })
                return resolve(result);
              }
              logger.warn('Failed request', { url, result });
              return reject(result.message);
            });
          } catch (err) {
            return reject(err);
          }
        });

        if (body) {
          req.write(this._serializeBody(body));
        }

        req.end();
      } catch (err) {
        return reject(err);
      }
    });
  }

  _serializeBody(body) {
    if (typeof body === 'object') {
      return JSON.stringify(body);
    }

    if (typeof body === 'function' || typeof body === 'symbol') {
      return '';
    }

    if (typeof body.toString === 'function') {
      return body.toString();
    }
    return body;
  }

  get(url, opts) {
    return this.request('GET', url, opts);
  }

  post(url, opts, body) {
    return this.request('POST', url, opts, body);
  }

  put(url, opts, body) {
    return this.request('PUT', url, opts, body);
  }

  delete(url, opts, body) {
    return this.request('DELETE', url, opts, body);
  }
}

export let request = new Request();
export default request;