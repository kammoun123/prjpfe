import { Component, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { NotificationService } from '../../Services/notification.service';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-magasinier-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="g-pieces-layout-dark">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo-area">
          <div class="logo-box">
             <i class="bi bi-box-seam-fill"></i>
          </div>
          <div class="logo-text">
            <span class="brand-name">G-PIÈCES</span>
            <span class="brand-sub">ESPACE MAGASINIER</span>
          </div>
        </div>

        <nav class="navigation">
          <div class="nav-section">
            <h5 class="section-title">VUE D'ENSEMBLE</h5>
            <a routerLink="/magasinier" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <i class="bi bi-grid-1x2"></i> <span>Tableau de bord</span>
            </a>
            <a routerLink="/magasinier/stock" routerLinkActive="active" class="nav-link">
              <i class="bi bi-search"></i> <span>Consultation Stock</span>
            </a>
            <a routerLink="/magasinier/audit" routerLinkActive="active" class="nav-link">
              <i class="bi bi-file-earmark-text"></i> <span>Rapports d'Audit</span>
            </a>
          </div>

          <div class="nav-section">
            <h5 class="section-title">RÉAPPRO & DEMANDES</h5>
            <a routerLink="/magasinier/demande-admin" routerLinkActive="active" class="nav-link">
              <i class="bi bi-send"></i> <span>Demande à l'Admin</span>
            </a>
            <a routerLink="/magasinier/demandes" routerLinkActive="active" class="nav-link">
              <i class="bi bi-people"></i> <span>Demandes Techniciens</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile-box">
            <div class="profile-avatar">M</div>
            <div class="profile-info">
              <span class="p-name">{{ getUserName() | uppercase }}</span>
              <span class="p-status"><span class="status-dot"></span> En ligne</span>
            </div>
            <button (click)="logout()" class="logout-link">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Container -->
      <div class="main-wrapper">
        <header class="top-bar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Rechercher une action ou une référence...">
          </div>

          <div class="top-actions">
            <!-- NOTIFICATIONS DROPDOWN -->
            <div class="action-btn notif-container" (click)="toggleNotifs()">
               <i class="bi bi-bell"></i>
               <span class="notif-dot" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
               
               <!-- Dropdown Menu -->
               <div class="notif-dropdown" *ngIf="showNotifs" (click)="$event.stopPropagation()">
                 <div class="nd-header">
                   <h4>Notifications</h4>
                   <button class="nd-mark-all" (click)="markAllRead()">Tout marquer comme lu</button>
                 </div>
                 <div class="nd-body">
                   <div class="nd-empty" *ngIf="notifications().length === 0">
                      Aucune notification
                   </div>
                   <div class="nd-item" *ngFor="let n of notifications()" [class.unread]="n.statut === 'NON_LUE'" (click)="markAsRead(n)">
                      <div class="ndi-icon" [ngClass]="getNotifIconClass(n.typeNotification)">
                         <i [class]="getNotifIcon(n.typeNotification)"></i>
                      </div>
                      <div class="ndi-content">
                         <p class="ndi-msg">{{ n.message }}</p>
                         <div class="ndi-footer">
                            <span class="ndi-time">{{ n.dateCreation | date:'MMM d, HH:mm' }}</span>
                            <button *ngIf="isAuditNotification(n)" 
                                    class="btn-notif-action" 
                                    (click)="goToReport(n.idNotification!, $event)">
                               Voir Rapport
                            </button>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
            </div>

            <div class="action-btn">
               <i class="bi bi-question-circle"></i>
            </div>
            <div class="user-initial-circle">K</div>
            <button class="btn-gestion-pro">
              <i class="bi bi-gear-fill"></i>
              <span>Gestion Pro</span>
            </button>
          </div>
        </header>

        <main class="page-content">
           <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --sidebar-w: 240px;
      --topbar-h: 64px;
      --bg-main: #f4f7fb;
      --sidebar-dark: #1e293b; /* Slate Dark Navy from mockup */
      --active-blue: #3b82f6;
      --text-gray: #94a3b8;
    }

    .g-pieces-layout-dark {
      display: flex;
      height: 100vh;
      background: var(--bg-main);
      font-family: 'Inter', sans-serif;
    }

    /* Sidebar - Dark theme */
    .sidebar {
      width: var(--sidebar-w);
      background: var(--sidebar-dark);
      display: flex;
      flex-direction: column;
      height: 100vh;
      z-index: 1000;
      color: white;
    }

    .logo-area {
      padding: 32px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-box {
      width: 36px;
      height: 36px;
      background: white;
      color: var(--sidebar-dark);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .logo-text { display: flex; flex-direction: column; }
    .brand-name { font-weight: 800; font-size: 1rem; color: white; letter-spacing: 1px; }
    .brand-sub { font-size: 0.6rem; color: #94a3b8; font-weight: 700; letter-spacing: 1px; }

    .navigation { flex: 1; padding: 0 16px; margin-top: 20px; }
    .nav-section { margin-bottom: 32px; }
    .section-title { 
      font-size: 0.65rem; font-weight: 700; color: #64748b; 
      padding: 0 16px 12px; letter-spacing: 1px; margin: 0;
    }

    .nav-link {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 16px; border-radius: 10px;
      color: #94a3b8; text-decoration: none;
      font-size: 0.85rem; font-weight: 500;
      transition: all 0.2s; margin-bottom: 4px;
    }

    .nav-link i { font-size: 1.1rem; }
    .nav-link:hover { color: white; background: rgba(255, 255, 255, 0.05); }

    .nav-link.active {
      background: #334155; /* Slightly lighter slate for active item */
      color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .nav-link.active i { color: #3b82f6; }

    .sidebar-footer { padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .user-profile-box {
      background: rgba(255, 255, 255, 0.03); border-radius: 12px;
      padding: 12px;
      display: flex; align-items: center; gap: 12px;
    }
    .profile-avatar {
      width: 32px; height: 32px; background: #334155;
      color: #94a3b8; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.8rem;
    }
    .profile-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .p-name { font-size: 0.75rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .p-status { font-size: 0.65rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
    .status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
    .logout-link { background: transparent; border: none; color: #ef4444; padding: 4px; cursor: pointer; }

    /* Top Bar */
    .main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    
    .top-bar {
      height: var(--topbar-h); background: white;
      padding: 0 40px; border-bottom: 1px solid #eef2f6;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }

    .search-box {
      display: flex; align-items: center; gap: 12px;
      background: #f1f5f9; border-radius: 40px;
      padding: 10px 20px; width: 360px;
    }
    .search-box i { color: #94a3b8; font-size: 0.9rem; }
    .search-box input { border: none; background: transparent; outline: none; font-size: 0.85rem; width: 100%; }

    .top-actions { display: flex; align-items: center; gap: 16px; position: relative; }
    .notif-container { position: relative; }
    .action-btn { position: relative; color: #64748b; font-size: 1.2rem; cursor: pointer; }
    .notif-dot { 
       position: absolute; top: -6px; right: -6px; min-width: 16px; height: 16px; 
       background: #ef4444; border-radius: 50%; border: 1.5px solid white; 
       color: white; font-size: 0.6rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
       padding: 0 4px;
    }

    /* Notification Dropdown Style */
    .notif-dropdown {
       position: absolute; top: 32px; right: -8px; width: 340px; background: white;
       border-radius: 16px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);
       border: 1px solid #f1f5f9; z-index: 9999; cursor: default;
       animation: slideDown 0.2s ease-out; overflow: hidden;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .nd-header { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    .nd-header h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
    .nd-mark-all { background: none; border: none; font-size: 0.7rem; font-weight: 700; color: #3b82f6; cursor: pointer; }
    .nd-mark-all:hover { text-decoration: underline; }
    .nd-body { max-height: 400px; overflow-y: auto; }
    .nd-empty { padding: 40px 20px; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 500; font-style: italic; }
    .nd-item { display: flex; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #f8fafc; cursor: pointer; transition: 0.2s; background: white; }
    .nd-item:hover { background: #f8fafc; }
    .nd-item.unread { background: #f0fdf4; border-left: 3px solid #22c55e; }
    .ndi-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; color: white; }
    .ic-info { background: #3b82f6; } .ic-success { background: #22c55e; } .ic-alert { background: #ef4444; } .ic-warning { background: #f59e0b; }
    .ndi-content { flex: 1; }
    .ndi-msg { margin: 0 0 6px 0; font-size: 0.85rem; color: #1e293b; font-weight: 600; line-height: 1.4; }
    .ndi-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .ndi-time { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }
    .btn-notif-action {
       background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe;
       font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 4px;
       cursor: pointer; transition: 0.2s;
    }
    .btn-notif-action:hover { background: #3b82f6; color: white; }
    
    .user-initial-circle {
      width: 34px; height: 34px; background: #3b82f6; color: white;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }

    .btn-gestion-pro {
      background: #3b82f6; color: white; border: none;
      padding: 10px 20px; border-radius: 10px;
      font-weight: 700; font-size: 0.85rem;
      display: flex; align-items: center; gap: 8px;
    }

    .page-content { flex: 1; overflow-y: auto; background: var(--bg-main); }
  `]
})
export class MagasinierLayoutComponent {
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private router = inject(Router);

  notifications = this.notifService.notifications;
  unreadCount = this.notifService.unreadCount;
  showNotifs = false;
  private intervalId: any;

  private ngZone = inject(NgZone);

  ngOnInit() {
    this.refreshNotifs();
    // Poll every 10 seconds for real-time feel, outside Angular zone to prevent UI lag
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
         if (!this.showNotifs) {
           this.ngZone.run(() => this.refreshNotifs());
         }
      }, 10000);
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  refreshNotifs() {
    this.notifService.fetchNotificationsForRole('MAGASINIER').subscribe();
  }

  toggleNotifs() {
    this.showNotifs = !this.showNotifs;
  }

  markAsRead(n: Notification) {
    if (n.statut === 'NON_LUE' && n.idNotification) {
      this.notifService.markAsRead(n.idNotification).subscribe(() => this.refreshNotifs());
    }
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe(() => this.refreshNotifs());
  }

  isAuditNotification(n: any): boolean {
    return n.message?.toLowerCase().includes('audit') || n.typeNotification === 'AUDIT_REPORT';
  }

  goToReport(id: number, event: Event) {
    event.stopPropagation();
    if (id) {
      this.notifService.markAsRead(id).subscribe(() => this.refreshNotifs());
    }
    this.showNotifs = false;
    this.router.navigate(['/magasinier/audit']);
  }

  getNotifIcon(type: string): string {
    if (type === 'alerte') return 'bi-exclamation-triangle-fill';
    if (type === 'success') return 'bi-check-circle-fill';
    if (type === 'warning') return 'bi-exclamation-circle-fill';
    return 'bi-info-circle-fill';
  }

  getNotifIconClass(type: string): string {
    if (type === 'alerte') return 'ic-alert';
    if (type === 'success') return 'ic-success';
    if (type === 'warning') return 'ic-warning';
    return 'ic-info';
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.prenom} ${user.nom}` : 'KAMMOUN KHALIL';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
