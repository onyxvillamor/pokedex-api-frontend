import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const RAILS_API = "http://192.168.1.32:3000/favorites";

interface Favorite {
  id: number;
  name: string;
}

const colorsByType: Record<string, { bg: string; text: string }> = {
  normal:   { bg: "#F0EFE8", text: "#7A7A58" },
  fire:     { bg: "#FEF0E6", text: "#B85A1A" },
  water:    { bg: "#EBF0FE", text: "#3A63C8" },
  electric: { bg: "#FEFBE6", text: "#C8A000" },
  grass:    { bg: "#EDF7E6", text: "#4E9626" },
  ice:      { bg: "#E8F8F7", text: "#5AAFAB" },
  fighting: { bg: "#FAEAEA", text: "#8C1410" },
  poison:   { bg: "#F7EAF7", text: "#721874" },
  ground:   { bg: "#FBF5E6", text: "#B08A30" },
  flying:   { bg: "#F3EFFE", text: "#7458C8" },
  psychic:  { bg: "#FEEBF2", text: "#C41E55" },
  bug:      { bg: "#F4F7E5", text: "#728000" },
  rock:     { bg: "#F6F2E6", text: "#847018" },
  ghost:    { bg: "#EEE9F5", text: "#4A2E6E" },
  dragon:   { bg: "#EDE5FE", text: "#4400CC" },
  dark:     { bg: "#EDEAE8", text: "#3E2E20" },
  steel:    { bg: "#F1F1F5", text: "#8080A0" },
  fairy:    { bg: "#FDF0F6", text: "#A84878" },
};

const fallback = { bg: "#F5F5F5", text: "#555" };

async function fetchPokemonMeta(name: string) {
  const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
  return {
    image:
      res.data.sprites.other["official-artwork"].front_default ??
      res.data.sprites.front_default,
    type: res.data.types[0]?.type?.name ?? "normal",
  };
}

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: Favorite;
  onRemove: (id: number) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["pokemonMeta", favorite.name],
    queryFn: () => fetchPokemonMeta(favorite.name),
  });

  const colors = data ? (colorsByType[data.type] ?? fallback) : fallback;

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      {isLoading ? (
        <View style={styles.imagePlaceholder} />
      ) : (
        <Image source={{ uri: data?.image }} style={styles.image} />
      )}

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{capitalize(favorite.name)}</Text>
        {data && (
          <View style={[styles.pill, { borderColor: colors.text }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>
              {capitalize(data.type)}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.5 }]}
        onPress={() => onRemove(favorite.id)}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </Pressable>
    </View>
  );
}

export default function FavoritesScreen() {
  const queryClient = useQueryClient();

  const { data: favorites, isLoading, isError } = useQuery({
    queryKey: ["favorites"],
    queryFn: async (): Promise<Favorite[]> => {
      const { data } = await axios.get(RAILS_API);
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${RAILS_API}/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );

  if (isError)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not connect to server.</Text>
        <Text style={styles.errorSub}>Is your Rails server running?</Text>
      </View>
    );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Favorites</Text>

      {favorites?.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No favorites yet.</Text>
          <Text style={styles.emptySub}>Add some from the Pokémon details page.</Text>
        </View>
      )}

      {favorites?.map((fav) => (
        <FavoriteCard
          key={fav.id}
          favorite={fav}
          onRemove={(id) => removeMutation.mutate(id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { backgroundColor: "#F7F7F5" },
  container: { padding: 20, gap: 12, paddingBottom: 40 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F5",
    gap: 6,
  },
  errorText: { fontSize: 16, fontWeight: "700", color: "#111" },
  errorSub: { fontSize: 13, color: "#aaa" },

  pageTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -1,
    marginBottom: 8,
  },

  empty: { alignItems: "center", marginTop: 60, gap: 6 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 13, color: "#aaa" },

  card: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  image: { width: 70, height: 70 },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e0e0e0",
  },

  cardInfo: { flex: 1, gap: 6 },
  cardName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
  },

  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: { fontSize: 13, color: "#555", fontWeight: "700" },
});