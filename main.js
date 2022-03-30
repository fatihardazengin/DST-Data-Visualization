// importing d3 lib.
/*global d3*/
/*global selectedData*/
/*global fetch*/

var parseDate = d3.timeParse("%Y-%m-%d");


//Reading the data.

fetch("daily_sentiment.json") // fetching the data file.
        .then(response => response.text())
        .then((response) => {
            //console.log(response)
            
            let data=response.split("\n")
            //console.log(data)
            data=data.map(e=>JSON.parse(e))
            data=data.map(e=>{
              //delete e.bootstrapped_means;
              e.timestamp=e.timestamp*1000;
              return e;
              
            })
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 60, bottom: 50, left: 60},
        //width = window.innerWidth - margin.left - margin.right -((window.innerWidth/100)*17)
        height = 450 - margin.top - margin.bottom;

    // find data range
    var xMin = d3.min(data, function(d){ return Math.min(d.timestamp); });
    var xMax = d3.max(data, function(d){ return Math.max(d.timestamp); });
    var yMin = d3.min(data, function(d){ return Math.min(d.senti_avg); });
    var yMax = d3.max(data, function(d){ return Math.max(d.senti_avg); });
    
	var svg = d3.select("#chart")
		margin = margin,
		width = +svg.attr("width") - margin.left - margin.right ,
		height = +svg.attr("height") - margin.top - margin.bottom;

	var x = d3.scaleTime()
		.domain([xMin,xMax])
		.range([margin.left, width - margin.right])

	var y = d3.scaleLinear()
		.domain([yMin,yMax+0.2]).nice()
		.range([height - margin.bottom, margin.top])

	var xAxis = svg.append("g")
		.attr("class", "x-axis")
		.attr("clip-path", "url(#clip)")
		.attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

	var yAxis = svg.append("g")
		.attr("class", "y-axis")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(y));

	var line = d3.line()
		.defined(d => !isNaN(d.senti_avg))
		.x(d => x(d.timestamp))
		.y(d => y(d.senti_avg))

	var defs = svg.append("defs").append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("x", margin.left)
		.attr("width", width - margin.right)
		.attr("height", height);

    //Show confidence interval
    var confidence = svg.append("path")
        .datum(data)
        .attr("class", "conf")
        .attr("fill", "#cce5df")
        .attr("clip-path", "url(#clip)")
        .attr("stroke", "none")
        .attr("d", d3.area()
            .x(function(d) { return x(d.timestamp) })
            .y0(function(d) { return y(d.senti_avg+d.senti_sd) })
            .y1(function(d) { return y((d.senti_avg-d.senti_sd)) }));
    
	var path = svg.append("path")
		.datum(data)
		.attr("class", "path")
		.attr("fill", "none")
		.attr("clip-path", "url(#clip)")
		.attr("stroke", "steelblue")
		.attr("stroke-width", 1)
		.attr("d", line);
    
    

	svg.call(zoom);

	function zoom(svg) {

		var extent = [
			[margin.left, margin.top], 
			[width - margin.right, height - margin.top]
		];

		var zooming = d3.zoom()
			.scaleExtent([1, 15])
			.translateExtent(extent)
			.extent(extent)
			.on("zoom", zoomed);

		svg.call(zooming);

		function zoomed() {

			x.range([margin.left, width - margin.right]
				.map(d => d3.event.transform.applyX(d)));

			svg.select(".path")
				.attr("d", line);
            
			svg.select(".conf")
				.attr("d", d3.area()
            .x(function(d) { return x(d.timestamp) })
            .y0(function(d) { return y(d.senti_avg+d.senti_sd) })
            .y1(function(d) { return y((d.senti_avg-d.senti_sd)) }));
			svg.select(".x-axis")
				.call(d3.axisBottom(x)
					.tickSizeOuter(0));
		}
	}

	svg.call(hover)

	function hover() {

		var bisect = d3.bisector(d => d.timestamp).left,
			format = d3.format("+.0%"),
			dateFormat = d3.timeFormat("%d.%m.%Y")

		var focus = svg.append("g")
			.attr("class", "focus")
			.style("display", "none");

		focus.append("line")
			.attr("stroke", "#666")
			.attr("stroke-width", 1)
			.attr("y1", -height + margin.top)
			.attr("y2", -margin.bottom);

		focus.append("circle")
			.attr("class", "circle")
			.attr("r", 5)
			.attr("dy", 5)
			.attr("stroke", "steelblue")
			.attr("fill", "#fff");

		focus.append("text")
            .attr("id","datetxt")
			.attr("text-anchor", "left")
			.attr("dy", ".35em");
        focus.append("text")
            .attr("id","avgtxt")
			.attr("text-anchor", "left")
			.attr("dy", ".35em");
       focus.append("text")
            .attr("id","sdtxt")
			.attr("text-anchor", "left")
			.attr("dy", ".35em");
        focus.append("text")
            .attr("id","wordstxt")
			.attr("text-anchor", "left")
			.attr("dy", ".35em");

		var overlay = svg.append("rect")
			.attr("class", "overlay")
			.attr("x", margin.left)
			.attr("y", margin.top)
			.attr("width", width - margin.right - margin.left - 1)
			.attr("height", height - margin.bottom - margin.top)
			.on("mouseover", () => focus.style("display", null))
			.on("mouseout", () => focus.style("display", "none"))
			.on("mousemove", mousemove);
	
		function mousemove() {

			var x0 = x.invert(d3.mouse(this)[0]);

			var i = bisect(data, x0, 1),
				d0 = data[i - 1],
				d1 = data[i],
				d = x0 - d0.timestamp > d1.timestamp - x0 ? d1 : d0;

			focus.select("line")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + height + ")");

			focus.selectAll(".circle")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + y(d.senti_avg) + ")");

//			focus.select("text")
//				.attr("transform", 
//					"translate(" + x(d.timestamp) + "," + (height  + margin.bottom) + ")")
//				.text( "Date:"+dateFormat(d.timestamp) + 
//                      " Avg:" + d.senti_avg.toFixed(2) + '\n\r SD: ' + d.senti_sd.toFixed(3));
            focus.select("#datetxt")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + (height   - 20 ) + ")")
				.text( "Date:"+dateFormat(d.timestamp));
            focus.select("#avgtxt")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + (height    ) + ")")
				.text( "Avg:" + d.senti_avg.toFixed(2));
            focus.select("#sdtxt")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + (height   + 20 ) + ")")
				.text('SD: ' + d.senti_sd.toFixed(3));
            focus.select("#wordstxt")
				.attr("transform", 
					"translate(" + x(d.timestamp) + "," + (height   + 40 ) + ")")
				.text('Most Common Words: ' );
		}
	}
                  })
                  .catch(err => console.log(err))


////

