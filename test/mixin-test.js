"use strict";

var vows = require('vows'),
	assert = require('assert'),
	BlueBird = require('bluebird'),
	PromiseClass = require('../index');

var MixinWithoutPseudoParams = {
	getName: function () {
		return this._name;
	},

	get name () {
		return this._name;
	},

	set name (value) {
		this._name = String(value).toUpperCase();
	}
};

var MixinWithPseudoParams = {
	getNameDeferred: function ($deferred, $self) {
		$deferred.resolve($self._name);
	}
};

var MixinWithInitializer = {
	initialize: function () {
		this._items = [];
	},

	getItems: function () {
		return this._items;
	}
};

var ClassWithMixinWithoutPseudoParams = PromiseClass.anonymous(class ClassWithMixinWithoutPseudoParams {
	constructor (name) {
		this._name = name;
	}
}, MixinWithoutPseudoParams);

var ClassWithMultipleMixins = PromiseClass.anonymous(class ClassWithMultipleMixins {
	constructor (name) {
		this._name = name;
	}
}, MixinWithoutPseudoParams, MixinWithPseudoParams);

var suite = vows.describe('Mixin Tests');

suite.addBatch({
	'Mixin Without Pseudo Params': {
		topic: new ClassWithMixinWithoutPseudoParams('james'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'james');
		}
	},

	'Mixin With Getter/Setter': {
		topic: new ClassWithMixinWithoutPseudoParams('james'),

		'is the name set': function (topic) {
			assert.equal(topic.name, 'james');
		},

		'can set name set': function (topic) {
			topic.name = 'semaj';
			assert.equal(topic.name, 'SEMAJ');
		}
	},

	'Multiple Mixins': {
		topic: new ClassWithMultipleMixins('james'),

		'is the name set': function (topic) {
			assert.equal(topic.getName(), 'james');
		}
	},

	'Multiple Mixins With Deferred Method': {
		topic: function () {
			var self = this,
				example = new ClassWithMultipleMixins('james');
			example.getNameDeferred().then(function (name) {
				self.callback(null, name);
			});
		},

		'is the name set': function (topic) {
			assert.equal(topic, 'james');
		}
	},

	'Mixin Using Initialize': {
		topic: function () {
			var Example = PromiseClass.anonymous(class Example {
				constructor (name) {
					this._name = name;
				}
			}, MixinWithoutPseudoParams, MixinWithInitializer);

			this.callback(null, new Example('james'));
		},

		'does error exist': function (topic) {
			assert.isArray(topic.getItems());
			assert.equal(topic.getName(), 'james');
		}
	},

	'Mixin Collision Initialize Error': {
		topic: function () {
			try {
				var Example = PromiseClass.anonymous(class Example {
					constructor (name) {
						this._name = name;
					}
					getName () {
						return this._name;
					}
				}, MixinWithoutPseudoParams);
			} catch (error) {
				this.callback(error);
			}
		},

		'does error exist': function (error, topic) {
			assert.instanceOf (error, Error);
			assert.equal(error.message, 'Mixin: "getName" collision, cannot override class methods/props, or other mixins');
		}
	}
});

exports.tests = suite;