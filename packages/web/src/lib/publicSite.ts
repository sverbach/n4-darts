import { createContext, useContext } from "react";

/** True on the public site: its pages leave out every link to the room's pages. */
export const PublicSite = createContext(false);

export const usePublicSite = () => useContext(PublicSite);
