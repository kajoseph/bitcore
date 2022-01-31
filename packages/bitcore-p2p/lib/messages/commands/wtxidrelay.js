'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var utils = require('../utils');
var $ = bitcore.util.preconditions;
var BufferUtil = bitcore.util.buffer;

/**
 * @param {Array=} arg
 * @param {Object} options
 * @extends Message
 * @constructor
 */
function WTXIDRelayMessage(arg, options) {
  Message.call(this, options);
  this.command = 'wtxidrelay';
}
inherits(WTXIDRelayMessage, Message);

WTXIDRelayMessage.prototype.setPayload = function(payload) {
  $.checkArgument(payload.length === 0, 'Expected an empty payload for ' + this.command);
};

WTXIDRelayMessage.prototype.getPayload = function() {
  return BufferUtil.EMPTY_BUFFER;
};

module.exports = WTXIDRelayMessage;
