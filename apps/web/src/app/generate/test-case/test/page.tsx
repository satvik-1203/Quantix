import Client from "./Client";

export default function TestCaseResultPage() {
  console.log("pringing page component");
  return (
    <div className="container mx-auto px-4 py-16">
      Hello
      <div>
        <Client />
      </div>
    </div>
  );
}
