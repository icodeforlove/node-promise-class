"use strict";

var vows = require('vows'),
	assert = require('assert'),
	BlueBird = require('bluebird'),
	PromiseClass = require('../index'),
	EventsMixin = require('../mixins/events');

var Class = PromiseClass.anonymous(class Class {
	ping ($self) {
		setTimeout(function () {
			$self.dispatchEvent('pong');
		}, 0);
	}

	*pingGenerator ($self) {
		yield BlueBird.delay(1);
		$self.dispatchEvent('pong');
	}
}, EventsMixin);

var suite = vows.describe('Events Mixin Tests');

suite.addBatch({
	'Basic Event Test': {
		topic: function () {
			var self = this,
				example = new Class();

			example.addEventListener('pong', function () {
				self.callback(false, true);
			});

			example.ping();
		},

		'did we get pong': function (topic) {
			assert.isTrue(topic);
		}
	},

	'Basic Generator Event Test': {
		topic: function () {
			var self = this,
				example = new Class();

			example.addEventListener('pong', function () {
				self.callback(false, true);
			});

			example.ping();
		},

		'did we get pong': function (topic) {
			assert.isTrue(topic);
		}
	}
});

exports.tests = suite;