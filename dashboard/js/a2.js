// Shorthand for $( document ).ready()
var my_viz_lib = my_viz_lib || {};

my_viz_lib.plotData = function() {
  var svg = d3.select("svg");

  // Set chart dimensions
  var width = 400;
  var height = 250;

  // Set chart margins, with space for axes
  var margin = {
    "top": 35,
    "bottom": 20,
    "left": 60,
    "right": 0
  };

  var data = [];
  var data_ = function(_) {
    var that = this;
    if (!arguments.length) return data;
    data = _;
    return that;
  }

  var color_scale = d3.scaleLinear().domain([5, 15]).range(['beige', 'red']);

  var plot_ = function() {
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

    // create axes
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y); 

    var clickActive = false;

    svg.append("rect")
      .attr("width",width)
      .attr("height",height)
      .attr("x",margin.left)
      .attr("y",margin.bottom);

    circle = svg
    .selectAll("circles")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", function(d) {
      return x(d.x);
    })
    .attr("cy", function(d) {
      return y(d.y);
    })
    .on("mouseover", function(d,i) {
        if (!clickActive) {
          d3.select(this)
            .transition()
            .attr("fill",function(d) {
              return color_scale(d.size);
            })
            .attr("r", function(d) {
              return d.size;
            });
          console.log(d)
          }
        })
    .on("mouseout", function(d,i) {
        if (!clickActive) {
          d3.select(this)
            .transition()
            .attr("fill","black")
            .attr("r", 3);
        }
      })
    .on("click", function(d,i) {
        console.log(d.category);
        if (!clickActive) {
          highlight(d.category);
          cat = d.category
          clickActive = true;
        }
        else {
          unhighlight(d.category);
          clickActive = false;
        }
    });

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
    }


  var highlight = function(category) {
    circle.filter(function(d,i) { 
      if (d.category == category)
        return true;
      else
        return false;
    })
    .transition()
    .attr("fill", function(d) {
      return color_scale(d.size);
    })
    .attr("r", function(d) {
      return d.size;
    });
    svg.append("text")
      .attr("id", "legend")
      .transition()
      .attr("x", function(d) {
        return margin.left + width + 10;
      })
      .attr("y", margin.top)
      .text( function(d) {
        return "Selected: " + category;
    });
  };

  var unhighlight = function(category) {
    circle.filter(function(d,i) { 
      if (d.category == category)
        return true;
      else
        return false;
    })
      .transition()
      .attr("fill","black").attr("r","3");
    d3.select("text#legend")
      .transition()
      .attr("fill","white")
      .remove()
  };

  var public = {
    "plot": plot_,
    "data": data_,
    "highlight": highlight,
    "unhighlight": unhighlight
  };

  return public;  
};


$(function() {
    // let's get started
    
    var myData = [
  {
    x: 1,
    y: 80,
    size: 7,
    category: "Monday"
  },
  {
    x: 2,
    y: 93,
    size: 5,
    category: "Tuesday"
  },
  {
    x: 3,
    y: 76,
    size: 7,
    category: "Wednesday"
  },
  {
    x: 4,
    y: 88,
    size: 6,
    category: "Thursday"
  },
  {
    x: 5,
    y: 67,
    size: 6,
    category: "Friday"
  },
  {
    x: 6,
    y: 71,
    size: 8,
    category: "Monday"
  },
  {
    x: 7,
    y: 76,
    size: 10,
    category: "Tuesday"
  },
  {
    x: 8,
    y: 88,
    size: 11,
    category: "Wednesday"
  },
  {
    x: 9,
    y: 96,
    size: 10,
    category: "Thursday"
  },
  {
    x: 10,
    y: 69,
    size: 8,
    category: "Friday"
  },
  {
    x: 11,
    y: 76,
    size: 15,
    category: "Monday"
  },
  {
    x: 12,
    y: 81,
    size: 12,
    category: "Tuesday"
  },
  {
    x: 13,
    y: 89,
    size: 8,
    category: "Wednesday"
  },
  {
    x: 14,
    y: 78,
    size: 11,
    category: "Thursday"
  },
  {
    x: 15,
    y: 62,
    size: 12,
    category: "Friday"
  },
  {
    x: 16,
    y: 87,
    size: 14,
    category: "Monday"
  },
  {
    x: 17,
    y: 102,
    size: 10,
    category: "Tuesday"
  },
  {
    x: 18,
    y: 91,
    size: 7,
    category: "Wednesday"
  },
  {
    x: 19,
    y: 90,
    size: 9,
    category: "Thursday"
  },
  {
    x: 20,
    y: 83,
    size: 13,
    category: "Friday"
  }
  ];

  var transitPlot = my_viz_lib.plotData();
    transitPlot.data(myData);
    transitPlot.plot();

})


