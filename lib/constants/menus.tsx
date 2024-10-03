import { IconCompass } from "@tabler/icons-react";

type SidebarItem = {
  title?: string;
  icon?: React.ReactNode;
  href?: string;
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Explora",
    href: "/",
    icon: <IconCompass size={20} />,
  },
];
