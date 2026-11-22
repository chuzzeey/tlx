'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export type ProductActivityPoint = { month: string; products: number };
export type CategoryMixPoint = {
  category: string;
  published: number;
  drafts: number;
  total: number;
};
export type InventoryBandPoint = { band: string; products: number; units: number };
export type RatingPoint = { rating: string; reviews: number };

type DashboardChartsProps = {
  activity: ProductActivityPoint[];
  categories: CategoryMixPoint[];
  publishedProducts: number;
  draftProducts: number;
  inventory: InventoryBandPoint[];
  ratingDistribution: RatingPoint[];
};

function countLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return reducedMotion;
}

function ChartTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: string | number; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className='intel-chart-tooltip'>
      {label !== undefined && <span className='intel-chart-tooltip-label'>{label}</span>}
      {payload.map((item, index) => (
        <p key={`${item.name ?? 'series'}-${index}`}>
          <i style={{ backgroundColor: item.color }} aria-hidden='true' />
          {item.name ?? 'Products'}
          <strong>{item.value ?? 0}</strong>
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  activity,
  categories,
  publishedProducts,
  draftProducts,
  inventory,
  ratingDistribution
}: DashboardChartsProps) {
  const reducedMotion = useReducedMotion();
  const publication = [
    { name: 'Published', value: publishedProducts },
    { name: 'Drafts', value: draftProducts }
  ];

  return (
    <>
      <section className='intel-panel intel-activity-panel' aria-labelledby='product-activity-title'>
        <header className='intel-panel-heading'>
          <div>
            <p className='intel-kicker'>01 <span>/</span> Product activity</p>
            <h2 id='product-activity-title'>A measured build-up</h2>
            <p>Products created in the last six months, from catalog records.</p>
          </div>
          <span className='intel-panel-aside'>Creation date</span>
        </header>
        <div
          className='intel-chart-area'
          role='img'
          aria-label={`Monthly product creation counts for the last six months: ${activity.map((point) => `${point.month}, ${countLabel(point.products, 'product', 'products')}`).join('; ')}`}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={activity} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id='product-activity-fill' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='hsl(var(--chart-1))' stopOpacity={0.28} />
                  <stop offset='92%' stopColor='hsl(var(--chart-1))' stopOpacity={0.015} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke='hsl(var(--border) / .64)' strokeDasharray='3 6' />
              <XAxis
                dataKey='month'
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                width={32}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--chart-1) / .32)', strokeDasharray: '3 4' }}
                content={<ChartTooltip />}
              />
              <Area
                type='monotone'
                dataKey='products'
                name='Products'
                stroke='hsl(var(--chart-1))'
                strokeWidth={2}
                fill='url(#product-activity-fill)'
                activeDot={{ r: 4, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                isAnimationActive={!reducedMotion}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className='intel-panel intel-category-panel' aria-labelledby='category-mix-title'>
        <header className='intel-panel-heading'>
          <div>
            <p className='intel-kicker'>02 <span>/</span> Catalog mix</p>
            <h2 id='category-mix-title'>Where the catalog sits</h2>
            <p>Published and draft products by category.</p>
          </div>
          <span className='intel-panel-aside'>All products</span>
        </header>
        {categories.length ? (
          <div
            className='intel-chart-area intel-category-chart'
            role='img'
            aria-label={`Product counts by category: ${categories.map((item) => `${item.category}, ${item.published} published, ${countLabel(item.drafts, 'draft', 'drafts')}`).join('; ')}`}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={categories} layout='vertical' margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke='hsl(var(--border) / .64)' strokeDasharray='3 6' />
                <XAxis type='number' allowDecimals={false} axisLine={false} tickLine={false} hide />
                <YAxis
                  type='category'
                  dataKey='category'
                  width={94}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip cursor={{ fill: 'hsl(var(--muted) / .36)' }} content={<ChartTooltip />} />
                <Bar dataKey='published' name='Published' stackId='catalog' fill='hsl(var(--chart-1))' radius={[0, 3, 3, 0]} isAnimationActive={!reducedMotion} />
                <Bar dataKey='drafts' name='Drafts' stackId='catalog' fill='hsl(var(--chart-2) / .72)' radius={[0, 3, 3, 0]} isAnimationActive={!reducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className='intel-chart-empty'>Products will appear here as they enter the catalog.</div>
        )}
        <div className='intel-chart-legend'>
          <span><i className='is-published' /> Published</span>
          <span><i className='is-draft' /> Draft</span>
        </div>
      </section>

      <section className='intel-panel intel-inventory-panel' aria-labelledby='inventory-distribution-title'>
        <header className='intel-panel-heading'>
          <div>
            <p className='intel-kicker'>03 <span>/</span> Inventory intelligence</p>
            <h2 id='inventory-distribution-title'>Stock on hand</h2>
            <p>Current product counts grouped by saved stock quantity.</p>
          </div>
          <span className='intel-panel-aside'>Current state</span>
        </header>
        {inventory.some((band) => band.products > 0) ? (
          <div
            className='intel-chart-area intel-inventory-chart'
            role='img'
            aria-label={`Current product counts by stock quantity band: ${inventory.map((item) => `${item.band}, ${countLabel(item.products, 'product', 'products')} and ${countLabel(item.units, 'unit', 'units')}`).join('; ')}`}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={inventory} margin={{ top: 12, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke='hsl(var(--border) / .64)' strokeDasharray='3 6' />
                <XAxis
                  dataKey='band'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  width={32}
                />
                <Tooltip cursor={{ fill: 'hsl(var(--muted) / .36)' }} content={<ChartTooltip />} />
                <Bar dataKey='products' name='Products' fill='hsl(var(--chart-3))' radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion}>
                  {inventory.map((band) => (
                    <Cell
                      key={band.band}
                      fill={band.band === '0 units' ? 'hsl(var(--overview-danger))' : band.band === '1–5 units' ? 'hsl(var(--overview-warning))' : 'hsl(var(--chart-3))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className='intel-chart-empty'>Add products to see the current stock distribution.</div>
        )}
        <p className='intel-panel-footnote'>Counts include drafts; storefront availability is stored separately.</p>
      </section>

      <section className='intel-panel intel-publication-panel' aria-labelledby='publication-balance-title'>
        <header className='intel-panel-heading'>
          <div>
            <p className='intel-kicker'>04 <span>/</span> Publication</p>
            <h2 id='publication-balance-title'>Catalog status</h2>
          </div>
        </header>
        <div className='intel-donut-wrap' role='img' aria-label={`Catalog status: ${publishedProducts} published and ${draftProducts} draft products`}>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie data={publication} dataKey='value' nameKey='name' innerRadius='72%' outerRadius='92%' paddingAngle={3} stroke='none' isAnimationActive={!reducedMotion}>
                <Cell fill='hsl(var(--chart-1))' />
                <Cell fill='hsl(var(--chart-2) / .68)' />
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className='intel-donut-center' aria-hidden='true'>
            <strong>{publishedProducts + draftProducts}</strong>
            <span>products</span>
          </div>
        </div>
        <div className='intel-publication-key'>
          <p><i className='is-published' />Published <strong>{publishedProducts}</strong></p>
          <p><i className='is-draft' />Draft <strong>{draftProducts}</strong></p>
        </div>
      </section>

      <section className='intel-panel intel-ratings-panel' aria-labelledby='review-distribution-title'>
        <header className='intel-panel-heading'>
          <div>
            <p className='intel-kicker'>05 <span>/</span> Customer engagement</p>
            <h2 id='review-distribution-title'>Rating distribution</h2>
            <p>Approved reviews only.</p>
          </div>
        </header>
        {ratingDistribution.some((rating) => rating.reviews > 0) ? (
          <div
            className='intel-chart-area intel-rating-chart'
            role='img'
            aria-label={`Approved customer reviews grouped by star rating: ${ratingDistribution.map((item) => `${item.rating}, ${countLabel(item.reviews, 'review', 'reviews')}`).join('; ')}`}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={ratingDistribution} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke='hsl(var(--border) / .64)' strokeDasharray='3 6' />
                <XAxis dataKey='rating' axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickMargin={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={32} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted) / .36)' }} content={<ChartTooltip />} />
                <Bar dataKey='reviews' name='Reviews' fill='hsl(var(--chart-2))' radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className='intel-chart-empty'>Rating distribution appears after approved reviews are recorded.</div>
        )}
      </section>
    </>
  );
}
