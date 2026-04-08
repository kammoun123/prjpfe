import { Routes } from '@angular/router';
import { TechnicianLayoutComponent } from './technicien/layout/technician-layout.component';
import { TechnicienDashboardComponent } from './technicien/dashboard/technicien-dashboard.component';
import { DemandePieceComponent } from './technicien/demande-piece/demande-piece.component';
import { ProfileComponent } from './technicien/profile/profile.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { CategorieManagementComponent } from './admin/categories/categorie-management.component';
import { ProductManagementComponent } from './admin/products/product-management.component';
import { MouvementManagementComponent } from './admin/stock-movements/mouvement-management.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { ControleurDashboardComponent } from './controleur/controleur-dashboard.component';
import { UserManagementComponent } from './admin/users/user-management.component';
import { MagasinierLayoutComponent } from './magasinier/layout/magasinier-layout.component';
import { MagasinierDashboardComponent } from './magasinier/magasinier-dashboard/magasinier-dashboard.component';
import { ConsultationStockComponent } from './magasinier/consultation-stock/consultation-stock.component';
import { DemandesConsultationComponent } from './magasinier/demandes-consultation/demandes-consultation.component';
import { AuditRapportComponent } from './magasinier/audit-rapport/audit-rapport.component';
import { DemandeAdminComponent } from './magasinier/demande-admin/demande-admin.component';
import { ProfileComponent as MagasinierProfile } from './technicien/profile/profile.component';



import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { AdminDemandesComponent } from './admin/demandes/admin-demandes.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        data: { role: 'ADMIN' },
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'categories', component: CategorieManagementComponent },
            { path: 'products', component: ProductManagementComponent },
            { path: 'mouvements', component: MouvementManagementComponent },
            { path: 'users', component: UserManagementComponent },
            { path: 'demandes', component: AdminDemandesComponent },
            { path: 'profile', component: ProfileComponent }
        ]
    },

    {
        path: 'technicien',
        component: TechnicianLayoutComponent,
        canActivate: [authGuard],
        data: { role: 'TECHNICIEN' },
        children: [
            { path: '', component: TechnicienDashboardComponent },
            { path: 'nouvelle-demande', component: DemandePieceComponent },
            { path: 'profile', component: ProfileComponent }
        ]
    },

    {
        path: 'controleur',
        component: ControleurDashboardComponent,
        canActivate: [authGuard],
        data: { role: 'CONTROLEUR' }
    },
    {
        path: 'magasinier',
        component: MagasinierLayoutComponent,
        canActivate: [authGuard],
        data: { role: 'MAGASINIER' },
        children: [
            { path: '', component: MagasinierDashboardComponent },
            { path: 'stock', component: ConsultationStockComponent },
            { path: 'demandes', component: DemandesConsultationComponent },
            { path: 'audit', component: AuditRapportComponent },
            { path: 'demande-admin', component: DemandeAdminComponent },
            { path: 'profile', component: MagasinierProfile }
        ]
    },


    { path: '', redirectTo: 'login', pathMatch: 'full' }
];


