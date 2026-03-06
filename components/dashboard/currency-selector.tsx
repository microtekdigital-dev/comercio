"use client"

import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/utils/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string, symbol: string, position: 'before' | 'after') => void;
  disabled?: boolean;
}

export function CurrencySelector({ value, onChange, disabled }: CurrencySelectorProps) {
  const handleChange = (code: string) => {
    const currency = SUPPORTED_CURRENCIES[code as CurrencyCode];
    if (currency) {
      onChange(code, currency.symbol, currency.position);
    }
  };
  
  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar moneda" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">{config.symbol}</span>
              <span>{config.name}</span>
              <span className="text-xs text-muted-foreground">({code})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
