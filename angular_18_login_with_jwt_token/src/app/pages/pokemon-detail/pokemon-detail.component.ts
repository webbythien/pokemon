import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PokemonService } from '../../service/pokemon.service';
import { IPokemon } from '../../model/pokemon';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.component.html',
  standalone: true,
  styleUrls: ['./pokemon-detail.component.css'],
  imports: [
    CommonModule,
  ],
  providers: [Location] 
})
export class PokemonDetailComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  pokemonSrv = inject(PokemonService);
  pokemon = signal<IPokemon | null>(null);
  togglingFavorite = signal<boolean>(false);

  private routeSub: Subscription | undefined;

  constructor(
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const pokemonId = params['id'];
      if (pokemonId) {
        this.loadPokemon(pokemonId);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  private loadPokemon(id: string): void {
    this.pokemonSrv.getPokemon(id).subscribe({
      next: (response: IPokemon) => {
        this.pokemon.set(response);
        console.log('Pokemon loaded:', this.pokemon());
      },
      error: (error) => {
        console.error('Error loading Pokemon:', error);
      }
    });
  }

  toggleFavorite(): void {
    const currentPokemon = this.pokemon();
    if (!currentPokemon || this.togglingFavorite()) return;
  
    this.togglingFavorite.set(true);
  
    const action = currentPokemon.is_favorite ? 'unmark' : 'mark';
    
    // Lưu trạng thái hiện tại để có thể khôi phục nếu cần
    const previousState = { ...currentPokemon };
    
    this.pokemonSrv.toggleFavorite(currentPokemon._id, action).subscribe({
      next: () => {
        this.pokemon.set({
          ...currentPokemon,
          is_favorite: !currentPokemon.is_favorite
        });
        this.showNotification({
          type: 'success',
          title: 'Success',
          message: `${currentPokemon.name} ${action === 'mark' ? 'added to' : 'removed from'} favorites`
        });
      },
      error: (error) => {
        console.error('Error toggling favorite:', error);
        // Khôi phục lại trạng thái trước đó nếu có lỗi
        this.pokemon.set(previousState);
        this.showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update favorite status'
        });
      },
      complete: () => {
        this.togglingFavorite.set(false);
      }
    });
  }

  goBack(): void {
    if (this.togglingFavorite()) {
      setTimeout(() => {
        this.tryNavigateBack();
      }, 100);
      return;
    }
    
    this.tryNavigateBack();
  }
  
  private tryNavigateBack(): void {
    try {
      this.location.back();
      
      setTimeout(() => {
        if (window.location.href === window.location.origin + this.router.url) {
          this.router.navigate(['../'], { relativeTo: this.route });
        }
      }, 100);
    } catch (error) {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  showNotification(notification: { type: string; title: string; message: string }): void {
    console.log(`${notification.type.toUpperCase()}: ${notification.title} - ${notification.message}`);
    // Replace with actual notification logic
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

  getPokemonVideoUrl(videoUrl: string): SafeResourceUrl {
    // You can customize this to get the correct video URL for each Pokemon
    // const videoUrl = `https://www.youtube.com/embed/search?q=${pokemonName}+pokemon`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  getYoutubeEmbedUrl(url: string): SafeResourceUrl {
    if (!url) return '';
    
    // Extract video ID from YouTube URL
    let videoId = '';
    const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(youtubeRegExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    // Create embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
