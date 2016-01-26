# cubx-webpackage-uploader

[![npm][npm-image]][npm-url]

This lib is part of the Cubbles platform. Use this lib to upload webpackages from Client to Base.

## Install

```sh
$ npm install -g cubx-webpackage-uploader
```

## Usage
```js
var uploader = require('cubx-webpackage-uploader')();
var uploaderConfig = {
    'source': '/packages/my-package1',
    'target': {
        'url': 'http://boot2docker.me',
        'proxy': ''
    },
    'debug': false
};
}
uploader.uploadSingleWebpackage(uploaderConfig, function(err, success) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(success);
    }
});
```

## CLI

### Configuration

You can pass the config via _config.json_ -File

Config structure:

```
# config.json
{
    'source': '/packages/my-package1',
    'target': {
        'url': 'http://boot2docker.me',
        'proxy': ''
    },
    'debug': false
};
```

* **source:** {string-path} (default == '.') Points to the folder containing the webpackage.
* **target.url:** {string-url} (default == https://boot2docker.me/sandbox) Url of the Base you want to upload your webpackage to.
* **target.proxy:** {string-url} (default == '') (optional) Proxy-Url, if your are behind a proxy.
* **debug:** {boolean} (default == false);


### Run (standalone)

    cubx-webpackage-uploader <config path e.g. ./folder/config.json>
