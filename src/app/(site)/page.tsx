import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { HowItWorks } from "@/components/sections/how-it-works";
import { TaskTypes } from "@/components/sections/task-types";
import { Pay } from "@/components/sections/pay";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Pay />
      <HowItWorks />
      <TaskTypes />
      <Faq />
      <Cta />
    </>
  );
}
