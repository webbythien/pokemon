export interface IPokemon {
    _id: string
    name: string
    type1: string
    type2: string
    total: number
    hp: number
    attack: number
    defense: number
    spAttack: number
    spDefense: number
    speed: number
    generation: number
    legendary: boolean
    image: string
    ytbUrl: string
    id: number
    __v: number
    is_favorite: boolean
  }
  

export interface PaginatedResponsePokemon<T> {
    results: IPokemon[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }

  export interface UploadResponse {
    success: boolean;
    message: string;
    data?: any;
  }