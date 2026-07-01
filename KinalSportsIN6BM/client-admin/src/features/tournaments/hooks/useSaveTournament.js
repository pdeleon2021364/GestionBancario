import { useTournamentsStore } from "../store/tournamentStore";

export const useSaveTournament = () => {
  const { createTournament, updateTournament } = useTournamentsStore();

  const saveTournament = async (data, id) => {
    if (id) {
      await updateTournament(id, data);
    } else {
      await createTournament(data);
    }
  };

  return { saveTournament };
};
