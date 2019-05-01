/* eslint-disable no-undef, no-negated-condition */
let ws: typeof WebSocket;
if (typeof window === 'undefined') ws = require('ws');
else if (typeof WebSocket !== 'undefined') ws = WebSocket;
else throw new Error('No WebSocket module found');

export { ws };
