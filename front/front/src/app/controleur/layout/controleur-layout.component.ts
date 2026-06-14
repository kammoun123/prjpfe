import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NotificationService } from '../../Services/notification.service';
import { AuthService } from '../../Services/auth.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-controleur-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './controleur-layout.component.html',
  styleUrl: './controleur-layout.component.css'
})
export class ControleurLayoutComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  showNotifDropdown = false;
  private intervalId: any;

  ngOnInit(): void {
    this.refreshNotifs();
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        if (!this.showNotifDropdown) {
          this.ngZone.run(() => this.refreshNotifs());
        }
      }, 10000);
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  refreshNotifs(): void {
    this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
  }

  toggleNotifDropdown(): void {
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  markAsRead(notif: Notification): void {
    if (notif.idNotification && notif.statut === 'NON_LUE') {
      this.notificationService.markAsRead(notif.idNotification).subscribe(() => this.refreshNotifs());
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => this.refreshNotifs());
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nom} ${user.prenom}` : 'Contrôleur';
  }

  getUserInitial(): string {
    const user = this.authService.getCurrentUser();
    return user && user.prenom ? user.prenom.charAt(0).toUpperCase() : 'C';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
