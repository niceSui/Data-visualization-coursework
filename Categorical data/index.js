const {csv, select, group,mean,rollup,scaleBand,scaleLinear,extent,interpolateInferno,max,min,axisBottom,axisLeft,scaleSequential,tip,range} = d3;
const datacsv = 'https://raw.githubusercontent.com/HKUST-VISLab/coding-challenge/master/temperature_daily.csv';
const width = innerWidth;
const height = innerHeight;

const svg = select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const parseRow = (d) => {
    d.date = new Date(d.date);
    d.year = d.date.getFullYear();
    d.month = d.date.getMonth()+1;
    d.day = d.date.getDate();
    d.max_temperature = + d.max_temperature;
    d.min_temperature = + d.min_temperature;
    return d;
}

const margin = {
    top: 60,
    right: 300,
    bottom: 160,
    left: 300,
  };

const radioDiv = select('body')
    .append('div')
    .attr('class', 'radioDiv');

const legendWidth = 1000;
const legendHeight = 50;
const legendX = margin.left;
const legendY = height - 100;
const legendNumBlocks = 10;
const legendBlockWidth = legendWidth / legendNumBlocks;



const tooltip = select('body')
    .append("div")
    .style("position", "absolute")
    .attr("class", "tooltip");




const main = async () => {
    const data = await csv(datacsv, parseRow);
    const latestData = data.filter(d => d.year >= 2008);
    const groupbyMonth = group(latestData, d => d.year,d => d.month);
    // 获取每天的最高和最低温度
    const dataToUse = Array.from(groupbyMonth, ([year, months]) => Array.from(months, ([month, data]) => ({
        year,
        month,
        max_temperature: data.map(d => d.max_temperature),
        min_temperature: data.map(d => d.min_temperature),
        day: data.map(d => d.day),
        max_temp_avg: mean(data, d => d.max_temperature),
        min_temp_avg: mean(data, d => d.min_temperature),
    }))).flat();



    const xScale_heatmap = scaleBand()
        .domain(dataToUse.map(d => d.year))
        .range([margin.left, width - margin.right])
        .padding(0.1);


    const yScale_heatmap = scaleBand()
        .domain(dataToUse.map(d => d.month))
        .range([height - margin.bottom, margin.top])
        .padding(0.1);

    const myColor = scaleSequential()
        .interpolator(interpolateInferno)
        .domain([min(dataToUse, d => d.min_temp_avg), max(dataToUse, d => d.max_temp_avg)]);



    const updateHeatmap = (data, temp) => {
        svg.selectAll("rect").remove();
        svg.selectAll("g").remove();
        tooltip.select("svg.tooltip_chart").remove();



        const xScale_line = scaleLinear()
            .domain([1,31])
            .range([0,xScale_heatmap.bandwidth()])


        const yScale_line = scaleLinear()
            .domain([0, extent(data, d => d.max_temperature)[1]])
            .range([yScale_heatmap.bandwidth()-2, 2]);

        const xScale_line_Tooltip = scaleLinear()
            .domain([1,31])
            .range([0,440])


        const yScale_line_Tooltip = scaleLinear()
            .domain([0, extent(data, d => d.max_temperature)[1]])
            .range([200, 0]);

        const line_max = d3.line()
            .x(d => xScale_line(d.day))
            .y(d => yScale_line(d.max_temperature));

        const line_min = d3.line()
            .x(d => xScale_line(d.day))
            .y(d => yScale_line(d.min_temperature));

        const line_max_Tooltip = d3.line()
            .x(d => xScale_line_Tooltip(d.day))
            .y(d => yScale_line_Tooltip(d.max_temperature));

        const line_min_Tooltip = d3.line()
            .x(d => xScale_line_Tooltip(d.day))
            .y(d => yScale_line_Tooltip(d.min_temperature));

        const tooltip_chart = tooltip
            .append("svg")
            .attr("class", "tooltip_chart")
            .attr("width", 520)
            .attr("height", 400);

        const xAxis = d3.axisBottom(xScale_line_Tooltip);
        const yAxis = d3.axisLeft(yScale_line_Tooltip);


        const mouseover = function(event, d) {
            tooltip
                .style("left", (event.x) + "px")
                .style("top", (event.y) + "px")
                .style('opacity', 1)

            let data = d.day.map((d1, t) => ({
                day: d1,
                max_temperature: d.max_temperature[t],
                min_temperature: d.min_temperature[t],
            }));


            const g_for_tooltip = tooltip_chart
                .append("g")
                .attr("transform", "translate(40,40)"); 

            g_for_tooltip.append("g")
                .attr("transform", "translate(0, 0)")
                .append("text")
                .text("Year: " + d.year +" Month: " + d.month)
                .attr("class", "tooltip_text");
            
            g_for_tooltip.append("g")
                .attr("transform", "translate(0, 25)")
                .append("text")
                .text("Max Average: " + d.max_temp_avg.toFixed(2) + "°C")
                .attr("class", "tooltip_text");

            g_for_tooltip.append("g")
                .attr("transform", "translate(0, 50)")
                .append("text")
                .text("Min Average: " + d.min_temp_avg.toFixed(2) + "°C")
                .attr("class", "tooltip_text");
                    
            g_for_tooltip
                .datum(data)
                .append("path")
                .attr("fill", "none")
                .attr("stroke","steelblue")
                .attr("stroke-width", 1.5)
                .attr("transform", "translate(0, 100)")
                .attr("d",line_max_Tooltip);

            g_for_tooltip
                .datum(data)
                .append("path")
                .attr("fill", "none")
                .attr("stroke","red")
                .attr("stroke-width", 1.5)
                .attr("transform", "translate(0, 100)")
                .attr("d",line_min_Tooltip);

            

            g_for_tooltip.append("g")
                .attr("transform", "translate(0, 300)")
                .call(xAxis);
            
            g_for_tooltip.append("g")
                .attr("transform", "translate(0, 100)")
                .call(yAxis);


        
            select(this)
                .style("stroke", "black")
                .style("opacity", 1) 
        };
        
        const mouseout = function(event, d) {
            tooltip
                .style('opacity', 0)
            tooltip_chart.selectAll("g").remove();
            select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        };

        const cells = svg.selectAll("g")
            .data(dataToUse)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${xScale_heatmap(d.year)}, ${yScale_heatmap(d.month)})`)
            .attr("class", "cell");

        cells.append("rect")
            .attr("width", xScale_heatmap.bandwidth())
            .attr("height", yScale_heatmap.bandwidth())
            .style("fill", d => myColor(d[temp]))
            .style("opacity", 0.8)
            .style("stroke", "none")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(axisBottom(xScale_heatmap).tickSize(10))
            .select(".domain").remove();

        svg.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(axisLeft(yScale_heatmap).tickSize(10))
            .select(".domain").remove();


        let i = 0;
        cells.each(function() {
            let data = dataToUse[i].day.map((d, t) => ({
                day: d,
                max_temperature: dataToUse[i].max_temperature[t],
                min_temperature: dataToUse[i].min_temperature[t],
            }));
            

            select(this)
            .datum(data)
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line_max);

            select(this)
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", line_min);

            i++;

        });

        const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

        const legendScale = scaleLinear()
        .domain([min(dataToUse, d => d.min_temp_avg), max(dataToUse, d => d.max_temp_avg)])
        .range([0, legendNumBlocks]);
    
        const intervals = range(legendNumBlocks).map(i => legendScale.invert(i));

        for (let i = 0; i < legendNumBlocks; i++) {
            legend.append("rect")
                .attr("x", i * legendBlockWidth)
                .attr("y", 0)
                .attr("width", legendBlockWidth)
                .attr("height", legendHeight)
                .style("fill", interpolateInferno(i / legendNumBlocks))
                .style('opacity', 0.8)
                .style("stroke", "none");

            legend.append("text")
                .attr("x", i * legendBlockWidth)
                .attr("y", legendHeight + 20)
                .style('font', '15px sans-serif')
                .text(intervals[i].toFixed(1) + "°C");

        }


    };

    let currentTemp = 'max_temp_avg';
    updateHeatmap(data, currentTemp);


    radioDiv.append('label')
        .text('Min Temperature')
        .attr('display', 'block')
        .append('input')
        .attr('transform', 'translate(100, 50)')
        .attr('type', 'radio')
        .attr('name', 'temp')
        .attr('value', 'min')
        .attr('checked', true)
        .on('change', function() {
            if(this.checked) {
                updateHeatmap(data, 'min_temp_avg');
            }});

    radioDiv.append('label')
        .text('Max Temperature')
        .attr('display', 'block')
        .append('input')
        .attr('transform', 'translate(100, 50)')
        .attr('type', 'radio')
        .attr('name', 'temp')
        .attr('value', 'max')
        .attr('checked', true)
        .on('change', function() {
            if(this.checked) {
                updateHeatmap(data, 'max_temp_avg');
            }});

}

main();