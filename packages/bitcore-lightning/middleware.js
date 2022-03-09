import crypto from 'crypto';
import { api as config } from './config.js';
import logger from './logger.js';

export async function authorization(req, res, next) {
  if (!config.authKey || config.authKey === 'example') {
    res.statusCode = 401;
    return res.send();
  }

  const headerTS = req.headers[config.headerPrefix + 'ts'];
  const headerHMAC = req.headers[config.headerPrefix + 'hmac'];

  if (!headerHMAC) {
    res.statusCode = 401;
    return res.send();
  }

  if (!headerTS) {
    res.statusCode = 401;
    return res.send();
  }

  const FIVE_SECONDS = 1000 * 5;

  // If timestamp is too old
  if (new Date(headerTS).getTime() < new Date().getTime() - FIVE_SECONDS) {
    res.statusCode = 406;
    return res.send();
  }

  await attachBody(req);

  const fullUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
  const computedHMAC = crypto.createHmac('SHA256', config.authKey)
                           .update(headerTS + req.method + fullUrl + req.bodyString)
                           .digest('base64');

  if (computedHMAC !== headerHMAC) {
    res.statusCode = 401;
    return res.send();
  }  

  next();
}

export async function attachBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(...chunk);
    });

    req.on('end', () => {
      req.body = null;
      req.bodyString = '';
      if (chunks.length) {
        try {
          req.bodyString = Buffer.from(chunks).toString();
          req.body = JSON.parse(req.bodyString);
        } catch (err) {
          logger.warn('Unable to parse body', { bodyString: req.bodyString });
        }
      }

      resolve();
    });
  });
}