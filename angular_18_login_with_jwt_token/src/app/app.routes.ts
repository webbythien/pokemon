import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PokemonsComponent } from './pages/pokemons/pokemons.component';
import { PokemonDetailComponent } from './pages/pokemon-detail/pokemon-detail.component';
import { SignupComponent } from './pages/signup/signup.component';

export const routes: Routes = [
    {
        path:'',
        redirectTo: 'login',
        pathMatch:'full'
    },
    {
        path:'login',
        component:LoginComponent
    },
    { path: 'signup', component: SignupComponent },
    {
        path:'',
        component:LayoutComponent,
        children: [
            {
                path:'dashboard',
                component:DashboardComponent
            },
            {
                path:'pokemon/:id',
                component:PokemonDetailComponent
            },
            {
                path:'pokemon',
                component:PokemonsComponent
            },
        ]
    }
];
