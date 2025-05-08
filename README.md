# NexGen Air Battlespace

## Overview
NexGen Air Battlespace is an interactive web application that visualizes modern air combat ecosystems, showcasing military aircraft, unmanned systems, and command-and-control platforms. Built with D3.js, it displays entities (e.g., F-35, XQ-58A Valkyrie, Link 16) and their mission-specific relationships through a dynamic graph interface. Users can explore mission sets, view entity details in a sidebar, and analyze inter-node connections, such as Link 16 data links, to understand networked warfare concepts.

The project is hosted on GitHub Pages at [https://flighter13.github.io/NexGen-Air-Battlespace/](https://flighter13.github.io/NexGen-Air-Battlespace/).

## Features
- **Interactive Graph Visualization**: Displays air battlespace entities as nodes with mission-specific layouts (e.g., ISR, Strike, Refueling) and connections.
- **Dynamic Sidebars**:
  - Left sidebar: Shows mission details and entity roles when a mission is selected.
  - Right sidebar: Displays entity details (name, description, capabilities, missions) on node click.
- **Mission Filtering**: Select mission sets (e.g., Close Air Support, Offensive Counter-Air) to view tailored layouts and roles.
- **Modular Design**: Supports adding new entities, customizing layouts, and defining connections via JavaScript functions.
- **Zoom and Pan**: Navigate the graph with D3.js zoom functionality for detailed exploration.

## Technologies
- **HTML/CSS/JavaScript**: Core web technologies for structure, styling, and interactivity.
- **D3.js (v7)**: For rendering the force-directed graph and handling data visualization.
- **GitHub Pages**: Hosts the static site for public access.

## Installation and Setup
To run or develop the project locally, follow these steps:

### Prerequisites
- A modern web browser (e.g., Chrome, Firefox).
- [Node.js](https://nodejs.org/) (optional, for local server).
- [Git](https://git-scm.com/) for cloning the repository.

### Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Flighter13/NexGen-Air-Battlespace.git
   cd NexGen-Air-Battlespace
   ```
2. **Serve Locally**:
   - Option 1: Use a simple HTTP server (requires Node.js):
     ```bash
     npm install -g http-server
     http-server .
     ```
     Open `http://localhost:8080` in your browser.
   - Option 2: Open `index.html` directly in a browser (note: `fetch` for `entities.json` and `missions.json` may fail due to CORS; a server is recommended).
3. **Verify Files**:
   Ensure the following files are present:
   ```
   NexGen-Air-Battlespace/
   ├── index.html
   ├── entities.json
   ├── missions.json
   ├── images/
   │   ├── f15.png
   │   ├── f16.png
   │   └── ... (other images)
   ```
   Replace missing images with placeholders (e.g., `https://via.placeholder.com/100`) in `entities.json` if needed.

## Usage
1. **Access the Site**:
   Visit [https://flighter13.github.io/NexGen-Air-Battlespace/](https://flighter13.github.io/NexGen-Air-Battlespace/) or run locally.
2. **Explore Missions**:
   - Use the dropdown (`Select Mission Set`) to switch between the main overview or mission-specific views (e.g., ISR, Strike).
   - The left sidebar displays mission details and entity roles when a mission is selected.
3. **View Entity Details**:
   - Click a node (image) in the graph to open the right sidebar, showing the entity’s name, description, capabilities, and missions.
4. **Navigate the Graph**:
   - Zoom in/out using the mouse wheel or touch gestures.
   - Pan by clicking and dragging the graph.
5. **Customize the Visualization**:
   - Add new entities using the `addNode` function in `index.html`:
     ```javascript
     addNode({
       id: "newdrone",
       name: "New Drone",
       type: "UCAV",
       image: "images/newdrone.png",
       capabilities: ["Stealth", "Surveillance"],
       description: "An experimental drone.",
       missions: ["ISR"]
     });
     ```
   - Define custom layouts with `setLayout` (e.g., circle, matrix, custom coordinates).
   - Add connections with `addLink` (e.g., Link 16 data links).
   - Call `renderVisualization()` to update the graph.

## Project Structure
- **`index.html`**: Main HTML file with D3.js visualization, sidebars, and modular JavaScript functions.
- **`entities.json`**: Defines entities (e.g., F-22, MQ-25 Stingray) with attributes like type, capabilities, and missions.
- **`missions.json`**: Specifies mission sets with layouts and inter-node links (e.g., Link 16 connections).
- **`images/`**: Folder for entity images referenced in `entities.json`.

## Deployment
The site is deployed via GitHub Pages. To update the deployment:
1. **Edit Files**:
   Modify `index.html`, `entities.json`, `missions.json`, or add images to the `images/` folder.
2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Update visualization"
   git push origin main
   ```
3. **Verify Deployment**:
   - Changes will propagate to `https://flighter13.github.io/NexGen-Air-Battlespace/` within minutes.
   - Check the GitHub Actions or Pages settings if updates don’t appear.

## Contributing
Contributions are welcome! To contribute:
1. **Fork the Repository**:
   Click “Fork” on [https://github.com/Flighter13/NexGen-Air-Battlespace](https://github.com/Flighter13/NexGen-Air-Battlespace).
2. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make Changes**:
   Add new entities, enhance visualizations, or fix bugs.
4. **Test Locally**:
   Ensure the site runs without errors and visualizations render correctly.
5. **Submit a Pull Request**:
   Push your branch and create a PR on GitHub, describing your changes.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and ensure code adheres to the existing style (e.g., consistent JSON formatting, modular JavaScript).

## Troubleshooting
- **Nodes Not Displaying**:
  - Check the browser console (F12 > Console) for `fetch` errors.
  - Verify `entities.json` and `missions.json` are in the repository root and accessible.
- **Images Not Loading**:
  - Ensure image paths in `entities.json` match files in the `images/` folder.
  - Use placeholders (e.g., `https://via.placeholder.com/100`) for missing images.
- **Sidebar Not Populating**:
  - Confirm node click events work (check console for `Clicked node:` logs).
  - Validate entity data in `entities.json` (e.g., `capabilities`, `missions` arrays).
- **Deployment Issues**:
  - Ensure GitHub Pages is enabled (Settings > Pages > Source: `main` branch, root folder).
  - Check GitHub Actions logs for build errors.

For additional help, open an issue on the [GitHub repository](https://github.com/Flighter13/NexGen-Air-Battlespace/issues).

## License
This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.

## Acknowledgments
- **D3.js**: For powerful data visualization capabilities.
- **GitHub Pages**: For seamless static site hosting.
- **Contributors**: Thanks to all who enhance this project!

---
*Built by [Flighter13](https://github.com/Flighter13)*  
*Last updated: May 2025*
