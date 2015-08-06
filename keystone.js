// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

	'name': 'BumbleBee',
	'brand': 'BumbleBee',
	
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'jade',
	
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': '&g0{xmbFcbIc.]KU?sh4N9&a8_h`&hTnW=ZPMJb.^8Whk*Ht>5GWA0Ta!~F"]OvT'

});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'enquiries': 'enquiries',
	'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server
// Start Keystone to connect to your database and initialise the web server
var initFunc = function(){
		//var Sub = keystone.list('Sub');
		//Sub.model.find().remove(function(err){});
		var tokenManager = require('./routes/api/tokenManager.js');
		var update30mins = tokenManager.update30mins;
		var update30mins30secs = tokenManager.update30mins30secs;
		//var CronJob = require('cron').CronJob;
		//new CronJob('*/7 * * * * *',function(){console.log(1)}, null, true, 'America/Los_Angeles');
		//setTimeout(function() {new CronJob('*/7 * * * * *', function(){console.log(2)}, null, true, 'America/Los_Angeles');}, 3000);
		update30mins();
		setInterval(update30mins, 1800000);
		setTimeout(function(){update30mins30secs(), setInterval(update30mins30secs, 1800000);}, 30000)
}

keystone.start(initFunc);
