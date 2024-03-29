# gulp-mongodb-data

[![Build status](https://dev.azure.com/Benne/gulp-mongodb-data/_apis/build/status/gulp-mongodb-data%20CI)](https://dev.azure.com/Benne/gulp-mongodb-data/_build/latest?definitionId=3) [![npm](https://img.shields.io/npm/v/gulp-mongodb-data.svg)](https://www.npmjs.com/package/gulp-mongodb-data)

Load JSON files and mongoexport dumps into MongoDB with Gulp

## **Important!** Repository archived 2021-04-21

I have decided to archive this project due lack of available time for maintenance. If you feel that you have what it takes to be the maintainer of this repo and NPM package, feel free to reach out to me. 😉

## Information

<table>
<tr>
<td>Package</td><td>gulp-mongodb-data</td>
</tr>
<tr>
<td>Description</td>
<td>Load JSON files and mongoexport dumps into MongoDB with Gulp (gulpjs.com)</td>
</tr>
<tr>
<td>Tested Node Versions</td>
<td>10.22.1, 12.19.0, 14.14.0, 15.0.1 (on Ubuntu)</td>
</tr>
<td>Tested against MongoDB</td>
<td>3.6.8</td>
</tr>
<tr>
<td>Gulp Version</td>
<td>4.x</td>
</tr>
</table>

## Usage

### Install

```bash
$ npm install gulp-mongodb-data --save-dev
```

### Example

```js
var gulp = require('gulp')
var mongodbData = require('gulp-mongodb-data')

// Load JSON files, with arrays of objects, or data dumps from mongoexport,
// into the specified MongoDB server, using file names as collection names
gulp.task('metadata', function() {
  gulp.src('./db/metadata/*.json')
    .pipe(mongodbData({
      mongoUri: 'mongodb://localhost',
      databaseName: 'mydb'
    }))
})

// Load JSON files, with arrays of objects, or data dumps from mongoexport,
// into the specified MongoDB server, using file names as collection names,
// and retain the _id data type (useful for when using strings or numbers as
// _id)
gulp.task('metadata', function() {
  gulp.src('./db/metadata/*.json')
    .pipe(mongodbData({
      mongoUri: 'mongodb://localhost',
      databaseName: 'mydb',
      idAsObjectID: false
    }))
})

// Load JSON file, with array of objects, or data dumps from mongoexport,
// into the specified MongoDB server, using the specified collection name
gulp.task('metadata', function() {
  gulp.src('./db/metadata/users-test.json')
    .pipe(mongodbData({
      mongoUri: 'mongodb://localhost',
      databaseName: 'mydb',
      collectionName: 'users'
    }))
})

// Load JSON file, with array of objects, or data dumps from mongoexport,
// into the specified MongoDB server, using the specified collection name,
// and dropping the collection before bulk inserting data
gulp.task('metadata', function() {
  gulp.src('./db/metadata/users-test.json')
    .pipe(mongodbData({
      mongoUri: 'mongodb://localhost',
      databaseName: 'mydb',
      collectionName: 'users',
      dropCollection: true
    }))
})
```

### JSON files

JSON files should be formatted as an array of valid JSON objects for the plugin
to be able to process it. You can even include a specific Object ID.

```js
[{
  "a": 1
},
{
  "_id": "578611d17c8a27dd5b329fd5",
  "a": 2
},
...]
```

The ```_id``` field is usually converted to an ObjectID before inserting,
if ```_id``` is a string. By setting the ```idAsObjectID``` option to false,
you can use any supported data type as ```_id``` (except arrays).

```js
[{
  "_id": "697d1942-47bc-4fc5-ac92-6e8b1dbb649f",
  "a": 1
},
{
  "_id": 13.37,
  "a": 2
},
{
  "_id": true,
  "a": 3
},
...]
```

JSON files containing data dumps from mongoexport can also be used.

```js
{"_id":{"$oid":"5787d450596cca272cab90ba"},"first":"Brian","last":"Flanagan","birthdate":{"$date":"1962-07-03T00:00:00.000Z"},"appearance":1,"male":true}
{"_id":{"$oid":"5787d450596cca272cab90bb"},"first":"Doug","last":"Coughlin","birthdate":{"$date":"1947-06-23T00:00:00.000Z"},"appearance":2,"male":true}
{"_id":{"$oid":"5787d450596cca272cab90bc"},"first":"Jordan","last":"Mooney","birthdate":{"$date":"1963-10-06T00:00:00.000Z"},"appearance":3,"male":false}
```

## License

(MIT License)

Copyright (c) 2020 Benne <benne@chaosbyte.com>

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
