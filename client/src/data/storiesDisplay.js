import heroBgLight from "../assets/Home/hero-bg-light.png";
import heroBgDark from "../assets/Home/hero-bg-dark.png";
import vosFeatured from "../assets/Stories/vision-of-sounds/vision-of-sounds-featured.png";
import vosArtistStories from "../assets/Stories/vision-of-sounds/vision-of-sounds-artist-stories.png";
import vosBehindTheScenes from "../assets/Stories/vision-of-sounds/vision-of-sounds-behind-the-scenes.png";
import vosFilmFestival from "../assets/Stories/vision-of-sounds/vision-of-sounds-film-festival.png";
import vosCommunityStories from "../assets/Stories/vision-of-sounds/vision-of-sounds-community-stories.png";
import visionOfSoundsLogo from "../assets/logos/Vision Of Sounds Copyright HD Logo.png";
import voiceOfVisionariesLogo from "../assets/logos/Voice Of Visionaries Copyright HD Logo.png";
import voiceNlLogo from "../assets/logos/V.O.I.C.E. NL Copyright HD Logo.png";
import vovFeatured from "../assets/Stories/voice-of-visionaries/voice-of-visionaries-featured.png";
import vovTedTalks from "../assets/Stories/voice-of-visionaries/voice-of-visionaries-ted-talks.png";
import vovPodcasts from "../assets/Stories/voice-of-visionaries/voice-of-visionaries-podcasts.png";
import vovLeadership from "../assets/Stories/voice-of-visionaries/voice-of-visionaries-leadership.png";
import vovInnovation from "../assets/Stories/voice-of-visionaries/voice-of-visionaries-innovation.png";

export const STORIES_HERO = {
  titleLead: "Stories That",
  titleAccent: "Inspire",
  description:
    "Discover the people, journeys and ideas shaping the V.O.I.C.E. NL movement.",
  imageLight: heroBgLight,
  imageDark: heroBgDark,
  quickLinks: [
    {
      key: "vision-of-sounds",
      icon: "music",
      logo: visionOfSoundsLogo,
      title: "Vision Of Sounds",
      subtitle: "Explore Stories",
      accent: "teal",
      to: "/stories#stories-vision-of-sounds",
    },
    {
      key: "voice-of-visionaries",
      icon: "microphone",
      logo: voiceOfVisionariesLogo,
      title: "Voice Of Visionaries",
      subtitle: "Explore Conversations",
      accent: "purple",
      to: "/stories#stories-voice-of-visionaries",
    },
  ],
};

export const STORIES_PILLARS = [
  {
    id: "stories-vision-of-sounds",
    accent: "teal",
    icon: "music",
    logo: visionOfSoundsLogo,
    label: "Vision Of Sounds",
    titleLineOne: "Stories Behind",
    titleLineTwo: "The Experience",
    description:
      "Follow the journeys of artists, performers and creators who bring V.O.I.C.E. NL experiences to life.",
    featured: {
      badge: "Featured Story",
      image: vosFeatured,
      title: "Meet The Artist",
      description: "The story behind the performance.",
      ctaLabel: "Watch Story",
      ctaTo: "/events",
    },
    cards: [
      {
        title: "Artist Stories",
        description: "Journeys of passion, talent and perseverance.",
        image: vosArtistStories,
        accent: "teal",
      },
      {
        title: "Behind The Scenes",
        description: "Moments you don't see on stage.",
        image: vosBehindTheScenes,
        accent: "purple",
      },
      {
        title: "Film Festival Stories",
        description: "Short films. Big stories. Global impact.",
        image: vosFilmFestival,
        accent: "blue",
      },
      {
        title: "Community Stories",
        description: "Real people. Real stories. Real change.",
        image: vosCommunityStories,
        accent: "gold",
      },
    ],
    viewAllLabel: "View All Stories",
    viewAllTo: "/events",
  },
  {
    id: "stories-voice-of-visionaries",
    accent: "purple",
    icon: "microphone",
    logo: voiceOfVisionariesLogo,
    label: "Voice Of Visionaries",
    titleLineOne: "Ideas That",
    titleLineTwo: "Shape Tomorrow",
    description:
      "Conversations with leaders, innovators and changemakers creating impact.",
    featured: {
      badge: "Featured Episode",
      image: vovFeatured,
      title: "Voice Of Visionaries Podcast",
      description: "Deep conversations. Bold ideas. Real impact.",
      ctaLabel: "Watch Episode",
      ctaTo: "/voice-venture-studio",
    },
    cards: [
      {
        title: "TED Style Talks",
        description: "Ideas worth spreading. Inspiration for all.",
        image: vovTedTalks,
        accent: "purple",
      },
      {
        title: "Podcasts",
        description: "Conversations that challenge and inspire.",
        image: vovPodcasts,
        accent: "teal",
      },
      {
        title: "Leadership Stories",
        description: "Lessons from leaders who lead with purpose.",
        image: vovLeadership,
        accent: "blue",
      },
      {
        title: "Innovation Forums",
        description: "Discussions that spark change and progress.",
        image: vovInnovation,
        accent: "gold",
      },
    ],
    viewAllLabel: "View All Episodes",
    viewAllTo: "/voice-venture-studio",
  },
];

export const STORIES_CTA = {
  lineOneLead: "Every Experience Has A ",
  lineOneAccent: "Story.",
  lineTwoLead: "Every Visionary Has A ",
  lineTwoAccent: "Voice.",
  subtext: "V.O.I.C.E. NL brings both together.",
  buttonLabel: "Explore Stories",
  buttonTo: "/stories#stories-vision-of-sounds",
  background: heroBgDark,
  logo: voiceNlLogo,
};
