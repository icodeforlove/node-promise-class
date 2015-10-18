"use strict";

var vows = require('vows'),
	assert = require('assert'),
	BlueBird = require('bluebird'),
	PromiseClass = require('../index');

var DeferredTest = PromiseClass.anonymous(class DeferredTest {
	doSomething ($deferred, $self, _count) {
		setTimeout(function () {
			_count++;

			if (_count === 5) {
				$deferred.reject(new Error('errored'));
			} else {
				$self.doSomething(_count).then(function () {
					$deferred.resolve();
				}, function (error) {
					$deferred.reject(error);	
				});
			}
		}, 0);
	}

	*doSomethingGenerator ($deferred, _count) {
		_count++;

		if (_count === 5) {
			$deferred.reject(new Error('errored'));
		} else {
			yield $self.doSomething(_count);
		}
	}
});

var suite = vows.describe('Errors Extension');
suite.addBatch({
	'Test Deferred Errors': {
		topic: function () {
			var self = this;

			var example = new DeferredTest();

			example.doSomething(0).then(function () {
				self.callback(null, {object: example, value: value});
			}, function (error) {
				self.callback(null, error);
			});
		},

		'did error fire': function (topic) {
			assert.equal(topic instanceof Error, true);
		}
	},

	'Test Deferred Generator Errors': {
		topic: function () {
			var self = this;

			var example = new DeferredTest();

			example.doSomethingGenerator(0).then(function () {
				self.callback(null, {object: example, value: value});
			}, function (error) {
				self.callback(null, error);
			});
		},

		'did error fire': function (topic) {
			assert.equal(topic instanceof Error, true);
		}
	}
});
exports.suite = suite;