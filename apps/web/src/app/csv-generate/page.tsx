import React from "react";
import NewCsv from "./components/NewCsv";

interface Props {}

const page: React.FC<Props> = () => {
  return (
    <div className="px-8 py-4">
      <div className="flex my-8 justify-end">
        <NewCsv />
      </div>
    </div>
  );
};

export default page;
