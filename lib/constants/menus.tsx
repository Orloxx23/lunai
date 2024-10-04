import {
  IconBook,
  IconBooks,
  IconCompass,
  IconHome,
  IconUsers,
} from "@tabler/icons-react";

type SidebarItem = {
  title?: string;
  icon?: React.ReactNode;
  href?: string;
};

const sidebarIconSize = 24;

export const sidebarItems: SidebarItem[] = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: <IconHome size={sidebarIconSize} />,
  },
  {
    title: "Explorar",
    href: "/explore",
    icon: <IconCompass size={sidebarIconSize} />,
  },
  {
    title: "Biblioteca",
    href: "/library",
    icon: <IconBooks size={sidebarIconSize} />,
  },
  {
    title: "Grupos",
    href: "/groups",
    icon: <IconUsers size={sidebarIconSize} />,
  },
  {
    title: "Historial",
    href: "/history",
    icon: <IconBook size={sidebarIconSize} />,
  },
];
