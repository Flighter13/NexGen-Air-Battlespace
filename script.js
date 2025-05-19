const width = window.innerWidth / 2;
const height = window.innerHeight - 64;
let entities = [], missions = [];
let currentMission = null;
let phase = 0;

const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

const mapImage = document.getElementById("mission-map");

Promise.all([
    fetch('entities.json').then(res => res.json()),
    fetch('missions.json').then(res => res.json())
]).then(([ent, mis]) => {
    entities = ent;
    missions = mis;

    const missionSelect = d3.select("#mission-select");
    missions.forEach(m => {
        missionSelect.append("option")
            .attr("value", m.id)
            .text(m.name);
    });

    missionSelect.on("change", () => {
        const missionId = missionSelect.property("value");
        currentMission = missionId === "overview" ? null : missions.find(m => m.id === missionId);
        phase = 0;
        d3.select("#timeline-slider").property("value", 0);
        if (currentMission && currentMission.phases) {
            d3.select("#timeline-slider").attr("max", currentMission.phases.length - 1);
        } else {
            // For overview, only one phase
            d3.select("#timeline-slider").attr("max", 0);
        }
        updateVisualization();
    });

    d3.select("#timeline-slider").on("input", function () {
        phase = +this.value;
        updateVisualization();
    });

    d3.select("#close-right-sidebar").on("click", () => {
        d3.select("#entity-details").html("");
        d3.select("#right-sidebar").style("display", "none");
    });

    updateVisualization();
});

const zoom = d3.zoom()
    .scaleExtent([0.5, 4])
    .on("zoom", ({ transform }) => {
        svg.attr("transform", transform);
        d3.select("#mission-map").style(
            "transform",
            `scale(${transform.k}) translate(${transform.x / transform.k}px, ${transform.y / transform.k}px)`
        );
    });

svg.call(zoom).append("g");

function getPhases(currentMission, entities, width, height) {
    if (!currentMission) {
        // Grid layout for overview
        const gridCols = Math.ceil(Math.sqrt(entities.length));
        const gridRows = Math.ceil(entities.length / gridCols);
        const cellWidth = width / (gridCols + 1);
        const cellHeight = height / (gridRows + 1);
        return [{
            name: "Overview",
            positions: entities.map((e, i) => {
                const col = i % gridCols;
                const row = Math.floor(i / gridCols);
                return {
                    id: e.id,
                    x: cellWidth * (col + 1),
                    y: cellHeight * (row + 1)
                };
            })
        }];
    }
    return currentMission.phases || [];
}

function updateVisualization() {
    if (currentMission && currentMission.mapImage) {
        mapImage.src = currentMission.mapImage;
    } else {
        mapImage.src = "";
    }

    // Hide map and timeline on overview
    if (!currentMission) {
        d3.select("#mission-map").style("display", "none");
        d3.select("#timeline").style("display", "none");
    } else {
        d3.select("#mission-map").style("display", "block");
        d3.select("#timeline").style("display", "block");
    }

    const phases = getPhases(currentMission, entities, width, height);
    const currentPhase = phases[Math.min(phase, phases.length - 1)] || { name: "", positions: [] };
    d3.select("#phase-label").text(currentPhase.name || "");

    const nodes = currentMission
        ? entities.filter(e => (currentPhase.positions || []).some(l => l.id === e.id))
        : entities;

    const links = currentMission ? (currentMission.links || []) : [];

    const nodeData = nodes.map(n => {
        const pos = currentPhase.positions.find(p => p.id === n.id) || { x: width / 2, y: height / 2 };
        return { ...n, x: pos.x, y: pos.y };
    });

    // Draw nodes
    const node = svg.selectAll(".node")
        .data(nodeData, d => d.id)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.selectAll("image")
        .data(d => [d])
        .join("image")
        .attr("class", "node-image")
        .attr("xlink:href", d => d.image)
        .attr("x", -25)
        .attr("y", -25)
        .attr("width", 100)
        .attr("height", 100)
        .on("click", (event, d) => {
            d3.select("#entity-details").html(`
                <h2 class="text-xl font-bold">${d.name}</h2>
                <p>${d.description}</p>
                <h3 class="text-lg font-semibold mt-2">Capabilities:</h3>
                <ul class="list-disc pl-5">${d.capabilities.map(c => `<li>${c}</li>`).join("")}</ul>
                <h3 class="text-lg font-semibold mt-2">Missions:</h3>
                <ul class="list-disc pl-5">${d.missions.map(m => `<li>${m}</li>`).join("")}</ul>
            `);
            d3.select("#right-sidebar").style("display", "block");
        });

    // Draw links
    svg.selectAll(".link")
        .data(links, d => `${d.source}-${d.target}`)
        .join("line")
        .attr("class", "link")
        .attr("x1", d => {
            const n = nodeData.find(n => n.id === d.source);
            return n ? n.x : 0;
        })
        .attr("y1", d => {
            const n = nodeData.find(n => n.id === d.source);
            return n ? n.y : 0;
        })
        .attr("x2", d => {
            const n = nodeData.find(n => n.id === d.target);
            return n ? n.x : 0;
        })
        .attr("y2", d => {
            const n = nodeData.find(n => n.id === d.target);
            return n ? n.y : 0;
        });

    // Mission details and entity roles
    if (currentMission) {
        d3.select("#mission-details").html(`
            <h2 class="text-xl font-bold">${currentMission.name}</h2>
            <p>${currentMission.description}</p>
        `);

        const displayed = new Set(currentPhase.positions.map(p => p.id));
        d3.select("#entity-roles").html(`
            <h3 class="text-lg font-semibold">Entity Roles:</h3>
            <ul class="list-disc pl-5">
                ${[...displayed].map(id => {
                    const entity = entities.find(e => e.id === id);
                    return entity ? `<li>${entity.name}: ${entity.type}</li>` : "";
                }).join("")}
            </ul>
        `);
    } else {
        d3.select("#mission-details").html("<p>Select a mission to view details.</p>");
        d3.select("#entity-roles").html("");
    }
}
