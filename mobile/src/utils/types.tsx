import React from "react";

export type selectProviderType = {
  id: number;
  logo: React.ReactNode;
  title: string;
  providerId: "netflix" | "prime";
};
