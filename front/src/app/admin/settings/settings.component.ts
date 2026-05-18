import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  darkMode: boolean = false;
  primaryColor: string = '#2563eb';
  animations: boolean = true;
  sidebarCompact: boolean = false;
  language: string = 'fr';

  // Advanced features
  isBackingUp: boolean = false;
  backupProgress: number = 0;
  lastBackup: Date | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Load settings from localStorage
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      this.darkMode = savedDarkMode;
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
      }

      const savedColor = localStorage.getItem('primaryColor');
      if (savedColor) {
        this.primaryColor = savedColor;
        document.documentElement.style.setProperty('--primary-color', this.primaryColor);
      }
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', this.darkMode.toString());
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }

  changePrimaryColor(color: string) {
    this.primaryColor = color;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('primaryColor', color);
      document.documentElement.style.setProperty('--primary-color', color);
    }
  }

  simulateBackup() {
    this.isBackingUp = true;
    this.backupProgress = 0;
    
    const interval = setInterval(() => {
      this.backupProgress += Math.random() * 15;
      if (this.backupProgress >= 100) {
        this.backupProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          this.isBackingUp = false;
          this.lastBackup = new Date();
          alert('Sauvegarde réussie ! Base de données sécurisée.');
        }, 500);
      }
    }, 400);
  }

  resetSettings() {
    this.darkMode = false;
    this.primaryColor = '#2563eb';
    this.animations = true;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('darkMode');
      localStorage.removeItem('primaryColor');
      document.body.classList.remove('dark-mode');
      document.documentElement.style.setProperty('--primary-color', '#2563eb');
      alert('Paramètres réinitialisés !');
    }
  }
}
