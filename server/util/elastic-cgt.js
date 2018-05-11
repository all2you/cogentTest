var CgtElastic = function(){
	var ce = {};
	var fn = CgtEl.prototype;
	var fn2 = CgtData.prototype;
	
	function CgtEl(param) {
		this.conf = this.init(param);
		this.query = this.convertCgtReqToElSearch();
	}
	
	function CgtData(data) {
		this.data = this.generateCgtData(data);
	}
	
	ce.generate = function (param) {
		return new CgtEl(param);
	};
	
	ce.cgtData = function(data){
		return new CgtData(data);
	};
	
	fn.init = function(param){
		var conf = {};
		conf.param = param;
		
		return conf;
	}
	
	fn.convertCgtReqToElSearch = function(){
		/**
			header\n
			body\n
			header\n
			body\n

			{header}\n
			{body}\n
		*/
		
		var conf = this.conf;
		var param = conf.param;
		var query = {};
		/*
		var param = {
			"filters":[
				{
					"dimension":"state",
					"values":["PA","LA","TN","DC"]
				}
			],
			"objects":[
				{"id":"page_1_PD128447",
				"type":"CH",
				"dimensions":["state"],
				"expressions":["SUM(balance)"]}
			],
			"app_id":"bank"
		}
		*/
		var objects = param.objects;
		var bodies = {};
		var dfFilter = {};
		
		for(var i=0; i<objects.length; i++){
			bodies[objects[i].id] = this.generateBody(objects[i]);
			
			
			//기본 필터 설정
			if(objects[i].colsInfo && objects[i].colsInfo.df){
				dfFilter[objects[i].id] = {"query_string":{"query":objects[i].colsInfo.df}}
			}
		}
		
		query.header = this.generateHeader(param.app_id);
		query.bodies = bodies;
		query.dfFilter = dfFilter;
		query.must = [];
		query.should = [];
		
		return query; 
	}
	
	//URI에 인덱스나 타입있으면 header는 빈오브젝트{}로 넣어도 됨.
	fn.generateHeader = function(index){
		var header = {index:index.toLowerCase()};
		return JSON.stringify(header)+"\n";
	};
	
	fn.generateBody = function(object){
		var body = {};
		//body.query = {"bool":{"filter":[]}};
		body.query = {"bool":{"must":[],"should":[]}};
		body.size = 0;
		body._source = {"excludes":[]};
		body.aggs = this.generateAggregation(object);
		
		//body = JSON.stringify(body)+"\n"
		return body;
	};
	
	/**
	param:obj = {
		"id":"page_1_PD128447",
		"type":"CH",
		"dimensions":["state"],
		"expressions":["SUM(balance)"]
	}
	*/
	fn.generateAggregation = function(obj){
		//"aggs{"+JSON.stringify(aggs)+"}";
		var exAgg = this.generateExAgg(obj.expressions, obj.colsInfo);
		var aggs = this.generateDimAgg(obj.dimensions, exAgg, obj.colsInfo);

		return aggs;
	};
	
	//expressions 만들기, cnt의 경우 예외 처리 해야함. 
	// script expression 추가`
	fn.generateExAgg = function(expressions, colsInfo){
		var currEx, currAgg, currField, aggEndIndex, fieldEndIndex;
		var isScript = false;
		var exAggs = {};
		var exNm;
		if(expressions){
			var i=0;
			for(i=0;i<expressions.length;i++){
				currEx = expressions[i];
				aggEndIndex = currEx.indexOf("(");
				fieldEndIndex = currEx.lastIndexOf(")");
				currAgg = currEx.substring(0,aggEndIndex).toLowerCase();
				isScript = (currEx.substr(-1) === "s") ? true : false;
				
				if(currAgg === "count"){
					currAgg = "value_count";
				}
					
				exNm = "ex("+i+")";	
				exAggs[exNm] = {};
				currField = currEx.substring(aggEndIndex+1, fieldEndIndex);
				
				if(isScript){
					//console.log(currField);
					exAggs[exNm][currAgg] = {script : {inline : currField}};
				} else {	
					exAggs[exNm][currAgg] = {field : currField};
				}
			}
		}
		return exAggs;
	};
	
	//dimension 만들기
	fn.generateDimAgg = function(dimensions, exAggs, colsInfo){
		var currDepth, currDimAgg;
		var aggs = {};
		var i=0;
		var fieldName;
		var fieldTypeInd;
        var key;

         
		
		if(dimensions && dimensions.length > 0){
			for(i=0;i<dimensions.length;i++){
				fieldName = dimensions[i].toLowerCase();

				//date구분...
				fieldTypeInd = fieldName.lastIndexOf(".date");
				if(fieldTypeInd > -1){
					fieldName = fieldName.substr(0,fieldTypeInd);
					currDimAgg = {
						"date_histogram":{
						  "field":fieldName,
						  "order":{"_key":"desc"}, //추후 옵션값으로 조정 
						  "interval" : "1M",
						  "time_zone" : "Asia/Tokyo"
						}
					}
				} else {
					currDimAgg = {
						"terms":{
						  //"field":dimensions[i].toLowerCase()+".keyword",
						  "field":fieldName,
						  "size":5000,		//추후 옵션값으로 조정 
						  "order":{"_count":"desc"} //추후 옵션값으로 조정 
						}
					}
					if(colsInfo){
						var info = colsInfo[dimensions[i]];
						if(info){
							if(info.size){
								currDimAgg.terms.size = parseInt(info.size);
							}
							if(info.order && info.order !== "desc"){
                                currDimAgg.terms.order = {};
								for(key in info.order){
                                    currDimAgg.terms.order[key] = info.order[key];

                                    if(!(key === "_count" || key === "_term")){
                                        if((dimensions.length-1) > i){
                                            if(!currDimAgg["aggs"])currDimAgg["aggs"] = {};
                                            currDimAgg["aggs"][key] = exAggs[key];
                                        }
                                    }
                                }
								//currDimAgg.terms.order = {"_count":info.order};
							}
							
						}
					}
				}
				
				
				
				
				if(i === 0){
					aggs["dim"+i] = currDimAgg;
				} else {
					 if(!currDepth["aggs"])currDepth["aggs"] = {};
					currDepth["aggs"]["dim"+i] = currDimAgg;
				}
				currDepth = currDimAgg;
			}
			
			if(exAggs){
				currDepth["aggs"] = exAggs;
			}
		}else{
			aggs = exAggs;
		}
		return aggs;
	}
	
	/*fn.setFilter = function(filters){
		console.log(filters);
		if(filters.length === 0) this.query.must = [];
		var currState = {};
		var must = this.query.must || [];
		var i,j,k;
		var isAllEmpty = true;
		var isContinue = false;
		
		
		for(i=0; i < filters.length;i++){
			var dim = filters[i].dimension.toLowerCase();
			var values = filters[i].values;
			
			if(dim === "_all"){
				currState[dim] = {"query_string":{"query":values[0]}};
			} else if(dim.substr(0,5) === "_item"){
				currState[dim] = {"query_string":{ "fields" : filters[i]["fields"], "query":values[0]}}
			} else {
				var ms = {terms:{}};
				ms["terms"][dim] = values;
				currState[dim] = ms;
			}

			if(values.length === 0){
				delete currState[dim];
			}
		}
		for(var key in currState){
			must.push(currState[key]);
		}
		this.query.must = must;
		
		//query_string 지우기;
		for(k=0; k < must.length;k++){
			if(must[k]["query_string"]){
				must.splice(k,1);
				break;
			}
		}
		for(i=0; i < filters.length;i++){
			var dim = filters[i].dimension.toLowerCase();
			var values = filters[i].values;
			isContinue = false;
			//전체검색
			if(dim === "_all" && values.length > 0){
				must.push({"query_string":{"query":values[0]}});
				isAllEmpty = false;
				continue;
			}
			//오브젝트 디멘젼 검색
			if(dim.substr(0,5) === "_item" && values.length > 0){
				must.push({"query_string":{ "fields" : filters[i]["fields"], "query":values[0]}});
				isAllEmpty = false;
				continue;
			}
			//기존에 있는경우
			for(k=0; k < must.length;k++){
				if(must[k]["terms"] && must[k]["terms"][dim]){
					must[k]["terms"][dim] = [];
					for(j=0;j<values.length;j++){
						//must[k]["terms"][dim].push(values[j].toLowerCase());
						must[k]["terms"][dim].push(values[j]);
						isAllEmpty = false;
					}
					isContinue = true;
					break;
				}
			}
			if(isContinue)continue;
			var lowerValues = [];
			
			if(values.length > 0){
				lowerValues = values;
				isAllEmpty = false;
			}

			var ms = {terms:{}};
			ms["terms"][dim] = lowerValues;
			must.push(ms);

		}
		if(isAllEmpty)must = [];
		this.query.must = must;
		
	}*/
	fn.setFilter = function(filters){
		var key;
		var must = [];
		var should = [];
		var i = 0;
		//console.log(filters);
		for(key in filters){
			var dim = key;
			var values = filters[key];
			var sType = dim.substr(0,5);
			if(values.length > 0){
				if(dim === "_all"){
					must.push({"query_string":{"query":values[0]}});
				} else if(sType === "_item"){
					must.push({"query_string":{ "fields" : values[1], "query":values[0]}});
				} else if(sType === "_rang"){	//date와 range 좀더 수정필요
					var range = {};
					dim = dim.replace("_range:","");
					range[dim] = {"gte" : values[0], "lte" : values[1]}
					must.push({"range":range});
				} else if(sType === "_date"){
					dim = dim.replace("_date:","");					
					for(i = 0; i < values.length; i++){
						var range = {};
						range[dim] = {"gte" : values[i]+"||/d", "lte" : values[i]+"||/d","time_zone":"Asia/Tokyo"}
						should.push({"range":range});	
					}
				} else {
					var ms = {terms:{}};
					ms["terms"][dim] = values;
					must.push(ms);
				}
			}
		}
		this.query.must = must;
		this.query.should = should;
		
	}
	fn.getQuery = function(filters){
		var query = this.query;
		var header = query.header;
		var bodies = query.bodies;
		var dfFilter = query.dfFilter;
		var must = query.must;
		var should = query.should;
		
		var queryString = "";
		var ids = [];
		var id;
		
		if(filters){
			this.setFilter(filters);
			must = query.must;
			should = query.should;
			
		}
		for(id in bodies){
			ids.push(id);
			queryString += header;
			//bodies[id].query.bool.filter.terms = terms;
			bodies[id].query.bool.must = must.slice(0);
			bodies[id].query.bool.should = should;	
			
			if(dfFilter[id]){
				bodies[id].query.bool.must.push(dfFilter[id]);
			}
			if(bodies[id].query.bool.should.length > 0){
				bodies[id].query.bool.minimum_should_match = 1;
			}else{
				delete bodies[id].query.bool.minimum_should_match;
			}
			
			queryString += (JSON.stringify(bodies[id])+"\n");
		}
		//queryString = queryString.substr(0, queryString.length-1)+"\r";
		//console.log("start query");
		//console.log(queryString);
		//console.log("end query");		
		return {"ids": encodeURIComponent(JSON.stringify(ids)), "elQ" : encodeURIComponent(queryString)};
	}
	fn2.generateCgtData = function(data){
		console.log(data);
		if(!data || !data["responses"]){
			return {};
		}
		var resps = data["responses"];
		
		for(var i in resps){
			var aggr = resps[i]["aggregations"];
			console.log(aggr);
		}
		/*
		{
			"responses": [
				{
					"took": 1,
					"timed_out": false,
					"_shards": {
						"total": 5,
						"successful": 5,
						"failed": 0
					},
					"hits": {
						"total": 623,
						"max_score": 0,
						"hits": []
					},
					"aggregations": {
						"dim0": {
							"doc_count_error_upper_bound": 0,
							"sum_other_doc_count": 147,
							"buckets": [
								{
									"key": "경기도",
									"doc_count": 180,
									"ex(0)": {
										"value": 443100
									}
								},
								{
									"key": "서울",
									"doc_count": 120,
									"ex(0)": {
										"value": 297800
									}
								},
								{
									"key": "경남",
									"doc_count": 62,
									"ex(0)": {
										"value": 152400
									}
								},
								{
									"key": "부산",
									"doc_count": 58,
									"ex(0)": {
										"value": 138600
									}
								},
								{
									"key": "경북",
									"doc_count": 56,
									"ex(0)": {
										"value": 140400
									}
								}
							]
						}
					},
					"status": 200
				}
			]
		}
		*/
		return data;
	}
	return ce;
}
module.exports = CgtElastic();

//var cgtEl = CgtElastic();
//var elasticDataSets = {};
//elasticDataSets["bank"] = cgtEl.generate("bank");
//elasticDataSets["bank"].getQuery([{"dimension":"state","values":["PA","LA","TN","DC"]}]);


