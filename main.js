// importing d3 lib.
/*global d3*/
/*global selectedData*/
/*global fetch*/



// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = screen.width - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
        
  ;
  
  

//
fetch("dataof2016Demo.json")
        .then(response => response.text())
        .then((response) => {
            //console.log(response)
            
            let data=response.split("\n")
            //console.log(data)
            data=data.map(e=>JSON.parse(e))
            data=data.map(e=>{
              delete e.bootstrapped_means;
              e.timestamp=e.timestamp*1000;
              return e;
              
            })
            // find data range
            var xMin = d3.min(data, function(d){ return Math.min(d.timestamp); });
            var xMax = d3.max(data, function(d){ return Math.max(d.timestamp); });
            var yMin = d3.min(data, function(d){ return Math.min(d.mean_estimation); });
            var yMax = d3.max(data, function(d){ return Math.max(d.mean_estimation); });
          //console.log(data);
            var x = d3.scaleTime()
              .domain([xMin,xMax])
              .range([ 0, width ]);
            svg.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x));
          
            // Add Y axis
            var y = d3.scaleLinear()
              .domain([yMin,yMax])
              .range([ height, 0 ]);
           
               // This allows to find the closest X index of the mouse:
            var bisect = d3.bisector(function(d) { return d.timestamp; }).left;
          
            // Create the circle that travels along the curve of chart
            var focus = svg
              .append('g')
              .append('circle')
                .style("fill", "none")
                .attr("stroke", "black")
                .attr('r', 8.5)
                .style("opacity", 0)
          
            // Create the text that travels along the curve of chart
            var focusText = svg
              .append('g')
              .append('text')
                .style("opacity", 0)
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "middle")

              
            svg.append("g")
              .call(d3.axisLeft(y));
            svg
              .append("path")
              .datum(data)
              .attr("fill", "none")
              .attr("stroke", "steelblue")
              .attr("stroke-width", 1.5)
              .attr("d", d3.line()
                .x(function(d) { return x(d.timestamp) }) 
                .y(function(d) { return y(d.mean_estimation) })
                )
          // Create a rect on top of the svg area: this rectangle recovers mouse position
            svg
              .append('rect')
              .style("fill", "none")
              .style("pointer-events", "all")
              .attr('width', width)
              .attr('height', height)
              .on('mouseover', mouseover)
              .on('mousemove', mousemove)
              .on('mouseout', mouseout);
          
          
            // What happens when the mouse move -> show the annotations at the right positions.
            function mouseover() {
              focus.style("opacity", 1)
              focusText.style("opacity",1)
            }
          
            function mousemove() {
              // recover coordinate we need
              var x0 = x.invert(d3.mouse(this)[0]);
              var i = bisect(data, x0, 1);
              selectedData = data[i]
              focus
                .attr("cx", x(selectedData.timestamp))
                .attr("cy", y(selectedData.mean_estimation))
              focusText
                .html("Time:" + new Date(selectedData.timestamp).toLocaleString() + "  -  " + "Value:" + selectedData.mean_estimation.toFixed(2))
                .attr("x", x(selectedData.timestamp)+15)
                .attr("y", y(selectedData.mean_estimation-0.091))
              }
            function mouseout() {
              focus.style("opacity", 0);
              focusText.style("opacity", 0);
            }
                  })
                  .catch(err => console.log(err))


////

