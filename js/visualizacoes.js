d3.csv("https://raw.githubusercontent.com/IgorLimaKI/TrabalhoFinalVisDados/master/PLEIADES.csv").then(function(data){
	  
	var facts= crossfilter(data);

	var featureDimension = facts.dimension(d=>d.featureType);


	var view = document;
	var tableChart = dc.dataTable('#dc-table-graph');
  
	tableChart.width(500)
            .height(800)
            .dimension(featureDimension)
            .group(d => "List of all places corresponding to the filters")
            .size(5)
            .columns(['id',
                      'title',
                      'featureType',
                      'reprLat',
                      'reprLong'])
            .order(d3.ascending)
  
  
	dc.renderAll()

 
	var map = L.map('mapid');
	  
	$('#mapid').css('height', 800);
	  var teste = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
		}).addTo(map);

    var circlesLayer = L.layerGroup().addTo(map);

	
	  circlesLayer.clearLayers()
	  data.forEach( function(d) {
		  var circle = L.circle([d.reprLat, d.reprLong], 5, {
				  color: '#fd8d3c',
				  weight: 2,
				  fillColor: '#fecc5c',
				  fillOpacity: 0.5
			  })
		circlesLayer.addLayer(circle) })
		
	map.setView({ lat: 47.040182144806664, lng: 9.667968750000002 }, 4);
	return view;
	});