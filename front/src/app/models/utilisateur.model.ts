export interface Utilisateur {
  idUtilisateur?: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  role: string;
  statut: string;
  ville?: string;
  gouvernorat?: string;
  telephone?: string;
  photo?: string;
}

export interface AuthResponse {
  token: string;
  user: Utilisateur;
}
