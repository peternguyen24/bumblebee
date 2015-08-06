var keystone = require('keystone'),
    Token2 = keystone.list('Token2');

// check server token
module.exports.checkServerPermission = function (req, res, next) {
	// if (req.ip !== '127.0.0.1') { // Wrong IP address
	//     return res.status(403).json({ 'error': 'no access' });
	// }
	next();
}

// check client token
module.exports.checkClientToken = function (req, res, next) {
  Token2.model.findOne({code: req.body.token}, function(err, token){
  	if (token !== null) return next();
  	return res.status(403).json({ 'error': 'no access' });
  })
}

//update client tokens for every 30 mins
module.exports.update30mins = function(){
	var randtoken = require('rand-token');
	//change name of current token to 2
	Token2.model.findOneAndUpdate({name:'1'}, {name:'2'}, function(err){
		if (err) return console.error(err);
		//then add new token with id 1
		var newToken = new Token2.model({
			code: randtoken.generate(16), // Generate a 16 character alpha-numeric token
		    name: '1',
		});
		// save new token
		newToken.save(function(err) {	
		    if (err) return console.error(err);	
		    console.log(newToken.code);
		});
	});	
}

// delete client token whose name = 2 for every 30 mins 30 seconds
module.exports.update30mins30secs = function(){
	Token2.model.find({name: '2'}).remove(function(err){
		if (err) return console.error(err);
	})	
}

//return a client token to the server
module.exports.getClientToken = function(callback){

	Token2.model.findOne({ name: '1' }, function (err, token) {
	 	callback(token.code);
	});	

}

