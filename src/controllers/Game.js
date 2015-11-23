var _ = require('underscore');
var models = require('../models');

var Player = models.Player;
var Account = models.Account;

var gamePage = function(req, res){
	Player.PlayerModel.findByObjectID(req.session.account.player, function(err,doc){
		if(err){
			console.log(err);
			return res.status(440).json({error:'An error occurred'});
		}
		
		res.render('game', {csrfToken: req.csrfToken(), player: doc});
	});
	
	
	/*Player.PlayerModel.findByOwner(req.session.account._id, function(err,docs) {
		if(err){
			console.log(err);
			return res.status(440).json({error:'An error occurred'});
		}
		
		res.render('game', {csrfToken: req.csrfToken(), player: docs});
	});*/
};

module.exports.gamePage = gamePage;