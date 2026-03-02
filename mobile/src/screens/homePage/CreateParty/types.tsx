import { Room } from "@/src/services/rooms";

export interface MovieProps {
  id: number;
  title: string;
  image: any;
  rank?: string;
  description?: string;
}

export interface CreatePartyProps {
  handleCreateParty: () => void;
  onClose: () => void;
  movie: MovieProps | null;
  createdRoom?: Room | null;
  onCreateRoom?: (name: string, description: string) => Promise<void>;
}
