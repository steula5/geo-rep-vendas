import { useState, useCallback } from 'react';
import { Search, MapPin, Phone, Mail, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Representative } from '@/types/representative';

interface CitySearchProps {
  onSearch: (lat: number, lng: number) => void;
  findRepresentativeByPoint: (lat: number, lng: number) => Representative | null;
  selectedRepresentative?: Representative | null;
  onAddPin?: (name: string, lat: number, lng: number) => void;
}

interface SearchResult {
  city: string;
  state: string;
  lat: number;
  lng: number;
  representative: Representative | null;
}

export default function CitySearch({ onSearch, findRepresentativeByPoint, selectedRepresentative, onAddPin }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Brasil')}&format=json&limit=1&countrycodes=br`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        const parts = display_name.split(', ');
        const rep = findRepresentativeByPoint(latNum, lngNum);
        setResult({
          city: parts[0] || query,
          state: parts.length > 2 ? parts[parts.length - 3] : '',
          lat: latNum,
          lng: lngNum,
          representative: rep,
        });
        onSearch(latNum, lngNum);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    }
    setLoading(false);
  }, [query, onSearch, findRepresentativeByPoint]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar cidade..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {result && (
        <div className="rounded-lg bg-sidebar-accent p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-sidebar-foreground font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            {result.city}{result.state && `, ${result.state}`}
          </div>
          {result.representative ? (
            <div className="space-y-1 pl-6">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{result.representative.name}</span>
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: result.representative.color }}
                />
              </div>
              <div className="flex items-center gap-2 text-sidebar-muted">
                <Phone className="h-3 w-3" />
                {result.representative.phone}
              </div>
              <div className="flex items-center gap-2 text-sidebar-muted">
                <Mail className="h-3 w-3" />
                {result.representative.email}
              </div>
            </div>
          ) : (
            <p className="pl-6 text-sidebar-muted">Nenhum representante cobre esta região.</p>
          )}

          {selectedRepresentative && onAddPin && (
            <div className="pt-2 mt-2 border-t border-sidebar-border">
              <button
                onClick={() => onAddPin(result.city, result.lat, result.lng)}
                className="w-full py-1.5 px-2 bg-primary/20 text-primary hover:bg-primary/30 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin className="h-3 w-3" />
                Adicionar Pin para {selectedRepresentative.name}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
