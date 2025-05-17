const width = window.innerWidth / 2;
const height = window.innerHeight - 64;
let entities = [];
let missions = [];
let currentMission = null;
let phase = 0;

const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

const mapImage = document.getElementById("mission-map");

// Load data
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
        return [{
            name: "Overview",
            positions: entities.map((e, i) => ({
                id: e.id,
                x: width / 2 + 100 * Math.cos(i * 2 * Math.PI / entities.length),
                y: height / 2 + 100 * Math.sin(i * 2 * Math.PI / entities.length)
            }))
        }];
    }
    return [
        {
            name: "Deploy",
            positions: currentMission.layout.map(l => ({
                id: l.id,
                x: l.x * 0.8,
                y: l.y * 0.8
            }))
        },
        {
            name: "Execute",
            positions: currentMission.layout
        },
        {
            name: "Sustain",
            positions: currentMission.layout.map(l => ({
                id: l.id,
                x: l.x * 1.1,
                y: l.y * 1.1
            }))
        },
        {
            name: "Return",
            positions: currentMission.layout.map(l => ({
                id: l.id,
                x: l.x * 0.9,
                y: l.y * 0.9
            }))
        }
    ];
}

function updateVisualization() {
    if (currentMission && currentMission.mapImage) {
        mapImage.src = currentMission.mapImage;
    } else {
        mapImage.src = "";
    }

    const nodes = currentMission
        ? entities.filter(e => currentMission.layout.some(l => l.id === e.id))
        : entities;

    const links = currentMission ? currentMission.links : [];

    const phases = getPhases(currentMission, entities, width, height);
    const currentPhase = phases[Math.min(phase, phases.length - 1)];
    d3.select("#phase-label").text(currentPhase.name);

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
        .attr("width", 50)
        .attr("height", 50)
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

        d3.select("#entity-roles").html(`
            <h3 class="text-lg font-semibold">Entity Roles:</h3>
            <ul class="list-disc pl-5">
                ${currentMission.layout.map(l => {
                    const entity = entities.find(e => e.id === l.id);
                    return entity
                        ? `<li>${entity.name}: ${entity.type}</li>`
                        : `<li>Unknown Entity (ID: ${l.id})</li>`;
                }).join("")}
            </ul>
        `);
    } else {
        d3.select("#mission-details").html("<p>Select a mission to view details.</p>");
        d3.select("#entity-roles").html("");
    }
}