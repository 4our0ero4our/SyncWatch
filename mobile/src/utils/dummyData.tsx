import { SlideData } from "../components/OnboardingSlide/types";
import {
  NetflixLogo,
  OnboardingImgOne,
  OnboardingImgTwo,
  PrimeLogo,
} from "../assets/svgs";
import { selectProviderType } from "./types";
import { MovieProps } from "../screens/homePage/CreateParty/types";

export const onboardingData: SlideData[] = [
  {
    id: 1,
    title: "Watch together. In sync.",
    description:
      "Start a watch party and stay in cinematic sync with friends & family.",
    image: <OnboardingImgOne />,
  },
  {
    id: 2,
    title: "One tap. Everyone's in!",
    description: "Start the movie, chat live, & react in real time.",
    image: <OnboardingImgTwo />,
  },
];

export const selectProviderData: selectProviderType[] = [
  {
    id: 1,
    logo: <NetflixLogo />,
    title: "Netflix",
    providerId: "netflix",
  },
  {
    id: 2,
    logo: <PrimeLogo />,
    title: "Prime Video",
    providerId: "prime",
  },
];

export const moviesData: MovieProps[] = [
  {
    id: 1,
    title: "The Unforgivable",
    image: require("../assets/images/image1.jpg"),
    description:
      "Fresh out of prison, Ruth begins a relentless search for the sister she left behind — at the while being hunted by those who can't forgive what she did.",
  },
  {
    id: 2,
    title: "Old Guard",
    image: require("../assets/images/image2.jpg"),
    description:
      "A group of immortal mercenaries are suddenly exposed and must now fight to keep their identity a secret.",
  },
  {
    id: 3,
    title: "Steve",
    image: require("../assets/images/image3.jpg"),
    description: "An amazing story about Steve and his adventures.",
  },
  {
    id: 4,
    title: "The Irishman",
    image: require("../assets/images/image4.jpg"),
    description:
      "An epic saga of organized crime in post-war America told through the eyes of World War II veteran Frank Sheeran.",
  },
  {
    id: 5,
    title: "Django",
    image: require("../assets/images/image5.jpg"),
    description:
      "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal plantation owner.",
  },
  {
    id: 6,
    title: "Oppenheimer",
    image: require("../assets/images/image6.png"),
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
  },
  {
    id: 7,
    title: "Midnight",
    image: require("../assets/images/image7.png"),
    description: "A gripping thriller set in the dark hours of midnight.",
  },
  {
    id: 8,
    title: "Ox",
    image: require("../assets/images/image8.png"),
    description: "A powerful drama about strength and resilience.",
  },

  {
    id: 9,
    title: "All Day and a Night",
    image: require("../assets/images/image9.png"),
    description:
      "While serving life in prison, a young man looks back at the people, circumstances and system that set him on the path to his crime.",
  },
  {
    id: 10,
    title: "White Frick",
    image: require("../assets/images/image10.png"),
    description: "An intense drama exploring complex themes.",
  },
];

export const CurrentParties = [
  {
    id: "1",
    title: "Three Musketeers!",
    description: "Our first watch party ever!",
    date: "Jan 24, 2026",
    movieImage: require("@/src/assets/images/image1.jpg"),
    movieTitle: "The Unforgivable",
    participants: [
      { id: "1", name: "Sarah", color: "#FEC500" },
      { id: "2", name: "Ryan", color: "#00D95F" },
      { id: "3", name: "Mike", color: "#9E9E9E" },
      { id: "4", name: "Lisa", color: "#FF007B" },
      { id: "5", name: "John", color: "#7130F0" },
    ],
    status: "Current" as const,
  },
  {
    id: "2",
    title: "Movie Night 🎬",
    description: "Weekly movie night with friends",
    date: "Jan 26, 2026",
    movieImage: require("@/src/assets/images/image2.jpg"),
    movieTitle: "Old Guard",
    participants: [
      { id: "1", name: "Alex", color: "#7130F0" },
      { id: "2", name: "Emma", color: "#FF007B" },
    ],
    status: "Current" as const,
  },
];

export const pastParties = [
  {
    id: "3",
    title: "Horror Night",
    description: "Scary movies marathon",
    date: "Jan 20, 2026",
    movieImage: require("@/src/assets/images/image4.jpg"),
    movieTitle: "Steve",
    participants: [
      { id: "1", name: "Tom", color: "#616161" },
      { id: "2", name: "Jerry", color: "#0077E6" },
    ],
    status: "Ended" as const,
  },
];

export const avatars = [
  {
    id: 1,
    seed: "Snow",
    selected: true,
    url: require("../assets/images/Avatar1.png"),
  },
  {
    id: 2,
    seed: "Felix",
    selected: false,
    url: require("../assets/images/Avatar2.png"),
  },
  {
    id: 3,
    seed: "Aneka",
    selected: false,
    url: require("../assets/images/Avatar3.png"),
  },
  {
    id: 4,
    seed: "Bailey",
    selected: false,
    url: require("../assets/images/Avatar4.png"),
  },
  {
    id: 5,
    seed: "Brooklynn",
    selected: false,
    url: require("../assets/images/Avatar5.png"),
  },
  {
    id: 6,
    seed: "Callie",
    selected: false,
    url: require("../assets/images/Avatar6.png"),
  },
  {
    id: 7,
    seed: "Charlie",
    selected: false,
    url: require("../assets/images/Avatar7.png"),
  },
  {
    id: 8,
    seed: "Chloe",
    selected: false,
    url: require("../assets/images/Avatar8.png"),
  },
  {
    id: 9,
    seed: "Cleo",
    selected: false,
    url: require("../assets/images/Avatar9.png"),
  },
  {
    id: 10,
    seed: "Dusty",
    selected: false,
    url: require("../assets/images/Avatar10.png"),
  },
];
