let gauge = function (container, configuration) {
    let that = {
        render: function (newValue) {
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
                .attr('fill', (lineData, index, lines) => {
                    if (index + 1 > centerLineIndex && index !== lines.length - 1 && index !== lastQuarterLineIndex) {
                        return 'tomato'
                    } else {
                        return '#000'
                    }
                })
                .attr('d', (lineData, index, lines) => {
                    if (index === centerLineIndex ||
                        index === firstQuarterLineIndex ||
                        index === lastQuarterLineIndex ||
                        index === 0 ||
                        index === lines.length - 1
                    ) {
                        return arc(lineData, index, lines);
                    } else {
                        return arcLong(lineData, index, lines);
                    }
                });


            let lg = svg.append('g')
                .attr('class', 'label')
                .attr('transform', centerTx);
            lg.selectAll('text')
                .data(ticks)
                .enter().append('text')
                .attr('transform', function (d, i) {
                    let ratio = scale(d);
                    let newAngle = config.minAngle + (ratio * range);
                    if (i === firstLineIndex) {
                        return 'translate(' + (-config.labelInset - ratio - 3) + '0)';
                    } else if (i === ticks.length - 1) {
                        return 'translate(' + (config.labelInset + ratio + 2) + '0)';
                    } else {
                        return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset * 3 - r + ')');
                    }
                })
                .text((d, i) => {
                    if (i === firstLineIndex || i === Math.ceil(tickData.length / 2) + 1 || i === ticks.length - 1) {
                        return d;
                    }
                });

            let lineData = [[config.pointerWidth / 2, 0],
                [0, -pointerHeadLength],
                [-(config.pointerWidth / 2), 0],
                [0, config.pointerTailLength],
                [config.pointerWidth / 2, 0]];
            let pointerLine = d3.line();
            let pg = svg.append('g').data([lineData])
                .attr('class', 'pointer')
                .attr('transform', centerTx);

            pointer = pg.append('path')
                .attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/)
                .attr('transform', 'rotate(' + this.minAngle + ')')
                .attr('fill', '#000')
                .attr('stroke-width', 0);

            let circe = pg.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', 12)
                .attr('fill', '#000')
                .attr('stroke-width', 0);

            this.update(newValue === undefined ? 0 : newValue);
        },
        update: function (newValue, newConfiguration) {
            if (newConfiguration !== undefined) {
                configure(newConfiguration);
            }
            let ratio = scale(newValue);
            let newAngle = config.minAngle + (ratio * range);
            pointer.transition()
                .duration(config.transitionMs)
                // .ease('elastic')
                .attr('transform', 'rotate(' + newAngle + ')');
        }


    };
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

    };

    let range, r, pointerHeadLength,svg,arc,arcLong,scale,ticks,tickData,pointer,centerLineIndex,firstQuarterLineIndex,lastQuarterLineIndex,lastLineIndex;
    let value = 0, firstLineIndex = 0;


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

        lastLineIndex = config.majorTicks - 1;
        centerLineIndex = Math.ceil(config.majorTicks / 2) - 1;
        firstQuarterLineIndex = (config.majorTicks - centerLineIndex - 1) / 2;
        lastQuarterLineIndex = config.majorTicks - (config.majorTicks - centerLineIndex - 1) / 2 - 1;

        const ticksMargin = 4;
        const minAngle = config.minAngle - ticksMargin;
        const maxAngle = config.maxAngle + ticksMargin;

        range = config.maxAngle - config.minAngle;
        const ticksRange = maxAngle - minAngle;

        r = config.size / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        scale = d3.scaleLinear()
            .domain([config.minValue, config.maxValue])
            .range([0, 1]);

        ticks = scale.ticks(config.majorTicks);
        tickData = d3.range(config.majorTicks).map(function () {
            return 1 / (config.majorTicks);
        });

        arc = d3.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset - 25) // - 25 for height decreasing
            .startAngle(function (d, i) {
                let ratio = d * i;
                return deg2rad(minAngle + (ratio * ticksRange) + ticksMargin);
            })
            .endAngle(function (d, i) {
                let ratio = d * (i + 1);
                return deg2rad(minAngle + (ratio * ticksRange) - ticksMargin);
            });

        arcLong = d3.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset - 30) // - 30 for height decreasing
            .startAngle(function (d, i) {
                let ratio = d * i;
                return deg2rad(minAngle + (ratio * ticksRange) + ticksMargin);
            })
            .endAngle(function (d, i) {
                let ratio = d * (i + 1);
                return deg2rad(minAngle + (ratio * ticksRange) - ticksMargin);
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


    configure(configuration);

    return that;
};

function onDocumentReady() {
    let powerGauge = gauge('#power-gauge', {
        size: 300,
        clipWidth: 300,
        clipHeight: 300,
        ringWidth: 50,
        transitionMs: 4000,
    });
    powerGauge.render();

    function updateReadings() {
        // just pump in random data here...
        powerGauge.update(Math.random() * 100);
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
