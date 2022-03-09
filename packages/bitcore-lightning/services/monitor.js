import config from '../config.js';
import logger from '../logger.js';
import fs from 'fs';


class MonitorService {
  rpc;

  constructor() {
  }

  async start() {
    logger.info('Starting Monitor Service');

    const dirs = fs.readdirSync('./monitors');
    for (let monitorFile of dirs) {
      const monitor = monitorFile.split('.')[0];

      if (config.monitors[monitor] && config.monitors[monitor].enabled) {
        await import('../monitors/' + monitorFile).then(mon => mon.default.start());
      }
    }
    
    logger.info('Sucessfully Started Monitor Service');
  }

}

export let Monitor = new MonitorService();