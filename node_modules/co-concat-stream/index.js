var read = require('co-read');

module.exports = function* (stream, opts) {
  opts = opts || {};
  var limit = opts.limit || Infinity;
  var body = [];
  var length = 0;
  var data;
  while(data = yield read(stream)) {
    if(length >= limit) {
      break;
    } else if(length + data.length > limit) {
      body.push(data.slice(0, limit - length));
    } else {
      body.push(data);
    }
    length += data.length;
  }
  return !body.length
      ? null
    : Buffer.isBuffer(body[0])
      ? Buffer.concat(body, length)
    : typeof body[0] == 'string'
      ? body.join('')
    : Array.isArray(body[0])
      ? [].concat.apply([], body)
    : body;
};
