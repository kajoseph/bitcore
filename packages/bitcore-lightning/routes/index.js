import express from 'express';
import cors from 'cors';
import { api as config } from '../config.js';
import logger from '../logger.js';
import * as middleware from '../middleware.js';
import { channelRouter } from './channel.js';

const app = express();

app.use(cors(config.cors));
app.use(middleware.authorization);

app.use('/channel', channelRouter);


app.post('/', middleware.authorization, (req, res) => {
  logger.debug('found you!');
  res.send({ data: 'got it' });
});

app.listen(config.port);