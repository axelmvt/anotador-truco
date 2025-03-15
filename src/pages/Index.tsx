import MatchCounter from "@/components/MatchCounter";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";

const Index = () => {
  return (
    <div className="h-full w-full bg-truco-green overflow-hidden flex flex-col">
      <AdBanner position="top" variant="horizontal" />
      <div className="flex-1 overflow-hidden">
        <MatchCounter />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
