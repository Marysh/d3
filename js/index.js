let gauge = function (container, configuration) {
  let that = {};
  let config = {
    size: 200,
    clipWidth: 200,
    clipHeight: 110,
    ringInset: 20,
    ringWidth: 20,

    pointerWidth: 10,
    pointerTailLength: 5,
    pointerHeadLengthPercent: 0.4,

    minValue: -100,
    maxValue: 100,

    minAngle: -90,
    maxAngle: 90,

    transitionMs: 750,

    majorTicks: 17,
    labelFormat: d3.format(',g'),
    labelInset: 10,

    // arcColorFn: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#3e6c0a'))
  };
  let range = undefined;
  let r = undefined;
  let pointerHeadLength = undefined;
  let value = 0;

  let svg = undefined;
  let arc = undefined;
  let scale = undefined;
  let ticks = undefined;
  let tickData = undefined;
  let pointer = undefined;

  // let donut = d3.pie();

  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  function newAngle(d) {
    let ratio = scale(d);
    let newAngle = config.minAngle + (ratio * range);
    return newAngle;
  }

  function configure(configuration) {
    let prop = undefined;
    for (prop in configuration) {
      config[prop] = configuration[prop];
    }

    range = config.maxAngle - config.minAngle;
    r = config.size / 2;
    pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

    scale = d3.scaleLinear()
      .domain([config.minValue, config.maxValue])
      .range([0, 1]);

    ticks = scale.ticks(config.majorTicks);
    tickData = d3.range(config.majorTicks).map(function () {
      return 1 / config.majorTicks;
    });

    arc = d3.arc()
      .innerRadius(r - config.ringWidth - config.ringInset)
      .outerRadius(r - config.ringInset - 30) // - 30 for height decreasing
      .startAngle(function (d, i) {
        let ratio = d * i;
        return deg2rad(config.minAngle + (ratio * range) + 4);
      })
      .endAngle(function (d, i) {
        let ratio = d * (i + 1);
        return deg2rad(config.minAngle + (ratio * range) - 4);
      });
  }

  that.configure = configure;

  function centerTranslation() {
    return 'translate(' + r + ',' + r + ')';
  }

  function isRendered() {
    return (svg !== undefined);
  }

  that.isRendered = isRendered;

  function render(newValue) {
    svg = d3.select(container)
      .append('svg:svg')
      .attr('class', 'gauge')
      .attr('width', config.clipWidth)
      .attr('height', config.clipHeight);

    let centerTx = centerTranslation();

    let arcs = svg.append('g')
      .attr('class', 'arc')
      .attr('transform', centerTx);

    arcs.selectAll('path')
      .data(tickData)
      .enter().append('path')
    // .attr('fill', function (d, i) {
    //   return config.arcColorFn(d * i);
    // })
      .attr('fill', (lineData, index, lines) => {
        const centerLineIndex = Math.ceil(lines.length / 2);
        const firstQuarterLineIndex = (lines.length - centerLineIndex) / 2;
        const lastQuarterLineIndex = lines.length - (lines.length - centerLineIndex) / 2 - 1;

        if(index + 1 > centerLineIndex && index !== lines.length - 1 && index !== lastQuarterLineIndex) {
          return 'tomato';
        } else {
          return '#ccc'
        }
      })
      .attr('d', (lineData, index, lines) => {
        return arc(lineData, index, lines);
      });

    // let lg = svg.append('g')
    //   .attr('class', 'label')
    //   .attr('transform', centerTx);
    // lg.selectAll('text')
    //   .data(ticks)
    //   .enter().append('text')
    //   .attr('transform', function (d) {
    //     let ratio = scale(d);
    //     let newAngle = config.minAngle + (ratio * range);
    //     return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
    //   })
    //   .text(config);

    let lineData = [[config.pointerWidth / 2, 0],
      [0, -pointerHeadLength],
      [-(config.pointerWidth / 2), 0],
      [0, config.pointerTailLength],
      [config.pointerWidth / 2, 0]];
    // let pointerLine = d3.line().interpolate('monotone');
    let pointerLine = d3.line();
    let pg = svg.append('g').data([lineData])
      .attr('class', 'pointer')
      .attr('transform', centerTx);

    pointer = pg.append('path')
      .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/)
      .attr('transform', 'rotate(' + config.minAngle + ')');

    update(newValue === undefined ? 0 : newValue);
  }

  that.render = render;

  function update(newValue, newConfiguration) {
    if (newConfiguration !== undefined) {
      configure(newConfiguration);
    }
    let ratio = scale(newValue);
    let newAngle = config.minAngle + (ratio * range);
    pointer.transition()
      .duration(config.transitionMs)
      // .ease('elastic')
      .attr('transform', 'rotate(' + newAngle + ')')
      .attr('fill', 'black');
  }

  that.update = update;

  configure(configuration);

  return that;
};

function onDocumentReady() {
  let powerGauge = gauge('#power-gauge', {
    size: 300,
    clipWidth: 300,
    clipHeight: 300,
    ringWidth: 50,
    maxValue: 10,
    transitionMs: 4000,
  });
  powerGauge.render();

  function updateReadings() {
    // just pump in random data here...
    powerGauge.update(Math.random() * 10);
  }

  // every few seconds update reading values
  updateReadings();
  setInterval(function () {
    updateReadings();
  }, 5 * 1000);
}

if (!window.isLoaded) {
  window.addEventListener("load", function () {
    onDocumentReady();
  }, false);
} else {
  onDocumentReady();
}

