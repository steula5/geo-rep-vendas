import { useState, useMemo } from 'react';
import { ChevronsUpDown, Map, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CityBound } from '@/types/representative';
import ibgeCitiesData from '@/data/ibge-cities.json';

interface IBGECity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  };
}

interface CityBoundSearchProps {
  onAddCity: (city: CityBound) => void;
  disabled?: boolean;
}

const ALL_CITIES: CityBound[] = (ibgeCitiesData as any[]).map(city => {
  let state = "";
  if (city.microrregiao?.mesorregiao?.UF?.sigla) {
    state = city.microrregiao.mesorregiao.UF.sigla;
  } else if (city['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla) {
    state = city['regiao-imediata']['regiao-intermediaria'].UF.sigla;
  }

  return {
    id: city.id.toString(),
    name: city.nome,
    state: state,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

export function CityBoundSearch({ onAddCity, disabled }: CityBoundSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    if (search.trim() === "") return [];

    const normalizedSearch = search.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return ALL_CITIES.filter(c => {
      const normalizedName = c.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedName.includes(normalizedSearch) || c.state.toLowerCase().includes(normalizedSearch);
    }).slice(0, 50);
  }, [search]);

  return (
    <div className="w-full flex items-center justify-between gap-2 mt-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
            disabled={disabled}
          >
            Adicionar contorno de município...
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2 z-[11000] flex flex-col gap-2 bg-popover text-popover-foreground">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Digite o nome da cidade..." 
              className="pl-8 text-xs h-9 bg-background"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
            {search.trim() === "" && (
              <div className="text-xs text-center p-3 text-muted-foreground">
                Digite o nome da cidade para buscar...
              </div>
            )}
            
            {search.trim() !== "" && filteredCities.length === 0 && (
              <div className="text-xs text-center p-3 text-muted-foreground">
                Nenhuma cidade encontrada.
              </div>
            )}
            
            {filteredCities.map(city => (
              <div 
                key={city.id}
                className="flex items-center text-xs p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm text-foreground"
                onClick={() => {
                  onAddCity(city);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Map className="h-3 w-3 mr-2 text-muted-foreground" />
                {city.name} - {city.state}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
