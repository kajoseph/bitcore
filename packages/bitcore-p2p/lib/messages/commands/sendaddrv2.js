'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var $ = bitcore.util.preconditions;
var BufferUtil = bitcore.util.buffer;

/**
 * @param {Array=} arg - An array of addrs
 * @param {Object=} options
 * @extends Message
 * @constructor
 */
function SendAddrV2Message(arg, options) {
  Message.call(this, options);
  this.command = 'sendaddrv2';
}
inherits(SendAddrV2Message, Message);

SendAddrV2Message.prototype.setPayload = function(payload) {
  $.checkArgument(payload.length === 0, 'Expected an empty payload for ' + this.command);
};

SendAddrV2Message.prototype.getPayload = function() {
  return BufferUtil.EMPTY_BUFFER;
};

module.exports = SendAddrV2Message;
