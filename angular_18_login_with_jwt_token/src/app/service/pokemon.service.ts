import { HttpClient,HttpEventType, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { IPokemon, PaginatedResponsePokemon, UploadResponse } from '../model/pokemon';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  apiUrl: string = 'http://localhost:3000/v1';
  
  constructor(private http: HttpClient) {}

  // In pokemon.service.ts
  getAllPokemon(
    page: number, 
    limit: number, 
    filters: {
      name?: string;
      type1?: string;
      type2?: string;
      legendary?: boolean;
      minSpeed?: number;
      maxSpeed?: number;
      favorites?: boolean;
    }
  ): Observable<PaginatedResponsePokemon<IPokemon>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters.name) params = params.set('name', filters.name);
    if (filters.type1) params = params.set('type1', filters.type1);
    if (filters.type2) params = params.set('type2', filters.type2);
    if (filters.legendary !== null) params = params.set('legendary', filters?.legendary?.toString() || "");
    if (filters.minSpeed) params = params.set('minSpeed', filters.minSpeed.toString());
    if (filters.maxSpeed) params = params.set('maxSpeed', filters.maxSpeed.toString());
    if (filters.favorites) params = params.set('favorites', filters.favorites.toString());
    return this.http.get<PaginatedResponsePokemon<IPokemon>>(`${this.apiUrl}/pokemons`, { params });

  }

  getPokemon(id: string): Observable<IPokemon> {
    return this.http.get<IPokemon>(`${this.apiUrl}/pokemons/${id}`);
  }

  uploadPokemonCSV(file: File): Observable<{progress: number} | UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/pokemons/import`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return { progress };
            }
            return { progress: 0 };
            
          case HttpEventType.Response:
            return event.body as UploadResponse;
            
          default:
            return { progress: 0 };
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid file format or data';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please login again';
          break;
        case 413:
          errorMessage = 'File is too large';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
    }
    
    return throwError(() => errorMessage);
  }


  toggleFavorite(pokemonId: string, action: 'mark' | 'unmark'): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorites/${pokemonId}`, { action })
      .pipe(
        catchError(this.handleError)
      );
  }

}
