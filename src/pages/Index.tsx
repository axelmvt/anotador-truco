import MatchCounter from "@/components/MatchCounter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="h-full w-full bg-truco-green overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <MatchCounter />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
