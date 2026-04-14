import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CityBound } from '@/types/representative';

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

export function CityBoundSearch({ onAddCity, disabled }: CityBoundSearchProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<CityBound[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all cities once and cache them in memory
    const fetchCities = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
        const data: IBGECity[] = await response.json();
        
        const formattedCities: CityBound[] = data.map(city => ({
          id: city.id.toString(),
          name: city.nome,
          state: city.microrregiao.mesorregiao.UF.sigla,
        })).sort((a, b) => a.name.localeCompare(b.name));
        
        setCities(formattedCities);
      } catch (error) {
        console.error('Failed to load IBGE cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    <div className="w-full flex items-center justify-between gap-2 mt-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
            disabled={disabled || loading}
          >
            {loading ? "Carregando municípios..." : "Adicionar contorno de município..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 z-[11000]">
          <Command>
            <CommandInput placeholder="Buscar município..." className="text-xs" />
            <CommandList>
              <CommandEmpty>Nenhum município encontrado.</CommandEmpty>
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={`${city.name} ${city.state}`}
                    onSelect={() => {
                      onAddCity(city);
                      setOpen(false);
                    }}
                    className="text-xs"
                  >
                    <Map className="mr-2 h-3 w-3 text-muted-foreground" />
                    {city.name} - {city.state}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
