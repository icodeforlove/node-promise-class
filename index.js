"use strict";

var co = require('./lib/co'),
	SelectedPromise = Promise;

const OPTIONS_REGEXP = /^\$.*[o|O]ptions$|\$.*[s|S]ettings$|\$.*[c|C]onfig$/;
const ARGUMENTS_REGEXP = /(?:^(?:function|)|constructor)\s*\*?[a-z0-9_$,\s]*\s*\(([a-z0-9_$,\s]+)\)/i

// if we have bluebird use it
try {
  SelectedPromise = require('bluebird');
} catch(e) {}

/**
 * slice() reference.
 */
var slice = Array.prototype.slice;

function deferPromise ()  {
	var result = {};
	result.promise = new SelectedPromise(function(resolve, reject) {
		result.resolve = function(value) {
			resolve(value);
		};
		result.reject = function(value) {
			reject(value);
		};
	});
	return result;
}

function getPseudoArgs (classConstructor, string) {
	var strictPsuedoArgs = ['$deferred', '$self', '$class'],
		match = string.match(ARGUMENTS_REGEXP);

	if (match) {
		var args = match[1].split(',').map(arg => arg.trim()),
			pseudoArgsInOrder = true;

		return args.map(function (arg, index) {
			if (strictPsuedoArgs.indexOf(arg) !== -1) {
				if (!pseudoArgsInOrder) {
					throw new Error(arg + ' was used after a non-pseudo argument');
				} else if (arg === '$deferred' && index !== 0) {
					throw new Error('$deferred argument on the "' + classConstructor.name + '" method has an arguments index of ' + index + ' and needs to be 0');
				}

				return arg;
			} else {
				pseudoArgsInOrder = false;

				if (arg.match(OPTIONS_REGEXP)) {
					return arg;
				} else {
					return null;
				}
			}
		});
	} else {
		return [];
	}
}

function wrapMethods (classConstructor, object, type, topLevelClassConstructor) {
	Object.getOwnPropertyNames(object).forEach(function (propertyName) {
		if (typeof object[propertyName] !== 'function' || !(object instanceof Object) || ['constructor'].indexOf(propertyName) !== -1) {
			return;
		}

		var funcString = object[propertyName].toString(),
			func = object[propertyName],
			isGenerator = func.constructor.name === 'GeneratorFunction',
			psuedoArgs = getPseudoArgs(classConstructor, funcString),
			hasPseudoArgs = psuedoArgs.filter(item => item).length;

		object[propertyName] = function () {
			var actualArgs = slice.call(arguments),
				scope = this;

			if (hasPseudoArgs) {
				var resolver;

				if (psuedoArgs.indexOf('$deferred') !== -1) {
					resolver = deferPromise();
				}

				var args = psuedoArgs.map(function (arg) {
					if (!arg) {
						return actualArgs.shift();
					} else if (arg === '$deferred') {
						return resolver;
					} else if (arg === '$self') {
						return scope;
					} else if (arg === '$class') {
						if (type === 'class') {
							return scope;
						} else {
							return topLevelClassConstructor;
						}
					} else if (arg.match(OPTIONS_REGEXP)) {
						return actualArgs.shift() || {};
					}
				});

				if (resolver) {
					if (isGenerator) {
						co.wrap(func).apply(scope, args).then(null, function (error) {
							resolver.reject(error);
						});
					} else {
						func.apply(scope, args);
					}

					return resolver.promise;
				} else {
					return func.apply(scope, args);
				}
			} else {
				return func.apply(scope, actualArgs);
			}
		};
	});
}

// function getConstructorArgumentNames (classConstructor) {
// 	var match = String(classConstructor).match(/constructor\s*\(([^\)]+)\)/);

// 	if (match) {
// 		return match[1].split(',').map(item => item.trim());
// 	} else {
// 		return [];
// 	}
// }

