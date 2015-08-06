var keystone = require('keystone');

var Sub = new keystone.List('Sub');

Sub.add({
	IMDB: { type: String},
	season: {type: String},
	episode: {type: String},
	language: {type: String},
	url: {type: String}
})

Sub.register();