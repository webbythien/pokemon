import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { Constant } from '../../conststnt';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginObj: any = {
    "email": "",
    "password": ""
  };

  http = inject(HttpClient);
  router = inject(Router);

  encriptData(data: any) {
    return CryptoJS.AES.encrypt(data, Constant.EN_KEY).toString();
  }

  onLogin() {
    if (!this.loginObj.email || !this.loginObj.password) {
      alert("Please enter both email and password");
      return;
    }

    this.http.post("http://localhost:3000/v1/auth/login", this.loginObj).subscribe({
      next: (res: any) => {
        if (res && res.token?.accessToken) {
          const enrUserName = this.encriptData(this.loginObj.email);
          localStorage.setItem("uName", enrUserName);
          localStorage.setItem('angular18Token', res.token.accessToken);
          this.router.navigateByUrl('/pokemon');
          alert("Login Success");
        } else {
          alert("Invalid response from server");
        }
      },
      error: (err) => {
        console.error("Login error:", err);
        alert(err.error?.message || "Login failed!");
      }
    });
  }
}