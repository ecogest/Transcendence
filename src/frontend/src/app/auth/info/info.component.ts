import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AvatarService } from 'src/app/avatar/avatar.service';
import { environment } from 'src/environments/environment';
import { JwtService, JwtUser } from '../jwt';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
})
export class InfoComponent implements OnInit {
  user?: JwtUser;
  is_valid = false;
  expiration = '';
  backend_messagee = '';
  users: string[] = [];

  constructor(
    private jwt: JwtService,
    public avatar: AvatarService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.user = this.jwt.user;
    this.is_valid = this.jwt.isValid();
    this.expiration = this.jwt.expirationString();
    this.jwt
      .testToken()
      .then((status) => (this.backend_messagee = status.message));
    // this.jwt.logPayload();
    this.http
      .get<string[]>(`${environment.backend}/users`)
      .subscribe((users) => (this.users = users));
  }
}
