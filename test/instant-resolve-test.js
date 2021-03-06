"use strict";

var vows = require('vows'),
	assert = require('assert'),
	BlueBird = require('bluebird'),
	PromiseClass = require('../index');

var Class1 = PromiseClass.anonymous(class Class1 {
	constructor () {

	}

	checkNumbers ($deferred, numbers) {
		BlueBird.map(numbers, this.checkNumber).then(
			function (result) {
				$deferred.resolve(result);
			},
			function (error) {
				$deferred.reject(error);
			}
		);
	}

	checkNumber ($deferred, number) {
		if (number % 2 === 0) {
			setTimeout(function () {
				$deferred.resolve(number);
			}, 0);
		} else {
			$deferred.resolve(number);
		}
	}
});

var suite = vows.describe('Instant Resolve');
suite.addBatch({
	'mapUnfulfilled with instant resolve': {
		topic: function () {
			var self = this;

			var example = new Class1();
			example.checkNumbers([1,2,3,4]).then(function (numbers) {
				self.callback(null, numbers);
			});
		},

		'expected params': function (numbers) {
			assert.deepEqual(numbers, [1,2,3,4]);
		}
	}
});

exports.suite = suite;