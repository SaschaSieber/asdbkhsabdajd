let SearchMode='node';

let initialGraphData = {
    nodes: [
        { "ID": "Function", "name": "Suche nach Funktionen", "level": 0 },
        { "ID": "Tools", "name": "Suche nach Tools", "level": 0 }


    ],
    links: [
    
    ]
};

let toolsData = []; // Declare toolsData variable
let planningstoolData = []; // Declare planningstoolData variable
let table_def_data = []; // Declare table_def_data variable
let function_def_data=[]
document.addEventListener('DOMContentLoaded', function () {
    fetchDataJson();
});
function fetchDataJson() {
    fetch('/generate_tools_json') // Adjust the endpoint to your actual API
        .then(response => response.json())
        .then(data => {
            toolsData = data.tools_data;
            planningstoolData = data.planningstool_data;
            table_def_data=data.table_def_data;
            function_def_data=data.function_def_data;
            console.log(function_def_data)
            // Initialize the graph with the fetched tools data
           
        })
        .catch(error => console.error('Error fetching data:', error));
}

document.getElementById("redirect-button").addEventListener("click", function() {
    window.location.href = "http://a11ccbd.online-server.cloud:5000"; // Specify your desired link here
});

function setNodeColors(nodes) {
    const colorScale = d3.scaleOrdinal()
        .domain(["Funktionen", "Tools", "Abfragen", "Tabelle"])
        .range(["#A020F0", "#BE4917", "#20548F", "#00A36C"]);
        const svg = d3.select("svg");

    nodes.forEach(node => {
       
            switch (node.level) {
             
                case 1:
                    svg.selectAll("circle").attr("fill", "#A020F0");
                    break;
                case 2:
                    svg.selectAll("circle").attr("fill", "#BE4917");
                    break;
                case 3:
                    svg.selectAll("circle").attr("fill", "#20548F");
                    break;
                case 4:
                    svg.selectAll("circle").attr("fill", "#00A36C");
                    break;
                default:
                    node.color = "#fff"; // Default color if no match
            }
        
    });
}



function createLegend() {
    const legend = document.getElementById('legend');
    const labels = ["Funktionen", "Tools", "Abfragen","Tabelle"];
    const colorScale = d3.scaleOrdinal()
        .domain(labels)
        .range(["#A020F0", "#BE4917", "#20548F","#00A36C"]);

    labels.forEach(label => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = colorScale(label);

        const textLabel = document.createElement('span');
        textLabel.textContent = label;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(textLabel);
        legend.appendChild(legendItem);
    });
}

document.addEventListener('DOMContentLoaded', createLegend);




let graphData = initialGraphData;
let graphDataStack = [];
let simulation;

function updateGraph(data) {
    graphData = data;
    if (simulation) {
        simulation.stop();
    }

    const graphContainer = document.getElementById('graph');
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    d3.select("svg").remove();

    const svg = d3.select("#graph").append("svg")
        .attr("width", width)
        .attr("height", height)
        
        .call(d3.zoom().on("zoom", function (event) {
            svg.attr("transform", event.transform);
        }))
        .append("g");
        if (!simulation) {
    simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.ID).distance(100))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2));
        }
        const color = node => node.type === 'filteredNode' ? 'red' : 'green';
        simulation.nodes(data.nodes);
    simulation.force("link").links(data.links);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("stroke-width", 2);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", "#fff")
        
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .on("click", function (event, d) {
            
            if (d.level === 0) {
                if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(toolsData)) {
                    //graphDataStack.push({ nodes: toolsData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: toolsData.links });
                }
                console.log(d.ID);

                if(d.ID==="Tools"){
                    const newData = toolsData; 
                updateGraph(newData);
                setNodeColors(toolsData.nodes);
                }
                else{
                    const newData = function_def_data; 
                    updateGraph(newData);
                setNodeColors(function_def_data.nodes);
                console.log(newData)

                }
                
                   
                    
                
            }

            
            else if (d.level === 1) {
                if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(toolsData)) {
                   // graphDataStack.push({ nodes: toolsData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: toolsData.links });
                }
                console.log(d.FollowUpNode);

                // Filter nodes based on FollowUpNode
                const filteredNodes = toolsData.nodes.filter(node => node.name === d.FollowUpNode);

                const filteredData = {
                    nodes: filteredNodes.map(node => ({ ...node, level: 2 })),
                    links: toolsData.links.filter(link => filteredNodes.some(node => node.name === link.source || node.name === link.target))
                };

                updateGraph(filteredData);
                setNodeColors(toolsData.nodes);
            }
            
            else if (d.level === 2 && !event.ctrlKey) {
                if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(planningstoolData)) {
                    graphDataStack.push({ nodes: toolsData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: toolsData.links });
                }

                // Filter nodes based on the clicked tool's name
                const filteredNodes = planningstoolData.nodes.filter(node => node.Tool === d.name);
                const filteredData = {
                    nodes: filteredNodes.map(node => ({ ...node, level: 3 })),
                    links: planningstoolData.links.filter(link => filteredNodes.some(node => node.name === link.source || node.name === link.target))
                };

                updateGraph(filteredData);
                setNodeColors(planningstoolData.nodes);
            }
             else if(d.level===2& event.ctrlKey ){
                console.log("test")
                const link = document.createElement('a');
                link.href = 'http://a11ccbd.online-server.cloud:3000/tool_info/Planungstool';
                link.target = '_blank'; 
                link.click();

             }
             else if (d.level === 3) {
                if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(planningstoolData)) {
                    graphDataStack.push({ nodes: toolsData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: toolsData.links });
                }

                // Filter nodes based on the clicked name
                const filteredNodes = table_def_data.nodes.filter(node => node.ID === d.name);
                const expandedNodes = filteredNodes.flatMap(node => node.names.map(name => ({ ID: node.ID, name, level: 4 })));

                const filteredData = {
                    nodes: expandedNodes,
                    links: planningstoolData.links.filter(link =>
                        expandedNodes.some(node => node.ID === link.source || node.ID === link.target))
                };

                updateGraph(filteredData);
                setNodeColors(table_def_data.nodes);
            }
            else if (d.level === 4){
                populateSidebar(d);

            }
            event.stopPropagation();
        });
        simulation.alpha(1).restart();

        const labels = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(data.nodes)
        .enter().append("text")
        .attr("class", "node-label")
        .text(d => {
            // Check if the node is at the first level (level 0)
            if (d.level === 1) {
                return d.ID; // Use d.ID as the label for level 0 nodes
            } else {
                return d.name; // Use d.name for other nodes
            }})

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y - 15);
    });
}
function handleCtrlClickOnLevel2Node(node) {
    // Implement the custom action when Ctrl key is pressed on a level 2 node
    console.log("Ctrl-click action for level 2 node:", node);
    // Example: Change node color or perform other actions
    d3.selectAll("circle")
        .attr("fill", d => d === node ? "red" : getColor(d.importance));
}

