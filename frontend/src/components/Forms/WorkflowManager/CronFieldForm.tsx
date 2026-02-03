/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useState } from 'react';
import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';
import CronLegend from '@/components/Legends/CronLegend';

type CronFieldFormProps = {
  cron: string;
  cronDetail: string;
  onChangeCron: (value: string) => void;
  onChangeCronDetail: (value: string) => void;
};

export default function CronFieldForm({
  cron,
  cronDetail,
  onChangeCron,
  onChangeCronDetail,
}: CronFieldFormProps) {
  const [fields, setFields] = useState({
    minute: '',
    hour: '',
    day: '',
    month: '',
    weekday: '',
  });
  const [naturalText, setNaturalText] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [error, setError] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const joined = `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`;
    onChangeCron(joined);
  }, [fields]);

  useEffect(() => {
    const tokens = cron.trim().split(/\s+/);
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

      const nextDate = interval.next().toDate();
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
    return {
      minute: isValidCronField(fields.minute),
      hour: isValidCronField(fields.hour),
      day: isValidCronField(fields.day),
      month: isValidCronField(fields.month),
      weekday: isValidCronField(fields.weekday),
    };
  }, [fields]);

  return (
    <div className="border-b pb-6">
      <h2 className="text-md font-semibold mb-4">Scheduler</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Side: CRON Fields */}
        <div className="flex flex-col gap-2">
          <Label>CRON Fields</Label>
          <div className="grid grid-cols-5 gap-2">
            {['minute', 'hour', 'day', 'month', 'weekday'].map((key) => (
              <div key={key} className="flex flex-col items-start">
                <Input
                  placeholder={key}
                  className={`h-10 font-mono ${getClass(
                    partStatus[key as keyof typeof partStatus]
                  )}`}
                  value={fields[key as keyof typeof fields]}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
                <Label
                  className={`text-xs capitalize pt-1 pl-1 ${getClass(
                    partStatus[key as keyof typeof partStatus]
                  )}`}
                >
                  {formatCronFieldLabel(key)}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 space-y-1">
            <div>
              {(naturalText || nextTime) && (
                <div className="flex flex-col gap-2 items-start text-sm text-muted-foreground">
                  {naturalText && <p className="italic">{naturalText}.</p>}
                  {nextTime && <p>{nextTime}</p>}
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="w-[20%]">
              <span
                className="text-blue-600 cursor-pointer underline text-sm pt-1 float-right"
                onClick={() => setShowLegend((prev) => !prev)}
              >
                {showLegend ? 'Hide' : 'Learn More'}
              </span>
            </div>
          </div>

          {showLegend && <CronLegend />}
        </div>

        {/* Right Side: Custom description */}
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
  return /^([*]|\d+|\d+(?:-\d+)?(?:\/\d+)?(?:,\d+)*)$/.test(field.trim());
}

function formatCronFieldLabel(key: string) {
  switch (key) {
    case 'minute':
      return 'Minute';
    case 'hour':
      return 'Hour';
    case 'day':
      return 'Day(month)';
    case 'month':
      return 'Month';
    case 'weekday':
      return 'Day(week)';
    default:
      return key;
  }
}
