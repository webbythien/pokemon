import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import * as CryptoJS from 'crypto-js';
import { Constant } from '../../conststnt';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  logiObj: any = {
    "email": "",
    "password": ""
  };

  http= inject(HttpClient);
  router = inject(Router);

  encriptData(data: any) {
    return CryptoJS.AES.encrypt(data,Constant.EN_KEY).toString();
  }

  onLogin() {
    debugger;
    console.log("this.logiObj: ",this.logiObj)
    this.http.post("http://localhost:3000/v1/auth/login",this.logiObj).subscribe((res:any)=>{
      console.log("res: ",res )
      if(res) {
        alert("Login Success");
        console.log("res: ",res)
        const enrUserName =  this.encriptData(this.logiObj.email);
        localStorage.setItem("uName",enrUserName);
        localStorage.setItem('angular18Token',res.accessToken);
        this.router.navigateByUrl('dashboard')
      } else {
        alert(res.message)
      }
    })
  }
}
