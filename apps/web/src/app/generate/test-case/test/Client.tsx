"use client";
import React, { useEffect, useState } from "react";

export default function Client() {
  const [showClient, setShowClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowClient(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  console.log("Printing client component");
  if (!showClient) return null;
  return <div>Client</div>;
}
