const svg = d3.select('svg')
    margin = {top:20,right:20,bottom:30,left:100},
    width = svg.node().clientWidth - margin.left - margin.right,
    height = svg.node().clientHeight - margin.top - margin.bottom,
    x = d3.scaleBand()
      .domain(['Mon','Tue','Wed','Thu','Fri'])
      .rangeRound([0, width])
      .padding(0.1)
    y = d3.scaleLinear().rangeRound([height, 0]),
    chart = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
const xAxis = chart.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

const yAxis = chart.append("g")
    .attr("class", "axis axis--y")

yAxis.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text("Frequency");
    
async function displayGraph(distanceFromCurrent=0){
    var week = moment().day(-distanceFromCurrent*7)
    var body = await get(GLOBALS.toggltoken,`/reports/api/v2/weekly?user_agent=ear15002@byui.edu&workspace_id=${GLOBALS.workspace}&grouping=users&since=${week.format('YYYY-MM-DD')}`)
    var details = body.data[0] ? body.data[0].details : []
    var projects = details.reduce((obj,p) => { obj[p.pid] = { name:p.title.project, total:p.totals[7]}; return obj },{})
    var data = Array(5).fill().map((_,i) => details.map(p => ({project:projects[p.pid],time:p.totals[1+i]||0})))

    y.domain([0, Math.max(...body.week_totals.slice(0,-1))]);
    yAxis.call(d3.axisLeft(y).tickFormat(d => {
      var dur = moment.duration(d)
      return [['days','days'],['hours','hours'],['minutes','min'],['seconds','sec']]
        .map(([unit,dis]) => [dis,dur.get(unit)])
        .filter(([unit,time]) => time)
        .slice(0,2)
        .map(([unit,amount]) => amount+' '+(amount==1?unit.replace(/\s$/,''):unit))
        .join(' ') || 'under a second'
    }))

    // g.selectAll(".bar")
    // .data(data)
    // .enter().append("rect")
    //   .attr("class", "bar")
    //   .attr("x", function(d) { return x(d.letter); })
    //   .attr("y", function(d) { return y(d.frequency); })
    //   .attr("width", x.bandwidth())
    //   .attr("height", function(d) { return height - y(d.frequency); });
}