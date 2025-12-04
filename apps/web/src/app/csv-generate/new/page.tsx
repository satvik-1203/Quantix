import React from "react";
import CreateForm from "./CreateForm";

interface Props {}

const page: React.FC<Props> = () => {
  return (
    <div className="px-4 sm:px-8 py-4 w-full max-w-3xl mx-auto">
      <div className="my-8">
        <h1 className="text-2xl font-bold">Create New CSV</h1>
        <p className="text-muted-foreground">
          Create a new CSV file with the given schema.
        </p>
      </div>
      <div className="w-full">
        <CreateForm />
      </div>
    </div>
  );
};

export default page;
