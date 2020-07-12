d3.csv("https://raw.githubusercontent.com/IgorLimaKI/TrabalhoFinalVisDados/master/PLEIADES.csv").then(function(data){
	  
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
	  
	var facts= crossfilter(data);

	var featureDimension = facts.dimension(d=>d.featureType);


	var view = document;
	var tableChart = dc.dataTable('#dc-table-graph');
  
	tableChart.width(500)
            .height(800)
            .dimension(featureDimension)
            .group(d => "Lista de Locais")
            .size(5)
            .columns(['id',
                      'title',
                      'featureType',
                      'reprLat',
                      'reprLong'])
            .order(d3.ascending)
  
  
	dc.renderAll()

 
	var map = L.map('mapid');
	  
	$('#mapid').css('height', 500);
	var teste = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors'
		}).addTo(map);

    var circlesLayer = L.layerGroup().addTo(map);

	
	  circlesLayer.clearLayers()
	  data.forEach( function(d) {
		  var circle = L.circle([d.reprLat, d.reprLong], 5, {
				  color: '#379e90',
				  weight: 2,
				  fillColor: '#379e90',
				  fillOpacity: 0.5
			  })
		  var strucp = d.featureType.join(' ');
				circle.bindPopup("<b>Nome: </b>" + d.title + "<br>" +
				"<b>Descrição: </b>" + d.description + "<br>" +
				"<b>Tipo(s) de Estrutura: </b>" + strucp + "<br>" +
				"<b>Intervalo Estimado: </b>" + d.minDate + " ~ " + d.maxDate);
		circlesLayer.addLayer(circle) })
		
	map.setView([36.7,43.0],2.5);
	return view;
	});