"use strict";

var vows = require('vows'),
	assert = require('assert'),
	PromiseClass = require('../index');

var Class = PromiseClass.anonymous(class Class {
	constructor ($config) {
		this.config = $config;
	}
});

var Class2 = PromiseClass.anonymous(class Class2 extends Class {
});

var suite = vows.describe('Class Extended Passthrough');

suite.addBatch({
	'test constructor': {
		topic: new Class2({success: true}),

		'has success set to true': function (topic) {
			assert.equal(topic.config.success, true);
		}
	}
});
exports.suite = suite;