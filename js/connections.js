

let dataset;

let promises = [
  d3.json('https://gist.githubusercontent.com/EveAndrade/35f886bf3dfd8c4cfa3bb919fb5dbab6/raw/0dda5ff717ab871acf5ffc4580ee31c9038dbe5b/PLEIADES.json')
  .then(function (data){
    data.nodes.forEach(function (x){
      let con = 0;
      data.links.forEach(function (y){
        if(x.id == y.source || x.id == y.target){
          con = con + 1;
        }
      });
      x.connections = con;
    });
    return data;
  }),
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
	dataset = data;
  })
]

Promise.all(promises).then(ready);

function ready([data]) {
	  
  const width = 1000
  const height = 500
  
  let view = document;
  
  const svg = d3.select('#connects').append("svg")
    .attr("width", width)
    .attr("height", height);

  
  var connScale = d3.scaleSqrt()
                    .domain(d3.extent(data.nodes, d => d.connections))
                    .range([1, d3.max(data.nodes, d => d.connections)]);
  
  var connecColor = d3.scaleLinear()
                      .domain([0, d3.max(data.nodes, d => d.connections)])
                      .range(["#070540","#ffbf75"]);
  
  const nodes = data.nodes.filter(function(obj){
                              return obj.connections != 0;
                           });
  const links = data.links;
  
  const simulation = d3.forceSimulation()
                       .nodes(nodes);
  
  var linkF = d3.forceLink(links)
                .id(d=> d.id)
                .distance(600);
  
  var chargeF = d3.forceManyBody()
                  .strength(-150)
                  .distanceMax(1800);
  
  var centerF = d3.forceCenter();
  
  simulation.force("charge_force", chargeF)
            .force("center_force", centerF)
            .force("links", linkF);
  
  simulation.on("tick", tickActions);
  
  var g = svg.append('g')
             .attr("transform","translate(" + width/2 + "," + height/2 + ") scale(0.05,0.05)")
             .attr("class","everything");
  
  const link = g.append('g')
                .selectAll('line')
                .data(links)
                .enter()
                .append('line')
                .attr('class', 'link')
                .attr('stroke','#18403a')
                .attr('stroke-width', 2);
  
  const node = g.append('g')
                .selectAll('circle')
                .data(nodes)
                .enter()
                .append('circle')
                .attr('class', 'node')
                .attr('r', d => connScale(d.connections) + 1)
                .attr('fill', '#379e90')
                .attr('opacity', '0.7')
                .attr('stroke','#18403a')
                .attr('stroke-width', 10)
                .on('mouseover', mouseON)
                .on("mouseout", mouseOFF);
  
  node.append('title')
      .text(d => getTip(d))
  
  var dragH = d3.drag()
                .on("start", dstart)
                .on("drag", ddrag)
                .on("end", dend);
  dragH(node);
  
  var zoomH = d3.zoom()
                .on("zoom", zAct);
  zoomH(svg);
  
  function dstart(d){
    if(!d3.event.active){
      simulation.alphaTarget(0.3).restart();
    }
    else{
      d.fx = d.x;
      d.fy = d.y;
    }
  }
  
  function ddrag(d){
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dend(d){
    if (!d3.event.active){
      simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }
  
  function zAct(){
    g.attr("transform","translate(" + width/2 + "," + height/2 + ") scale(0.025,0.025)")
     .attr("transform", d3.event.transform);
  }
  
  function mouseON(d){    
    node.attr('opacity', o => {
          const isConnectedValue = isConnected(o, d);
          if (isConnectedValue) {
            return 1.0;
          }
          else{
            return 0.7;
          }
        })
        .attr('fill', (o) => {
          let fillColor;
          if (isConnectedAsTarget(o, d) || isConnectedAsSource(o, d)) {
            fillColor = "orange";
          }
          else if(isEqual(o, d)){
            fillColor = "#070540"
          }
          else{
            fillColor = "#379e90"
          }
          return fillColor;
        })
        .attr('stroke', (o) =>{
          let strokeColor;
          if (isConnectedAsTarget(o, d) || isConnectedAsSource(o, d)) {
            strokeColor = "#070540";
          }
          else if(isEqual(o, d)){
            strokeColor = "orange"
          }
          else{
            strokeColor = '#18403a'
          }
          return strokeColor;
        });
    
    link.attr('stroke', (o) => {
            let lineColor;
            if(o.source === d || o.target === d){
              lineColor = "orange"
            }
            else{
              lineColor = '#18403a'
            }
            return lineColor
         })
         .attr('stroke-width', (o) => {
            let strokeW;
            if(o.source === d || o.target === d){
              strokeW = 30
            }
            else{
              strokeW = 2
            }
            return strokeW
         });
  }
  
  function mouseOFF(){
    node
    link
  }
  
  let linkedByIndex = {};
  links.forEach((d) => {
    linkedByIndex[`${d.source.index},${d.target.index}`] = true;
  });
  
  function isConnected(a, b) {
    return isConnectedAsTarget(a, b) || isConnectedAsSource(a, b) || a.index === b.index;
  }

  function isConnectedAsSource(a, b) {
    return linkedByIndex[`${a.index},${b.index}`];
  }

  function isConnectedAsTarget(a, b) {
    return linkedByIndex[`${b.index},${a.index}`];
  }
  
  function isEqual(a, b) {
    return a.index === b.index;
  }
  
  function getTip(d) {
    var aux = dataset.find(x => x.id == d.id);
    var strucp = aux.featureType.join(' ');

    var h = "Nome: " + aux.title + "\n" +
            "Descrição: " + aux.description + "\n" +
            "Tipo(s) de Estrutura: " + strucp + "\n" +
            "Intervalo Estimado: " + aux.minDate + " ~ " + aux.maxDate +"\n" +
            "Número de Conexões: " + d.connections;
    return h;
  }
  
  function tickActions() {
    link.attr("x1", d => d.source.x);
    link.attr("y1", d => d.source.y);
    link.attr("x2", d => d.target.x);
    link.attr("y2", d => d.target.y);
  
    node.attr('cx', d => d.x);
    node.attr('cy', d => d.y);
  }
  
  return svg.node()
	};