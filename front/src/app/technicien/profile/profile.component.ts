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
    <div class="dashboard-advanced animate-fade-in p-3">
        <!-- Modern Header -->
        <div class="mb-5 d-flex justify-content-between align-items-center">
            <div>
                <h1 class="fw-bold text-slate-900 mb-1" style="font-size: 1.85rem; letter-spacing: -0.5px;">Mon Profil</h1>
                <p class="text-slate-500 mb-0 smaller">Gérez vos informations personnelles et vos préférences de compte.</p>
            </div>
            <div class="d-flex gap-2">
                <button *ngIf="!isEditing" class="btn btn-edit-pro" (click)="toggleEdit()">
                    <i class="bi bi-pencil-square me-2"></i> Modifier
                </button>
                <button *ngIf="isEditing" class="btn btn-save-pro" (click)="saveProfile()" [disabled]="isSavingPhoto">
                    <i class="bi bi-check-circle me-2"></i> Enregistrer
                </button>
                <button *ngIf="isEditing" class="btn btn-cancel-pro" (click)="cancelEdit()">
                    Annuler
                </button>
                <button *ngIf="!isEditing" class="btn btn-logout-pro" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i> Déconnexion
                </button>
            </div>
        </div>

        <div class="row g-4">
            <!-- Profile Info Card -->
            <div class="col-lg-4">
                <div class="glass-premium p-4 border-0 shadow-sm text-center bg-white h-100">
                    <div class="position-relative d-inline-block mb-4">
                        <!-- Avatar Display -->
                        <div class="profile-avatar-giant shadow-lg mx-auto overflow-hidden">
                            <img *ngIf="profil.photo" [src]="profil.photo" class="w-100 h-100 object-fit-cover" alt="Profile">
                            <span *ngIf="!profil.photo">{{ profil.nom.charAt(0) }}</span>
                            
                            <!-- Camera Overlay (Edit Mode or Hover) -->
                            <div class="camera-overlay" (click)="fileInput.click()" title="Changer la photo">
                                <i class="bi bi-camera-fill"></i>
                            </div>
                        </div>
                        <input #fileInput type="file" class="d-none" accept="image/*" (change)="onFileSelected($event)">
                        
                        <div class="status-badge-online"></div>
                    </div>
                    <h3 class="fw-bold text-slate-900 mb-1">{{ profil.nom }} {{ profil.prenom }}</h3>
                    <div class="badge bg-primary-soft text-primary px-3 py-2 rounded-pill mb-4 fw-bold smaller">
                        <i class="bi bi-shield-check me-2"></i>{{ profil.role | titlecase }} Système
                    </div>

                    <div class="d-flex justify-content-around border-top pt-4 mt-2">
                        <div class="text-center">
                            <div class="h4 fw-bold text-slate-900 mb-0">124</div>
                            <div class="smaller text-slate-400 fw-bold">ACTIONS</div>
                        </div>
                        <div class="vr opacity-25"></div>
                        <div class="text-center">
                            <div class="h4 fw-bold text-slate-900 mb-0">92%</div>
                            <div class="smaller text-slate-400 fw-bold">SCORE</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Details Card -->
            <div class="col-lg-8">
                <div class="glass-premium p-4 border-0 shadow-sm bg-white mb-4">
                    <h5 class="fw-bold text-slate-900 mb-4 d-flex align-items-center gap-2">
                        <i class="bi bi-person-badge text-primary"></i> 
                        Informations du Compte
                    </h5>
                    
                    <div class="row g-4" *ngIf="!isEditing">
                        <div class="col-md-6">
                            <div class="p-3 rounded-4 bg-light-pro border border-light-subtle">
                                <label class="text-slate-400 smaller fw-bold mb-1 opacity-75">NOM COMPLET</label>
                                <div class="fw-bold text-slate-900">{{ profil.nom }} {{ profil.prenom }}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 rounded-4 bg-light-pro border border-light-subtle">
                                <label class="text-slate-400 smaller fw-bold mb-1 opacity-75">ADRESSE EMAIL</label>
                                <div class="fw-bold text-slate-900 text-truncate">{{ profil.email }}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 rounded-4 bg-light-pro border border-light-subtle">
                                <label class="text-slate-400 smaller fw-bold mb-1 opacity-75">VILLE / GOUVERNORAT</label>
                                <div class="fw-bold text-slate-900">{{ profil.ville || 'Ariana' }} / {{ profil.gouvernorat || 'Tunis' }}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 rounded-4 bg-light-pro border border-light-subtle">
                                <label class="text-slate-400 smaller fw-bold mb-1 opacity-75">TÉLÉPHONE</label>
                                <div class="fw-bold text-slate-900">{{ profil.telephone || 'Non défini' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Edit Form -->
                    <div class="row g-3" *ngIf="isEditing">
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">NOM</label>
                            <input type="text" class="form-control form-control-pro" [(ngModel)]="editData.nom">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">PRÉNOM</label>
                            <input type="text" class="form-control form-control-pro" [(ngModel)]="editData.prenom">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">EMAIL</label>
                            <input type="email" class="form-control form-control-pro" [(ngModel)]="editData.email">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">TÉLÉPHONE</label>
                            <input type="text" class="form-control form-control-pro" [(ngModel)]="editData.telephone">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">VILLE</label>
                            <input type="text" class="form-control form-control-pro" [(ngModel)]="editData.ville">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label smaller fw-bold text-slate-400">GOUVERNORAT</label>
                            <input type="text" class="form-control form-control-pro" [(ngModel)]="editData.gouvernorat">
                        </div>
                        <div class="col-md-12">
                            <label class="form-label smaller fw-bold text-slate-400">NOUVEAU MOT DE PASSE (Optionnel)</label>
                            <input type="password" class="form-control form-control-pro" [(ngModel)]="editData.motDePasse" placeholder="Laissez vide pour conserver l'actuel">
                        </div>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="glass-premium p-4 border-0 shadow-sm bg-white">
                    <h5 class="fw-bold text-slate-900 mb-4 d-flex align-items-center gap-2">
                        <i class="bi bi-gear-fill text-primary"></i> 
                        Préférences & Sécurité
                    </h5>
                    <div class="list-group list-group-flush border-0">
                        <div class="list-group-item border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold text-slate-900">Notifications Système</div>
                                <div class="text-slate-400 smaller fw-bold opacity-75">Alertes critiques et validations</div>
                            </div>
                            <div class="form-check form-switch custom-switch">
                                <input class="form-check-input" type="checkbox" role="switch" [checked]="profil.notificationsEmail" (change)="updateSetting('notificationsEmail', !profil.notificationsEmail)">
                            </div>
                        </div>
                        <div class="list-group-item border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold text-slate-900">Interface Moderne (Glassmorphism)</div>
                                <div class="text-slate-400 smaller fw-bold opacity-75">Activer les effets de transparence</div>
                            </div>
                            <div class="form-check form-switch custom-switch">
                                <input class="form-check-input" type="checkbox" role="switch" checked disabled>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
    styles: [`
    .dashboard-advanced { min-height: 85vh; }
    
    .profile-avatar-giant {
      width: 120px; height: 120px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 3rem; font-weight: 800;
      border-radius: 35px;
      border: 5px solid white;
      position: relative;
    }

    .camera-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 1.5rem;
        opacity: 0; transition: opacity 0.3s; cursor: pointer;
    }
    .profile-avatar-giant:hover .camera-overlay { opacity: 1; }
    
    .status-badge-online {
        position: absolute; bottom: 5px; right: 5px;
        width: 24px; height: 24px;
        background: #10b981; border: 4px solid white;
        border-radius: 50%;
        z-index: 10;
    }

    .bg-primary-soft { background-color: #eef2ff; }
    .text-primary { color: #4f46e5 !important; }
    .bg-light-pro { background-color: #f8fafc; }

    .form-control-pro {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        font-weight: 500;
    }
    .form-control-pro:focus {
        background: white; border-color: #4f46e5;
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }

    .btn-edit-pro {
        background: white; color: #4f46e5;
        border: 1px solid #e2e8f0; border-radius: 50px;
        padding: 0.6rem 1.5rem; font-weight: 700;
        font-size: 0.85rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }
    .btn-edit-pro:hover { background: #f8fafc; transform: translateY(-1px); }

    .btn-save-pro {
        background: #4f46e5; color: white;
        border: none; border-radius: 50px;
        padding: 0.6rem 1.5rem; font-weight: 700;
        font-size: 0.85rem; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
        transition: all 0.2s;
    }
    .btn-save-pro:hover { transform: translateY(-1px); background: #4338ca; }
    .btn-save-pro:disabled { opacity: 0.7; cursor: not-allowed; }

    .btn-cancel-pro {
        background: transparent; color: #94a3b8;
        border: none; border-radius: 50px;
        padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem;
    }

    .btn-logout-pro {
        background: #fef2f2; color: #ef4444; border: none; border-radius: 50px;
        padding: 0.6rem 1.5rem; font-weight: 700; font-size: 0.85rem;
    }

    .custom-switch .form-check-input:checked { background-color: #4f46e5; border-color: #4f46e5; }
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
