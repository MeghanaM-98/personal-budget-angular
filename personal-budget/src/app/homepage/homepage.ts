import {
  Component, OnDestroy, ViewChild, ElementRef, inject, PLATFORM_ID, AfterViewInit
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Article } from '../article/article';
import Chart from 'chart.js/auto';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import * as d3 from 'd3';
import { DataService, BudgetItem } from '../data';

@Component({
  selector: 'pb-homepage',
  standalone: true,
  imports: [Article, Breadcrumbs],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss'
})
export class Homepage implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private dataSvc = inject(DataService);

  // Chart.js canvas
  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  // D3 host div
  @ViewChild('d3Donut', { static: true }) d3Donut?: ElementRef<HTMLDivElement>;
  private ro?: ResizeObserver;

  // We keep a reference only for drawing; the source of truth is DataService.
  private items: BudgetItem[] = [];

  // Chart.js dataset object is built from DataService data
  dataSource = {
    datasets: [
      {
        data: [] as number[],
        backgroundColor: ['#ffc65d', '#ff6384', '#36a2eb', '#f6db19', '#9ad0f5', '#ff9f40']
      }
    ],
    labels: [] as string[],
  };

  ngAfterViewInit(): void {
    this.dataSvc.getBudget$().subscribe({
      next: (list) => {
        this.items = list;

        // Populate Chart.js dataset from service data
        this.dataSource.datasets[0].data = list.map(i => Number(i.budget) || 0);
        this.dataSource.labels = list.map(i => String(i.title ?? ''));

        // Draw both charts
        this.renderChart();
        this.drawDonut();

        // Responsive redraw for D3
        if (isPlatformBrowser(this.platformId) && this.d3Donut?.nativeElement) {
          this.ro?.disconnect();
          this.ro = new ResizeObserver(() => this.drawDonut());
          this.ro.observe(this.d3Donut.nativeElement);
        }
      },
      error: (err) => console.error('GET /budget failed', err)
    });
  }

  // ---- Chart.js pie ----
  private renderChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) { queueMicrotask(() => this.renderChart()); return; }

    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'pie',
      data: this.dataSource,
      options: {
        responsive: true,
        layout: { padding: 0 },
      }
    });
  }

  // ---- D3 donut ----
  private drawDonut(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const host = this.d3Donut?.nativeElement;
    if (!host || !this.items.length) return;

    host.innerHTML = '';

    const innerW = host.clientWidth || 900;
    const innerH = 520;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const width  = innerW + margin.left + margin.right;
    const height = innerH + margin.top + margin.bottom;
    const radius = Math.min(innerW, innerH) / 2;
    const labelOffset = 12;
    const yOffset = -80;

  const svg = d3.select(host)
    .append('svg')
    .attr('width', (innerW + margin.left + margin.right))
    .attr('height', (innerH + margin.top + margin.bottom))
    .append('g')
    // center the donut inside the margins
    .attr('transform', `translate(${margin.left + innerW / 2},${margin.top + innerH / 2 + yOffset})`);

    const gSlices = svg.append('g').attr('class', 'slices');
    const gLines  = svg.append('g').attr('class', 'lines');
    const gLabels = svg.append('g').attr('class', 'labels');

    const pie = d3.pie<BudgetItem>().sort(null).value((d: BudgetItem) => +d.budget);

    const arc = d3.arc<d3.PieArcDatum<BudgetItem>>()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.5);

    const outerArc = d3.arc<d3.PieArcDatum<BudgetItem>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const mid = (d: d3.PieArcDatum<BudgetItem>) =>
      d.startAngle + (d.endAngle - d.startAngle) / 2;

    const color = d3.scaleOrdinal<string>()
      .domain(this.items.map(d => d.title))
      .range((d3.schemeTableau10 as string[]).concat((d3.schemeSet3 as unknown as string[] | undefined) ?? []));

    const dataReady = pie(this.items);

    // slices
    gSlices.selectAll('path.slice')
      .data(dataReady)
      .join('path')
      .attr('class', 'slice')
      .attr('fill', (d: d3.PieArcDatum<BudgetItem>) => color(d.data.title)!)
      .attr('d', arc as any);

    // callout lines
    gLines.selectAll('polyline')
      .data(dataReady)
      .join('polyline')
      .attr('class', 'polyline')
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1.4)
      .attr('opacity', 0.7)
      .attr('points', (d: d3.PieArcDatum<BudgetItem>) => {
        const start = arc.centroid(d) as [number, number];
        const midPt = outerArc.centroid(d) as [number, number];
        const end: [number, number] = [...midPt] as [number, number];
        end[0] = (radius + labelOffset) * (mid(d) < Math.PI ? 1 : -1);
        return [start, midPt, end] as any;
      });

    // labels
    gLabels.selectAll('text')
      .data(dataReady)
      .join('text')
      .attr('class', 'label')
      .attr('dy', '.35em')
      .style('fill', '#333')
      .text((d: d3.PieArcDatum<BudgetItem>) => `${d.data.title} (${d.data.budget})`)
      .attr('transform', (d: d3.PieArcDatum<BudgetItem>) => {
        const pos = outerArc.centroid(d) as [number, number];
        pos[0] = (radius + labelOffset + 6) * (mid(d) < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .style('text-anchor', (d: d3.PieArcDatum<BudgetItem>) => (mid(d) < Math.PI ? 'start' : 'end'));

    // title
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -radius * 0.65)
      .attr('font-weight', 600)
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.ro?.disconnect();
    if (this.d3Donut?.nativeElement) this.d3Donut.nativeElement.innerHTML = '';
  }
}
