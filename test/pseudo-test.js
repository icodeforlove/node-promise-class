"use strict";

var vows = require('vows-harmony'),
	assert = require('assert'),
	PromiseClass = require('../index');

var ClassWithPseudoInit = PromiseClass.anonymous(class ClassWithPseudoInit {
	constructor (name) {
		this._name = name;
	}

	getName ($self) {
		return this._name;
	}
});

var ExtendedClassWithPseudoInit = PromiseClass.anonymous(class ExtendedClassWithPseudoInit extends ClassWithPseudoInit {
	constructor (name) {
		super(name);
	}
});

var ClassWithNoPseudoParams = PromiseClass.anonymous(class ClassWithNoPseudoParams {
	constructor (name) {
		this._name = name;
	}

	getName () {
		return this._name;
	}
});

var ExtendedClassWithNoPseudoParams = PromiseClass.anonymous(class ExtendedClassWithNoPseudoParams extends ClassWithNoPseudoParams {
	constructor (name) {
		super(name);
	}
});

var suite = vows.describe('Pseudo Param Tests');

suite.addBatch({
	'Init Class With Pseudo Params': {
		topic: new ClassWithPseudoInit('james'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'james');
		}
	},

	'Init Class Without Pseudo Params': {
		topic: new ClassWithNoPseudoParams('bob'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'bob');
		}
	},

	'Init Extended Class With Pseudo Params': {
		topic: new ExtendedClassWithPseudoInit('joe'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'joe');
		}
	},

	'Init Extended Class Without Pseudo Params': {
		topic: new ExtendedClassWithNoPseudoParams('sally'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'sally');
		}
	}
});

exports.tests = suite;