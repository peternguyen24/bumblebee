var keystone = require('keystone');

var Token2 = new keystone.List('Token2');

Token2.add({
	name: { type: String},
	code: {type: String}
})

Token2.register();