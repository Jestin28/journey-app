export type AppUser = {
  id: string;
  name: string;
};

export type NationalParkCoordinates = {
  lat: number;
  lng: number;
};

export type NationalPark = {
  id: string;
  name: string;
  state: string;
  coordinates: NationalParkCoordinates;
  description: string;
};
