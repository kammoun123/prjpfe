import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // If we're on the server, we MUST return true. 
  // Redirection stays in the browser because the server doesn't have localStorage.
  if (!isPlatformBrowser(platformId)) {
    return true; 
  }

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('currentUser');
  
  // No token? Definitely redirect to login.
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  // If token exists, we are potentially logged in.
  // We try to find the required role for the current route.
  let expectedRole: string | null = null;
  let curr: any = route;
  while (curr) {
    if (curr.data && curr.data['role']) {
      expectedRole = curr.data['role'];
      break;
    }
    curr = curr.parent;
  }

  // If no role is required, but we have a token, we are good.
  if (!expectedRole) {
    return true;
  }

  // If we have a token AND we are already navigating to a path that matches the required role,
  // we SHOULD NOT redirect to login, even if the user object is momentarily null during refresh.
  const path = state.url.toLowerCase();
  const required = expectedRole.toLowerCase();
  
  if (path.includes(required)) {
    return true; // Safety net for refresh on correct branch
  }

  // If we have a user object, we can do a more precise role check.
  if (userJson) {
     try {
       const user = JSON.parse(userJson);
       const userRole = (user.role || '').toLowerCase();
       if (userRole === required) {
         return true;
       }
       
       // Role mismatch: redirect to their own home
       if (userRole === 'admin') return router.createUrlTree(['/admin']);
       if (userRole === 'technicien') return router.createUrlTree(['/technicien']);
       if (userRole === 'controleur') return router.createUrlTree(['/controleur']);
       if (userRole === 'magasinier') return router.createUrlTree(['/magasinier']);
     } catch (e) {
       console.error('AuthGuard: Error parsing user', e);
     }
  }

  // If we got here, we have a token but either the role is wrong or data is missing.
  // On a refresh, we prefer to stay put if possible, but if not, login is the fallback.
  return router.createUrlTree(['/login']);
};
