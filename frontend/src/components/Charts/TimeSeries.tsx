'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

type GraphType = 'line' | 'bar' | 'area';

interface TimeSeriesProps {
  title?: string;
  graphType?: GraphType;
  data: { timestamp: number; value: number }[];
}

export const TimeSeries: React.FC<TimeSeriesProps> = ({
  title = 'Time Series Chart',
  graphType = 'line',
  data,
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const xAxis = (
      <XAxis
        dataKey="timestamp"
        tickFormatter={(ts) => format(new Date(ts * 1000), 'MMM d HH:mm')}
      />
    );

    const yAxis = <YAxis />;
    const tooltip = (
      <Tooltip
        labelFormatter={(ts) => format(new Date(Number(ts) * 1000), 'PPpp')}
      />
    );

    const grid = <CartesianGrid strokeDasharray="3 3" />;

    switch (graphType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {xAxis}
            {yAxis}
            {tooltip}
            {grid}
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {xAxis}
            {yAxis}
            {tooltip}
            {grid}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              fill="#d1fae5"
            />
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            {xAxis}
            {yAxis}
            {tooltip}
            {grid}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
