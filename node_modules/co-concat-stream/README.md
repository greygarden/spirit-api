# co-concat-stream

Concat stream contents, generator-style.

## Install

```
$ npm install co-concat-stream
```

## Usage

```js
var concat = require('co-concat-stream');

var content = yield* concat(fs.createReadStream(file))
```

## API

### concat(stream, opts)

Creates a generator, that yields with the content of the stream.
It stops reading after `opts.limit` bytes.

## License

MIT
