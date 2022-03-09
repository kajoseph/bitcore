import express from 'express';
import { Storage } from '../services/storage.js';

const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.query.longChannelId) {
    res.statusCode = 400;
    return res.send('Missing longChannelId')
  }
  const channel = await Storage.model('Channels').findOne({ longChannelId: req.params.longChannelId });
  res.send({
    partnernPublicKey: channel.partnerPublicKey
  });
});

router.get('/all', async (req, res) => {
  const query = {};

  if (req.query['caplt'] && req.query['capgt']) {
    query.$and = [
      { capacity: { $lt: req.query['caplt'] } },
      { capacity: { $gt: req.query['capgt'] } }
    ];
  } else if (req.query['caplt']) {
    query.capacity = { $lt: req.query['caplt'] };
  } else if (req.query['capgt']) {
    query.capacity = { $gt: req.query['capgt'] };
  }

  const cursor = Storage.model('Channels').find(quer).cursor();

  cursor.on('data', (channel) => {
    res.write(channel);
  });

  cursor.on('end', () => {
    res.end();
  });

  cursor.on('error', (err) => {
    res.statusCode = 500;
    res.write(err.message);
  });
});

router.post('/sync', (req, res) => {
  // todo force a channel sync
});



export let channelRouter = router;