


let promisesBarScatterBubble = [
  d3.csv("https://gist.githubusercontent.com/EveAndrade/0b939e13487c446ae0193f895f001993/raw/05a881978b1cb0237e39094ea799ba2ec2ba7327/PLEIADES.csv")
  .then(function (data){
    data.forEach(function (d){
      d.id = parseInt(d.id);
      d.maxDate = parseInt(d.maxDate);
      if(isNaN(d.maxDate)){
        d.maxDate = 0
      }
      
      d.minDate = parseInt(d.minDate);
      if(isNaN(d.minDate)){
        d.minDate = 0
      }
      
      d.timePeriodsKeys = d.timePeriodsKeys.split(",");
      d.tags = d.tags.split(",");
      
      d.reprLat = parseFloat(d.reprLat);
      d.reprLong = parseFloat(d.reprLong);
      
      d.bbox = d.bbox.split(",");
      for(var i=0; i< d.bbox.length; i++){ 
        d.bbox[i] = parseFloat(d.bbox[i]);
      };
      
      d.featureType = d.featureType.split(",");
      d.nameAttested = d.nameAttested.split(",");
      d.nameLanguage = d.nameLanguage.split(",");
      d.nameTransliterated = d.nameTransliterated.split(",");
    });
    return data;
  })
]

//###################### BAR CONTENT ######################

Promise.all(promisesBarScatterBubble).then(readyBarScatterBubble);

