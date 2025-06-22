export interface POAPEvent {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  eventId: string;
  poapName: string;
  poapDescription: string;
  poapImgPath: string;
  expiredAt: number;
  visitors: string[];
}

export interface POAP {
  id: string;
  eventId: string;
  owner: string;
} 