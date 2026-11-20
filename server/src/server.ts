import { createApp } from './app';
import { config } from './config';

/** Starts the MADD API on the configured port. */
function start() {
  createApp().listen(config.port, () => {
    console.log(`MADD server running on http://localhost:${config.port}`);
  });
}

start();
