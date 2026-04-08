export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toastState = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
    this.toastSubject.next({ message, type });
    // In a real app this would overlay a toast on screen, 
    // for this mockup we just output to console too
    console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
  }
}
