import type { NotFoundProps } from "@/const/interfaces/not-found-link.interface";
import { Book } from "lucide-react";

export const NotFoundItems: NotFoundProps = {
  errorCode: "404 error",
  title: "We can't find this page",
  description: "The page you are looking for doesn't exist or has been moved.",
  links: [
    {
      title: "Documentation",
      subtitle: "Dive in to learn all about our project",
      icon: Book,
      href: '/user-guidance',
    },
  ],
  backButtonText: "Go back",
  homeButtonText: "Go Home",
  showBackground: true,
};
