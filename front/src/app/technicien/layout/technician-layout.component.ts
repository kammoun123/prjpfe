import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NotificationService } from '../../Services/notification.service';
import { Notification } from '../../models/notification.model';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-technician-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './technician-layout.component.html',
  styleUrl: './technician-layout.component.css'
})
export class TechnicianLayoutComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  showNotifDropdown = false;
  private intervalId: any;

  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this.refreshNotifs();
    // Refresh every 10 seconds for real-time feel without UI lag
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
         if (!this.showNotifDropdown) {
           this.ngZone.run(() => this.refreshNotifs());
         }
      }, 10000);
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  refreshNotifs(): void {
    this.notificationService.fetchNotificationsForRole('TECHNICIEN').subscribe();
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
    return user ? `${user.nom} ${user.prenom}` : 'Technicien';
  }

  getUserInitial(): string {
    const user = this.authService.getCurrentUser();
    return user && user.prenom ? user.prenom.charAt(0).toUpperCase() : 'T';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
