import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiUrl}/notifications`;

    // Global Notification State
    notifications = signal<Notification[]>([]);
    unreadCount = computed(() => this.notifications().filter(n => n.statut === 'NON_LUE').length);

    constructor(private http: HttpClient) { }

    fetchNotificationsForRole(role: string): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl).pipe(
            map(notifs => notifs.filter(n => n.roleCible && n.roleCible.toUpperCase() === role.toUpperCase())),
            tap(filtered => {
                // Sort by newest first natively
                filtered.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
                this.notifications.set(filtered);
            })
        );
    }

    getAllNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl);
    }

    getNotifications(role: string): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl).pipe(
            map(notifications => notifications.filter(n => 
                n.roleCible && n.roleCible.toUpperCase() === role.toUpperCase()
            ))
        );
    }

    markAsRead(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
    }

    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/read-all`, {});
    }

    createNotification(notification: Partial<Notification>): Observable<Notification> {
        return this.http.post<Notification>(this.apiUrl, notification);
    }

    deleteNotification(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
