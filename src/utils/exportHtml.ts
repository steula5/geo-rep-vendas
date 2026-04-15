import brazilStatesData from '@/data/brazil-states.json';
import { Representative } from '@/types/representative';

export async function generateHtmlExport(representatives: Representative[]): Promise<string> {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Mapa de Regiões Comerciais - GeoRep</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { padding: 0; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    html, body, #map { height: 100vh; width: 100vw; }
    
    .legend-container {
      position: absolute; 
      bottom: 30px; 
      right: 10px; 
      z-index: 1000;
      background: white; 
      padding: 15px; 
      border-radius: 8px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      max-height: calc(100vh - 60px); 
      overflow-y: auto;
      min-width: 200px;
      border: 1px solid #e2e8f0;
    }
    
    .legend-container h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }

    .legend-item { 
      display: flex; 
      align-items: center; 
      gap: 10px; 
      margin-bottom: 6px; 
      font-size: 13px; 
      color: #475569;
    }
    
    .color-box { 
      width: 14px; 
      height: 14px; 
      border-radius: 4px; 
      flex-shrink: 0;
    }
    
    .search-container {
      position: absolute;
      top: 15px;
      left: 60px;
      z-index: 1000;
      background: white;
      padding: 5px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: flex;
      gap: 5px;
    }
    .search-container input {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 250px;
      font-size: 14px;
    }
    .search-container button {
      padding: 8px 15px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .search-container button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div class="search-container">
    <input type="text" id="city-search" placeholder="Buscar cidade... (ex: Campinas, SP)" onkeypress="if(event.key === 'Enter') searchCity()" />
    <button onclick="searchCity()">Buscar</button>
  </div>
  <div class="legend-container">
    <h3>Representantes</h3>
    <div id="legend-list"></div>
  </div>
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const representatives = ${JSON.stringify(representatives)};
    const brazilStatesData = ${JSON.stringify(brazilStatesData)};

    // Map initialization
    const map = L.map('map').setView([-14.235, -51.9253], 4);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18,
    }).addTo(map);

    // Build Legend
    const legendList = document.getElementById('legend-list');
    if (representatives.length === 0) {
      legendList.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Nenhum cadastrado.</span>';
    } else {
      representatives.forEach(rep => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = '<div class="color-box" style="background-color: ' + rep.color + '"></div><span>' + rep.name + '</span>';
        legendList.appendChild(item);
      });
    }

    // Draw Map Layers
    async function init() {
      representatives.forEach(rep => {
        // 1. Draw States
        if (rep.states && rep.states.length > 0) {
          L.geoJSON(brazilStatesData, {
            filter: function(feature) { return rep.states.includes(feature.properties.sigla); },
            style: { 
              color: rep.color, 
              weight: 2, 
              fillColor: rep.color, 
              fillOpacity: 0.25 
            },
            onEachFeature: function(feature, layer) {
              layer.bindTooltip(rep.name + ' / ' + feature.properties.name, { direction: 'top', className: 'map-tooltip' });
              layer.bindPopup(
                '<div style="min-width:180px">' +
                '<strong style="font-size:14px">' + feature.properties.name + '</strong><br/>' +
                '<span style="color:'+rep.color+'; font-weight: 500">' + rep.name + '</span><br/>' +
                '📞 ' + (rep.phone || '—') + '<br/>' +
                '✉️ ' + (rep.email || '—') +
                '</div>'
              );
            }
          }).addTo(map);
        }

        // 2. Draw Custom Regions
        if (rep.regions && rep.regions.length > 0) {
          rep.regions.forEach(function(region) {
            const polygon = L.polygon(region.points, {
              color: rep.color, 
              weight: 2, 
              fillColor: rep.color, 
              fillOpacity: 0.25
            }).addTo(map);
            
            polygon.bindTooltip(rep.name, {direction: 'top'});
            polygon.bindPopup(
                '<div style="min-width:180px">' +
                '<strong style="font-size:14px">' + rep.name + '</strong><br/>' +
                '<span style="color:#666">' + (rep.code || '—') + '</span><br/>' +
                '📞 ' + (rep.phone || '—') + '<br/>' +
                '✉️ ' + (rep.email || '—') + '<br/>' +
                '</div>'
            );
          });
        }

        // 3. Draw Pins
        if (rep.pins && rep.pins.length > 0) {
          rep.pins.forEach(function(pin) {
            const marker = L.circleMarker([pin.lat, pin.lng], {
              radius: 6, 
              color: '#fff', 
              weight: 2, 
              fillColor: rep.color, 
              fillOpacity: 1
            }).addTo(map);
            
            marker.bindTooltip(rep.name + ' / ' + pin.name, {direction: 'top'});
            marker.bindPopup(
                '<div style="min-width:180px">' +
                '<strong style="font-size:14px">' + pin.name + '</strong><br/>' +
                '<span style="color:'+rep.color+'; font-weight: 500">' + rep.name + '</span><br/>' +
                '📞 ' + (rep.phone || '—') + '<br/>' +
                '✉️ ' + (rep.email || '—') +
                '</div>'
            );
          });
        }
      });

      // 4. Fetch and draw city bounds
      const neededCities = [];
      representatives.forEach(rep => {
        if (rep.cityBounds) {
          rep.cityBounds.forEach(city => {
            neededCities.push({
              rep: rep, 
              cityId: city.id, 
              cityName: city.name, 
              cityState: city.state
            });
          });
        }
      });

      for (let i = 0; i < neededCities.length; i++) {
        const item = neededCities[i];
        try {
          const res = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/municipios/' + item.cityId + '?formato=application/vnd.geo+json');
          const data = await res.json();
          L.geoJSON(data, {
            style: { 
              color: item.rep.color, 
              weight: 2, 
              fillColor: item.rep.color, 
              fillOpacity: 0.25 
            },
            onEachFeature: function(_, layer) {
              layer.bindTooltip(item.rep.name + ' / ' + item.cityName + ' - ' + item.cityState, { direction: 'top' });
              layer.bindPopup(
                '<div style="min-width:180px">' +
                '<strong style="font-size:14px">' + item.cityName + ' - ' + item.cityState + '</strong><br/>' +
                '<span style="color:'+item.rep.color+'; font-weight: 500">' + item.rep.name + '</span><br/>' +
                '📞 ' + (item.rep.phone || '—') + '<br/>' +
                '✉️ ' + (item.rep.email || '—') +
                '</div>'
              );
            }
          }).addTo(map);
        } catch(e) { 
          console.error('Failed to load city boundaries for', item.cityId, e); 
        }
      }
    }
    
    let searchMarker = null;
    async function searchCity() {
      const query = document.getElementById('city-search').value;
      if (!query) return;
      
      try {
        const response = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ', Brasil'));
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          
          map.setView([lat, lon], 10);
          
          if (searchMarker) {
            map.removeLayer(searchMarker);
          }
          
          // Add a red marker for the searched location
          const icon = L.divIcon({
            className: 'search-marker',
            html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          searchMarker = L.marker([lat, lon], {icon: icon})
            .bindTooltip(data[0].display_name, {direction: 'top'})
            .addTo(map);
        } else {
          alert('Cidade não encontrada.');
        }
      } catch (e) {
        console.error('Erro na busca', e);
        alert('Erro ao buscar a cidade. Tente novamente.');
      }
    }

    init();
  </script>
</body>
</html>`;
  return html;
}
