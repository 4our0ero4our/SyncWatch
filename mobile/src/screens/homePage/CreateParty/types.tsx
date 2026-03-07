import { Room } from "@/src/services/rooms";

export interface MovieProps {
  id: number | string;
  title: string;
  image: { uri: string } | number;
  rank?: string;
  description?: string;
  embedUrl?: string;
}

export interface CreatePartyProps {
  handleCreateParty: () => void;
  onClose: () => void;
  movie: MovieProps | null;
  createdRoom?: Room | null;
  onCreateRoom?: (name: string, description: string) => Promise<void>;
}
