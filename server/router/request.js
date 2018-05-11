module.exports = function(app, fs)
{
	app.get('/open/:filename', function(req, res){
		var filename = req.params.filename;
		console.log("open file : "+filename);
		fs.readFile( __dirname + "/../../client/design/"+filename+".cgt", 'utf8', function (err, data) {
            //var file = JSON.parse(data);
			if(err != null){
				res.end(err);
			}
            res.end(data);
		});
    });
	
	app.get('/isfile/:filename', function(req, res){
		var filename = req.params.filename;
		console.log("open file : "+filename);
		//fs.lstatSync( __dirname + "/../../client/design/"+filename+".cgt")
		fs.isFile( __dirname + "/../../client/design/"+filename+".cgt", 'utf8', function (err, data) {
			//var file = JSON.parse(data);
			if(err != null){
				res.end(err);
			}
			res.end(data);
			/*
			if(data != null){
				res.json({"result":"true"});
			}else{
				res.json({"result":"false"});
			}
			*/
			
		});
    });
	
	app.put('/save/:filename', function(req, res){
		var filename = req.params.filename;
		console.log("save file : "+filename);
		fs.readFile( __dirname + "/../../client/design/"+filename+".cgt", 'utf8', function (err, data) {
            //var file = JSON.parse(data);
			if(err != null){
				res.end(err);
			}
            res.end(data);
		});
    });

}