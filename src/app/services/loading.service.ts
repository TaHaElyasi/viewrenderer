import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _pending = new BehaviorSubject<number>(0);
  readonly isLoading$ = this._pending.asObservable();

  begin(): void {
    const v = this._pending.getValue();
    this._pending.next(v + 1);
  }

  end(): void {
    const v = this._pending.getValue();
    this._pending.next(Math.max(0, v - 1));
  }

  reset(): void {
    this._pending.next(0);
  }
}