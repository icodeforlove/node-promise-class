"use strict";

var vows = require('vows-harmony'),
	assert = require('assert'),
	PromiseClass = require('../index');

var Class = PromiseClass.anonymous(class Class {
	constructor () {

	}

	static getClassReference ($class) {
		return $class;
	}

	getClassReference ($class) {
		return $class;
	}

	static method () {
		return 'class method';
	}

	method () {
		return 'prototype method';
	}

	static deferredMethod ($deferred) {
		$deferred.resolve('class method');
	}

	deferredMethod ($deferred) {
		$deferred.resolve('prototype method');
	}
	
	static get stringProperty () {
		return 'class string';
	}

	get stringProperty () {
		return 'prototype string';
	}

	static get intProperty () {
		return 1;
	}

	get intProperty () {
		return 2;
	}

	static get objectProperty () {
		return {value: 1};
	}

	get objectProperty () {
		return {value: 2};
	}
});

var Class2 = PromiseClass.anonymous(class Class2 extends Class {
	static deferredMethod ($deferred) {
		super.deferredMethod().then(function (result) {
			$deferred.resolve(result + ' two');
		});
	}
});

var Class3 = PromiseClass.anonymous(class Class3 extends Class2 {
	static deferredMethod ($deferred) {
		super.deferredMethod().then(function (result) {
			$deferred.resolve(result + ' three');
		});
	}
});

var suite = vows.describe('Class Methods Tests');

suite.addBatch({
	'test methods': {
		topic: new Class(),

		'returns prototype method': function (topic) {

			assert.equal(topic.method(), 'prototype method');
		},

		'returns class method': function (topic) {
			assert.equal(Class.method(), 'class method');
		}
	},

	'test properties': {
		topic: new Class(),

		'test prototype properties': function (topic) {
			assert.equal(topic.stringProperty, 'prototype string');
			assert.equal(topic.intProperty, 2);
			assert.equal(topic.objectProperty.value, 2);
		},

		'test class properties': function (topic) {
			assert.equal(Class.stringProperty, 'class string');
			assert.equal(Class.intProperty, 1);
			assert.equal(Class.objectProperty.value, 1);
		},

		'returns class method': function (topic) {
			assert.equal(Class.method(), 'class method');
		}
	},

	'test deferred instance method': {
		topic: function () {
			var self = this,
				instance = new Class();

			instance.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'prototype method');
		}
	},

	'test deferred class method': {
		topic: function () {
			var self = this;

			Class.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'class method');
		}
	},

	'test deferred class extended method': {
		topic: function () {
			var self = this;

			Class3.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'class method two three');
		}
	},

	'test $class pseudo property': {
		topic: new Class({name: ''}),

		'instance method returns $class reference': function (topic) {
			assert.isTrue(topic.getClassReference() === Class);
		},

		'class method returns $class reference': function (topic) {
			assert.isTrue(Class.getClassReference() === Class);
		}
	}
});
exports.suite = suite;