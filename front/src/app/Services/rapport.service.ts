import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RapportItem {
  reference: string;
  designation: string;
  quantiteStock: number;
  quantiteReelle: number;
  ecart: number;
}

export interface Rapport {
  id: string;
  idInventaire?: number;
  date: string;
  titre: string;
  controleur?: string;
  statut?: string;
  data: RapportItem[];
}

@Injectable({
  providedIn: 'root'
})
export class RapportService {
  private rapportsUrl = `${environment.apiUrl}/inventaires`;

  constructor(private http: HttpClient) {}

  getRapports(): Observable<any[]> {
    return this.http.get<any[]>(this.rapportsUrl);
  }

  getRapportById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.rapportsUrl}/${id}`);
  }
}
