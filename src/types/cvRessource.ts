export type CvType = "tech" | "agence" | "grande_entreprise" | "autre";

export type CvFormat = "court" | "complet";

export type CvRessource = {
  id: string;
  titre: string;
  type: CvType;
  format?: CvFormat;
  url: string;
  createdAt: string;
};
