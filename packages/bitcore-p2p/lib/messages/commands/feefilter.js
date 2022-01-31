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
 * @param {Array=} arg
 * @param {Object=} options
 * @extends Message
 * @constructor
 */
function FeeFilterMessage(arg, options) {
  Message.call(this, options);
  this.command = 'feefilter';
  if (!arg) {
    arg = {};
  }
  this.feeRate = new BN(arg.feeRate || 0);
}
inherits(FeeFilterMessage, Message);

FeeFilterMessage.prototype.setPayload = function(payload) {
  var parser = new BufferReader(payload);
  $.checkArgument(!parser.finished(), 'No data received in payload');

  this.feeRate = parser.readUInt64LEBN();

  utils.checkFinished(parser);
};

FeeFilterMessage.prototype.getPayload = function() {
  var bw = new BufferWriter();

  bw.writeUInt64LEBN(this.feeRate);

  return bw.concat();
};

module.exports = FeeFilterMessage;
