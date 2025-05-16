const width = window.innerWidth;
const height = window.innerHeight;

// Set up SVG canvas
const svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Define map projection
const projection = d3.geoMercator()
    .center([127, 25]) // Center on Taiwan Strait
    .scale(1000)
    .translate([width / 2, height / 2]);

// Role-based positioning
const roles = {
    decoy: { x: width * 0.7, y: height * 0.3 }, // Forward
    jammer: { x: width * 0.6, y: height * 0.4 },
    strike: { x: width * 0.5, y: height * 0.5 },
    refueler: { x: width * 0.3, y: height * 0.7 } // Rear
};

// Load data
async function loadData() {
    const entities = await d3.json("entities.json");
    const missions = await d3.json("missions.json");
    return { entities, missions };
}

// Render visualization
function renderVisualization(nodes, links, threatZones) {
    svg.selectAll(".threat-zone").remove();
    svg.selectAll(".link").remove();
    svg.selectAll(".node").remove();

    // Draw threat zones
    svg.selectAll(".threat-zone")
        .data(threatZones || [])
        .enter()
        .append("circle")
        .attr("class", "threat-zone")
        .attr("cx", d => projection([d.center.lon, d.center.lat])[0])
        .attr("cy", d => projection([d.center.lon, d.center.lat])[1])
        .attr("r", d => d.radius * 2); // Scale radius to pixels

    // Draw links
    const link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke-width", d => d.type === "link16" ? 2 : 1);

    // Draw nodes
    const node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded))
        .on("click", (event, d) => updateEntityDetails(d));

    node.append("image")
        .attr("xlink:href", d => d.image)
        .attr("x", -20)
        .attr("y", -20)
        .attr("width", 40)
        .attr("height", 40);

    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.id);

    // Set up force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-50))
        .force("link", d3.forceLink(links).distance(d => d.type === "link16" ? 300 : 100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30))
        .force("role", d3.forceX().strength(0.1).x(d => roles[d.role]?.x || width / 2))
        .force("threat", d3.forceManyBody().strength(d => d.capabilities.includes("Stealth") ? -10 : -100));

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return simulation;
}

// Update entity details in sidebar
function updateEntityDetails(entity) {
    const details = d3.select("#entity-details");
    details.html(`
        <h3>${entity.id}</h3>
        <p>Type: ${entity.type}</p>
        <p>Role: ${entity.role}</p>
        <p>Capabilities: ${entity.capabilities.join(", ")}</p>
    `);
}

// Update mission details in sidebar
function updateMissionDetails(mission, phase) {
    const details = d3.select("#mission-details");
    details.html(`
        <h3>${mission.name} - ${phase.name}</h3>
        <p>${mission.description}</p>
        <p>Phase: ${phase.name}</p>
    `);
}

// Transition to a new phase
function transitionPhase(phase, nodes, links, threatZones) {
    nodes.forEach(node => {
        const layoutNode = phase.layout.find(n => n.id === node.id);
        if (layoutNode) {
            const [x, y] = projection([layoutNode.lon, layoutNode.lat]);
            node.x = x;
            node.y = y;
        }
    });
    renderVisualization(nodes, links, threatZones);
}

// Main initialization
loadData().then(({ entities, missions }) => {
    const missionSelect = d3.select("#mission");
    const phaseSelect = d3.select("#phase");

    missionSelect.on("change", function() {
        const missionId = this.value;
        const mission = missions.find(m => m.id === missionId);
        phaseSelect.selectAll("option").remove();
        phaseSelect.selectAll("option")
            .data(mission.phases)
            .enter()
            .append("option")
            .attr("value", (d, i) => i)
            .text(d => d.name);

        const phase = mission.phases[0];
        const nodes = phase.layout.map(l => ({
            ...entities.find(e => e.id === l.id),
            ...l,
            x: projection([l.lon, l.lat])[0],
            y: projection([l.lon, l.lat])[1]
        }));
        const links = phase.links;
        const threatZones = phase.threat_zones;

        updateMissionDetails(mission, phase);
        renderVisualization(nodes, links, threatZones);
    });

    phaseSelect.on("change", function() {
        const missionId = missionSelect.property("value");
        const phaseIndex = this.value;
        const mission = missions.find(m => m.id === missionId);
        const phase = mission.phases[phaseIndex];

        const nodes = phase.layout.map(l => ({
            ...entities.find(e => e.id === l.id),
            ...l,
            x: projection([l.lon, l.lat])[0],
            y: projection([l.lon, l.lat])[1]
        }));
        const links = phase.links;
        const threatZones = phase.threat_zones;

        updateMissionDetails(mission, phase);
        transitionPhase(phase, nodes, links, threatZones);
    });

    // Initialize with first mission and phase
    missionSelect.dispatch("change");
});

const mapData = await d3.json("indo-pacific.json");
svg.append("g")
    .selectAll("path")
    .data(mapData.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath().projection(projection))
    .attr("fill", "#ccc")
    .attr("stroke", "#000");