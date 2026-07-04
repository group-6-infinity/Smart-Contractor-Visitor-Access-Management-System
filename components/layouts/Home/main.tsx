import Action from "@/components/layouts/Home/action";
import Content from "@/components/layouts/Home/content";
import Header from "@/components/layouts/Home/header";

export default function Main() {
  return (
    <div
      id="home__main__content"
      className="mx-auto my-auto max-w-5xl p-4 max-sm:py-10"
    >
      <Header />
      <Content />
      <Action />
    </div>
  );
}
