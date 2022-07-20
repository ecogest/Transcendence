import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  private readonly authorize_url = 'https://api.intra.42.fr/oauth/authorize';
  private readonly get_client_id_url =
    'http://localhost:3000/auth/oauth42/client_id';
  private client_id = '';
  private readonly frontend_url = 'http://localhost:4200';
  private readonly redirect_uri = encodeURI(
    `${this.frontend_url}/auth/oauth42/callback`,
  );

  constructor(private http: HttpClient) {}

  authorize(state: 'signin' | 'signup') {
    this.http
      .get<{ client_id: string }>(this.get_client_id_url)
      .subscribe((response) => {
        this.client_id = response.client_id;
        window.location.href = `${this.authorize_url}?client_id=${this.client_id}&redirect_uri=${this.redirect_uri}&response_type=code&state=${state}`;
      });
  }
}
