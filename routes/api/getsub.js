var yifysubs   = require("yifysubs");  // yify API
var http = require('http');            //download 
var fs = require('fs');                //download + write file
var AdmZip = require('adm-zip');       // unzip file
var srt2vtt = require('srt-to-vtt');      // srt -> vtt
var keystone = require('keystone');
var Sub = keystone.list('Sub');
var request = require('request');
var ip = require('ip'), 
	serverIP = ip.address();
var subs = require("./opensubtitle");    //openSubtitle API
var mkdirp = require('mkdirp');

// download zip file from yify, unzip, convert to vtt, and save it to database
var downAndSaveYify = function(url, imdb, language, callback) {
	http.get(url, function(response) {
		var	dir = './public/vtt/' + imdb + '/' + language + '/';
		// create directory to save file
		mkdirp(dir, function (err) {   
          if (err) {
            callback(null);
          } else {
          	var file = fs.createWriteStream(dir +'sub.zip');
          	response.on('data', function (data) {
            	file.write(data);
        	}).on('end', function(){
      			file.end();
		    	var zip = new AdmZip(dir + 'sub.zip');
	 			zip.extractAllTo(dir, true); // unzip
	 			// delete file .zip
	 			fs.unlink(dir + 'sub.zip', function(){
	 				fs.readdir(dir, function(err, files) {
	 					
	 					for(var file in files) {
	 						var path = require('path');
						   if(path.extname(files[file]) === ".srt") {
						   	
						   	fs.createReadStream(dir + files[file])
							  .pipe(srt2vtt())
							  .pipe(fs.createWriteStream(dir + 'sub.vtt'))
							// delete file .srt
							fs.unlink(dir + files[file]); // delete .srt file
							callback({url: dir + 'sub.vtt'}); // 1 means sucessful
						   }
						}
					});
	 			});
      		});   	
          }
        });
	})

};

// download srt file from opensubtitle,convert to vtt, and save it to database
var downAndSaveOpensub = function(url, imdb, season, episode, language, callback){
	http.get(url, function(response){
		var dir = "";
		if (season === '0') {
			dir = './public/vtt/' + imdb +  '/' + language + '/'
		} else {
			dir = './public/vtt/' + imdb + '/season' + season + '/episode' + episode + '/' + language + '/'
		}
		// create directory to save file
		mkdirp(dir, function (err) {
	      if (err) {
	        callback(null);
	      } else {
	      	var file = fs.createWriteStream(dir +'sub.srt');
	      	response.on('data', function (data) {
	        	file.write(data);
	    	}).on('end', function(){
	  			file.end();
	 			fs.createReadStream(dir + 'sub.srt')
				  .pipe(srt2vtt())
				  .pipe(fs.createWriteStream(dir + 'sub.vtt'))
				// delete file .srt
				fs.unlink(dir + 'sub.srt');
				callback({url: dir + 'sub.vtt'});
	  		});
	      }
	    });
	})
	
};
	

var yifyDownload = function(imdb, language, adjust, callback){
	// check if the sub already exists in database
	Sub.model.findOne({IMDB: imdb,language: language, season: '0'}, function(err, sub){
		// if it already exists
		if (sub !== null){
			callback(1); 
		} else {
			request({url:'http://api.yifysubtitles.com/subs/'+imdb, json: true}, function(error, response, data){
				// if cannot get response using given imdb and language
				if (data.subtitles === 0 || !data.subs[imdb].hasOwnProperty(language)) {
					callback(null) 
				} else {
					yifysubs.searchSubtitles(language, imdb, function(result){   // else search for the sub 	
						tempUrl = result[language].url;	// url of the sub
						downAndSaveYify(tempUrl, imdb, language, function(result){
							if (result === null) {
								callback(null)
							} else {
								// save new sub to database
								var newSub = new Sub.model({
									IMDB: imdb,
									season: '0',
									episode: '0',
									language: language,
									url: result.url//'http://' + serverIP + '/vtt/' + imdb + '/' + language + '/' +'sub.vtt'
								});
								newSub.save(function(err) {
								   if (err) {console.log(err);} else {
								   		callback(1);
								   }
								   
								})
							};
						
						});
			   	 	});
				}
			})
		}
	})
};

var openSubtitleDownload = function(imdb, season, episode, language, adjust, callback){
	Sub.model.findOne({IMDB: imdb, season: season, episode: episode, language: language}, function(err, sub){
		//console.log(sub);
		if (sub !== null){
			callback(1);
		} else {
			// create query
			var query = {
		    	imdbid: imdb
			};
			// if this is a series
			if (season !== '0'){
				query.season = season;
				query.episode = episode;
				query.language = language.substring(0,3);
			}

			subs.searchEpisode(query, 'OSTestUserAgent')
			    .then(function(result) {
			        if (Object.keys(result).length === 0) {
			        	callback(null)
			        } else {
			        	if (!result.hasOwnProperty(language.substring(0, 2))){
			        		callback(null)
			        	} else {
			        		var tempUrl = result[language.substring(0, 2)].url;
			        		downAndSaveOpensub(tempUrl, imdb, season, episode, language, function(result){
								if (result === null) {
									callback(null)
								} else {
									// save new sub to database
									//for movie
									
									var newSub = new Sub.model({
										IMDB: imdb,
										season: season,
										episode: episode, 
										language: language,
										url: result.url
									});
									newSub.save(function(err) {
									    if (err) {console.log(err); } else {
									    	callback(1);
									    }

									})
								}
							});
			        	}
			        	
			        }
			    }).fail(function(error) {
			        callback(null);
			    });
		}
	})
};

exports = module.exports = 	function(req, res){
	var IMDB = req.body.IMDB,
		language = req.body.language.toLowerCase(),
		season = req.body.season,
		episode = req.body.episode,
		adjust = req.body.adjust;

	// if this is a movie (not a series)
	if (season === '0'){
		//use yify
		yifyDownload(IMDB, language, adjust, function(result){
			if (result === null){
				// if cannot find in yify, try opensubtitle
				openSubtitleDownload(IMDB, season, episode, language, adjust, function(result){
					if (result === null) {
						res.status(404).json({success: false})
					} else {
						res.json({success: true, url: 'http://' + serverIP + '/vtt/' + IMDB + '/' + language + '/' + 'sub.vtt'})
					}
				})
			}
			else {
				res.json({success: true, url: 'http://' + serverIP + '/vtt/' + IMDB + '/' + language + '/'  + 'sub.vtt'})
			}
		})
	} else { // if this is a series
		openSubtitleDownload(IMDB, season, episode, language, adjust, function(result){
			if (result === null) {
				res.status(404).json({success: false})
			} else {
				res.json({success: true, url: 'http://' + serverIP + '/vtt/' + IMDB + '/season' + season + '/episode' + episode + '/' + language + '/' + 'sub.vtt'})
			}
		})
	}
}