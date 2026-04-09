import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { NotificationService } from '../../Services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  public notificationService = inject(NotificationService);

  showNotifications = false;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.fetchNotificationsForRole('ADMIN').subscribe();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe(() => {
      this.loadNotifications();
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nom} ${user.prenom}` : 'Administrateur';
  }

  getUserInitial(): string {
    const user = this.authService.getCurrentUser();
    return user && user.prenom ? user.prenom.charAt(0).toUpperCase() : 'A';
  }

  getUserPhoto(): string | undefined {
    const user = this.authService.getCurrentUser();
    return user?.photo;
  }

  getNotificationIcon(type?: string): string {
    switch (type) {
      case 'STOCK_ALERT': return 'bi-exclamation-triangle-fill text-warning';
      case 'USER_REGISTRATION': return 'bi-person-plus-fill text-primary';
      case 'DEMANDE_PIECE': return 'bi-clipboard-check-fill text-success';
      case 'AUDIT_REPORT': return 'bi-file-earmark-bar-graph-fill text-info';
      default: return 'bi-info-circle-fill text-info';
    }
  }

  isAuditNotification(n: any): boolean {
    const msg = n.message?.toLowerCase() || '';
    return msg.includes('rapport d\'audit') || n.typeNotification === 'AUDIT_REPORT';
  }

  goToReport(id: number, event: Event): void {
    event.stopPropagation();
    this.markAsRead(id, event);
    this.showNotifications = false;
    this.router.navigate(['/admin/audit']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
