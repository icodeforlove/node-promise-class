"use strict";

var vows = require('vows'),
	assert = require('assert'),
	BlueBird = require('bluebird'),
	PromiseClass = require('../index'),
	EventsMixin = require('../mixins/events');

var Class = PromiseClass.anonymous(class Class {
	constructor () {
		this.foo = 'foo';
	}

	*test ($deferred, $self) {
		setTimeout(this.boundMethod, 0);
		yield BlueBird.delay(20);
		$deferred.resolve(this.foo);
	}

	boundMethod ($self) {
		this.foo = 'bar';
	}

	static whatsMyScope () {
		return this;
	}

	static *whatsMyScopeDeferred ($deferred) {
		$deferred.resolve(this);
	}
}, EventsMixin);

var suite = vows.describe('Scope Tests');

suite.addBatch({
	'Basic Scope Test': {
		topic: function () {
			var self = this,
				example = new Class();

			example.test().then(function () {
				self.callback(false, example);
			});
		},

		'did we update the right scope': function (topic) {
			assert.equal(topic.foo, 'bar');
		}
	},

	'Class Scope Test': {
		topic: function () {
			return Class.whatsMyScope();
		},

		'do we have the right scope': function (topic) {
			assert.equal(topic, topic);
		}
	},

	'Class Deferred Scope Test': {
		topic: function () {
			var self = this;

			Class.whatsMyScopeDeferred().then(function (scope) {
				self.callback(false, scope);
			});
		},

		'do we have the right scope': function (topic) {
			assert.equal(topic, topic);
		}
	}
});

exports.tests = suite;