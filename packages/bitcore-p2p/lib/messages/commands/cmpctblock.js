'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var $ = bitcore.util.preconditions;
var BufferUtil = bitcore.util.buffer;

/**
 * @param {Array=} arg
 * @param {Object=} options
 * @extends Message
 * @constructor
 */
function CmpctBlockMessage(arg, options) {
  Message.call(this, options);
  this.command = 'cmpctblock';
}
inherits(CmpctBlockMessage, Message);

CmpctBlockMessage.prototype.setPayload = function(payload) {
  $.checkArgument(payload.length === 0, 'Expected an empty payload for ' + this.command);
};

CmpctBlockMessage.prototype.getPayload = function() {
  return BufferUtil.EMPTY_BUFFER;
};

module.exports = CmpctBlockMessage;
