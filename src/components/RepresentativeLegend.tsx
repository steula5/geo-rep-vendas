import { Representative } from '@/types/representative';

interface RepresentativeLegendProps {
  representatives: Representative[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function RepresentativeLegend({ representatives, selectedId, onSelect }: RepresentativeLegendProps) {
  if (representatives.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted">Legenda</h3>
      {representatives.map(rep => (
        <button
          key={rep.id}
          onClick={() => onSelect(selectedId === rep.id ? null : rep.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
            selectedId === rep.id ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'
          }`}
        >
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: rep.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-sidebar-foreground">{rep.name}</div>
            <div className="text-xs text-sidebar-muted">
              {rep.states.join(', ')} · {rep.regions.length} região(ões)
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
