import { Component, effect, ElementRef, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { PokemonService } from '../../service/pokemon.service';
import { IPokemon, PaginatedResponsePokemon } from '../../model/pokemon';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject, Subscription } from 'rxjs';
import { PokemonSliderComponent } from '../pokemon-slider/pokemon-slider.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokemons',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PokemonSliderComponent],
  templateUrl: './pokemons.component.html',
  styleUrl: './pokemons.component.css'
})
export class PokemonsComponent implements OnInit {
  @ViewChild('newModal') modal: ElementRef | undefined;
  @ViewChild('fileInput') fileInput: ElementRef | undefined;
  router = inject(Router);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);

  protected createArray(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  protected getMath(): typeof Math {
    return Math;
  }

  pokemonSrv = inject(PokemonService);
  pokemonList = signal<IPokemon[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  itemsPerPage = signal(20);
  pageSizeOptions = [20, 10, 50, 100];


  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  isUploading = signal(false);
  error = signal<string | null>(null);
  showSuccess = signal(false);

  searchForm: FormGroup;
  private searchSubject = new Subject<string>();
  pokemonTypes = [
    'Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting',
    'Fire', 'Flying', 'Ghost', 'Grass', 'Ground', 'Ice',
    'Normal', 'Poison', 'Psychic', 'Rock', 'Steel', 'Water'
  ];
  private formSubscription: Subscription | undefined;

  constructor() {
    this.searchForm = this.fb.group({
      name: [''],
      type1: [''],
      type2: [''],
      legendary: [''],
      minSpeed: [''],
      maxSpeed: [''],
      favorites: [false] 
    });

    // Subscribe to form changes with URL update
    this.formSubscription = this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(1);
      this.updateUrlParams();
      this.loadPokemons();
    });
  }
  
  togglingFavorites = signal<Set<string>>(new Set());
  notification = signal<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  navigateToDetail(id: string) {
    this.router.navigate(['/pokemon', id]);
  }

  isTogglingFavorite(id: string): boolean {
    return this.togglingFavorites().has(id);
  }

  async toggleFavorite(pokemon: IPokemon) {
    const newSet = new Set(this.togglingFavorites());
    newSet.add(pokemon._id);
    this.togglingFavorites.set(newSet);

    try {
      const action = pokemon.is_favorite ? 'unmark' : 'mark';
      await firstValueFrom(this.pokemonSrv.toggleFavorite(pokemon._id, action));
      
      // Update the local state
      const updatedList = this.pokemonList().map(p => {
        if (p._id === pokemon._id) {
          return { ...p, is_favorite: !p.is_favorite };
        }
        return p;
      });
      this.pokemonList.set(updatedList);

      this.showNotification({
        type: 'success',
        title: 'Success',
        message: `${pokemon.name} ${action === 'mark' ? 'added to' : 'removed from'} favorites`
      });
    } catch (error) {
      this.showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update favorite status'
      });
    } finally {
      const newSet = new Set(this.togglingFavorites());
      newSet.delete(pokemon._id);
      this.togglingFavorites.set(newSet);
    }
  }

  showNotification(notification: { type: 'success' | 'error'; title: string; message: string }) {
    this.notification.set(notification);
    setTimeout(() => this.clearNotification(), 3000);
  }

  clearNotification() {
    this.notification.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
      this.error.set(null);
      this.uploadProgress.set(0);
    }
  }


  uploadFile() {
    if (!this.selectedFile()) return;

    this.isUploading.set(true);
    this.error.set(null);
    this.uploadProgress.set(0);

    this.pokemonSrv.uploadPokemonCSV(this.selectedFile()!)
      .subscribe({
        next: (response) => {
          if ('progress' in response) {
            this.uploadProgress.set(response.progress);
          } else {
            // Upload completed successfully
            this.showSuccess.set(true);
            setTimeout(() => this.showSuccess.set(false), 3000);
            this.resetUploadState();
            this.closeModal();
            this.loadPokemons();
          }
        },
        error: (error: string) => {
          this.error.set(error);
          this.isUploading.set(false);
          
          if (error === 'Unauthorized. Please login again') {
            // Handle unauthorized error - e.g., redirect to login
            localStorage.removeItem('angular18Token');
            // this.router.navigate(['/login']);
          }
        }
      });
  }

  ngOnInit(): void {
    // Subscribe to route params and query params
    this.route.queryParams.subscribe(params => {
      // Update form values from URL params
      this.searchForm.patchValue({
        name: params['name'] || '',
        type1: params['type1'] || '',
        type2: params['type2'] || '',
        legendary: params['legendary'] || '',
        minSpeed: params['minSpeed'] || '',
        maxSpeed: params['maxSpeed'] || ''
      }, { emitEvent: false });

      // Update pagination from URL params
      this.currentPage.set(Number(params['page']) || 1);
      this.itemsPerPage.set(Number(params['pageSize']) || 20);

      this.loadPokemons();
    });
  }

  updateUrlParams() {
    const queryParams: any = {
      page: this.currentPage(),
      pageSize: this.itemsPerPage()
    };

    // Add filter params if they have values
    const formValues = this.searchForm.value;
    Object.keys(formValues).forEach(key => {
      if (formValues[key]) {
        queryParams[key] = formValues[key];
      }
    });

    // Update URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
  onPageSizeChange(event: Event) {
    const newSize = Number((event.target as HTMLSelectElement).value);
    this.itemsPerPage.set(newSize);
    this.currentPage.set(1); // Reset to first page when changing page size
    this.updateUrlParams();
    this.loadPokemons();
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  loadPokemons() {
    const filters = this.searchForm.value;
    
    const validFilters = {
      name: filters.name || '',
      type1: filters.type1 || '',
      type2: filters.type2 || '',
      legendary: filters.legendary === '' ? null : filters.legendary,
      minSpeed: filters.minSpeed || null,
      maxSpeed: filters.maxSpeed || null,
      favorites: filters.favorites || false // Add favorites filter
    };

    this.pokemonSrv.getAllPokemon(
      this.currentPage(), 
      this.itemsPerPage(),
      validFilters
    ).subscribe((response) => {
      this.pokemonList.set(response.results);
      this.totalPages.set(response.pagination.pages);
    });
  }

  resetFilters() {
    this.searchForm.reset({
      name: '',
      type1: '',
      type2: '',
      legendary: '',
      minSpeed: '',
      maxSpeed: '',
      favorites: false
    });
    this.loadPokemons();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.updateUrlParams();
      this.loadPokemons();
    }
  }

  resetUploadState() {
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.isUploading.set(false);
    this.error.set(null);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.nativeElement.style.display = 'block';
    }
  }

  closeModal() {
    if (this.isUploading()) return;
    if (this.modal) {
      this.modal.nativeElement.style.display = 'none';
      this.resetUploadState();
    }
  }

