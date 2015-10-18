## promise-class [![Build Status](https://travis-ci.org/icodeforlove/node-promise-class.png?branch=master)](https://travis-ci.org/icodeforlove/node-promise-class)
easy promises,  coroutines, and a few other goodies!

- by having a **$deferred** argument in a method you now have a function that returns a 
promise.
- by having a **$deferred** argument in a generator method its now a coroutine 

[promise-class](https://github.com/icodeforlove/node-promise-class) is the new [promise-object](https://github.com/icodeforlove/node-promise-object)

coroutines in PromiseClass are 15x faster than PromiseObject ;)

## requirements

you must be using at minimum node **4.0.0** with the **--harmony** option, we are living on the edge here

## usage

here is an example class that looks up information on a user

```javascript
var PromiseClass = require('promise-class');
var database = ...;

PromiseClass(class User {
	static *find ($deferred, id) {
		$deferred.resolve({
        	details: yield this.getDetails(id),
            friends: yield this.getFriends(id)
        });
    }
    
    static *getDetails($deferred, id) {
    	$deferred.resolve(yield database.query(...));
    }
    
    static *getFriends($deferred, id) {
    	$deferred.resolve(yield database.query(...));
    }
});

PromiseClass.wrap(function *() {
	var user = yield User.find(123);
})();
```


## installation
	npm install promise-class

```
node --harmony script.js
```

## native promises?

by default **PromiseClass** will use **BlueBird** for promises if its in your node_modules directory.

if you would like to use another Promise library you can do the following

```javascript
PromiseClass.setPromise(Q);
```


## pseudo params
there are a few rules with these params

* if you want to use **$deferred** it MUST be the first param
* any other pseudo param must be before any real params

these pseudo params are supported

* **$deferred** converts the method into a deferred method
* **$class** returns the class
* **$self** alternative to var self = this;
* **$\*config**,  **$\*settings**, **$\*options** ensures that the first argument is an object

## $\*config / $\*settings / $\*options
helper that makes working with $config objects a little easier

```javascript
PromiseClass(class User {
	constructor ($config) {
		this._name = $config.name;
    }
});

new User({name: 'joe'});
new User(); // this does not error out because the argument was replaced with an empty object
```

this would allow you to call the class method via `Class.method`

## $deferred / promises
promoise-object is promise library agnostic, you initialize the wrapper by passing in the promise library you are using.

below is an example of using promises and showing errors

```javascript
PromiseClass(class User {
	constructor (name) {
    	this._name = name;
    }
    
    getInfo ($deferred, error) {
		setTimeout(function () {
			if (error) {
				$deferred.reject(new Error('Something went wrong'));
			} else {
				$deferred.resolve({age: 12});
			}
		}, 1000);
	}
});

PromiseClass.wrap(function * {
	var joe = new User('joe');
    
	yield joe.getInfo(false);
    
    try {
    	joe.getInfo(true);
    } catch (error) {
    	console.log(error);
    }
})();
```

## coroutines

any method that is a generator, and has the $deferred argument automatically becomes a coroutine

```javascript
  *getInfo ($deferred) {
      var one = yield this.getSomething();
      $deferred.resolve(one);
  }
```


## reopen
you can add methods to an instance by passing them via `.reopen` like this

```javascript
var user = new User();

user.reopen({
	*getName ($deferred, $self) {
		setTimeout(function () {
			$deferred.resolve($self._name);
		}, 1000);
	}
});
```

and you can add methods to a class like this

```javascript
User.reopen({
	*getName ($deferred, $self) {
		setTimeout(function () {
			$deferred.resolve($self._name);
		}, 1000);
	}
});
```

when you should not reopen and override existing methods because you cant use super 

## mixins
```javascript
var Mixin =  {
	getRandomNumber () {
		return Math.random();
	}
};

var Mixin2 = {
	getRandomNumberDeferred ($deferred) {
		$deferred.resolve(Math.random());
	},
    
    *getRandomNumberCoroutine ($deferred) {
    	yield this.getRandomNumberDeferred();
	}
};

PromiseClass(class Class {
}, Mixin, Mixin2);

// examples
var example = new Class();

example.getRandomNumber();

example.getRandomNumberDeferred().then(function (number) {
	console.log(number);
});

example.getRandomNumberCoroutine().then(function (number) {
	console.log(number);
});
```

mixins should only use initialize to store instance vars

```javascript
var Mixin =  {
	initialize () {
		this._tags = [];
	},
    
    get length () {
    	return this._tags.length;
    },

	hasTag (tag) {
		return this._tags.indexOf(tag) !== -1;
	},

	addTag (tag) {
		if (this.hasTag(tag)) return;

		this._tags.push(tag);
	}
};
```

## anonymous classes
by default PromiseClasses are global in your file (not app), you can change this by doing the following

```
var User = PromiseClass.anonymous(class User {
});
```

or

```
var User = PromiseClass.anonymous(class {
});
```