async function fetchData(d) {
    try {

        let response = await fetch(`/table/${encodeURIComponent(d.name)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Rethrow the error to propagate it to the caller
    }
}
function fetchToolInfo(tableName) {
    fetch(`/tool_info/`)
        .then(response => response.json())
        .then(data => {
            const url = new URL('ToolsIndex.html', window.location.origin);
            url.searchParams.set('table_name', tableName);
            window.open(url.toString(), '_blank');
        })
        .catch(error => console.error('Error fetching tool info:', error));
}

function sendValueToBackend(selectedValue) {
    fetch('/export', { // Adjust the URL to match your backend endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedDatabase: selectedValue }), // Send the selected value as JSON
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from backend:', data);
    })
    .catch(error => console.error('Error sending value to backend:', error));
}




async function FetToolsInfo(d) {
    try {
        let response = await fetch(`http://a11ccbd.online-server.cloud:3000/tool_info/${d.name}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let data = await response.json();
        console.log(data)
        return data;
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error; // Rethrow the error to propagate it to the caller
    }
}






async function fetchLogs(d) {
    try {
        let response = await fetch(`/uploadlogs/${d.name}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error; // Rethrow the error to propagate it to the caller
    }
}


async function populateSidebar(d) {
    try {
        let tableData = await fetchData(d);
        let tableData2 = await fetchLogs(d);
        let tableInfoData = await fetchTableInfo(d.name);

        console.log("D kommt:", d);
        document.getElementById('legend-container').classList.add('hidden');

        let sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = '';

        const additionalInfo = document.getElementById('top-right-entity');
        document.getElementById('top-right-entity').style.display = 'table';

        // Display last update information
        if (tableData2 && tableData2.letzterAbzug) {
            additionalInfo.innerHTML = `
                <p><strong>Zuletzt geändert:</strong> <span style="color: red;">${tableData2.timestamp}</span></p>
                <p><strong>Name:</strong> <span style="color: red;">${tableData2.user}</span></p>`;
        } else {
            additionalInfo.innerHTML = `
                <p><strong>Zuletzt geändert:</strong> /</p>
                <p><strong>Name:</strong> /</p>`;
        }
        console.log("Logs:", tableData2);

        if (tableInfoData.length > 0) {
            let infoContainer = document.createElement('div');
            infoContainer.classList.add('table-info');

            // Base SharePoint URL (Modify as needed)
            const sharepointBaseURL = "https://amotiqautomotive.sharepoint.com/:x:/r/sites/DaimlerProduktiv/_layouts/15/Doc.aspx?sourcedoc=%7B908A6210-B64B-494F-AF7E-6CD05A0F6E64%7D&file=GSS%20Datenabz%25u00fcge.xlsx&action=default&mobileredirect=true";

            let infoHtml = `
                <h3 class="table-info-header">Tabelleninformationen (Editierbar)</h3>
                <div class="table-wrapper">
                    <table class="table-info-content">
                        <thead>
                            <tr>
                                <th>Feldbeschreibung</th>
                                <th>Beispiel</th>
                                <th>Bemerkung</th>
                            </tr>
                        </thead>
                        <tbody>`;

            // Function to create input fields and detect SharePoint files
            function createEditableField(value, fieldId) {
                if (!value) return `<input type="text" id="${fieldId}" value="" class="editable-field">`;

                // Check if value is a SharePoint file (e.g., .xlsx)
                if (value.includes(".xlsx") || value.includes(".xls")) {
                    let fileUrl = `${sharepointBaseURL}`;
                    return `
                        <div class="editable-link-container">
                            <input type="text" id="${fieldId}" value="${value}" class="editable-field">
                            <a href="${fileUrl}" target="_blank" class="link-button">🔗</a>
                        </div>`;
                }
                return `<input type="text" id="${fieldId}" value="${value}" class="editable-field">`;
            }

            // Populate the table dynamically with editable fields
            tableInfoData.forEach((row, index) => {
                let beispielFieldId = `beispiel-${index}`;
                let bemerkungFieldId = `bemerkung-${index}`;

                infoHtml += `
                    <tr>
                        <td><strong>${row.feldbeschreibung}</strong></td>
                        <td>${createEditableField(row.beispiel, beispielFieldId)}</td>
                        <td>${createEditableField(row.bemerkung, bemerkungFieldId)}</td>
                    </tr>`;
            });

            infoHtml += `</tbody></table></div>
                <button id="updateTableInfo" class="update-button">Änderungen speichern</button>`;

            infoContainer.innerHTML = infoHtml;

            let existingContainer = document.getElementById('table-info-container');
            if (!existingContainer) {
                existingContainer = document.createElement('div');
                existingContainer.id = 'table-info-container';
                document.body.appendChild(existingContainer);
            }

            existingContainer.innerHTML = '';
            existingContainer.appendChild(infoContainer);
            existingContainer.style.display = 'block';

            let topRightEntity = document.getElementById('top-right-entity');
            let rect = topRightEntity.getBoundingClientRect();

            existingContainer.style.position = 'absolute';
            existingContainer.style.top = `${rect.bottom + 10}px`;
            existingContainer.style.left = `${rect.left - 98}px`;
            existingContainer.style.width = `500px`;

            // Add event listener to update button
            document.getElementById('updateTableInfo').addEventListener('click', () => updateTableInfo(tableInfoData,d.name));
        }
    let header = document.createElement('div');


   
    header.classList.add('sidebar-header');
    header.innerHTML = `
        <span class="column">Column</span>
        <span class="type">Type</span>
    `;
    sidebar.appendChild(header);
    
        // Create a document fragment to build the sidebar content
        let fragment = document.createDocumentFragment();

        let maxColumnWidth = 0;
        console.log('Fetched table data:', tableData);
        // Calculate max column width
// Populate sidebar with list items
tableData.forEach(row => {
    let listItem = document.createElement('div');
    listItem.classList.add('list-item');

    let rowHtml = '';
    for (const key in row) {
        let cleanKey = key.replace('column_name', '').replace('data_type', '').trim();
        let cleanValue = row[key].replace('data_type', '').trim();

        // Align columns and types using spans
        rowHtml += `<span class="type">${cleanValue}</span>`;
    }

    listItem.innerHTML = rowHtml;
    fragment.appendChild(listItem);
});


        // Populate sidebar with list items
        // Populate sidebar with list items
tableData.forEach(row => {
    let listItem = document.createElement('div');
    listItem.classList.add('list-item');

    // Ensure each column name and type are aligned
    let columnName = document.createElement('span');
    columnName.classList.add('column');
    columnName.textContent = row.column_name; // Replace with your data's column name key

    let columnType = document.createElement('span');
    columnType.classList.add('type');
    columnType.textContent = row.data_type; // Replace with your data's type key

    listItem.appendChild(columnName);
    listItem.appendChild(columnType);
    fragment.appendChild(listItem);
});


        sidebar.appendChild(fragment);

        sidebar.classList.add('open');
        sidebar = document.getElementById('top-right-entity');
        sidebar.classList.add('open');
   
        // Create the image element
   

        
        if (sidebarImageContainer) {
          
      

            
            sidebarImageContainer.style.display = 'block';
        } else {
            console.error('Error populating sidebar: sidebarImageContainer element not found');
        }

        
       
          
            SidebarImagePG.innerHTML = '';        
        
    } catch (error) {
        console.error('Error populating sidebar:', error);
    
    }
}






function hideExtraInfo() {
    let sidebar = document.getElementById('top-right-entity');
    sidebar.classList.remove('open');
    document.getElementById('top-right-entity').style.display = 'none';
    sidebar.innerHTML = '';
}

function hideSidebar() {
    let sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
    sidebar.innerHTML = '';
    document.getElementById('legend-container').classList.remove('hidden');
    let sidebarImageContainer = document.getElementById('sidebarImageContainer');
    let SidebarImagePG = document.getElementById('SidebarImagePG');

    
    if (sidebarImageContainer) {
        sidebarImageContainer.style.display = 'none';
        SidebarImagePG.style.display='none'
    }

}
function hideTableInfoContainer() {
    const tableInfoContainer = document.getElementById('table-info-container');
    if (tableInfoContainer) {
        tableInfoContainer.style.display = 'none';
    }
}



document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const link = document.getElementById('sidebarImageContainer');
    const linkPG = document.getElementById('SidebarImagePG');
    const tableInfoContainer = document.getElementById('table-info-container');
    const topRightEntity = document.getElementById('top-right-entity');

    if (!sidebar.contains(event.target) && 
        !link.contains(event.target) && 
        !linkPG.contains(event.target) &&
        !tableInfoContainer.contains(event.target) && 
        !topRightEntity.contains(event.target) 
    ) {
        hideSidebar();
        hideExtraInfo();
        hideTableInfoContainer(); // Call the new function to hide the table info
    }
});



document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        event.preventDefault(); // Prevent default behavior of Escape key (e.g., closing modals)

        if (graphDataStack.length > 0) {
            if (simulation) {
                simulation.stop();
            }
            hideSidebar();
            hideExtraInfo();
            hideTableInfoContainer();
            d3.select("svg").remove(); // Remove the current SVG graph
            
            // Retrieve the previous graph data from the stack
            const previousGraphData = graphDataStack.pop();
            console.log(previousGraphData);
            
            // If there is previous graph data, update the graph with it
            if (previousGraphData) {
                updateGraph(previousGraphData);
                setNodeColors(previousGraphData.nodes)
            }
            
            
            document.getElementById('search-input').value = ''; // Clear the search input
        } else {
            hideSidebar();
            hideExtraInfo();
            d3.select("svg").remove(); // Remove the current SVG graph
            
            // Update graph to the initial graph data
            updateGraph(initialGraphData);
            
            document.getElementById('search-input').value = ''; // Clear the search input
        }
    }
});

    
document.addEventListener("click", function (event) {
    const sidePanel = document.getElementById('side-panel');
    if (!sidePanel.contains(event.target)) {
        hideNodeInfo();
    }
});



async function searchNodeByID(query) {
    const foundNodes = [];
    let OldGraphData = graphData;
    
    // Assuming planningtoolData is already globally defined
    const grandchilMdren = planningstoolData.nodes; // use global variable directly

    // Search nodes in planningtoolData based on query
    for (const child of grandchilMdren) {
        if (child.name.toLowerCase().includes(query)) {
            foundNodes.push(child.Tool);
        }
    }

    if (foundNodes.length === 0) {
        // Handle no results case
    } else {
        // Use global ToolsData directly instead of redeclaring
        const filteredNodes = toolsData.nodes.filter(node => foundNodes.includes(node.ID));

        // Filter nodes in planningtoolData based on Tool
        const filteredAbf = planningstoolData.nodes.filter(node => foundNodes.includes(node.Tool));

        // Combine filteredNodes and filteredAbf, removing duplicates
        const combinedNodes = [
            ...filteredNodes.map(node => ({ ...node, level: 2, type: 'filteredNode' })),
            ...filteredAbf.map(node => ({ ...node, level: 3, type: 'otherNode' }))
        ];

        // Create unique links between filteredNodes and filteredAbf
        const uniqueLinks = new Map();
        filteredNodes.forEach(filteredNode => {
            filteredAbf.forEach(filteredAbfNode => {
                if (filteredNode.ID === filteredAbfNode.Tool) {
                    const linkKey = `${filteredNode.ID}-${filteredAbfNode.ID}`;
                    if (!uniqueLinks.has(linkKey)) {
                        uniqueLinks.set(linkKey, { source: filteredNode.ID, target: filteredAbfNode.ID });
                    }
                }
            });
        });

        const combinedLinks = Array.from(uniqueLinks.values());

        // Prepare filtered data structure
        const filteredData = {
            nodes: combinedNodes,
            links: combinedLinks
        };

        // Update graph if necessary
        if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(OldGraphData)) {
            graphDataStack.push({ nodes: OldGraphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: OldGraphData.links });
        }

        // Update the graph and highlight nodes
        updateGraph(filteredData);
        highlightNodes(filteredNodes, "#BE4917", false); // Highlight in red
        highlightNodes(filteredAbf, "#20548F", false); // Highlight in blue

        const searchedNodes = grandchilMdren.filter(node => node.name.toLowerCase().includes(query));
        highlightNodes(searchedNodes, "#ff0000", false); // Highlight searched nodes in red
    }
}







async function SearchFunction(query) {
    const foundNodes = [];
    let OldGraphData = graphData;
    let grandchildMData;

    try {
        grandchildMData = function_def_data;
        const grandchilMdren = grandchildMData.nodes;

        for (const child of grandchilMdren) {
            if (child.name.toLowerCase().includes(query)) {
                foundNodes.push(child.ID); // Assuming you want to use child.ID instead of child.name
                console.log(query);
            }
        }

        if (foundNodes.length === 0) {
            console.log("No nodes found for the query.");
            return;
        }

        const newData = function_def_data;
        d3.select("svg").remove();

        // Filter nodes in newData based on foundNodes
        const filteredNodes = newData.nodes.filter(node => foundNodes.includes(node.ID));
        const combinedNodes = [
            ...filteredNodes.map(node => ({ ...node, level: 1, type: 'filteredNode' })),
        ];

        // Filter links based on the filtered nodes
        const filteredLinks = newData.links.filter(link => 
            foundNodes.includes(link.source) && foundNodes.includes(link.target)
        );

        const filteredData = {
            nodes: combinedNodes,
            links: filteredLinks
        };

        if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(OldGraphData)) {
            graphDataStack.push({ nodes: OldGraphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: OldGraphData.links });
        }

        updateGraph(filteredData);

        const searchedNodes = grandchilMdren.filter(node => node.name.toLowerCase().includes(query));
        highlightNodes(searchedNodes, "#A020F0", false);

    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}



document.getElementById('search-button').addEventListener('click', async function () {
    const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
    if (searchQuery !== '') {
        if (searchQuery.startsWith('tbl_')&& graphData.nodes[0].level!=4) {
            const foundNodes = await searchTableInFourthLayer(searchQuery);
            console.log(foundNodes)
        
            //highlightNodes(foundNodes);
        }
        else if (searchQuery.startsWith('tbl_') && graphData.nodes[0].level===4) {
            searchTableInTableDefData(searchQuery);

        } else if (searchQuery.startsWith('abf_')) {
            searchNodeByID(searchQuery);

        }
        else if(graphData.nodes[0].level===2){
            searchToolByID(searchQuery);

        }
        else{
            searchToolByID(searchQuery);

        }
    }
});

function searchTableInTableDefData(query) {
    
        const searchQuery = query.toLowerCase(); // Convert search query to lowercase
        const foundNodes = graphData.nodes.filter(node => node.name.toLowerCase() === searchQuery); // Find matching node
    
        if (foundNodes.length > 0) {
            const svg = d3.select("svg"); // Select the SVG element
            const g = svg.select("g"); // Select the <g> element where your graph elements are appended
    
            // Assume we're only focusing on the first matching node
            const firstNode = foundNodes[0];
            const nodePositionX = firstNode.x;
            const nodePositionY = firstNode.y;
    
            // Get the dimensions of the graph to center the node
            const width = document.getElementById('graph').clientWidth;
            const height = document.getElementById('graph').clientHeight;
            const translateX = width / 2 - nodePositionX;
            const translateY = height / 2 - nodePositionY;
    
            // Create a zoom behavior
            const zoom = d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
    
            // Apply the zoom behavior to the SVG element
            svg.call(zoom);
    
            // Transition to the new zoom transform (centering on the node)
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translateX, translateY)
            );
    
            // Reset all nodes to their original color
            svg.selectAll("circle").attr("fill", "#fff");
    
            // Highlight the found node(s) with a different color
            foundNodes.forEach(node => {
                svg.selectAll("circle")
                    .filter(d => d.name === node.name) // Use 'name' to match nodes
                    .attr("fill", "#ff0000"); // Red color for highlighting
            });
    
            // Clear the search input
            document.getElementById('search-input').value = '';
        } else {
            console.log('Table not found');
        }
    }
    



function searchToolByID(query) {
    const searchQuery = query.toLowerCase(); // Convert search query to lowercase
    const foundNodes = graphData.nodes.filter(node => node.name.toLowerCase().includes(searchQuery));

    if (foundNodes.length > 0) {
        const svg = d3.select("svg"); // Select the SVG element
        const g = svg.select("g"); // Select the <g> element where your graph elements are appended

        // Calculate the translation to center on the first found node
        const firstNode = foundNodes[0];
        const nodePositionX = firstNode.x;
        const nodePositionY = firstNode.y;
        const width = document.getElementById('graph').clientWidth;
        const height = document.getElementById('graph').clientHeight;
        const translateX = width / 2 - nodePositionX;
        const translateY = height / 2 - nodePositionY;

        // Create a zoom behavior
        const zoom = d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

        // Apply the zoom behavior to the SVG element
        svg.call(zoom);

        // Transition to the new zoom transform
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY)
        );

        // Reset all nodes to their original color based on importance
        svg.selectAll("circle").attr("fill","#fff");

        // Highlight the found nodes with a different color
        foundNodes.forEach(node => {
            svg.selectAll("circle")
                .filter(d => d.ID === node.ID)
                .attr("fill", "#ff0000");
        });

        // Clear the search input
        document.getElementById('search-input').value = '';
    } else {
      
    }
}



async function searchTableInFourthLayer(searchString) {
    const foundNodes = [];
    let OldGraphData = graphData; // Track the old graph data for comparison
    const level4Nodes = []; // Array to hold level 4 nodes that match the search

    // Ensure toolsData and its nodes are defined
    if (!toolsData || !toolsData.nodes) {
        console.error("toolsData or toolsData.nodes is undefined");
        return;
    }

    // Ensure planningstoolData and its nodes are defined
    if (!planningstoolData || !planningstoolData.nodes) {
        console.error("planningstoolData or planningstoolData.nodes is undefined");
        return;
    }

    // Iterate through the top-level nodes (level 1, equivalent to ToolsData)
    const children = toolsData.nodes;

    for (const childm of children) {
        // Get grandchildren data from the respective planning tool data
        const grandchildMData = planningstoolData.nodes.filter(grandchild => grandchild.Tool === childm.name);

        for (const child of grandchildMData) {
            // Get table data from table_def_data
            if (!table_def_data || !table_def_data.nodes) {
                console.error("table_def_data or table_def_data.nodes is undefined");
                return;
            }
            const tableNodes = table_def_data.nodes.filter(tableNode => tableNode.ID === child.name);

            for (const grandchild of tableNodes) {
                const expandedNodes = grandchild.names
                    .filter(name => name.trim() === searchString) // Only keep names that match the searchString
                    .map(name => ({ ID: grandchild.ID, name: name.trim(), level: 4 }));

                for (const expandedNode of expandedNodes) {
                    console.log(expandedNode);

                    // Check if the expanded node matches the searchString
                    if (expandedNode.name === searchString) {
                        foundNodes.push(expandedNode);

                        // Add the childm (tool) node if it's not already added
                        if (!foundNodes.some(foundNode => foundNode.ID === childm.ID)) {
                            foundNodes.push(childm);
                        }
                    }

                    // Always add matching expandedNode to level4Nodes
                    level4Nodes.push(expandedNode);
                }
            }
        }
    }

    // If no results found, handle the case
    if (foundNodes.length === 0) {
        console.log("No matching table found");
    } else {
        // Filter nodes in toolsData based on foundNodes (tools and matching tables)
        const filteredNodes = toolsData.nodes.filter(node => foundNodes.some(foundNode => foundNode.ID === node.ID) && node.level === 2);

        // Filter nodes in planningstoolData based on Tool
        const filteredAbf = planningstoolData.nodes.filter(node => foundNodes.some(foundNode => foundNode.ID === node.Tool));

        // Combine filteredNodes and filteredAbf, ensuring level 4 nodes are only the matched ones
        const combinedNodes = [
            ...filteredNodes.map(node => ({ ...node, level: 2, type: 'filteredNode' })),
            ...filteredAbf.map(node => ({ ...node, level: 3, type: 'otherNode' })),

            //...level4Nodes // Only include matching level 4 nodes
        ];
        console.log(level4Nodes)

        // Create unique links
        const uniqueLinks = new Map();

        
        // Links between tools (level 2) and queries (level 3)
      filteredNodes.forEach(filteredNode => {
        // Iterate over each level 3 node
        filteredAbf.forEach(level3Node => {
            // Link if tool matches
            if (filteredNode.ID === level3Node.Tool) {
                const linkKey = `${filteredNode.ID}-${level3Node.ID}`;
                
                if (!uniqueLinks.has(linkKey)) {
                    
                
                    uniqueLinks.set(linkKey, { source: filteredNode.ID, target: level3Node.ID });
                }
            }
        });
    });


    




    
        const combinedLinks = Array.from(uniqueLinks.values());
        

        // Create the filtered data structure
        const filteredData = {
            nodes: combinedNodes,
            links: combinedLinks
        };

        // Update the graph if the current graph is different from the new one
        if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(OldGraphData)) {
            graphDataStack.push({ nodes: OldGraphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: OldGraphData.links });
        }

        // Update the graph with the filtered data
        updateGraph(filteredData);

        // Highlight the found nodes (tools, tables) with different colors if desired
        highlightNodes(filteredNodes, "#BE4917", false); // Highlight tools in red
        highlightNodes(filteredAbf, "#FFFFFF", false); // Highlight tables in blue
        highlightNodes(level4Nodes, "#FF0000", false); // Highlight matched level 4 nodes in green
    }
}









function highlightNodes(nodes, highlightColor = "#ff0000", makeOthersWhite = true) {
    const svg = d3.select("svg");

    // Clear previous highlights
    if (makeOthersWhite) {
        svg.selectAll("circle").attr("fill", "#fff");
    }

    // Highlight found nodes
    nodes.forEach(node => {
        svg.selectAll("circle")
            .filter(d => d.ID === node.ID)
            .attr("fill", highlightColor);
    });
}


async function fetchTableInfo(tableName) {
    try {
        let response = await fetch(`/api/table-info?table=${tableName}`);
        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching table info:', error);
        return [];
    }
}

// Function to calculate "Update fällig"
function calculateUpdateFaellig(timestampval, periode) {
    if (!timestampval || !periode) return "N/A";

    try {
        let timestampDate = new Date(timestampval); // Parse timestampval as a Date object
        let periodValue = parseInt(periode, 10); // Convert periode from string to integer

        if (isNaN(periodValue)) return "Invalid period"; // Handle incorrect format

        // Add the period (in days) to the timestamp date
        timestampDate.setDate(timestampDate.getDate() + periodValue);

        return timestampDate.toLocaleDateString("de-DE"); // Return formatted date in German format
    } catch (error) {
        console.error("Error calculating Update fällig:", error);
        return "Error";
    }
}


async function updateTableInfo(tableInfoData, tableName) {
    console.log(tableName)
    let updatedData = tableInfoData.map((row, index) => ({
        tabelle: tableName, // Ensure the API receives the correct table name
        feldbeschreibung: row.feldbeschreibung,
        beispiel: document.getElementById(`beispiel-${index}`).value,
        bemerkung: document.getElementById(`bemerkung-${index}`).value
    }));
    console.log(updatedData);

    try {
        let response = await fetch("/api/update-table-info", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ updatedData })
        });

        let result = await response.json();
        
        if (response.ok) {
            alert(result.message);
        } else {
            console.error("Fehler beim Aktualisieren:", result.error);
            alert("Fehler beim Speichern der Änderungen.");
        }
    } catch (error) {
        console.error("Fehler beim Aktualisieren:", error);
        alert("Fehler beim Speichern der Änderungen.");
    }
}

document.getElementById("OpenTimeTable").addEventListener("click", function() {
    openTimeTable();
});

// Attach event listeners after the DOM loads
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("updateButton").addEventListener("click", updateFunction);
    document.getElementById("protokollButton").addEventListener("click", showProtokoll);
    document.getElementById("dokuAbzugButton").addEventListener("click", showDokuAbzug);
    document.getElementById("exitButton").addEventListener("click", closeModals);
});

// Function to fetch schedule data from API
async function fetchScheduleData() {
    try {
        let response = await fetch("/api/schedule-data");
        return await response.json();
    } catch (error) {
        console.error("Error fetching schedule data:", error);
        return [];
    }
}
async function openTimeTable() {
    const modal = document.getElementById("timeTableModal");
    const buttonModal = document.getElementById("buttonModal");
    const tableContainer = document.getElementById("schedule-table-container");

    const currentDate = new Date(); // Get current date
    const scheduleData = await fetchScheduleData(); // Fetch API data

    let tableHtml = `
    <div class="schedule-title">Upload-Zeitplan</div>
    <div style="overflow-x: auto;">
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Strang</th>
                    <th>Tabelle</th>
                    <th>Name</th>
                    <th class="sortable" data-column="4">Upload ▲▼</th>
                    <th>Uhrzeit</th>
                    <th>User</th>
                    <th>Protokoll</th>
                    <th>Tage</th>
                    <th class="sortable" data-column="9">Nächster Upload ▲▼</th>
                </tr>
                <tr class="filter-row">
                    <th></th>
                    <th><input type="text" class="filter-input" data-column="1" placeholder="Strang"></th>
                    <th><input type="text" class="filter-input" data-column="2" placeholder="Tabelle"></th>
                    <th><input type="text" class="filter-input" data-column="3" placeholder="Name"></th>
                    <th><input type="text" class="filter-input" data-column="4" placeholder="Upload"></th>
                    <th><input type="text" class="filter-input" data-column="5" placeholder="Uhrzeit"></th>
                    <th><input type="text" class="filter-input" data-column="6" placeholder="User"></th>
                    <th><input type="text" class="filter-input" data-column="7" placeholder="Protokoll"></th>
                    <th><input type="text" class="filter-input" data-column="8" placeholder="Tage"></th>
                    <th><input type="text" class="filter-input" data-column="9" placeholder="Nächster Upload"></th>
                </tr>
            </thead>
            <tbody>`;






    scheduleData.forEach((row, index) => {
        let nextDateFormatted = "-"; // Default value

        if (row.letzterAbzug && row.tage) {
            const letzterAbzugDate = parseGermanDate(row.letzterAbzug); // Convert German date to JS Date
            if (!isNaN(letzterAbzugDate)) {
                let nextDate = new Date(letzterAbzugDate);
                nextDate.setDate(nextDate.getDate() + parseInt(row.tage, 10)); // Add Tage

                nextDateFormatted = formatGermanDate(nextDate); // Convert back to German format
            }
        }

        // Check if due date has passed
        let nextDateClass = isDueDatePassed(nextDateFormatted, currentDate) ? "due-date" : "";

        tableHtml += `
            <tr data-index="${index}">
                <td class="selection-cell"></td> <!-- Empty, toggles "X" on click -->
                <td>${row.strang || "-"}</td>
                <td>${row.tabelle || "-"}</td>
                <td>${row.name || "-"}</td>
                <td>${row.letzterAbzug || "-"}</td>
                <td>${row.uhrzeit || "-"}</td>
                <td class="username-highlight">${row.user || "-"}</td>
                <td>${row.protokoll || "-"}</td>
                <td>${row.tage || "-"}</td>
                <td class="${nextDateClass}">${nextDateFormatted}</td>
            </tr>`;
    });

    tableHtml += `</tbody></table></div>`;

    tableContainer.innerHTML = tableHtml;
    modal.style.display = "block"; // Open table modal
    buttonModal.style.display = "block"; // Open button modal
    // Function to Filter Table Rows
    
function filterTable() {
    const filters = {};
    document.querySelectorAll(".filter-input").forEach(input => {
        const column = parseInt(input.getAttribute("data-column"));
        const value = input.value.toLowerCase();
        filters[column] = value;
    });

    const rows = document.querySelectorAll(".schedule-table tbody tr");
    rows.forEach(row => {
        let isVisible = true;

        // Check each filter
        Object.keys(filters).forEach(columnIndex => {
            const cellValue = row.cells[columnIndex].textContent.toLowerCase();
            const filterValue = filters[columnIndex];

            if (filterValue && !cellValue.includes(filterValue)) {
                isVisible = false;
            }
        });

        // Toggle row visibility
        row.style.display = isVisible ? "" : "none";
    });

}

// Attach Event Listeners for Filtering
document.querySelectorAll(".filter-input").forEach(input => {
    input.addEventListener("keyup", filterTable);
});


    // Attach click event listeners to rows
    document.querySelectorAll(".schedule-table tbody tr").forEach(row => {
        row.addEventListener("click", function() {
            toggleRowSelection(this);
        });
    });

    // Attach Event Listeners for Sorting
document.querySelectorAll(".sortable").forEach(header => {
    header.addEventListener("click", function() {
        const columnIndex = parseInt(header.getAttribute("data-column"));
        sortTableByDate(columnIndex);
    });
});

}


let sortDirection = {}; // Store sort direction for each column

// Function to Sort Table by Date Column
function sortTableByDate(columnIndex) {
    const tableBody = document.querySelector(".schedule-table tbody");
    const rows = Array.from(tableBody.rows);

    // Toggle Sort Direction
    if (!sortDirection[columnIndex]) {
        sortDirection[columnIndex] = 'asc';
    } else {
        sortDirection[columnIndex] = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
    }

    // Convert German Date (DD.MM.YYYY) to JavaScript Date Object
    const parseDate = (dateStr) => {
        const parts = dateStr.split(".");
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM (0-based), DD
        }
        return new Date(0); // Invalid dates go to the bottom
    };

    // Sort Rows
    rows.sort((a, b) => {
        const dateA = parseDate(a.cells[columnIndex].textContent);
        const dateB = parseDate(b.cells[columnIndex].textContent);

        if (sortDirection[columnIndex] === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });

    // Append Sorted Rows
    rows.forEach(row => tableBody.appendChild(row));
}


// Function to close both modals
function closeModals() {
    document.getElementById("timeTableModal").style.display = "none";
    document.getElementById("buttonModal").style.display = "none";
}
// Convert German DD.MM.YYYY date format to JavaScript Date object
function parseGermanDate(germanDate) {
    if (!germanDate) return NaN;
    const parts = germanDate.split(".");
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]); // YYYY, MM (0-based), DD
    }
    return NaN;
}

// Convert JavaScript Date object to German DD.MM.YYYY format
function formatGermanDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "-";
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

// Check if the due date has passed
function isDueDatePassed(dueDate, currentDate) {
    if (!dueDate || dueDate === "-") return false;
    const dueDateObj = parseGermanDate(dueDate);
    return dueDateObj < currentDate;
}


// Global Function to Toggle Row Selection (One Row Only)
function toggleRowSelection(row) {
    // Deselect all rows first
    document.querySelectorAll(".selected-row").forEach(selectedRow => {
        selectedRow.classList.remove("selected-row");
        selectedRow.querySelector(".selection-cell").textContent = ""; // Clear "X"
    });

    // Select the clicked row
    row.classList.add("selected-row");
    row.querySelector(".selection-cell").textContent = "X"; // Mark row with "X"
}


// Functions for button actions (Modify these for real functionality)
function updateFunction() {
    window.open("http://a11ccbd.online-server.cloud:5000/", "_blank"); // Replace with the real URL
}

function showProtokoll() {
    window.open("https://amotiqautomotive.sharepoint.com/:x:/r/sites/DaimlerProduktiv/_layouts/15/Doc.aspx?sourcedoc=%7B908A6210-B64B-494F-AF7E-6CD05A0F6E64%7D&file=GSS%20Datenabz%25u00fcge.xlsx&action=default&mobileredirect=true", "_blank"); // Replace with the real URL
}

function showDokuAbzug() {
    window.open("https://amotiqautomotive.sharepoint.com/:x:/r/sites/DaimlerProduktiv/_layouts/15/Doc.aspx?sourcedoc=%7B908A6210-B64B-494F-AF7E-6CD05A0F6E64%7D&file=GSS%20Datenabz%25u00fcge.xlsx&action=default&mobileredirect=true", "_blank"); // Replace with the real URL
}




updateGraph(graphData);

