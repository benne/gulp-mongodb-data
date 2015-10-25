# gulp-mongodb-data

> Load JSON files into MongoDB with Gulp

## Information

<table>
<tr>
<td>Package</td><td>gulp-mongodb-data</td>
</tr>
<tr>
<td>Description</td>
<td>Load JSON files into MongoDB with Gulp (gulpjs.com)</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 4.1.2</td>
</tr>
<tr>
<td>Gulp Version</td>
<td>3.x</td>
</tr>
</table>

## Usage

### Install

```bash
$ npm install gulp-mongodb-data --save
```

### Example

```js
var gulp = require('gulp');
var mongodb = require('gulp-mongodb-data')

// Loads JSON files with arrays of objects into the specified
// MongoDB server, using file names as collection names
gulp.task('metadata', function() {
	gulp.src('./db/metadata/*.json')
		.pipe(mongodb({ mongoUrl: 'mongodb://localhost/mydb' }));
});

// Loads JSON files with arrays of objects into the specified
// MongoDB server, using the specified collection name
gulp.task('metadata', function() {
	gulp.src('./db/metadata/users-test.json')
		.pipe(mongodb({
				mongoUrl: 'mongodb://localhost/mydb',
				collectionName: 'users'
		}));
});

// Loads JSON files with arrays of objects into the specified
// MongoDB server, using the specified collection name, and
// dropping the collection before bulk inserting data
gulp.task('metadata', function() {
	gulp.src('./db/metadata/users-test.json')
		.pipe(mongodb({
				mongoUrl: 'mongodb://localhost/mydb',
				collectionName: 'users',
				dropCollection: true
		}));
});

```

### JSON files

Json files should be formatted as an array of valid JSON objects for the plugin
to be able to process it.

```js
[{
	"a": 1
},
{
	"a": 2
},
...]
```

## License

(MIT License)

Copyright (c) 2015 Benne <benne@chaosbyte.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
