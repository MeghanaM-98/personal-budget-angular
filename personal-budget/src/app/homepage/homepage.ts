// src/app/homepage/homepage.ts
import { Component, OnDestroy, ViewChild, ElementRef, inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Article } from '../article/article';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'pb-homepage',
  standalone: true,
  imports: [Article],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss'
})
export class Homepage implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  dataSource = {
    datasets: [
      {
        data: [] as number[],
        // colors optional
        backgroundColor: ['#ffc65d', '#ff6384', '#36a2eb', '#f6db19', '#9ad0f5', '#ff9f40']
      }
    ],
    labels: [] as string[],
  };

  ngAfterViewInit(): void {
    this.http.get<any>('http://localhost:3000/budget').subscribe({
      next: (res) => {
        const list = res?.myBudget ?? res;
        if (!Array.isArray(list)) {
          console.error('Unexpected /budget payload:', res);
          return;
        }
        for (let i = 0; i < list.length; i++) {
          this.dataSource.datasets[0].data.push(Number(list[i].budget) || 0);
          this.dataSource.labels.push(String(list[i].title ?? ''));
        }
        this.renderChart();
      },
      error: (err) => {
        console.error('GET /budget failed. Is port 3000 running / CORS ok?', err);
      }
    });
  }

  private renderChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;              // SSR guard
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      // try again on next tick (when projected content is in DOM)
      queueMicrotask(() => this.renderChart());
      return;
    }
    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'pie',
      data: this.dataSource,
      options: { responsive: true }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
