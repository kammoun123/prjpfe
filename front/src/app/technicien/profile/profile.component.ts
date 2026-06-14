import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, Profil } from '../../Services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, TitleCasePipe, FormsModule],
    template: `
    <div class="profile-container animate-fade-in">
        <!-- Top Banner / Cover -->
        <div class="profile-banner">
            <div class="banner-overlay"></div>
            <div class="banner-content">
                <button (click)="logout()" class="btn-logout-mini" title="Déconnexion">
                    <i class="bi bi-power"></i>
                </button>
            </div>
        </div>

        <div class="profile-content-wrapper p-4">
            <div class="row g-4 justify-content-center">
                <!-- Left Column: Avatar & Quick Info -->
                <div class="col-xl-4 col-lg-5">
                    <div class="glass-card profile-main-card text-center p-4 h-100">
                        <div class="avatar-section mb-4">
                            <div class="avatar-wrapper shadow-premium">
                                <img *ngIf="profil.photo" [src]="profil.photo" class="profile-img" alt="Profile">
                                <div *ngIf="!profil.photo" class="avatar-initials">
                                    {{ profil.nom.charAt(0) }}{{ profil.prenom.charAt(0) }}
                                </div>
                                <div class="camera-action" (click)="fileInput.click()" title="Changer la photo">
                                    <i class="bi bi-camera-fill"></i>
                                </div>
                            </div>
                            <input #fileInput type="file" class="d-none" accept="image/*" (change)="onFileSelected($event)">
                            <div class="online-indicator"></div>
                        </div>

                        <h2 class="user-name mb-1">{{ profil.prenom }} {{ profil.nom }}</h2>
                        <div class="user-role-badge mb-4">
                            <span class="badge-glass">
                                <i class="bi bi-shield-lock-fill"></i> {{ profil.role | titlecase }} Système
                            </span>
                        </div>

                        <div class="profile-stats-grid">
                            <div class="stat-item">
                                <div class="stat-value">124</div>
                                <div class="stat-label">Actions</div>
                            </div>
                            <div class="stat-divider"></div>
                            <div class="stat-item">
                                <div class="stat-value">92%</div>
                                <div class="stat-label">Performance</div>
                            </div>
                        </div>

                        <div class="mt-4 pt-3 border-top border-light">
                            <button *ngIf="!isEditing" (click)="toggleEdit()" class="btn-premium-action w-100 mb-2">
                                <i class="bi bi-pencil-square me-2"></i> Modifier le Profil
                            </button>
                            <button *ngIf="isEditing" (click)="saveProfile()" class="btn-premium-save w-100 mb-2" [disabled]="isSavingPhoto">
                                <i class="bi bi-check-all me-2"></i> Enregistrer les changements
                            </button>
                            <button *ngIf="isEditing" (click)="cancelEdit()" class="btn-premium-cancel w-100">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Form & Settings -->
                <div class="col-xl-8 col-lg-7">
                    <!-- Account Details -->
                    <div class="glass-card p-4 mb-4">
                        <div class="section-header mb-4">
                            <div class="header-icon bg-indigo-soft"><i class="bi bi-person-lines-fill"></i></div>
                            <div class="header-text">
                                <h5 class="mb-0 fw-bold">Informations Personnelles</h5>
                                <p class="text-muted smaller mb-0">Détails officiels de votre compte collaborateur</p>
                            </div>
                        </div>

                        <div class="row g-4" *ngIf="!isEditing">
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-label">NOM COMPLET</span>
                                    <span class="info-value text-dark-slate">{{ profil.prenom }} {{ profil.nom }}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-label">EMAIL PROFESSIONNEL</span>
                                    <span class="info-value text-primary-indigo">{{ profil.email }}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-label">LOCALISATION</span>
                                    <span class="info-value text-dark-slate">{{ profil.ville || 'Ariana' }}, {{ profil.gouvernorat || 'Tunis' }}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <span class="info-label">TÉLÉPHONE</span>
                                    <span class="info-value text-dark-slate">{{ profil.telephone || 'Non renseigné' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Edit Form with Modern Inputs -->
                        <div class="row g-3" *ngIf="isEditing">
                            <div class="col-md-6">
                                <label class="input-label">Prénom</label>
                                <input type="text" class="modern-input" [(ngModel)]="editData.prenom">
                            </div>
                            <div class="col-md-6">
                                <label class="input-label">Nom</label>
                                <input type="text" class="modern-input" [(ngModel)]="editData.nom">
                            </div>
                            <div class="col-md-12">
                                <label class="input-label">Email</label>
                                <input type="email" class="modern-input" [(ngModel)]="editData.email">
                            </div>
                            <div class="col-md-6">
                                <label class="input-label">Ville</label>
                                <input type="text" class="modern-input" [(ngModel)]="editData.ville">
                            </div>
                            <div class="col-md-6">
                                <label class="input-label">Téléphone</label>
                                <input type="text" class="modern-input" [(ngModel)]="editData.telephone">
                            </div>
                            <div class="col-md-12">
                                <label class="input-label">Nouveau mot de passe</label>
                                <input type="password" class="modern-input" [(ngModel)]="editData.motDePasse" placeholder="••••••••">
                            </div>
                        </div>
                    </div>

                    <!-- Security & Preferences -->
                    <div class="glass-card p-4">
                        <div class="section-header mb-4">
                            <div class="header-icon bg-emerald-soft"><i class="bi bi-shield-check"></i></div>
                            <div class="header-text">
                                <h5 class="mb-0 fw-bold">Sécurité & Préférences</h5>
                                <p class="text-muted smaller mb-0">Paramètres de visibilité et d'alertes</p>
                            </div>
                        </div>

                        <div class="preference-list">
                            <div class="preference-item">
                                <div class="pref-info">
                                    <div class="pref-title">Notifications Email</div>
                                    <div class="pref-desc smaller">Recevoir les alertes de stock critique par mail</div>
                                </div>
                                <div class="form-check form-switch custom-switch-premium">
                                    <input class="form-check-input" type="checkbox" role="switch" [checked]="profil.notificationsEmail" (change)="updateSetting('notificationsEmail', !profil.notificationsEmail)">
                                </div>
                            </div>
                            <div class="preference-item">
                                <div class="pref-info">
                                    <div class="pref-title">Double Authentification</div>
                                    <div class="pref-desc smaller">Sécuriser votre accès avec une validation mobile</div>
                                </div>
                                <div class="form-check form-switch custom-switch-premium">
                                    <input class="form-check-input" type="checkbox" role="switch" disabled>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
    styles: [`
        .profile-container {
            background-color: #f8fafc;
            min-height: 100vh;
        }

        /* Banner Design */
        .profile-banner {
            height: 180px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            position: relative;
            border-bottom-left-radius: 30px;
            border-bottom-right-radius: 30px;
        }
        .banner-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
            opacity: 0.1;
        }
        .banner-content {
            position: relative; padding: 20px; display: flex; justify-content: flex-end;
        }

        .btn-logout-mini {
            width: 40px; height: 40px; border-radius: 12px; border: none;
            background: rgba(255, 255, 255, 0.2); color: white;
            backdrop-filter: blur(10px); transition: all 0.3s;
        }
        .btn-logout-mini:hover { background: #ef4444; transform: scale(1.1); }

        /* Content Wrapper positioning */
        .profile-content-wrapper {
            margin-top: -80px;
            position: relative;
            z-index: 5;
        }

        /* Glass Cards */
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 24px;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease;
        }
        .glass-card:hover { transform: translateY(-5px); }

        /* Avatar Styling */
        .avatar-section { position: relative; margin-top: -60px; }
        .avatar-wrapper {
            width: 140px; height: 140px; border-radius: 35% 65% 63% 37% / 37% 35% 65% 63%;
            background: white; padding: 6px; margin: 0 auto;
            position: relative; transition: all 0.5s ease; overflow: hidden;
            border: 4px solid white;
        }
        .avatar-wrapper:hover { border-radius: 24px; }
        .profile-img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
        .avatar-initials {
            width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #6366f1, #4f46e5); color: white;
            font-size: 3rem; font-weight: 800; border-radius: inherit;
        }
        .camera-action {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); color: white; display: flex; align-items: center;
            justify-content: center; font-size: 1.5rem; opacity: 0; transition: 0.3s; cursor: pointer;
        }
        .avatar-wrapper:hover .camera-action { opacity: 1; }
        .online-indicator {
            position: absolute; bottom: 15px; right: calc(50% - 65px);
            width: 24px; height: 24px; background: #10b981;
            border: 4px solid white; border-radius: 50%;
        }

        /* Stats */
        .profile-stats-grid {
            display: flex; justify-content: center; align-items: center;
            background: #f1f5f9; border-radius: 18px; padding: 15px;
        }
        .stat-item { flex: 1; }
        .stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .stat-divider { width: 1px; height: 30px; background: #cbd5e1; margin: 0 20px; }

        /* Section Header */
        .section-header { display: flex; align-items: center; gap: 15px; }
        .header-icon {
            width: 45px; height: 45px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .bg-indigo-soft { background: #eef2ff; color: #4f46e5; }
        .bg-emerald-soft { background: #ecfdf5; color: #10b981; }

        /* Boxes & Values */
        .info-box {
            padding: 15px; border-radius: 16px; background: #f8fafc;
            border: 1px solid #f1f5f9; display: flex; flex-direction: column;
        }
        .info-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; }
        .info-value { font-weight: 700; font-size: 0.95rem; }
        .text-primary-indigo { color: #4f46e5; }
        .text-dark-slate { color: #1e293b; }

        /* Modern Inputs */
        .input-label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 6px; margin-left: 4px; }
        .modern-input {
            width: 100%; padding: 12px 16px; border-radius: 14px;
            border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 600;
            transition: all 0.3s;
        }
        .modern-input:focus {
            outline: none; border-color: #6366f1; background: white;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        /* Buttons */
        .btn-premium-action {
            background: white; color: #1e293b; border: 1px solid #e2e8f0;
            padding: 12px; border-radius: 14px; font-weight: 700; transition: 0.3s;
        }
        .btn-premium-action:hover { background: #f8fafc; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .btn-premium-save {
            background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border: none;
            padding: 12px; border-radius: 14px; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
            transition: 0.3s;
        }
        .btn-premium-save:hover { transform: translateY(-2px); box-shadow: 0 15px 20px -3px rgba(79, 70, 229, 0.4); }

        .btn-premium-cancel {
            background: transparent; color: #64748b; border: none; padding: 10px; font-weight: 600;
        }

        /* Preferences */
        .preference-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 15px 0; border-bottom: 1px solid #f1f5f9;
        }
        .preference-item:last-child { border-bottom: none; }
        .pref-title { font-weight: 700; color: #1e293b; }
        .pref-desc { color: #94a3b8; }

        .custom-switch-premium .form-check-input { width: 45px; height: 22px; cursor: pointer; }
        .custom-switch-premium .form-check-input:checked { background-color: #10b981; border-color: #10b981; }

        .user-name { font-size: 1.5rem; letter-spacing: -0.5px; color: #1e293b; font-weight: 800; }
        .badge-glass {
            background: #eef2ff; color: #4f46e5; padding: 6px 16px;
            border-radius: 50px; font-size: 0.8rem; font-weight: 700;
        }
    `]
})
export class ProfileComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);

    isEditing = false;
    isSavingPhoto = false;
    editData: any = {};

    profil: Profil = {
        nom: 'Utilisateur',
        prenom: 'Admin',
        email: 'admin@g-pieces.com',
        role: 'admin',
        statut: 'ACTIF',
        departement: 'Administration',
        dateAdhesion: 'Mars 2024',
        notificationsEmail: true,
        modeSombre: false
    };

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        const user = this.authService.getCurrentUser();
        if (user && user.idUtilisateur) {
            this.authService.getProfil(user.idUtilisateur.toString()).subscribe({
                next: (data) => {
                    if (data) {
                        this.profil = data;
                        this.editData = { ...this.profil, motDePasse: '' };
                    }
                },
                error: () => { /* fallback */ }
            });
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.isSavingPhoto = true;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const base64Image = e.target.result;
                this.editData.photo = base64Image;
                this.profil.photo = base64Image; // Preview
                this.isSavingPhoto = false;

                // If not in editing mode, we might want to save immediately or just wait for toggleEdit
                // Let's make it so it enables editing mode automatically for visual feedback
                this.isEditing = true;
            };
            reader.readAsDataURL(file);
        }
    }

    toggleEdit() {
        this.isEditing = true;
        this.editData = { ...this.profil, motDePasse: '' };
    }

    cancelEdit() {
        this.isEditing = false;
        this.loadProfile(); // Reset
    }

    saveProfile() {
        const user = this.authService.getCurrentUser();
        if (user && user.idUtilisateur) {
            const updatePayload = { ...this.editData };
            if (!updatePayload.motDePasse) delete updatePayload.motDePasse;

            this.authService.updateProfil(user.idUtilisateur.toString(), updatePayload).subscribe({
                next: (updated) => {
                    this.profil = updated;
                    this.isEditing = false;
                    this.authService.updateSession(updated);
                },
                error: (err) => {
                    console.error('Error updating profile', err);
                    this.isSavingPhoto = false;
                }
            });
        }
    }

    updateSetting(key: string, value: any) {
        this.profil = { ...this.profil, [key]: value };
        const user = this.authService.getCurrentUser();
        if (user && user.idUtilisateur) {
            this.authService.updateProfil(user.idUtilisateur.toString(), { [key]: value }).subscribe();
        }
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
