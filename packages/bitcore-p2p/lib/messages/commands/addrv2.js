'use strict';

var Message = require('../message');
var inherits = require('util').inherits;
var bitcore = require('bitcore-lib');
var utils = require('../utils');
var $ = bitcore.util.preconditions;
var _ = bitcore.deps._;
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;

/**
 * @param {Array=} arg - An array of V2 addrs
 * @param {Object=} options
 * @extends Message
 * @constructor
 */
function AddrV2Message(arg, options) {
  Message.call(this, options);
  this.command = 'addrv2';
  $.checkArgument(
    _.isUndefined(arg) ||
      (Array.isArray(arg) &&
       !_.isUndefined(arg[0].services) &&
       !_.isUndefined(arg[0].ip) &&
       !_.isUndefined(arg[0].port)),
    'First argument is expected to be an array of addrs'
  );
  this.addresses = arg;
}
inherits(AddrV2Message, Message);

AddrV2Message.prototype.setPayload = function(payload) {
  var parser = new BufferReader(payload);

  var addrCount = parser.readVarintNum();

  this.addresses = [];
  for (var i = 0; i < addrCount; i++) {
    // todo: time only available on versions >=31402
    var time = new Date(parser.readUInt32LE() * 1000);

    var addr = utils.parseAddrV2(parser);
    addr.time = time;
    this.addresses.push(addr);
  }

  utils.checkFinished(parser);
};

AddrV2Message.prototype.getPayload = function() {
  var bw = new BufferWriter();
  bw.writeVarintNum(this.addresses.length);

  for (var i = 0; i < this.addresses.length; i++) {
    var addr = this.addresses[i];
    bw.writeUInt32LE(addr.time.getTime() / 1000);
    utils.writeAddrV2(addr, bw);
  }

  return bw.concat();
};

module.exports = AddrV2Message;
