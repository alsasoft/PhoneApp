'use strict';
const os = require('os');
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const bcryptSalt = bcrypt.genSaltSync(10);

module.exports = {

	'object_id_counter': 0,

	'object_id_counters': {},

	'setCategory': function(category) {
		if(category && !this.object_id_counters.hasOwnProperty(category)) {
			this.object_id_counters[category] = parseInt(Math.random() * 16777216) || 0;
		}
	},

	'generateObjectIdCounter': function() {
		this.object_id_counter = parseInt(Math.random() * 16777216);
		return this.object_id_counter;
	},

	'incrementObjectIdCounter': function(category) {
		if(!category || !this.object_id_counters.hasOwnProperty(category)) {
			this.object_id_counter = (this.object_id_counter + 1) % 16777216;
			return this.object_id_counter;
		}
		else {
			this.object_id_counters[category] = (this.object_id_counters[category] + 1) % 16777216;
			return this.object_id_counters[category];
		}
	},

	'leftPad': function (str, pad){
		if(str.length >= pad.length){
			return str.substring(str.length - pad.length, str.length);
		}
		else {
			return pad.substring(0, pad.length - str.length) + str;
		}
	},

	/**
	 * Genera un array de n IDs estilo MongoId (24 caracteres hexadecimales)
	 */
	'generateObjectId': function (category = null) {
		this.setCategory(category);
		const seconds   = Math.floor(new Date() / 1000).toString(16);
		const machineId = crypto.createHash('md5').update(os.hostname()).digest('hex').slice(0, 6);
		const processId = this.leftPad(process.pid.toString(16).slice(0, 4), '0000');
		const counter   = this.leftPad(this.incrementObjectIdCounter(category).toString(16).slice(0, 6), '000000');
		return seconds + machineId + processId + counter;
	},

	'md5': function (value) {
		return crypto.createHash('md5').update(value);
	},
	
	'checkObjectId': function (objectId) {
		const allowed = "0123456789abcdef";

		let ret = objectId && typeof(objectId) == 'string' && objectId.length == 24;

		for(let i = 0; ret && i < 24; i++){
			ret = allowed.indexOf(objectId.charAt(i)) >= 0;
		}

		return ret;
	},
	
	'checkEmail': function (email){
		let ret = false;
		if(email && typeof(email) == 'string'){
			let emailParts = email.split('@');
			if(emailParts.length == 2 && emailParts[0].length > 2 && emailParts[1].length > 2){
				ret = true;
				const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-+";
				for(let i = 0; ret && i < 2; i++){
					for(let j = 0; ret && j < emailParts[i].length; j++){
						ret = allowed.indexOf(emailParts[i].charAt(j)) >= 0;
					}
				}
			}
		}
		return ret;
	},
	
	'formatEmail': function (email){
		return this.checkEmail(email) ? email.trim().toLowerCase() : null;
	},

	'checkPassword': function (password){
		let ret = false;
		if(password && typeof(password) == 'string' && password.length > 0){
			ret = true;
		}
		return ret;
	},
	
	'hashPassword': function (password){
		return this.checkPassword(password) 
		? bcrypt.hashSync(password, bcryptSalt)
		: null;
	},
	
	'checkHashedPassword': function (unhashedPassword, hashedPassword){
		return bcrypt.compareSync(unhashedPassword, hashedPassword);
	},

	'randomString': function (length, possible) {
		let ret = "";

		if(!possible || typeof(possible) != 'string' || possible.length < 1){
			possible = "abcdefghijklmnopqrstuvwxyz0123456789";
		}

		for (let i = 0; i < length; i++){
			ret += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return ret;
	},
	
	'array2list': function (array, sep, quote){
		if(!Array.isArray(array)){
			return null;
		}
		
		if(!sep){
			sep = ',';
		}
		
		if(!quote){
			quote = '\'';
		}
		
		let r = '';
		let f = true;
		
		for(let element of array){
			if(f){
				f = false;
			}
			else {
				r += sep;
			}
			r += quote + element + quote;
		}

		return r;
	},

	'yyyyMMddHHmmss': function(dateObject){
		let fullYear = dateObject.getFullYear().toString();
		let month    = (dateObject.getMonth() + 1).toString();
		let day      = dateObject.getDate().toString();
		let hours    = dateObject.getHours().toString();
		let minutes  = dateObject.getMinutes().toString();
		let seconds  = dateObject.getSeconds().toString();

		if (dateObject.getMonth() < 9) {
			month = "0" + month;
		}

		if (dateObject.getDate() < 10) {
			day = "0" + day;
		}

		if (dateObject.getHours() < 10) {
			hours = "0" + hours;
		}

		if (dateObject.getMinutes() < 10) {
			minutes = "0" + minutes;
		}

		if (dateObject.getSeconds() < 10) {
			seconds = "0" + seconds;
		}

		return fullYear + month + day + hours + minutes + seconds;
	},
	
	'getFieldByMultikey': function(obj, key, def = null){
		if(!obj || typeof(obj) != 'object' || !key || typeof(key) != 'string'){
			return def;
		}
		else {
			
		}
	}
}
