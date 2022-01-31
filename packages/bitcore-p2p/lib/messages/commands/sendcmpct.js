'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var utils = require('../utils');
var BN = bitcore.crypto.BN;
var $ = bitcore.util.preconditions;
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;

/**
 * @param {Object=} arg
 * @param {Boolean} arg.announce 
 * @param {Number} arg.version
 * @param {Object=} options
 * @extends Message
 * @constructor
 */
function SendCmpctMessage(arg, options) {
  Message.call(this, options);
  this.command = 'sendcmpct';
  if (!arg) {
    arg = {};
  }

  this.announce = arg.announce;
  this.version = new BN(arg.version || 0);
}
inherits(SendCmpctMessage, Message);

SendCmpctMessage.prototype.setPayload = function(payload) {
  var parser = new BufferReader(payload);
  $.checkArgument(!parser.finished(), 'No data received in payload');

  this.announce = parser.readUInt8();
  this.version = parser.readUInt64LEBN().toString();
  
  utils.checkFinished(parser);
};

SendCmpctMessage.prototype.getPayload = function() {
  var bw = new BufferWriter();

  bw.writeUInt8(this.announce || 0);
  bw.writeUInt64LEBN(this.version);

  return bw.concat();
};

module.exports = SendCmpctMessage;
