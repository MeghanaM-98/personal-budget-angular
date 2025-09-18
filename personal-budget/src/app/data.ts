import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap, finalize } from 'rxjs/operators';

export type BudgetItem = { title: string; budget: number };

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  /** In-memory cache for this app session */
  private cache: BudgetItem[] | null = null;

  /** Tracks an in-flight HTTP request so callers don’t duplicate it */
  private inflight$?: Observable<BudgetItem[]>;

  /** Public API: returns cached data if present, otherwise fetches once. */
  getBudget$(): Observable<BudgetItem[]> {
    if (this.cache) return of(this.cache);         // already cached
    if (this.inflight$) return this.inflight$;     // request already running

    this.inflight$ = this.http.get<any>('http://localhost:3000/budget').pipe(
      map(res =>
        Array.isArray(res?.myBudget) ? (res.myBudget as BudgetItem[]) :
        Array.isArray(res)            ? (res as BudgetItem[])        : []),
      tap(data => (this.cache = data)),            // fill the cache
      finalize(() => (this.inflight$ = undefined)),
      shareReplay(1)
    );

    return this.inflight$;
  }

  /** Optional: clear cache (e.g., after mutating the data elsewhere) */
  clearCache(): void { this.cache = null; }
}
