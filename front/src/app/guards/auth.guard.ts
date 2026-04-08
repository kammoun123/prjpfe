import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    const expectedRole = route.data['role'];

    if (!expectedRole || user?.role === expectedRole) {
      return true;
    }

    // Role mismatch, redirect to appropriate dashboard
    if (user?.role === 'ADMIN') router.navigate(['/admin']);
    else if (user?.role === 'TECHNICIEN') router.navigate(['/technicien']);
    else if (user?.role === 'CONTROLEUR') router.navigate(['/controleur']);
    else if (user?.role === 'MAGASINIER') router.navigate(['/magasinier']);
    
    return false;
  }

  router.navigate(['/login']);
  return false;
};
