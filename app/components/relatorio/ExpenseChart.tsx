'use client';

import { DonutChart, Card, Title, Legend } from '@tremor/react';

interface ExpenseChartProps {
  data: {
    category: string;
    total: number;
  }[];
}

const valueFormatter = (number: number) =>
  `€${new Intl.NumberFormat('pt-PT').format(number).toString()}`;

export function ExpenseChart({ data }: ExpenseChartProps) {
  // We need to transform the data to fit the DonutChart's expected format
  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total,
  }));

  return (
    <Card className="flex flex-col">
      <Title>Despesas por Categoria</Title>
      <DonutChart
        className="mt-6"
        data={chartData}
        category="value"
        index="name"
        valueFormatter={valueFormatter}
        colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
      />
      <Legend
        className="mt-3"
        categories={chartData.map(item => item.name)}
        colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
      />
    </Card>
  );
}
