import { useState, useCallback } from 'react';
import BrazilMap from '@/components/BrazilMap';
import AppSidebar from '@/components/AppSidebar';
import { useRepresentatives } from '@/hooks/useRepresentatives';
import { Representative } from '@/types/representative';

const Index = () => {
  const {
    representatives,
    selectedId,
    setSelectedId,
    addRepresentative,
    updateRepresentative,
    deleteRepresentative,
    addRegion,
    deleteRegion,
    addPin,
    deletePin,
    findRepresentativeByPoint,
    setRepresentatives,
  } = useRepresentatives();

  const [drawingForId, setDrawingForId] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number } | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const handleRegionCreated = useCallback((repId: string, points: [number, number][]) => {
    addRegion(repId, {
      id: crypto.randomUUID(),
      points,
    });
    // Don't stop drawing mode - allow creating multiple regions
  }, [addRegion]);

  const handleStartDrawing = useCallback((id: string) => {
    setDrawingForId(prev => prev === id ? null : id);
    setSelectedId(id);
  }, [setSelectedId]);

  const handleSearchResult = useCallback((lat: number, lng: number) => {
    setSearchResult({ lat, lng });
  }, []);

  const handleAddPin = useCallback((repId: string, name: string, lat: number, lng: number) => {
    addPin(repId, {
      id: crypto.randomUUID(),
      name,
      lat,
      lng
    });
    setSearchResult(null); // Clear search marker after adding pin
  }, [addPin]);

  const handleImportJson = useCallback((data: Representative[]) => {
    setRepresentatives(data);
  }, [setRepresentatives]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar
        representatives={representatives}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={addRepresentative}
        onUpdate={updateRepresentative}
        onDelete={deleteRepresentative}
        onDeleteRegion={deleteRegion}
        onAddPin={(name, lat, lng) => selectedId && handleAddPin(selectedId, name, lat, lng)}
        onDeletePin={deletePin}
        onAddCityBound={(city) => selectedId && addCityBound(selectedId, city)}
        onDeleteCityBound={deleteCityBound}
        onStartDrawing={handleStartDrawing}
        onStopDrawing={() => setDrawingForId(null)}
        drawingForId={drawingForId}
        onSearchResult={handleSearchResult}
        findRepresentativeByPoint={findRepresentativeByPoint}
        overlayImage={overlayImage}
        setOverlayImage={setOverlayImage}
        overlayOpacity={overlayOpacity}
        setOverlayOpacity={setOverlayOpacity}
        onImportJson={handleImportJson}
      />
      <div className="flex-1 relative">
        <BrazilMap
          representatives={representatives}
          selectedId={selectedId}
          onSelectRepresentative={setSelectedId}
          onRegionCreated={handleRegionCreated}
          drawingForId={drawingForId}
          onSearchResult={searchResult}
          overlayImage={overlayImage}
          overlayOpacity={overlayOpacity}
        />
        {drawingForId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-card text-card-foreground shadow-lg rounded-lg px-4 py-2 text-sm font-medium border border-border flex items-center gap-3">
            <span>🖊️ Clique no mapa para adicionar pontos · Clique no 1º ponto para fechar · Botão direito desfaz</span>
            <button
              onClick={() => setDrawingForId(null)}
              className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity"
            >
              Parar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
