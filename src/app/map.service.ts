import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor(private http: HttpClient) {}

  fetchCountryGeoJSON(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>('/assets/world-countries.json');
  }
}