const gaugeChart = (o) => {
  const chart = d3.select(o.el);
  const width = chart.attr('width', '10px');
  const center = width / 2;
  const outerBezelWidth = width * 0.009;
  const outerBezelRadius = center - outerBezelWidth;
  const innerBezelWidth = width * 0.072;
  const innerBezelRadius = outerBezelRadius - (innerBezelWidth / 2);
  const tickHeight = outerBezelWidth + innerBezelWidth + (width * 0.027);
  const tickWidth = width * 0.009;
  const tickHiderRadius = width * 0.345;
  const labelY = center / 1.3;
  const valueLabelY = width * 0.75;
  const labelFontSize = width * 0.13;
  const needleWidth = width * 0.054;
  const needleCapRadius = width * 0.059;
  const tickSpacing = 13.5;
  const lastTickAngle = 135;
  let angle = -135;

  const needleScale = d3.scaleLinear()
    .domain([o.min || 0, o.max || 100])
    .range([angle, lastTickAngle]);

  const needleAngle = needleScale(o.value);

  /* outer bezel */
  chart.append('circle')
    .attr('class', 'gaugeChart-bezel-outer')
    .attr('cx', center)
    .attr('cy', center)
    .attr('stroke-width', outerBezelWidth)
    .attr('r', outerBezelRadius);

  /* face */
  chart.append('circle')
    .attr('class', 'gaugeChart-face')
    .attr('cx', center)
    .attr('cy', center)
    .attr('r', outerBezelRadius - 1);

  /* inner bezel */
  chart.append('circle')
    .attr('class', 'gaugeChart-bezel-inner')
    .attr('cx', center)
    .attr('cy', center)
    .attr('stroke-width', innerBezelWidth)
    .attr('r', innerBezelRadius);

  while (angle <= lastTickAngle) {
    chart.append('line')
      .attr('class', 'gaugeChart-tick')
      .attr('x1', center)
      .attr('y1', center)
      .attr('x2', center)
      .attr('y2', tickHeight)
      .attr('stroke-width', tickWidth)
      .attr('transform', `rotate(${angle} ${center} ${center})`);

    angle += tickSpacing;
  }

  /* tick hider */
  chart.append('circle')
    .attr('class', 'gaugeChart-tickHider')
    .attr('cx', center)
    .attr('cy', center)
    .attr('r', tickHiderRadius);

  /* label */
  chart.append('text')
    .attr('class', 'gaugeChart-label')
    .attr('x', center)
    .attr('y', labelY)
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('font-size', labelFontSize)
    .text(o.label);

  /* value label */
  chart.append('text')
    .attr('class', 'gaugeChart-label-value')
    .attr('x', center)
    .attr('y', valueLabelY)
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('font-size', labelFontSize)
    .text(o.value);

  /* needle */
  chart.append('path')
    .attr('class', 'gaugeChart-needle')
    .attr('stroke-width', outerBezelWidth)
    .attr('d', `M ${center - needleWidth / 2} ${center}
                L ${center} ${tickHeight}
                L ${center + needleWidth / 2} ${center} Z`)
    .attr('transform', `rotate(${needleAngle} ${center} ${center})`);

  /* needle cap */
  chart.append('circle')
    .attr('class', 'gaugeChart-needle-cap')
    .attr('cx', center)
    .attr('cy', center)
    .attr('stroke-width', outerBezelWidth)
    .attr('r', needleCapRadius);
};

gaugeChart({
  el: '#memChart',
  label: 'Memory',
  value: 73,
});

gaugeChart({
  el: '#cpuChart',
  label: 'CPU',
  value: 80,
});

gaugeChart({
  el: '#netChart',
  label: 'Network',
  value: 62,
});


// ------- the last --------


function deg2rad(deg) {
  return deg * Math.PI / 180;
}

var r = 200,
  exAngle = 90,
  whRatio = 2 / (Math.sin(deg2rad(exAngle)) + 1),
  angleScale = d3.scaleLinear()
    .domain([-100, 100])
    // .range([(90 + exAngle) * -1, 90 + exAngle]);
    .range([(exAngle) * -1, exAngle]);

var svg = d3.select('body').append('svg')
  .attr('viewBox', -r * 0.9 + " " + -r * 1.11 + " " + r * 2 + " " + r * 2 * whRatio);
var axis = d3.axisRadialInner(angleScale.copy().range(angleScale.range().map(d => deg2rad(d))), r).tickPadding(15);
// 軸線
svg.append('g').classed('axis', true)
  .call(axis);

// 指針
var pointer = svg.append('g')
  .attr('transform', 'scale(' + r * 0.85 + ')')
  .append('path')
  .attr('fill', 'red')
  .attr('d', ['M0 -1', 'L0.03 0', 'A 0.03 0.03 0 0 1 -0.03 0', 'Z'].join(' '))
  .attr('transform', `rotate(${angleScale(0)})`);

// 目前數值
var label = svg.append('text')
  .classed('label', true)
  .attr('x', 0)
  .attr('y', r * 0.6)
  .attr('text-anchor', 'middle')
  .text('0');


setInterval(() => {
  var newVal = Math.round(Math.random() * 100);

  label.transition()
    .duration(800)
    .attrTween("d", function () {
      var v = label.text();
      return function (n) {
        var i = d3.interpolateNumber(+v, +newVal);
        label.text(parseInt(i(n)));
      };
    });


  pointer.transition()
    .duration(1200)
    .ease(d3.easeElastic)
    .attr('transform', `rotate(${angleScale(newVal)})`);

}, 3300);