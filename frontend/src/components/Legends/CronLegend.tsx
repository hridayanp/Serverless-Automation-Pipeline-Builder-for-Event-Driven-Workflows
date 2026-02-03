export default function CronLegend() {
  return (
    <div className="mt-4 p-4 bg-muted rounded-md text-sm text-muted-foreground space-y-3 border">
      <p className="font-semibold text-base mb-1">CRON Format Guide</p>

      <p>
        A CRON expression is a 5-part string that tells the system when to run a
        task. Each part represents a unit of time, separated by spaces:
      </p>

      <div className="grid grid-cols-5 gap-4 font-mono text-center text-xs bg-white rounded-md p-3 border">
        <div>
          <span className="block font-bold text-black mb-1">Minute</span>
          <span>0–59</span>
          <br />
          <span className="text-muted-foreground">
            Which minute (e.g. 0, 15, 30)
          </span>
        </div>
        <div>
          <span className="block font-bold text-black mb-1">Hour</span>
          <span>0–23</span>
          <br />
          <span className="text-muted-foreground">
            Which hour (e.g. 9, 14 for 2pm)
          </span>
        </div>
        <div>
          <span className="block font-bold text-black mb-1">Day(month)</span>
          <span>1–31</span>
          <br />
          <span className="text-muted-foreground">Which day of the month</span>
        </div>
        <div>
          <span className="block font-bold text-black mb-1">Month</span>
          <span>1–12</span>
          <br />
          <span className="text-muted-foreground">
            Which month (e.g. 1 = Jan)
          </span>
        </div>
        <div>
          <span className="block font-bold text-black mb-1">Day(week)</span>
          <span>0–6</span>
          <br />
          <span className="text-muted-foreground">
            0 = Sunday, 6 = Saturday
          </span>
        </div>
      </div>

      <p className="mt-2">
        Use{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded">* (asterisk)</code> to
        mean "every value" for that unit. For example:
      </p>

      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          <code className="bg-gray-100 px-1 py-0.5 rounded">0 * * * *</code> →
          every hour, on the hour
        </li>
        <li>
          <code className="bg-gray-100 px-1 py-0.5 rounded">30 9 * * 1-5</code>{' '}
          → 9:30am, Monday–Friday
        </li>
        <li>
          <code className="bg-gray-100 px-1 py-0.5 rounded">0 0 1 * *</code> →
          midnight on the 1st of every month
        </li>
      </ul>
    </div>
  );
}
