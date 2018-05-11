module.exports = function(app, ec, eq)
{
    app.get('/health', function (req, res) {
        ec.cluster.health({},function(err,resp,status) {  
            res.json(resp);
        });
    });
    app.get('/index', function (req, res) {
        ec.cat.indices({format:"json"},function(err,resp,status) {  
            res.json(resp);
        });
    });
    app.get('/get', function (req, res) {
		var param = {"objects":[{"id":"page_1_PD178584","type":"CH","dimensions":["지역.raw"],"expressions":["SUM(판매가)"],"colsInfo":{"지역.raw":{"size":"5"}}}],"filters":[],"app_id":"car_im"};;
		
		
		if(param){
			var elQ = new eq.CgtEsQuery(param);
			res.json(elQ.getQuery());
		}else{
			res.json({"result":"no data"});
		}
    });
	app.post('/get', function (req, res) {
		var param = req.body["objects"];
		
		if(param){
			res.json(eq.generate(param));
		}else{
			res.json({"result":"no data"});
		}
		/*
        ec.get({
            index:"",
            type:"",
            id:""
        }, function(err, resp){
            res.json(resp);
        });
		*/
    });
	app.get('/search/:index/:col/:word', function (req, res) {
		var index = req.params.index;
		var col = req.params.col;
		var word = req.params.word;
		console.log(col);
		var q = {};
		q[col] = word;
		ec.search({  
			index: index,
			body: {
				query: {
					match: q
				}
			}
		},
		function (err, resp,status) {
			res.json(resp);
		});
	});
	app.get('/msearch/:index/:word', function (req, res) {
		var index = req.params.index;
		var word = req.params.word;
		word = "'"+word+"'";
		ec.msearch({
			body: [
				// match all query, on all indices and types
				{},
				{ query: { match_all: {} } },
				// query_string query, on index/mytype
				{ index: index},
				{ query: { query_string: { query: word } } }
			]
		}, function(err, resp, status){
			res.json(resp);
		});
	});
	
	app.get('/get_data', function (req, res) {
		var param = {"objects":[{"id":"page_1_PD178584","type":"CH","dimensions":["지역.raw"],"expressions":["SUM(판매가)"],"colsInfo":{"지역.raw":{"size":"5"}}},{"id":"page_1_PD11234","type":"CH","dimensions":["지역.raw"],"expressions":["SUM(판매가)"],"colsInfo":{"지역.raw":{"size":"5"}}}],"filters":[],"app_id":"car_im"};
		
		if(param){
			var elQ = new eq.CgtEsQuery(param);
			var sQuery = elQ.getQuery();
			var ids = sQuery.ids;
			
			ec.msearch({
				body: [
					sQuery.elQ
				]
			}, function(err, resp, status){
				var cgtData = new eq.CgtEsData(ids, resp); 
				res.json(cgtData.generate());
				//res.json(resp);
			});
		}else{
			res.json({"result":"no param"});
		}
	});
	
	app.post('/get_data', function (req, res) {
		let param = req.body;
		if(param){
			console.log(param);
			var elQ = new eq.CgtEsQuery(param);
			var sQuery = elQ.getQuery();
			var ids = sQuery.ids;
			
			ec.msearch({
				body: [
					sQuery.elQ
				]
			}, function(err, resp, status){
				var cgtData = new eq.CgtEsData(ids, resp); 
				res.json(cgtData.generate());
				//res.json(resp);
			});
		}else{
			res.json({"result":"no param"});
		}
	});
}