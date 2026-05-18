import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const darkMode = localStorage.getItem('darkMode') === 'true';
      if (darkMode) {
        document.body.classList.add('dark-mode');
      }

      const primaryColor = localStorage.getItem('primaryColor');
      if (primaryColor) {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
      }
    }
  }
}
