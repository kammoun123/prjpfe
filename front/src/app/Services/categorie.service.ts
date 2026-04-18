import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../models/categorie.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CategorieService {
    private categoriesUrl = `${environment.apiUrl}/categories`;

    constructor(private http: HttpClient) { }

    getCategories(): Observable<Categorie[]> {
        return this.http.get<Categorie[]>(this.categoriesUrl);
    }

    createCategorie(categorie: Categorie): Observable<Categorie> {
        return this.http.post<Categorie>(this.categoriesUrl, categorie);
    }

    deleteCategorie(id: number): Observable<void> {
        return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
    }
}
