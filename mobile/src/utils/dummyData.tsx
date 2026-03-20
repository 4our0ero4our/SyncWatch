import { SlideData } from "../components/OnboardingSlide/types";
import {
  NetflixLogo,
  OnboardingImgOne,
  OnboardingImgTwo,
  PrimeLogo,
} from "../assets/svgs";
import { selectProviderType } from "./types";

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
