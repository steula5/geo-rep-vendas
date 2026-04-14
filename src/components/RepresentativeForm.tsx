import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Representative, BRAZILIAN_STATES, REPRESENTATIVE_COLORS } from '@/types/representative';
import { Check, Palette } from 'lucide-react';

interface RepresentativeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Representative, 'id' | 'regions'>) => void;
  initial?: Representative | null;
  usedColors?: string[];
}

export default function RepresentativeForm({ open, onClose, onSave, initial, usedColors = [] }: RepresentativeFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [salesGoal, setSalesGoal] = useState('');
  const [color, setColor] = useState(REPRESENTATIVE_COLORS[0]);
  const [customColor, setCustomColor] = useState('');

  // Reset form when dialog opens or initial changes
  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setCode(initial?.code || '');
      setPhone(initial?.phone || '');
      setEmail(initial?.email || '');
      setStates(initial?.states || []);
      setNotes(initial?.notes || '');
      setSalesGoal(initial?.salesGoal?.toString() || '');
      setCustomColor('');
      
      if (initial?.color) {
        setColor(initial.color);
        // If the initial color is not in the palette, set it as custom
        if (!REPRESENTATIVE_COLORS.includes(initial.color)) {
          setCustomColor(initial.color);
        }
      } else {
        // Find first unused color
        const nextColor = REPRESENTATIVE_COLORS.find(c => !usedColors.includes(c)) || REPRESENTATIVE_COLORS[0];
        setColor(nextColor);
      }
    }
  }, [open, initial, usedColors]);

  const toggleState = (s: string) => {
    setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name, code, phone, email, states, notes,
      color: customColor || color,
      salesGoal: salesGoal ? parseFloat(salesGoal) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar' : 'Novo'} Representante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Código / Sigla *</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Palette className="h-4 w-4" />
              Cor do Representante *
            </Label>
            <div className="flex flex-wrap gap-2 items-center">
              {REPRESENTATIVE_COLORS.map(c => {
                const isUsed = usedColors.includes(c) && c !== initial?.color;
                const isSelected = !customColor && color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setCustomColor(''); }}
                    className={`relative w-8 h-8 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                      isSelected
                        ? 'border-foreground scale-110 shadow-md ring-2 ring-offset-2 ring-offset-background'
                        : isUsed
                          ? 'border-transparent opacity-40 cursor-not-allowed'
                          : 'border-transparent hover:scale-105 hover:border-muted-foreground/40'
                    }`}
                    style={{ 
                      backgroundColor: c,
                      ringColor: c,
                    }}
                    disabled={isUsed}
                    title={isUsed ? 'Cor já em uso' : c}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    )}
                    {isUsed && !isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-white/70 rotate-45 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
              
              {/* Custom color input */}
              <div className="flex items-center gap-1.5 ml-1">
                <label
                  className={`relative w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${
                    customColor 
                      ? 'border-foreground scale-110 shadow-md ring-2 ring-offset-2 ring-offset-background' 
                      : 'border-dashed border-muted-foreground/50 hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: customColor || 'transparent' }}
                  title="Escolher cor personalizada"
                >
                  {!customColor && <span className="text-muted-foreground text-xs font-bold">+</span>}
                  {customColor && <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
                  <input
                    type="color"
                    value={customColor || color}
                    onChange={e => {
                      setCustomColor(e.target.value);
                      setColor(e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>
            
            {/* Color preview */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-4 h-4 rounded-sm inline-block border border-border"
                style={{ backgroundColor: customColor || color }}
              />
              <span className="text-xs text-muted-foreground">
                Cor selecionada: <code className="bg-muted px-1 py-0.5 rounded text-xs">{customColor || color}</code>
              </span>
            </div>
          </div>

          <div>
            <Label>Estados atendidos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {BRAZILIAN_STATES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleState(s)}
                  className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                    states.includes(s)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Meta de vendas (R$)</Label>
            <Input type="number" value={salesGoal} onChange={e => setSalesGoal(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