function readyBarScatterBubble([data]) {
	 
  let facts = crossfilter(data)	 
  const width = 3000
  const height = 480
  let view = document
  
  function reduceAdd(p, v){
    v.featureType.forEach(function(val, idx){
      p[val] = (p[val] || 0) + 1;
    });
    return p;
  }
  
  function reduceRemove(p, v){
    v.featureType.forEach(function(val, idx){
      p[val] = (p[val] || 0) - 1;
    });
    return p;
  }
  
  function reduceInitial() {
    return {};  
  }
  
  var sDim = facts.dimension(d => d.featureType);
  
  var sGroup = sDim.groupAll()
                   .reduce(reduceAdd, reduceRemove, reduceInitial)
                   .value();
    
  sGroup.all = function() {
    var newObject = [];
    for (var key in this) {
      if (this.hasOwnProperty(key) &&
          key != "all" &&
          this[key] < 1000 &&
          this[key] >= 10) {
        newObject.push({
          key: key,
          value: this[key]
        });
      }
    }
    return newObject;
  };
  
  var strucTypes = function (){
    let sorted = sGroup.top(Infinity)
    return sorted.map(d => d.key)
  }
  
  var sScale = d3.scaleOrdinal()
                 .domain(strucTypes);
  
  let structCountBarChart = dc.barChart(view.querySelector("#structureChart"));
  
  structCountBarChart.width(width)
                     .height(height)
                     .dimension(sDim)
                     .group(sGroup, 'Número de Locais por Tipo de Estrutura')
                     .x(sScale)
                     .xUnits(dc.units.ordinal)
                     .elasticX(true)
                     .elasticY(true)
                     .gap(1)
                     .centerBar(false)
                     .legend(dc.legend().x(width-2800).y(5).itemHeight(13).gap(5))
                     .renderHorizontalGridLines(true)
                     .colors('#379e90')
                     .xAxisLabel("Tipo de Estrutura")
                     .yAxisLabel("Número de Locais")
                     .on("filtered", function(chart,filter){updateMarkers()});
  

  //###################### BAR CONTENT ######################

  
  //###################### SCATTER CONTENT ######################

  const width2 = 500
  const height2 = 500
  
  
  let timeScatterChart = dc.scatterPlot(view.querySelector("#timeChart"));
  
  var yearDim = facts.dimension(function(d) { return [d.minDate, d.maxDate];});
  
  
  
  var yearGroup = yearDim.group();
  
  var minDim = facts.dimension(d => d.minDate);
  
  var xScale = d3.scaleLinear()
                 .domain([-18000, minDim.top(1)[0].minDate])
                 .range([width, height]);
  
  var maxDim = facts.dimension(d => d.maxDate);
  
  var yScale = d3.scaleLinear()
                 .domain([-4000, maxDim.top(1)[0].maxDate])
                 .range([width, height]);
  
  var valuDom = [];
  
  yearGroup.top(Infinity)
           .filter(function(d){
              if(!valuDom.includes(d.value)){
                valuDom.push(d.value);
              }       
           });
  
  var colorScale = d3.scaleLinear()
                     .domain(valuDom)
                     .range(["orange", "green"]);
  
  timeScatterChart.width(width2)
                  .height(height2)
                  .x(xScale)
                  .y(yScale)
                  .elasticY(false)
                  .elasticX(false)
                  .keyAccessor(d => d.key[0])
                  .valueAccessor(d => d.key[1])
                  .symbolSize(8)
                  .clipPadding(10)
                  .dimension(yearDim)
                  .group(yearGroup)
                  .colorAccessor(d => d.value)
                  .colors(d => colorScale(d))
                  .excludedColor("#dddddd")
                  .xAxisLabel("Ano Mínimo Estimado")
                  .yAxisLabel("Ano Máximo Estimado")
                  .on("filtered", function(chart,filter){updateMarkers()});
				  
  timeScatterChart.margins().left = 55;
  timeScatterChart.margins().bottom = 45;
  
  $('#selectScatter').click(function(event) {
    event.preventDefault();
	timeScatterChart.brushOn(false);
	$('#selectScatter').addClass('disabled');
	$('#filterScatter').removeClass('disabled');
	dc.renderAll();
  });
  
  $('#filterScatter').click(function(event) {
    event.preventDefault();
	timeScatterChart.brushOn(true);
	$('#filterScatter').addClass('disabled');
	$('#selectScatter').removeClass('disabled');
	dc.renderAll();
  });

  //###################### SCATTER CONTENT ######################

  
  //###################### MAP CONTENT ######################

  let mapI = L.map('mainMap').setView([36.7,43.0],2.5)

  $('#mainMap').css('height', 500).css('width', 1000);
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors',
		maxZoom: 17
		}).addTo(mapI);
    mapI.on('moveend', updateFilters);
  
  let placesLayer = L.layerGroup().addTo(mapI);
  
  
  let markers = d3.map();
  data.forEach(function (d){
    let point = L.circle([d.reprLat,d.reprLong],{
      color: '#379e90',
      weight: 2
    });
    
    var strucp = d.featureType.join(' ');
    point.bindPopup("<b>Nome: </b>" + d.title + "<br>" +
                    "<b>Descrição: </b>" + d.description + "<br>" +
                    "<b>Tipo(s) de Estrutura: </b>" + strucp + "<br>" +
                    "<b>Intervalo Estimado: </b>" + d.minDate + " ~ " + d.maxDate);
    
    point.on('clustermouseover', function(e){});
    point.id = d.id;
    markers.set(d.id, point);
    //placesLayer.addLayer(point);
  });

  let idDimension = facts.dimension(d => d.id)
  let idGrouping = idDimension.group()
  let layerList = []
  let visibleMarkers = []
  
  function updateMarkers(){
	  let ids = idGrouping.all()
	  let todisplay = new Array(ids.length) //preallocate array to be faster
	  let mc = 0; //counter of used positions in the array
	  for (let i = 0; i < ids.length; i++) {
		let tId = ids[i];
		if(tId.value > 0){ //when an element is filtered, it has value > 0
		  todisplay[mc] = markers.get(tId.key)
		  mc = mc + 1
		}
	  }
	  todisplay.length = mc; //resize the array so Leaflet does not complain
	  if (layerList.length == 1) {
		layerList[0].clearLayers() //remove circles in layerGroup
		if (mapI.hasLayer(layerList[0])){
		  mapI.removeLayer(layerList[0]) //remove layerGroup if present
		}
	  }
	  layerList[0] = L.layerGroup(todisplay).addTo(mapI) //add it again passing the array of markers
  }
  
  function updateFilters(e){
  layerList[0].eachLayer(function(layer) {
    if(e.target.getBounds().contains(layer.getLatLng())){
      visibleMarkers.push(layer.id)
    }
    else if(visibleMarkers.includes(layer.id)){
      let i = visibleMarkers.indexOf(layer.id)
      if(i !== -1){
        visibleMarkers.splice(i, 1)
      }
    }
  })

  idDimension.filterFunction(function(d) {
     return visibleMarkers.indexOf(d) > -1;
  });

  dc.redrawAll();
  }

  //###################### MAP CONTENT ######################



  //###################### BUBBLE CONTENT ######################

  
  var pediDim = facts.dimension((d => d.timePeriodsKeys),true);
  var periGroup = pediDim.group();
  
  var data = {"children":periGroup.top(Infinity).filter(d => d.key != "unknown")};
  
  const bubble = d3.pack(data)
                 .size([500,500])
                 .padding(1.5);
  
  var svg = d3.select("#periodsChart").append("svg")
              .attr("class","bubble")
			        .style("width", "500px")
			        .style("height", "500px")
              .style("cursor", "pointer");
  
  var nodes = d3.hierarchy(data)
                .sum(d => d.value);
  
  var node = svg.selectAll(".node")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(d => !d.children)
                .append("g")
                .attr("class","node")
                .attr("transform", function(d){
                   return "translate(" + d.x + "," + d.y + ")";
                });
  
  node.append("title")
      .text(d => "Período: " + d.data.key + "\n" + "Número de Locais: " + d.data.value);
  
  clicado = false
  
  node.append("circle")
      .attr("r", d => d.r)
      .style("fill", "#379e90")
	  .on("click", function(d) {
		d3.selectAll("circle") 
		.style("fill", "#379e90");
		pediDim.filterAll();
		d3.select(this) 
		.style("fill", "#070540");
		pediDim.filter(d.data.key);
	    updateMarkers();
	    dc.renderAll();
      });
  
  $('#resetPeriod').click(function(event) {
    event.preventDefault();
    clicado = false
	d3.selectAll("circle") 
	.style("fill", "#379e90");
	pediDim.filterAll();
	updateMarkers();
	dc.renderAll();
  });
  
  node.append("text")
      .style("text-anchor","middle")
      .text(d => d.data.key)
      .attr("font-family", "sans-serif")
      .attr("font-size", function(d){
          return d.r/7;
      })
      .attr("fill", "white");
	  
  
  var zoomH = d3.zoom()
                .on("zoom", zAct);
  zoomH(svg);
  
  function zAct(){
    svg.attr("transform", d3.event.transform)
  }

  //###################### BUBBLE CONTENT ######################
  
  updateMarkers()
  dc.renderAll()
  return svg.node()
	};