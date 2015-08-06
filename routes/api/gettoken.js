
var tokenManager = require('./tokenManager');
exports = module.exports = 	function(req, res) {
	tokenManager.getClientToken(function(code){
		res.json({clientToken: code})
	});
}
