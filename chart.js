const svg = d3.select('svg')
const margin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 20
}
const width = 700 /* svg.node().clientWidth */ - margin.left - margin.right
const height = svg.node().clientHeight - margin.top - margin.bottom
const x = d3.scaleBand()
  .domain(d3.range(5))
  .rangeRound([0, width])
  .padding(0.1)
const y = d3.scaleLinear().rangeRound([height, 0])

const chart = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const xAxis = chart.append("g")
  .attr("class", "axis axis--x")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x).tickFormat((d,i) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]));

function time(d) {
  var dur = moment.duration(d)
  return [['days','days'],['hours','hours'],['minutes','min'],['seconds','sec']]
    .map(([unit, dis]) => [dis, dur.get(unit)])
    .filter(([unit, time]) => time)
    .slice(0, 2)
    .map(([unit, amount]) => amount + ' ' + (amount == 1 ? unit.replace(/\s$/, '') : unit))
    .join(' ') || (d === 0 ? '0 sec' : 'under a second')
}

async function displayGraph(distanceFromCurrent = 0) {
  var week = moment().day(-distanceFromCurrent * 7)
  var body = await get(GLOBALS.toggltoken, `/reports/api/v2/weekly?user_agent=ear15002@byui.edu&workspace_id=${GLOBALS.workspace}&grouping=users&since=${week.format('YYYY-MM-DD')}`)

  body.data.push({details:[]})
  var projects = body.data[0].details.reduce((obj,p) => {obj[p.pid] = p.title.project;return obj},{})
  var days = body.data[0].details.reduce((arr,p) => {p.totals.slice(1,-2).forEach((time,i) => time && arr[i].projects.push({project:p.pid,time:time}));return arr},
    body.week_totals.slice(1,-2).map(total => ({total:total||0,projects:[]})))

  y.domain([0, Math.max(1000*60*60,body.week_totals[7])])
  xAxis.call(d3.axisBottom(x).tickFormat((d,i) => week.clone().add(i+1,'day').format('ddd M/D')))

  chart.selectAll(".bar")
    .data(days)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", (d,i) => x(i))
    .attr("y", d => y(d.total))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.total))
}