let missionsData;

function preload() {
    fetch('missions.json')
        .then(response => response.json())
        .then(data => {
            missionsData = data.missions;
            setupMissions();
        })
        .catch(error => console.error('Error loading missions.json:', error));
}

function setupMissions() {
    const missionSet = document.getElementById('mission-set');
    missionSet.addEventListener('change', updateMissionDetails);

    updateMissionDetails();
}

function updateMissionDetails() {
    const missionSet = document.getElementById('mission-set').value;
    const overviewSection = document.getElementById('overview-section');
    const missionDetails = document.getElementById('mission-details');
    const missionTitle = document.getElementById('mission-title');
    const missionDescription = document.getElementById('mission-description');

    if (missionSet === 'overview') {
        overviewSection.style.display = 'block';
        missionDetails.style.display = 'none';
    } else {
        overviewSection.style.display = 'none';
        missionDetails.style.display = 'block';
        const mission = missionsData.find(m => m.id === missionSet);
        missionTitle.textContent = mission.name;
        missionDescription.textContent = mission.description;

        // Update roles content
        const rolesContent = document.getElementById('roles-content');
        rolesContent.innerHTML = '';
        let roles = [];
        if (mission.axes) {
            mission.axes.forEach(axis => {
                axis.entities.forEach(entity => {
                    if (!roles.some(r => r.type === entity.type && r.role === entity.role)) {
                        roles.push({ type: entity.type, role: entity.role, count: entity.count });
                    }
                });
            });
        } else if (mission.phases) {
            mission.phases.forEach(phase => {
                phase.entities.forEach(entity => {
                    if (!roles.some(r => r.type === entity.type && r.role === entity.role)) {
                        roles.push({ type: entity.type, role: entity.role, count: entity.count });
                    }
                });
            });
        }
        roles.forEach(role => {
            rolesContent.innerHTML += `<p>${role.type} - ${role.role} (x${role.count})</p>`;
        });

        // Update missions content
        const missionsList = document.getElementById('missions-list');
        missionsList.innerHTML = '';
        if (mission.axes) {
            mission.axes.forEach(axis => {
                missionsList.innerHTML += `<li>${axis.name}: ${axis.entities.map(e => `${e.type} (${e.role}) x${e.count}`).join(', ')}</li>`;
            });
        } else if (mission.phases) {
            mission.phases.forEach(phase => {
                missionsList.innerHTML += `<li>${phase.name}: ${phase.entities.map(e => `${e.type} (${e.role}) x${e.count}`).join(', ')}</li>`;
            });
        }
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initial load
preload();
const width = window.innerWidth / 2;
const height = window.innerHeight - 64; // Adjust for header
let entities = [], missions = [];
let currentMission = null;
let phase = 0;

const svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

const map = L.map('map').setView([15, 120], 4); // Pacific theater
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load data
Promise.all([
    fetch('entities.json').then(res => res.json()),
    fetch('missions.json').then(res => res.json())
]).then(([ent, mis]) => {
    entities = ent;
    missions = mis;

    // Populate mission dropdown
    const missionSelect = d3.select("#mission-select");
    missions.forEach(m => {
        missionSelect.append("option")
            .attr("value", m.id)
            .text(m.name);
    });

    // Initialize visualization
    missionSelect.on("change", () => {
        const missionId = missionSelect.property("value");
        currentMission = missionId === "overview" ? null : missions.find(m => m.id === missionId);
        phase = 0;
        d3.select("#timeline-slider").property("value", 0);
        updateVisualization();
    });

    // Timeline slider
    d3.select("#timeline-slider").on("input", function() {
        phase = +this.value;
        updateVisualization();
    });

    // Close right sidebar
    d3.select("#close-right-sidebar").on("click", () => {
        d3.select("#entity-details").html("");
        d3.select("#right-sidebar").style("display", "none");
    });

    updateVisualization();
});

// Coordinate mapping: Layout (x, y) to Lat/Lon
function mapCoordinates(x, y) {
    const lat = 30 - (y / height) * 20; // Scale y to latitude (10°N to 30°N)
    const lon = 110 + (x / width) * 20; // Scale x to longitude (110°E to 130°E)
    return [lat, lon];
}

// Update visualization
function updateVisualization() {
    const nodes = currentMission ? entities.filter(e => currentMission.layout.some(l => l.id === e.id)) : entities;
    const links = currentMission ? currentMission.links : [];

    // Mission phases (example)
    const phases = currentMission ? [
        { name: "Deploy", positions: currentMission.layout.map(l => ({ id: l.id, x: l.x * 0.8, y: l.y * 0.8 })) },
        { name: "Execute", positions: currentMission.layout },
        { name: "Sustain", positions: currentMission.layout.map(l => ({ id: l.id, x: l.x * 1.1, y: l.y * 1.1 })) },
        { name: "Return", positions: currentMission.layout.map(l => ({ id: l.id, x: l.x * 0.9, y: l.y * 0.9 })) },
    ] : [{ name: "Overview", positions: entities.map((e, i) => ({ id: e.id, x: width / 2 + 100 * Math.cos(i * 2 * Math.PI / entities.length), y: height / 2 + 100 * Math.sin(i * 2 * Math.PI / entities.length) })) }];

    const currentPhase = phases[Math.min(phase, phases.length - 1)];
    d3.select("#phase-label").text(currentPhase.name);

    // Update nodes
    const nodeData = nodes.map(n => {
        const pos = currentPhase.positions.find(p => p.id === n.id) || { x: width / 2, y: height / 2 };
        return { ...n, x: pos.x, y: pos.y };
    });

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

    // Update links
    const link = svg.selectAll(".link")
        .data(links, d => `${d.source}-${d.target}`)
        .join("line")
        .attr("class", "link")
        .attr("x1", d => nodeData.find(n => n.id === d.source).x)
        .attr("y1", d => nodeData.find(n => n.id === d.source).y)
        .attr("x2", d => nodeData.find(n => n.id === d.target).x)
        .attr("y2", d => nodeData.find(n => n.id === d.target).y);

    // Update map markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
    });
    nodeData.forEach(d => {
        const [lat, lon] = mapCoordinates(d.x, d.y);
        L.marker([lat, lon], {
            icon: L.divIcon({ className: 'hidden' }) // Invisible marker to sync map
        }).addTo(map);
    });

    // Update sidebars
    if (currentMission) {
        d3.select("#mission-details").html(`
            <h2 class="text-xl font-bold">${currentMission.name}</h2>
            <p>${currentMission.description}</p>
        `);
        d3.select("#entity-roles").html(`
            <h3 class="text-lg font-semibold">Entity Roles:</h3>
            <ul class="list-disc pl-5">${currentMission.layout.map(l => {
                const entity = entities.find(e => e.id === l.id);
                return `<li>${entity.name}: ${entity.type}</li>`;
            }).join("")}</ul>
        `);
    } else {
        d3.select("#mission-details").html("<p>Select a mission to view details.</p>");
        d3.select("#entity-roles").html("");
    }

    // Sync map and graph zoom
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.5, 4])
        .on("zoom", ({ transform }) => {
            node.attr("transform", d => `translate(${transform.applyX(d.x)},${transform.applyY(d.y)})`);
            link.attr("x1", d => transform.applyX(nodeData.find(n => n.id === d.source).x))
                .attr("y1", d => transform.applyY(nodeData.find(n => n.id === d.source).y))
                .attr("x2", d => transform.applyX(nodeData.find(n => n.id === d.target).x))
                .attr("y2", d => transform.applyY(nodeData.find(n => n.id === d.target).y));
            const zoomLevel = map.getZoom() * transform.k;
            map.setZoom(zoomLevel);
        }));
}