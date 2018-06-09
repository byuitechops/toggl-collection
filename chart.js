const svg = d3.select('svg')
const margin = {
  top: 20,
  right: 20,
  bottom: 30,
  left: 20,
  innerLeft: 20,
}
const width = 800 /* svg.node().clientWidth */ - margin.left - margin.right - margin.innerLeft
const height = svg.node().clientHeight - margin.top - margin.bottom

const x = d3.scaleBand().rangeRound([margin.innerLeft, width+margin.innerLeft]).padding(0.1)
const y = d3.scaleLinear().rangeRound([0, height])

const chart = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
const xAxis = chart.append("g").attr("class", "axis axis--x")
const yAxis = chart.append("g").attr("class", "axis axis--y")

function time(d) {
  var dur = moment.duration(d)
  return [['days','days'],['hours','hours'],['minutes','min'],['seconds','sec']]
    .map(([unit, dis]) => [dis, dur.get(unit)])
    .filter(([unit, time]) => time)
    .slice(0, 2)
    .map(([unit, amount]) => amount + ' ' + (amount == 1 ? unit.replace(/\s$/, '') : unit))
    .join(' ') || (d === 0 ? '0 sec' : 'under a second')
}

async function getReport(start,end){
  var path = page => `/reports/api/v2/details?user_agent=bananas&workspace_id=${GLOBALS.user.workspace}&since=${start.format('YYYY-MM-DD')}&until=${end.format('YYYY-MM-DD')}&page=${page}`
  var page=1,data=[],body
  do{
    body = await get(GLOBALS.user.toggltoken,path(page))
    data = data.concat(body.data)
    page++
  } while(body.data.length >= body.per_page)

  // play with time
  data.forEach(task => {
    task.start = moment(task.start)
    task.end = moment(task.end)
    var day = task.start.clone().startOf('day')
    task.time = [task.start,task.end].map(d => d.diff(day))
  })

  return data
}

async function displayGraph(distanceFromCurrent = 0,isWeek=true,) {
  var start,end
  if(isWeek){
    start = moment().day(-distanceFromCurrent * 7+1)
    end = moment().day(-distanceFromCurrent * 7+6)
  } else {
    start = moment().startOf('month')
    end = moment().endOf('month')
  }
  var data = await getReport(start,end)
  console.log(data)// stop deleting

  var morning = moment('8:00am','h:mma').diff(moment().startOf('day'))
  var afternoon = moment('5:00pm','h:mma').diff(moment().startOf('day'))
  y.domain([
    Math.min(morning,...data.map(d => d.time[0])),
    Math.max(afternoon,...data.map(d => d.time[1])),
  ].map((n,i) => (Math.floor(n/(1000*60*60))+i)*1000*60*60))
  x.domain(d3.range(end.diff(start,'days')+1))
  xAxis.call(d3.axisTop(x)
    .tickFormat((d,i) => start.clone().add(i,'day').format(isWeek ? 'ddd D/M' : 'Do')))
  xAxis.select('.domain').remove()
  xAxis.selectAll('.tick line').remove()
  xAxis.selectAll('.tick text')
  yAxis.call(d3.axisRight(y)
    .tickValues(d3.range(...y.domain(),(1000*60*60)))
    .tickFormat(d => moment().startOf('day').add(d).format('h A'))
    .tickSize(width+margin.innerLeft))
  yAxis.select('.domain').remove()
  yAxis.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#ddd")
  yAxis.selectAll(".tick text").attr("x", 0).attr("dy", 12)

  chart.append('g').selectAll('.task')
    .data(data)
    .enter().append('rect')
    .attr('class','task')
    .attr('x',d => x(d.start.diff(start,'days')+isWeek))
    .attr('y',d => y(d.time[0]))
    .attr('width',d => x.bandwidth())
    .attr('height',d => y(d.time[1]) - y(d.time[0]))
    .attr('fill',d => d.project_hex_color)
}