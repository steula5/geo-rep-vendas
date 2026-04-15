import { useState, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Map, Upload, Download, FileUp,
  ChevronDown, ChevronUp, Layers, X, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import CitySearch from '@/components/CitySearch';
import RepresentativeLegend from '@/components/RepresentativeLegend';
import RepresentativeForm from '@/components/RepresentativeForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Representative, CityBound } from '@/types/representative';
import { CityBoundSearch } from './CityBoundSearch';
import { generateHtmlExport } from '@/utils/exportHtml';
interface AppSidebarProps {
  representatives: Representative[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (data: Omit<Representative, 'id' | 'regions' | 'pins'>) => Representative;
  onUpdate: (id: string, data: Partial<Representative>) => void;
  onDelete: (id: string) => void;
  onDeleteRegion: (repId: string, regionId: string) => void;
  onAddPin: (name: string, lat: number, lng: number) => void;
  onDeletePin: (repId: string, pinId: string) => void;
  onAddCityBound: (city: CityBound) => void;
  onDeleteCityBound: (repId: string, cityId: string) => void;
  onStartDrawing: (id: string) => void;
  onStopDrawing: () => void;
  drawingForId: string | null;
  onSearchResult: (lat: number, lng: number) => void;
  findRepresentativeByPoint: (lat: number, lng: number) => Representative | null;
  overlayImage: string | null;
  setOverlayImage: (img: string | null) => void;
  overlayOpacity: number;
  setOverlayOpacity: (val: number) => void;
  onImportJson: (data: Representative[]) => void;
}

export default function AppSidebar({
  representatives,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteRegion,
  onAddPin,
  onDeletePin,
  onAddCityBound,
  onDeleteCityBound,
  onStartDrawing,
  onStopDrawing,
  drawingForId,
  onSearchResult,
  findRepresentativeByPoint,
  overlayImage,
  setOverlayImage,
  overlayOpacity,
  setOverlayOpacity,
  onImportJson,
}: AppSidebarProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Representative | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setOverlayImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExportJson = () => {
    const json = JSON.stringify(representatives, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'representantes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = async () => {
    try {
      // Fetch logo and convert to base64 for monolithic export
      let logoBase64 = "";
      try {
        const response = await fetch('/Logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Logo not found for export", err);
      }

      const htmlContent = await generateHtmlExport(representatives, logoBase64);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mapa-representantes-interativo.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create HTML export', e);
      alert('Erro ao gerar o HTML Interativo. Tente novamente.');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data)) {
          onImportJson(data);
        }
      } catch (err) {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be imported again
    e.target.value = '';
  };

  const handleOpenAddForm = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (rep: Representative) => {
    setEditing(rep);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const usedColors = representatives.map(r => r.color);

  return (
    <div className="w-80 h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center mb-1 py-1">
          <img src="/Logo.png" alt="Steula Logo" className="h-10 w-auto object-contain" />
        </div>
        <p className="text-[10px] text-center text-sidebar-muted uppercase tracking-widest font-medium">Gestão de Vendas</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Search */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted mb-2">Buscar Cidade</h3>
          <CitySearch 
            onSearch={onSearchResult} 
            findRepresentativeByPoint={findRepresentativeByPoint} 
            selectedRepresentative={representatives.find(r => r.id === selectedId) || null}
            onAddPin={onAddPin}
          />
        </div>

        {/* Representatives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted">Representantes</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleOpenAddForm}
              title="Adicionar representante"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {representatives.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-sidebar-accent flex items-center justify-center">
                <Plus className="h-5 w-5 text-sidebar-muted" />
              </div>
              <p className="text-xs text-sidebar-muted italic mb-2">Nenhum representante cadastrado.</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={handleOpenAddForm}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar primeiro representante
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {representatives.map(rep => (
                <div
                  key={rep.id}
                  className={`rounded-lg p-2.5 cursor-pointer transition-colors ${
                    selectedId === rep.id ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => onSelect(selectedId === rep.id ? null : rep.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: rep.color }} />
                    <span className="font-medium text-sm truncate flex-1">{rep.name}</span>
                    <span className="text-xs text-sidebar-muted">{rep.code}</span>
                  </div>

                  {selectedId === rep.id && (
                    <div className="mt-2 pl-5 space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="text-xs space-y-0.5 text-sidebar-muted">
                        <div>📞 {rep.phone || '—'}</div>
                        <div>✉️ {rep.email || '—'}</div>
                        <div>📍 {rep.states.join(', ') || '—'}</div>
                        {rep.salesGoal && <div>🎯 R$ {rep.salesGoal.toLocaleString('pt-BR')}</div>}
                        {rep.notes && <div className="italic">💬 {rep.notes}</div>}
                      </div>

                      {/* Regions and Pins list with delete buttons */}
                      <div className="space-y-2 mt-2">
                        {/* Regions */}
                        <div className="space-y-1">
                          <div className="text-xs text-sidebar-muted font-medium">
                            🗺️ {rep.regions.length} região(ões)
                          </div>
                          {rep.regions.length > 0 && (
                            <div className="space-y-0.5">
                              {rep.regions.map((region, idx) => (
                                <div
                                  key={region.id}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-sidebar-accent/50 group"
                                >
                                  <span className="text-xs text-sidebar-muted flex items-center gap-1">
                                    <Map className="h-3 w-3" />
                                    Região {idx + 1}
                                    <span className="opacity-60">({(region.points as any[]).length} pts)</span>
                                  </span>
                                  <button
                                    onClick={() => onDeleteRegion(rep.id, region.id)}
                                    className="text-destructive hover:text-destructive/80 opacity-60 hover:opacity-100 transition-opacity p-0.5"
                                    title="Excluir região"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* City Bounds */}
                        <div className="space-y-1">
                          <div className="text-xs text-sidebar-muted font-medium">
                            🏙️ {(rep.cityBounds || []).length} municípios(s)
                          </div>
                          {(rep.cityBounds || []).length > 0 && (
                            <div className="space-y-0.5">
                              {rep.cityBounds!.map((city) => (
                                <div
                                  key={city.id}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-sidebar-accent/50 group"
                                >
                                  <span className="text-xs text-sidebar-muted flex items-center gap-1 truncate w-40">
                                    <Map className="h-3 w-3 flex-shrink-0" style={{ color: rep.color }} />
                                    <span className="truncate" title={city.name}>{city.name} - {city.state}</span>
                                  </span>
                                  <button
                                    onClick={() => onDeleteCityBound(rep.id, city.id)}
                                    className="text-destructive hover:text-destructive/80 opacity-60 hover:opacity-100 transition-opacity p-0.5"
                                    title="Excluir município"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Pins */}
                        <div className="space-y-1">
                          <div className="text-xs text-sidebar-muted font-medium">
                            📍 {(rep.pins || []).length} pin(s)
                          </div>
                          {(rep.pins || []).length > 0 && (
                            <div className="space-y-0.5">
                              {rep.pins!.map((pin) => (
                                <div
                                  key={pin.id}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-sidebar-accent/50 group"
                                >
                                  <span className="text-xs text-sidebar-muted flex items-center gap-1 truncate w-40">
                                    <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: rep.color }} />
                                    <span className="truncate" title={pin.name}>{pin.name}</span>
                                  </span>
                                  <button
                                    onClick={() => onDeletePin(rep.id, pin.id)}
                                    className="text-destructive hover:text-destructive/80 opacity-60 hover:opacity-100 transition-opacity p-0.5"
                                    title="Excluir pin"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <CityBoundSearch onAddCity={onAddCityBound} />
                      <div className="flex gap-2 mt-3 pt-3 border-t border-sidebar-border/50">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
                          onClick={() => handleOpenEditForm(rep)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        {drawingForId === rep.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary hover:bg-sidebar-accent animate-pulse"
                            onClick={() => onStopDrawing()}
                          >
                            <Map className="h-3 w-3 mr-1" /> Parar Desenho
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
                            onClick={() => onStartDrawing(rep.id)}
                          >
                            <Map className="h-3 w-3 mr-1" /> Desenhar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`Excluir representante "${rep.name}"?`)) {
                              onDelete(rep.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add another representative button at the bottom of the list */}
              <Button
                size="sm"
                variant="ghost"
                className="w-full h-8 text-xs text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent border border-dashed border-sidebar-border mt-2"
                onClick={handleOpenAddForm}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar representante
              </Button>
            </div>
          )}
        </div>

        {/* Legend */}
        <RepresentativeLegend
          representatives={representatives}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        {/* Overlay */}
        <div>
          <button
            onClick={() => setOverlayOpen(!overlayOpen)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted w-full"
          >
            <Layers className="h-3 w-3" />
            Sobreposição de Imagem
            {overlayOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </button>
          {overlayOpen && (
            <div className="mt-2 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleOverlayUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" /> Upload Imagem
              </Button>
              {overlayImage && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sidebar-muted">Opacidade:</span>
                    <Slider
                      value={[overlayOpacity * 100]}
                      onValueChange={v => setOverlayOpacity(v[0] / 100)}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive"
                    onClick={() => setOverlayImage(null)}
                  >
                    Remover imagem
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with JSON import/export */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJson}
          className="hidden"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={handleExportJson}
          >
            <Download className="h-3 w-3 mr-1" /> Exportar JSON
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => jsonInputRef.current?.click()}
          >
            <FileUp className="h-3 w-3 mr-1" /> Importar JSON
          </Button>
        </div>
        <Button
          size="sm"
          variant="default"
          className="w-full text-xs"
          onClick={handleExportHtml}
        >
          <Download className="h-3 w-3 mr-2" /> Baixar HTML Interativo
        </Button>
      </div>

      {/* Form dialog */}
      <RepresentativeForm
        open={formOpen}
        onClose={handleCloseForm}
        initial={editing}
        usedColors={usedColors}
        onSave={data => {
          if (editing) {
            onUpdate(editing.id, data);
          } else {
            onAdd(data);
          }
        }}
      />
    </div>
  );
}
