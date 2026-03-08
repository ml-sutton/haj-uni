import { create } from "zustand";
import type { DatabaseObject } from "../models/databaseObject";

type DatabaseStore = {
  databaseObject: DatabaseObject | null;
  setDatabaseObject: (databaseObject: DatabaseObject | null) => void;
};

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  databaseObject: DatabaseObject,
  setDatabaseObject: (databaseObject: DatabaseObject) => set({ databaseObject }),
}));
