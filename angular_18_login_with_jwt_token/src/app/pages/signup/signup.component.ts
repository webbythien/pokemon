import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { Constant } from '../../conststnt';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule  // Added RouterModule to imports
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  signupObj: any = {
    "email": "",
    "password": "",
    "confirmPassword": ""
  };

  http = inject(HttpClient);
  router = inject(Router);

  encriptData(data: any) {
    return CryptoJS.AES.encrypt(data, Constant.EN_KEY).toString();
  }

  onSignup() {
    if(this.signupObj.password !== this.signupObj.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const registerData = {
      email: this.signupObj.email,
      password: this.signupObj.password
    };

    this.http.post("http://localhost:3000/v1/auth/register", registerData).subscribe({
      next: (res: any) => {
        if(res) {
          alert("Registration Successful!");
          this.router.navigateByUrl('/login');
        }
      },
      error: (err) => {
        alert(err.error.message || "Registration failed!");
      }
    });
  }
}