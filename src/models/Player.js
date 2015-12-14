var mongoose = require('mongoose');
var _ = require('underscore');

var PlayerModel;

var setName = function(name) {
	return _.escape(name).trim();
};

var PlayerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		set: setName
	},
	
	level: {
		type: Number,
		min: 1,
		required: true,
		default: 1
	},
	
	exp: {
		type: Number,
		min: 0,
		required: true,
		default: 0
	},
	
	health: {
		type: Number,
		min: 0,
		required: true,
		default: 50
	},
	
	maxHealth: {
		type: Number,
		min: 50,
		required: true,
		default: 50
	},
	
	damage: {
		type: Number,
		min: 1,
		required: true,
		default: 10
	},
	
	defense: {
		type: Number,
		min: 1,
		required: true,
		default: 10
	},
	
	location: {
		type: String,
		required: true,
		trim: true,
		default: 'room1'
	},
	
	createdDate: {
		type: Date,
		default: Date.now
	}
	
});

PlayerSchema.methods.toAPI = function() {
	return {
		name: this.name,
		level: this.level,
		exp: this.exp,
		health: this.health,
		maxHealth: this.maxHealth,
		damage: this.damage,
		defense: this.defense,
		location: this.location
	};
};

PlayerSchema.statics.findByObjectID = function(objectID, callback) {

    var search = {
        _id: objectID
    };

    return PlayerModel.findOne(search, callback);
};

PlayerSchema.statics.savePlayerData = function(player) {
	var search = {
		name: player.name
	};
	
	PlayerModel.findOne(search, function(err, doc){
		if(err)
		{
			console.log(err);
			return;
		}
		else if(doc === null)
		{
			console.log("Player does not exist");
			return;
		}
		else
		{
			doc.level = player.level;
			doc.exp = player.exp;
			doc.health = player.health;
			doc.maxHealth = player.maxHealth;
			doc.damage = player.damage;
			doc.defense = player.defense;
			doc.location = player.location;
			doc.save(function(err){
				if(err){
					console.log(err);
					return;
				}
			});
			console.log("Saved player data");
			return null;
		}
	});
};

PlayerModel = mongoose.model('Player', PlayerSchema);

module.exports.PlayerModel = PlayerModel;
module.exports.PlayerSchema = PlayerSchema;