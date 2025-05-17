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