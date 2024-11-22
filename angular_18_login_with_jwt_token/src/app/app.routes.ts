// app.routes.ts
import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PokemonsComponent } from './pages/pokemons/pokemons.component';
import { PokemonDetailComponent } from './pages/pokemon-detail/pokemon-detail.component';
import { SignupComponent } from './pages/signup/signup.component';

// Auth guard function
const authGuard = () => {
    const router = inject(Router);
    const token = localStorage.getItem('angular18Token');
    if (token) {
        return true;
    }
    return router.navigate(['/login']);
};

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'signup',
        component: SignupComponent
    },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'pokemon/:id',
                component: PokemonDetailComponent
            },
            {
                path: 'pokemon',
                component: PokemonsComponent
            },
        ]
    }
];