// pokemon-slider.component.ts
import { 
  Component, 
  CUSTOM_ELEMENTS_SCHEMA, 
  Input, 
  OnInit, 
  OnDestroy,
  signal, 
  Signal,
  inject,
  effect,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';
import { IPokemon } from '../../model/pokemon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

register();

@Component({
  selector: 'app-pokemon-slider',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './pokemon-slider.component.html',
  styleUrl: './pokemon-slider.component.css',
})
export class PokemonSliderComponent implements OnInit, OnDestroy {
  @Input() pokemonList!: Signal<IPokemon[]>;
  
  readonly featuredVideos = signal<IPokemon[]>([]);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private swiperEl: HTMLElement | null = null;
  private hasInitializedVideos = false; // Flag to track initialization

  constructor() {
    effect(() => {
      const pokemons = this.pokemonList();
      // Only set videos once when we first get data
      if (pokemons.length && !this.hasInitializedVideos) {
        this.setRandomVideos(pokemons);
        this.hasInitializedVideos = true;
      }
    }, { allowSignalWrites: true });
  }

  trackByPokemonId(index: number, pokemon: IPokemon): string {
    return pokemon._id;
  }

  async ngOnInit(): Promise<void> {
    await this.initializeSlider();
  }

  ngOnDestroy(): void {
    if (this.swiperEl) {
      (this.swiperEl as any)?.destroy();
    }
  }

  private setRandomVideos(pokemons: IPokemon[]): void {
    try {
      const withVideos = pokemons.filter(p => 
        p.ytbUrl && 
        typeof p.ytbUrl === 'string' && 
        this.getYoutubeVideoId(p.ytbUrl)
      );

      if (withVideos.length === 0) {
        console.warn('No valid YouTube videos found in pokemon list');
        return;
      }

      const randomVideos = this.shuffleArray(withVideos).slice(0, 5);
      this.featuredVideos.set(randomVideos);
    } catch (error) {
      console.error('Error setting random videos:', error);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  private getYoutubeVideoId(url: string): string | null {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  }

  getYoutubeEmbedUrl(url: string): SafeResourceUrl | null {
    try {
      const videoId = this.getYoutubeVideoId(url);
      if (!videoId) return null;
      
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } catch (error) {
      console.error('Error creating YouTube embed URL:', error);
      return null;
    }
  }

  private async initializeSlider(): Promise<void> {
    try {
      await customElements.whenDefined('swiper-container');
      
      this.swiperEl = document.querySelector('swiper-container');
      if (!this.swiperEl) {
        console.error('Swiper container element not found');
        return;
      }

      const swiperOptions = {
        slidesPerView: 1,
        pagination: {
          clickable: true,
        },
        navigation: true,
        breakpoints: {
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }
      };

      Object.assign(this.swiperEl, swiperOptions);
      await (this.swiperEl as any).initialize();
      
    } catch (error) {
      console.error('Error initializing slider:', error);
    }
  }
}