function initializeGraphLogic() {
    const yearSelector = document.getElementById('yearSelector');
    const graphContainer = document.getElementById('graphContainer');
    const associatedWordsDisplay = document.getElementById('associatedWordsDisplay');
    const loadedIframes = {};

    function loadGraph() {
        const selectedYear = yearSelector.value;
        const graphUrl = yearSelector.options[yearSelector.selectedIndex] ? yearSelector.options[yearSelector.selectedIndex].dataset.graph : null;

        associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';

        if (graphUrl) {
            if (loadedIframes[selectedYear]) {
                graphContainer.innerHTML = '';
                graphContainer.appendChild(loadedIframes[selectedYear]);
                console.log(`Mostrando grafo cacheado para el año: ${selectedYear}`);
                
                setTimeout(() => { 
                    const network = loadedIframes[selectedYear].contentWindow.network; 
                    if (network) {
                        attachNodeClickListener(network);
                    } else {
                        console.warn("DEBUG: No se pudo re-adjuntar listener para grafo cacheado. Instancia 'network' no disponible.");
                    }
                }, 100);
                
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = graphUrl;
                iframe.style.width = '100%';
                iframe.style.height = '700px';
                iframe.style.border = 'none';

                iframe.onload = function() {
                    console.log(`Grafo para el año ${selectedYear} cargado.`);
                    setTimeout(() => {
                        const network = iframe.contentWindow.network;
                        if (network) {
                            attachNodeClickListener(network);
                        } else {
                            console.error("DEBUG: Instancia 'network' no disponible en iframe.onload después del delay.");
                        }
                    }, 100);
                };

                loadedIframes[selectedYear] = iframe;
                graphContainer.innerHTML = '';
                graphContainer.appendChild(iframe);
            }
        } else {
            graphContainer.innerHTML = '<p>Selecciona un año para ver el grafo.</p>';
            associatedWordsDisplay.innerHTML = ''; 
        }
    }

    function attachNodeClickListener(networkInstance) { 
        if (!networkInstance || typeof networkInstance.on !== 'function') { 
            console.error("DEBUG: La instancia de la red no es válida o no tiene el método 'on'.");
            return;
        }

        networkInstance.on("selectNode", function (params) { 
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const nodeData = networkInstance.body.data.nodes.get(nodeId); 
                const words = nodeData.associated_words; 
                console.log(`Node selected: ${nodeId}, Associated words: ${words}`);

                if (words) {
                    const wordsArray = words.split(', ').filter(word => word.trim() !== '');
                    if (wordsArray.length > 0) {
                        const formattedList = wordsArray.map(word => `<li>${word}</li>`).join('');
                        associatedWordsDisplay.innerHTML = `
                            <h3>Palabras vecinas de "${nodeId}":</h3>
                            <ul>
                                ${formattedList}
                            </ul>
                        `;
                    } else {
                        associatedWordsDisplay.innerHTML = `<p>No hay palabras vecinas para "${nodeId}".</p>`;
                    }
                } else {
                    associatedWordsDisplay.innerHTML = `<p>No hay palabras vecinas para "${nodeId}".</p>`;
                }
            } else {
                associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';
            }
        });

        networkInstance.on("click", function(params) {
            if (params.nodes.length === 0 && params.edges.length === 0) {
                associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';
            }
        });
    }
    
    if (yearSelector) {
        yearSelector.addEventListener('change', loadGraph);

        if (yearSelector.value) {
            loadGraph();
        } else if (yearSelector.options.length > 1) {
            yearSelector.value = yearSelector.options[1].value;
            loadGraph();
        }
    }
}