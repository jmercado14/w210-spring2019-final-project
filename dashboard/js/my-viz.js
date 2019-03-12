// Shorthand for $( document ).ready()
$(function() {
    // let's get started
    
    var data = [
  {
    x: 1,
    y: 80,
    size: 10,
    category: 1
  },
  {
    x: 2,
    y: 93,
    size: 5,
    category: 2
  },
  {
    x: 3,
    y: 76,
    size: 7,
    category: 3
  },
  {
    x: 4,
    y: 88,
    size: 15,
    category: 4
  },
  {
    x: 5,
    y: 67,
    size: 6,
    category: 5
  },
  {
    x: 6,
    y: 71,
    size: 8,
    category: 1
  },
  {
    x: 7,
    y: 76,
    size: 6,
    category: 2
  },
  {
    x: 8,
    y: 88,
    size: 10,
    category: 3
  },
  {
    x: 9,
    y: 96,
    size: 10,
    category: 4
  },
  {
    x: 10,
    y: 69,
    size: 7,
    category: 5
  },
  {
    x: 11,
    y: 76,
    size: 9,
    category: 1
  },
  {
    x: 12,
    y: 81,
    size: 7,
    category: 2
  },
  {
    x: 13,
    y: 89,
    size: 7,
    category: 3
  },
  {
    x: 14,
    y: 78,
    size: 7,
    category: 4
  },
  {
    x: 15,
    y: 62,
    size: 7,
    category: 5
  },
  {
    x: 16,
    y: 87,
    size: 7,
    category: 1
  },
  {
    x: 17,
    y: 102,
    size: 7,
    category: 2
  },
  {
    x: 18,
    y: 91,
    size: 7,
    category: 3
  },
  {
    x: 19,
    y: 90,
    size: 7,
    category: 4
  },
  {
    x: 20,
    y: 83,
    size: 7,
    category: 5
  }
];

var svg = d3.select("svg");

// Set chart dimensions
var width = 400;
var height = 250;

// Set chart margins, with space for axes
var margin = {
  	"top": 0,
  	"bottom": 20,
  	"left": 60,
  	"right": 0
};

// scale x and y
var x = d3.scaleLinear()
  	.domain(d3.extent(data.map(function(d) {
      	return d.x;
    })))
  	.range([margin.left, width + margin.left]);

var y = d3.scaleLinear()
  	.domain(d3.extent(data.map(function(d) {
      	return d.y;
    })))
  	.range([height + margin.bottom, margin.bottom]);

svg.append("rect")
	.attr("width",width)
	.attr("height",height)
	.attr("x",margin.left)
	.attr("y",margin.bottom);

svg
  	.selectAll("path.pt")
  	.data(data)
  	.enter()
  	.append("path")
  	.attr("class", "pt")
  	.attr("d", d3.symbol().type(d3.symbolCircle))
  	// use scaled x,y
  	.attr("transform", function(d) {
    return "translate(" + x(d.x) + "," + y(d.y) + ")";
 });

// create axes
var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);

svg.append("g")
    .attr("transform",function(d) { return "translate(0,"+(height+margin.bottom)+")"; })
    .call(xAxis);
svg.append("g")
  	.attr("transform",function(d) { return "translate("+(margin.left)+","+(0)+")"; })
    .call(yAxis);

svg.append("text")
  .attr("x", 0)
  .attr("y", function(d) {
    return height / 2;
  })
  .attr("dy", ".35em")
  .attr("font", "8px")
  .text("Minutes")
  ;

svg.append("text")
  .attr("x", function(d) {
    return margin.left + (width / 2);
  })
  .attr("y", function(d) {
    return height + 50;
  })
  .attr("dy", ".35em")
  .attr("font", "8px")
  .text("Day Id")
  ;

});

