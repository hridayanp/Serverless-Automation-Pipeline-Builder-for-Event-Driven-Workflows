'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useState } from 'react';
import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';
import CronLegend from '@/components/Legends/CronLegend';

type CronFormProps = {
  cron: string;
  cronDetail: string;
  onChangeCron: (value: string) => void;
  onChangeCronDetail: (value: string) => void;
};

export default function CronForm({
  cron,
  cronDetail,
  onChangeCron,
  onChangeCronDetail,
}: CronFormProps) {
  const [parts, setParts] = useState<string[]>([]);
  const [naturalText, setNaturalText] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [error, setError] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const tokens = cron.trim().split(/\s+/);
    setParts(tokens);

    if (tokens.length !== 5) {
      setError(
        'CRON must have 5 parts: minute hour day(month) month day(week)'
      );
      setNaturalText('');
      setNextTime('');
      return;
    }

    try {
      const desc = cronstrue.toString(cron, {
        use24HourTimeFormat: true,
        verbose: true,
      });
      setNaturalText(desc);
      setError('');

      const interval = CronExpressionParser.parse(cron, {
        tz: 'Asia/Kolkata',
      });

      const nextDate = interval.next().toDate(); // JS Date in IST
      const istDate = new Date(
        nextDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      );

      const day = String(istDate.getDate()).padStart(2, '0');
      const month = String(istDate.getMonth() + 1).padStart(2, '0');
      const year = istDate.getFullYear();

      const time = istDate.toLocaleTimeString('en-IN', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setNextTime(`Next at ${time} on ${day}-${month}-${year}`);
    } catch {
      setError('Invalid CRON expression');
      setNaturalText('');
      setNextTime('');
    }
  }, [cron]);

  const partStatus = useMemo(() => {
    const [min, hr, day, month, dow] = parts;
    return {
      minute: isValidCronField(min),
      hour: isValidCronField(hr),
      day: isValidCronField(day),
      month: isValidCronField(month),
      weekday: isValidCronField(dow),
    };
  }, [parts]);

  return (
    <div className="border-b pb-6">
      <h2 className="text-md font-semibold mb-4">Scheduler</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* CRON Input */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="cron">CRON Expression</Label>
          <Input
            id="cron"
            placeholder="e.g. 12 2 3 3 3"
            value={cron}
            onChange={(e) => onChangeCron(e.target.value)}
            className="h-10 font-mono"
          />

          {/* Field Highlights */}
          <div className="flex gap-4 text-sm font-medium pt-1 pb-1">
            <span className={getClass(partStatus.minute)}>Minute</span>
            <span className={getClass(partStatus.hour)}>Hour</span>
            <span className={getClass(partStatus.day)}>Day(month)</span>
            <span className={getClass(partStatus.month)}>Month</span>
            <span className={getClass(partStatus.weekday)}>Day(week)</span>

            <span
              className="ml-auto text-blue-600 cursor-pointer underline"
              onClick={() => setShowLegend((prev) => !prev)}
            >
              {showLegend ? 'Hide' : 'Learn More'}
            </span>
          </div>

          {/* Description */}
          {naturalText && (
            <p className="text-sm text-muted-foreground italic pt-2">
              {naturalText}.
            </p>
          )}

          {/* Next Run */}
          {nextTime && (
            <p className="text-sm text-muted-foreground">{nextTime}</p>
          )}

          {/* Error */}
          {error && <p className="text-sm text-red-500 pt-1">{error}</p>}

          {/* CRON Legend */}
          {showLegend && <CronLegend />}
        </div>

        {/* Custom description */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="cron-detail">Custom Description</Label>
          <Input
            id="cron-detail"
            placeholder="e.g. Every weekday at 10pm"
            value={cronDetail}
            onChange={(e) => onChangeCronDetail(e.target.value)}
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
}

function getClass(isValid: boolean) {
  return isValid
    ? 'underline underline-offset-4 text-black'
    : 'underline underline-offset-4 text-red-500';
}

function isValidCronField(field?: string) {
  if (!field) return false;
  return /^(\*|\d+|\d+(?:-\d+)?(?:\/\d+)?(?:,\d+)*)$/.test(field.trim());
}