function wrapClass (classConstructor, mixins, isAnonymous) {
	var className = classConstructor.name || 'Anonymous';

	var mixinInitializers = [];
	mixins.forEach(function (mixin) {
		for (var propertyName in mixin) {
			if (propertyName === 'initialize') {
				mixinInitializers.push(mixin[propertyName]);
			}
		}
	});

	var topLevelClassConstructor = function(str){return eval(str)}.call(
		{
			classConstructor: classConstructor,
			classConstructorArgumentNames: getPseudoArgs(classConstructor, String(classConstructor)),
			mixinInitializers: mixinInitializers
		}, `
		var mixinInitializers = this.mixinInitializers,
			classConstructorArgumentNames = this.classConstructorArgumentNames;

		class ${className} extends this.classConstructor {
			constructor(...actualArgs) {
				var args = classConstructorArgumentNames.slice(0);

				super(...args.map(function (arg, index) {
					var argumentName = classConstructorArgumentNames[index];
					
					if (!arg) {
						return actualArgs.shift();
					} else if (arg === '$self') {
						throw new Error('Cannot use $self in a constructor');
					} else if (arg === '$class') {
						return ${className};
					} else if (arg.match(OPTIONS_REGEXP)) {
						return actualArgs.shift() || {};
					} else {
						throw new Error('Unhandled psuedo argument' + arg);
					}
				}));

				mixinInitializers.forEach(function (initializer) {
					initializer.call(this);
				}, this);
			}
		}
	`);

	wrapMethods(classConstructor, classConstructor, 'class', topLevelClassConstructor);
	wrapMethods(classConstructor, classConstructor.prototype, 'prototype', topLevelClassConstructor);

	mixins.forEach(function (mixin) {
		wrapMethods(classConstructor, mixin, 'prototype', topLevelClassConstructor);

		for (var propertyName in mixin) {
			if (propertyName === 'initialize') {
				continue;
			}
			var existingDescriptor = Object.getOwnPropertyDescriptor(classConstructor.prototype, propertyName);

			if (existingDescriptor) {
				throw new Error('Mixin: "' + propertyName + '" collision, cannot override class methods/props, or other mixins');
			}

			var descriptor = Object.getOwnPropertyDescriptor(mixin, propertyName);
			Object.defineProperty(classConstructor.prototype, propertyName, descriptor);
		}
	});

	classConstructor = topLevelClassConstructor;

	if (!isAnonymous) {
		// Make class public
		;(new Function('constructorObject', className + ' = constructorObject')).call(null, classConstructor);
	}

	classConstructor.reopen = function (methods) {
		wrapMethods(classConstructor, methods, 'class');
		for (var propertyName in methods) {
			var descriptor = Object.getOwnPropertyDescriptor(methods, propertyName);
			Object.defineProperty(classConstructor, propertyName, descriptor);
		}
	};

	classConstructor.prototype.reopen = function (methods) {
		wrapMethods(classConstructor, methods, 'prototype');

		for (var propertyName in methods) {
			var descriptor = Object.getOwnPropertyDescriptor(methods, propertyName);
			Object.defineProperty(this, propertyName, descriptor);
		}
	};

	return classConstructor;
}

module.exports = function (classConstructor) {
	var mixins = slice.call(arguments, 1);
	return wrapClass(classConstructor, mixins);
};
module.exports.each = function (objects, func) {
	if (func.constructor.name === 'GeneratorFunction') {
		func = co.wrap(func);
	}

	return new SelectedPromise (function (resolve, reject) {
	    var length = 0;

	    function next() {
	        if (length < objects.length) {
	            func(objects[length++]).then(next, reject);
	        } else {
	        	resolve();
	        }
	    }
	    next();
	});
}
module.exports.wrap = co.wrap;
module.exports.anonymous = function (classConstructor) {
	var mixins = slice.call(arguments, 1);
	return wrapClass(classConstructor, mixins, true);
};
module.exports.setPromise = function (newPromise) {
	SelectedPromise = newPromise;
	co.setPromise(newPromise);
};