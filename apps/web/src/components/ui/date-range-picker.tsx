'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  className?: string;
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  placeholder?: string;
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  placeholder = 'Pick a date range',
}: DateRangePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date);

  React.useEffect(() => {
    setInternalDate(date);
  }, [date]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setInternalDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !internalDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, 'LLL dd, y')} -{' '}
                  {format(internalDate.to, 'LLL dd, y')}
                </>
              ) : (
                format(internalDate.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}