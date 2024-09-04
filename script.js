    let SearchMode='node';

    let initialGraphData = {
        nodes: [
            { "ID": "Function", "name": "Suche nach Funktionen", "level": 0 },
            { "ID": "Tools", "name": "Suche nach Tools", "level": 0 }
    

        ],
        links: [
        
        ]
    };

    document.getElementById("redirect-button").addEventListener("click", function() {
        window.location.href = "http://82.165.126.38:5000"; // Specify your desired link here
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
                    if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(graphData)) {
                        graphDataStack.push({ nodes: graphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: graphData.links });
                    }
                    console.log(d.ID)
                    d3.json(`${d.ID}.json`).then(newData => {
                        console.log('New graph data:', newData);
                        // Set level for new nodes
                        d3.select("svg").remove();
                        updateGraph(newData);

                        if(d.ID==="Tools"){
                           /* highlightNodes(graphData.nodes, "#BE4917", false);*/
                            setNodeColors(graphData.nodes);

                        }
                        else{
                           
                            setNodeColors(graphData.nodes);
                        }
                        
                    }).catch(error => {
                        console.error('Error loading JSON:', error);
                    });
                }

                
                if (d.level === 1) {
                    if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(graphData)) {
                        graphDataStack.push({ nodes: graphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: graphData.links });
                    }
                    console.log(d.FollowUpNode);
                
                    d3.json(`Tools.json`).then(newData => {
                        console.log('New graph data:', newData);
                
                        // Filter nodes to include only those with ID matching FollowUpNode
                        const filteredNodes = newData.nodes.filter(node => node.name === d.FollowUpNode);
                
                        // Set the level for new nodes and create the new filtered data structure
                        const filteredData = {
                            nodes: filteredNodes.map(node => ({ ...node, level: 2 })),
                            links: newData.links.filter(link => filteredNodes.some(node => node.name === link.source || node.name === link.target))
                        };
                
                        // Remove existing SVG and update the graph with filtered data
                        d3.select("svg").remove();
                        updateGraph(filteredData);
                        
                        setNodeColors(graphData.nodes);
                        
                    }).catch(error => {
                        console.error('Error loading JSON:', error);
                    });
                }
                
                else if(!event.ctrlKey && d.level === 2) {
                    if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(graphData)) {
                        graphDataStack.push({ nodes: graphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: graphData.links });
                        }
                        sendValueToBackend(d.name) 
                        d3.json(`Plannungstool.json`).then(newData => {
                            console.log('New graph data:', newData);
                            d3.select("svg").remove();
                    
                            // Filter nodes by ID and expand the names array
                            const filteredNodes = newData.nodes.filter(node => node.Tool === d.name);
                            // expandedNodes = filteredNodes.flatMap(node => node.names.map(name => ({ ID: node.ID, name, level: 4,Tool })));
                    
                            // Create the new filtered data structure
                            const filteredData = {
                                nodes: filteredNodes.map(node => ({ ...node, level: 3 })),
                                links: newData.links.filter(link => 
                                    filteredNodes.some(node => node.name === link.source || node.name === link.target))
                            };
                        updateGraph(filteredData);
                        setNodeColors(graphData.nodes);
                    }).catch(error => {
                        console.error('Error loading JSON:', error);
                    });
                    
                    
                 }
                 else if(d.level===2& event.ctrlKey ){
                    console.log("test")
                    const link = document.createElement('a');
                    link.href = '82.165.126.38:3000/tool_info/Planungstool';
                    link.target = '_blank'; 
                    link.click();

                 }
                else if (d.level === 3) {
                    if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(graphData)) {
                        graphDataStack.push({ nodes: graphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: graphData.links });
                    }
                    d3.json(`TableDefs.json`).then(newData => {
                        console.log('New graph data:', newData);
                        d3.select("svg").remove();
                
                        // Filter nodes by ID and expand the names array
                        console.log(newData)
                        const filteredNodes = newData.nodes.filter(node => node.ID === d.name);
                        const expandedNodes = filteredNodes.flatMap(node => node.names.map(name => ({ ID: node.ID, name, level: 4 })));
                
                        // Create the new filtered data structure
                        const filteredData = {
                            nodes: expandedNodes,
                            links: newData.links.filter(link => expandedNodes.some(node => node.ID === link.source || node.ID === link.target))
                        };
                        
                        updateGraph(filteredData);
                       
                        setNodeColors(graphData.nodes);
                    }).catch(error => {
                        console.error('Error loading JSON:', error);
                    });
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
            .text(d => d.name);

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
    
            let response = await fetch(`http://82.165.166.108:3000/table/${encodeURIComponent(d.name)}`);
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
            let response = await fetch(`http://localhost:3000/tool_info/${d.name}`);
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
            let response = await fetch(`http://82.165.166.108:3000/tool_info/${d.name}`);
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
            let tableData2= await fetchLogs(d);
            document.getElementById('legend-container').classList.add('hidden');
            
            
        
        
            


            let sidebar = document.getElementById('sidebar');
            sidebar.innerHTML = '';

            
        sidebar.innerHTML = '';
        const additionalInfo = document.getElementById('top-right-entity');
        
        document.getElementById('top-right-entity').style.display = 'table';
        if (tableData2.length > 0) {
            additionalInfo.innerHTML = `
                <p>Zuletzt geändert:  <p style="font-family: Arial; color: red;"> ${tableData2[0].timestampval}</p>
                <p>Name:  <p style="font-family: Arial; color: red;"> ${tableData2[0].username}</p>`;
        } else {
            additionalInfo.innerHTML = `
                <p>Zuletzt geändert: /</p>
                <p>Name: /</p>`;
        }
        console.log(tableData2)

        let header = document.createElement('div');


            
            header.classList.add('sidebar-header');
            header.innerHTML = '<span style="white-space: pre;">Column                Type</span>';

            sidebar.appendChild(header);
            // Create a document fragment to build the sidebar content
            let fragment = document.createDocumentFragment();

            let maxColumnWidth = 0;
            console.log('Fetched table data:', tableData);
            // Calculate max column width
            tableData.forEach(row => {
                for (const key in row) {
                    let tempSpan = document.createElement('span');
                    tempSpan.className = 'column'; 
                    tempSpan.textContent = key; 
                    fragment.appendChild(tempSpan);

                    let columnWidth = tempSpan.offsetWidth;
                    maxColumnWidth = Math.max(maxColumnWidth, columnWidth);
                }
            });
            // Append all column headers to fragment
            fragment.querySelectorAll('.column').forEach(tempSpan => {
                fragment.removeChild(tempSpan); 
            });

            // Populate sidebar with list items
            tableData.forEach(row => {
                let listItem = document.createElement('div');
                listItem.classList.add('list-item');
    
                let rowHtml = '';
                for (const key in row) {
                
                    let cleanKey = key.replace('column_name', '');
                    cleanKey = cleanKey.replace('data_type', '');
                    let cleanKey2 = row[key].replace('data_type', '');
                    rowHtml += `<span class="column">${cleanKey}</span><span class="type">${cleanKey2}</span>`;

                        //</span><span class="type">${row[key]}</span>`;
                    
                    
            
                }
                listItem.innerHTML = rowHtml;
   
                fragment.appendChild(listItem);
            });

            sidebar.appendChild(fragment);

            sidebar.classList.add('open');
            sidebar = document.getElementById('top-right-entity');
            sidebar.classList.add('open');
       
            // Create the image element
       
   
            
            if (sidebarImageContainer) {
              
                sidebarImageContainer.innerHTML = '';
    
                // Check if the link element already exists
                var existingLink = document.getElementById('sidebar-link');
               
                    // Create the link element
                    var link = document.createElement('a');
                    link.href = `http://82.165.166.108:3000/view_table/${d.name}`;
                    link.target = '_blank'; 
                    link.id = 'sidebar-link';
    
                    // Create the image element
                    var img = document.createElement('img');
                    img.src = 'tablePic.svg';
                    img.alt = 'Logo';
    
                  
                    link.appendChild(img);
    
                 
                    sidebarImageContainer.appendChild(link);
                
    
                
                sidebarImageContainer.style.display = 'block';
            } else {
                console.error('Error populating sidebar: sidebarImageContainer element not found');
            }

            
           
              
                SidebarImagePG.innerHTML = '';
    
                // Check if the link element already exists
                var existingLink = document.getElementById('sidebar-link');
               
                    // Create the link element
                    var link = document.createElement('a');
                    link.href = `https://www.pgadmin.org/`;
                    
                    link.target = '_blank'; 
                    link.id = 'sidebar-link';
    
                    // Create the image element
                    var img = document.createElement('img');
                    img.src = 'pgadmin_94126.png';
                    img.alt = 'Logo';
    
                  
                    link.appendChild(img);
    
                 
                    SidebarImagePG.appendChild(link);
                
    
                
                SidebarImagePG.style.display = 'block';
          
            
            
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


    document.addEventListener('click', function (event) {
        const sidebar = document.getElementById('sidebar');
        const link = document.getElementById('sidebarImageContainer');
        const linkPG = document.getElementById('SidebarImagePG');
        if (!sidebar.contains(event.target) && (!link.contains(event.target)) &&(!linkPG.contains(event.target))) {
            hideSidebar();
            hideExtraInfo();
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
        let OldGraphData= graphData
        let grandchildMData, tableData;
    
        
        
                grandchildMData = await d3.json('Plannungstool.json');
                const grandchilMdren = grandchildMData.nodes;
                for (const child of grandchilMdren) {
                    if(child.name.toLowerCase().includes(query))
                        foundNodes.push(child.Tool);
                        console.log(query)
                    }
                    
                
            
    
            if (foundNodes.length === 0) {
              
                
       
             
                // Assuming updateGraph function is defined elsewhere
            }
           

            else if(foundNodes.length >0){
                const newData = await d3.json('Tools.json');
                const toolsData = await d3.json('Plannungstool.json');
        
                d3.select("svg").remove();
        
                // Filter nodes in Tools.json based on foundNodes
                // Filter nodes in Tools.json based on foundNodes
        const filteredNodes = newData.nodes.filter(node => foundNodes.includes(node.ID));
        
        // Filter nodes in Plannungstool.json based on Tool
        const filteredAbf = toolsData.nodes.filter(node => foundNodes.includes(node.Tool));

        // Combine filteredNodes and filteredAbf, removing duplicates
        const combinedNodes = [
            ...filteredNodes.map(node => ({ ...node, level: 2, type: 'filteredNode' })),
            ...filteredAbf.map(node => ({ ...node, level: 3, type: 'otherNode' }))
        ];

        // Combine links from both datasets
       
        console.log(filteredAbf)
        console.log(filteredNodes)
        // Add dynamic edges between filteredNode and all filteredAbf nodes
      // Create a map to store unique links
      const uniqueLinks = new Map();

      // Add dynamic edges between filteredNode and all filteredAbf nodes
      filteredNodes.forEach(filteredNode => {
          filteredAbf.forEach(filteredAbfNode => {
              // Condition to link nodes based on ID and Tool
              if (filteredNode.ID === filteredAbfNode.Tool) {
                  // Generate a unique key for the link
                  const linkKey = `${filteredNode.ID}-${filteredAbfNode.ID}`;
                  // Add to the map only if the key doesn't exist
                  if (!uniqueLinks.has(linkKey)) {
                      uniqueLinks.set(linkKey, { source: filteredNode.ID, target: filteredAbfNode.ID });
                  }
              }
          });
      });

      // Convert map values to array of links
      const combinedLinks = Array.from(uniqueLinks.values());

      // Create the new filtered data structure
      const filteredData = {
          nodes: combinedNodes,
          links: combinedLinks
      };


        
                if (graphDataStack.length === 0 || JSON.stringify(graphDataStack[graphDataStack.length - 1]) !== JSON.stringify(OldGraphData)) {
                    graphDataStack.push({ nodes: OldGraphData.nodes.map(d => ({ ...d, fx: d.x, fy: d.y })), links: OldGraphData.links });
                }
                console.log("here")
                console.log(OldGraphData)
        
                updateGraph(filteredData);
                highlightNodes(filteredNodes, "#BE4917", false); // Highlights nodes in filteredNodes with red color, does not change other nodes to white

                highlightNodes(filteredAbf, "#20548F", false);

                const searchedNodes = grandchilMdren.filter(node => node.name.toLowerCase().includes(query));

                // Highlight all searched nodes
                highlightNodes(searchedNodes, "#ff0000", false);

            } 
    }




    
    async function SearchFunction(query) {
        const foundNodes = [];
        let OldGraphData = graphData;
        let grandchildMData;
    
        try {
            grandchildMData = await d3.json('Function.json');
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
    
            const newData = await d3.json('Function.json');
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
            if (searchQuery.startsWith('tbl_')) {
                const foundNodes = await searchTableInFourthLayer(searchQuery);
            
                highlightNodes(foundNodes);
            } else if (searchQuery.startsWith('abf_')) {
                searchNodeByID(searchQuery);

            }
            else if(graphData.nodes[0].level===2){
                searchToolByID(searchQuery);

            }
            else{
                SearchFunction(searchQuery);

            }
        }
    });


    
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



    async function searchTableInFourthLayer(table) {
        const foundNodes = [];
    
        try {
            // Iterate through each node in the first level
            const MainNodes = await d3.json('Function.json');
            for (const node of MainNodes.nodes) {
                if (node.level === 1) {
                    const childData = await d3.json('Tools.json');
                    // Filter children to only include those with an ID matching node.FollowUpNode
                    const children = childData.nodes.filter(child => child.name === node.FollowUpNode);
    
                    for (const childm of children) {
                        const grandchildMData = await d3.json(`${childm.name}.json`);
                        const grandchilMdren = grandchildMData.nodes;
    
                        // Iterate through each child (level 2 node)
                        for (const child of grandchilMdren) {
                            const tableData = await d3.json('TableDefs.json');
                            const tableNodes = tableData.nodes.filter(tableNode => tableNode.ID === child.name);
    
                            for (const grandchild of tableNodes) {
                                // Expand grandchild nodes by names array
                                const expandedNodes = grandchild.names.map(name => ({ ID: grandchild.ID, name, level: 4 }));
    
                                // Check if any expanded node matches the table name
                                for (const expandedNode of expandedNodes) {
                                    if (expandedNode.name.includes(table)) {
                                        
                                    
                                        // Add the relevant nodes to foundNodes if not already added
                                       
                                        if (!foundNodes.some(foundNode => foundNode.ID === child.ID)) {
                                            foundNodes.push(child);
                                        }
                                        if (!foundNodes.some(foundNode => foundNode.ID === childm.ID)) {
                                            foundNodes.push(childm);
                                        }
                                        if (!foundNodes.some(foundNode => foundNode.ID === node.ID)) {
                                            foundNodes.push(node);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading JSON data:', error);
        }
        console.log(graphData)

        if (graphData.nodes[0].level === 4) {
            for (const node of graphData.nodes) {
                if (node.name.some(name => name.includes(table))) {
                    foundNodes.push(node);
                }
            }
        }
        
        
            
        
    
        return foundNodes;
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
    


    updateGraph(graphData);
