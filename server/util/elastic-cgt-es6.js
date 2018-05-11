class CgtEsQuery {
	constructor(param) {
		this.param = param;
		this.query = this._convertCgtReqToElSearch();
  	}
	
  	getParam(){
  		return this.param;
  	};
	getQuery(filters){
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
			this._setFilter(filters);
			must = query.must;
			should = query.should;
			
		}
		var queryArr = [];
		
		for(id in bodies){
			ids.push(id);
			//queryString += header;
			queryArr.push(header);
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
			queryArr.push(JSON.stringify(bodies[id]));
			//queryString += (JSON.stringify(bodies[id])+"\n");
		}
	
		return {"ids": ids, "elQ" : queryArr.join("\n")};
	};
	
  	_convertCgtReqToElSearch(){
		/**
			header\n
			body\n
			header\n
			body\n

			{header}\n
			{body}\n
		*/
		var param = this.param;
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
		
		objects.map((obj, index, list) => {
			bodies[obj.id] = this._generateBody(obj);
			
			//기본 필터 설정
			if(obj.colsInfo && obj.colsInfo.df){
				dfFilter[obj.id] = {"query_string":{"query":obj.colsInfo.df}}
			}
		});
		/*
		for(var i=0, objMax = objects.length; i<objMax; i++){
			bodies[objects[i].id] = this._generateBody(objects[i]);
			
			//기본 필터 설정
			if(objects[i].colsInfo && objects[i].colsInfo.df){
				dfFilter[objects[i].id] = {"query_string":{"query":objects[i].colsInfo.df}}
			}
		}
		*/
		query.header = this._generateHeader(param.app_id);
		query.bodies = bodies;
		query.dfFilter = dfFilter;
		query.must = [];
		query.should = [];
		
		return query; 
	};
	
	_generateHeader(index){
		var header = {index:index.toLowerCase()};
		return JSON.stringify(header);
	};
	
	_generateBody(object){
		var body = {};
		//body.query = {"bool":{"filter":[]}};
		body.query = {"bool":{"must":[],"should":[]}};
		body.size = 0;
		body._source = {"excludes":[]};
		body.aggs = this._generateAggregation(object);
		
		//body = JSON.stringify(body)+"\n"
		return body;
	};
	_generateAggregation(obj){
		//"aggs{"+JSON.stringify(aggs)+"}";
		var exAgg = this._generateExAgg(obj.expressions, obj.colsInfo);
		var aggs = this._generateDimAgg(obj.dimensions, exAgg, obj.colsInfo);

		return aggs;
	};
	_generateExAgg(expressions, colsInfo){
		var currEx, currAgg, currField, aggEndIndex, fieldEndIndex;
		var isScript = false;
		var exAggs = {};
		var exNm;
		if(expressions){
			expressions.map((exp, index, list) => {
				currEx = exp;
				aggEndIndex = currEx.indexOf("(");
				fieldEndIndex = currEx.lastIndexOf(")");
				currAgg = currEx.substring(0,aggEndIndex).toLowerCase();
				isScript = (currEx.substr(-1) === "s") ? true : false;
				
				if(currAgg === "count"){
					currAgg = "value_count";
				}
					
				exNm = "ex("+index+")";	
				exAggs[exNm] = {};
				currField = currEx.substring(aggEndIndex+1, fieldEndIndex);
				
				if(isScript){
					exAggs[exNm][currAgg] = {script : {inline : currField}};
				} else {	
					exAggs[exNm][currAgg] = {field : currField};
				}
			});
			/*
			var i=0;
			var exMax = expressions.length;
			for(i=0;i<exMax;i++){
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
			*/
		}
		return exAggs;
	};
	_generateDimAgg(dimensions, exAggs, colsInfo){
		var currDepth, currDimAgg;
		var aggs = {};
		var i=0;
		var fieldName;
		var fieldTypeInd;
        var key;
		
		
		if(dimensions && dimensions.length > 0){
			dimensions.map((dim, index, list) => {
				fieldName = dim.toLowerCase();

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
						var info = colsInfo[dim];
						if(info){
							if(info.size){
								currDimAgg.terms.size = parseInt(info.size);
							}
							if(info.order && info.order !== "desc"){
                                currDimAgg.terms.order = {};
								for(key in info.order){
                                    currDimAgg.terms.order[key] = info.order[key];

                                    if(!(key === "_count" || key === "_term")){
                                        if((dimensions.length-1) > index){
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
				if(index === 0){
					aggs["dim"+index] = currDimAgg;
				} else {
					 if(!currDepth["aggs"])currDepth["aggs"] = {};
					currDepth["aggs"]["dim"+index] = currDimAgg;
				}
				currDepth = currDimAgg;
			});
			/*
			var dimMax = dimensions.length;
			for(i=0;i< dimMax;i++){
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
			*/
			if(exAggs){
				currDepth["aggs"] = exAggs;
			}
		}else{
			aggs = exAggs;
		}
		return aggs;
	};
	
	_setFilter(filters){
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
		
	};
}

class CgtEsData {
	constructor(ids, data) {
		this.ids = ids;
		this.data = data;
  	}
  	
  	generate(){
		let data = this.data;
		let ids = this.ids;
		
  		if(!data || !data["responses"]){
			return {};
		}
		let resps = data["responses"];

		let objArr = [];
		
		resps.map((value, index, list) => {
			let aggr = value["aggregations"];
			let stNo = value["status"];
			let dataArr = [];
			let datas = [];
			if(stNo == 500){
				return {};
			}
			if(aggr){
				this._getSubBucketData(aggr, 0 , dataArr, datas);
			}
			var obj = {};
			obj["id"] = ids[index];
			obj["data"] = datas;
			objArr.push(obj);
		}); 
		
		return objArr;
  	};
	
	_getSubBucketData(aggr, depth, dataArr, datas){
		var dimm = aggr["dim"+depth];
		
		if(dimm){
			var buckets = dimm["buckets"];

			buckets.map((item,index, list) => {
				var dataClone = dataArr.slice(0);
				dataClone.push(item["key"]);
				if(item){ 
					this._getSubBucketData(item, depth+1, dataClone, datas);
				}
			});
		}else{
			for(var key in aggr){
				var isExp = key.endsWith(")");
				
				if(isExp){
					dataArr.push(aggr[key]["value"]);
				}
			}
			datas.push(dataArr);
		}
	};
}

module.exports = {CgtEsQuery:CgtEsQuery,CgtEsData:CgtEsData}