getPokemonTypeIcon = (type: string): string => {
    const typeIcons: { [key: string]: string } = {
      dark: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx06-5b31bdc5-e822-4f80-8d88-af30c132d4fb.png/v1/fill/w_894,h_894/dark_energy_card_vector_symbol_by_biochao_dezrx06-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OSIsInBhdGgiOiJcL2ZcLzc3YmYzYmE5LTBhYWMtNDQ1Mi1iZTgyLWRlNTM2YjVhYWIzMlwvZGV6cngwNi01YjMxYmRjNS1lODIyLTRmODAtOGQ4OC1hZjMwYzEzMmQ0ZmIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.FG7xj8hrU1BZ0GrNftMJa0TJy0Qs9xteH1GT-lQ36Sc",
      dragon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl4n-1942f6ac-3f08-4dbb-a761-a722f791bc37.png/v1/fill/w_894,h_894/dragon_type_symbol_galar_by_jormxdos_dffvl4n-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcL2U4ZGRjNGRhLTIzZGQtNDUwMi1iNjViLTM3OGM5Y2ZlNWVmYVwvZGZmdmw0bi0xOTQyZjZhYy0zZjA4LTRkYmItYTc2MS1hNzIyZjc5MWJjMzcucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.Q9B0RKlPeJSmVIrfZq75vfmVscHZ50jPWPViMQp68kc",
      grass: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx3b-faf247b4-bbcf-4a1d-bba4-47236408df42.png/v1/fill/w_1280,h_1278/grass_energy_card_vector_symbol_by_biochao_dezrx3b-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiJcL2ZcLzc3YmYzYmE5LTBhYWMtNDQ1Mi1iZTgyLWRlNTM2YjVhYWIzMlwvZGV6cngzYi1mYWYyNDdiNC1iYmNmLTRhMWQtYmJhNC00NzIzNjQwOGRmNDIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.oOHbZYJsNszy_P66CbLaiuRVY8kFzjJvvxQ0tZkF3BM",
      fighting: "https://www.giantbomb.com/a/uploads/scale_medium/16/164924/3129073-3687239775-tumbl.png",
      fairy: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pok%C3%A9mon_Fairy_Type_Icon.svg/1024px-Pok%C3%A9mon_Fairy_Type_Icon.svg.png",
      fire: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx2m-6a187f20-c54f-443c-abb5-6304a14d1d39.png/v1/fill/w_1280,h_1278/fire_energy_card_vector_symbol_by_biochao_dezrx2m-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiJcL2ZcLzc3YmYzYmE5LTBhYWMtNDQ1Mi1iZTgyLWRlNTM2YjVhYWIzMlwvZGV6cngybS02YTE4N2YyMC1jNTRmLTQ0M2MtYWJiNS02MzA0YTE0ZDFkMzkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.MrtaX3vm446Kd5jU02FfLdjMSyXljqW0ahnU8jEo0aE",
      bug: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl73-294f6e5b-aad2-484f-bde8-1ecf082f1dfe.png/v1/fill/w_1280,h_1280/bug_type_symbol_galar_by_jormxdos_dffvl73-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcL2U4ZGRjNGRhLTIzZGQtNDUwMi1iNjViLTM3OGM5Y2ZlNWVmYVwvZGZmdmw3My0yOTRmNmU1Yi1hYWQyLTQ4NGYtYmRlOC0xZWNmMDgyZjFkZmUucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.msN6ZkYf5XuPiA27qO-1Zaow3B4iSRqp3nAHzctfBW0",
      flying: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl6n-4e403272-f641-4ec0-a451-49061d40aef6.png/v1/fill/w_1280,h_1280/flying_type_symbol_galar_by_jormxdos_dffvl6n-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcL2U4ZGRjNGRhLTIzZGQtNDUwMi1iNjViLTM3OGM5Y2ZlNWVmYVwvZGZmdmw2bi00ZTQwMzI3Mi1mNjQxLTRlYzAtYTQ1MS00OTA2MWQ0MGFlZjYucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.xTE63SRI89iYddks3zDYryz4UkqEFOCAOH5_feLbQHs",
      poison: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png",
      rock: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Pok%C3%A9mon_Rock_Type_Icon.svg/800px-Pok%C3%A9mon_Rock_Type_Icon.svg.png",
      electric: "https://i.pinimg.com/originals/3c/dd/17/3cdd17306e51b9ff6c0264241e3e4c4c.png",
      ghost: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxVH22RDli4DHPKX6Ufc90vWDXO0v9I-lzXw&s",
      psychic: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx4c-6cff5589-ce3b-4135-8ace-ee3bec01aa7e.png/v1/fill/w_1280,h_1278/psychic_energy_card_vector_symbol_by_biochao_dezrx4c-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiJcL2ZcLzc3YmYzYmE5LTBhYWMtNDQ1Mi1iZTgyLWRlNTM2YjVhYWIzMlwvZGV6cng0Yy02Y2ZmNTU4OS1jZTNiLTQxMzUtOGFjZS1lZTNiZWMwMWFhN2UucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.ZHn6anZ59G_2EsYUB07VZjquVekNJ0v7vm2tZG3XTWg",
      normal: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl62-5a7d2cd1-0e54-4a3f-870d-bce6d157a84f.png/v1/fill/w_894,h_894/normal_type_symbol_galar_by_jormxdos_dffvl62-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcL2U4ZGRjNGRhLTIzZGQtNDUwMi1iNjViLTM3OGM5Y2ZlNWVmYVwvZGZmdmw2Mi01YTdkMmNkMS0wZTU0LTRhM2YtODcwZC1iY2U2ZDE1N2E4NGYucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.6WIqtbC5CGYGzevXOzcj0_mP0hLVcWBD3hHs95hhCZw",
      ground: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png",
      water: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Pok%C3%A9mon_Water_Type_Icon.svg/1200px-Pok%C3%A9mon_Water_Type_Icon.svg.png",
      ice: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Pok%C3%A9mon_Ice_Type_Icon.svg/2048px-Pok%C3%A9mon_Ice_Type_Icon.svg.png",
      steel: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dfgddcz-06a632af-8eb8-41e3-8468-dcc0eb9886f4.png/v1/fill/w_894,h_894/metal_type_symbol_tcg_by_jormxdos_dfgddcz-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcL2U4ZGRjNGRhLTIzZGQtNDUwMi1iNjViLTM3OGM5Y2ZlNWVmYVwvZGZnZGRjei0wNmE2MzJhZi04ZWI4LTQxZTMtODQ2OC1kY2MwZWI5ODg2ZjQucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.TvVirKp3SOiBkZgrJvZb0iKASIOy66c7mdKnZ3aBPTA"
    };
  
    // Convert input to lowercase to make it case-insensitive
    const typeLower = type.toLowerCase();
    return typeIcons[typeLower] || '';
  };
}
