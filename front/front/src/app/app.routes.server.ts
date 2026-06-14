import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'technicien',
    renderMode: RenderMode.Client
  },
  {
    path: 'technicien/**',
    renderMode: RenderMode.Client
  },

  {
    path: 'controleur',
    renderMode: RenderMode.Client
  },
  {
    path: 'controleur/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
