import React from "react";

export type selectProviderType = {
  id: number;
  logo: React.ReactNode;
  title: string;
  /** Backend value: netflix | prime | youtube */
  providerId: "netflix" | "prime" | "youtube";
};
