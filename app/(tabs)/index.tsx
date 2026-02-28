import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../services/api";

interface Pokemon {
  name: string;
  image: string;
  types: PokemonType[];
  id: number;
  hp: number;
}

interface PokemonType {
  type: {
    name: string;
    url: string;
  };
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

async function fetchPokemons(): Promise<Pokemon[]> {
  const response = await api.get("/pokemon?limit=20");
  const detailed = await Promise.all(
    response.data.results.map(async (pokemon: any) => {
      const details = await api.get(`/pokemon/${pokemon.name}`);
      return {
        name: pokemon.name,
        image:
          details.data.sprites.other["official-artwork"].front_default ??
          details.data.sprites.front_default,
        types: details.data.types,
        id: details.data.id,
        hp: details.data.stats.find((s: any) => s.stat.name === "hp")?.base_stat ?? 50,
      };
    })
  );
  return detailed;
}

function capitalize(text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function padId(id: number) {
  return `#${String(id).padStart(3, "0")}`;
}

export default function Index() {
  const { data: pokemons, isLoading, error } = useQuery({
    queryKey: ["pokemons"],
    queryFn: fetchPokemons,
  });

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load Pokémon</Text>
      </View>
    );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Pokédex</Text>

      {pokemons?.map((pokemon) => {
        const typeName = pokemon.types[0]?.type?.name ?? "normal";
        const colors = colorsByType[typeName] ?? fallback;
        const secondType = pokemon.types[1]?.type?.name;

        return (
          <Link
            key={pokemon.name}
            href={{ pathname: "/details", params: { name: pokemon.name } }}
            asChild
          >
            <Pressable
              style={({ pressed }) => [styles.card, { backgroundColor: colors.bg }, pressed && styles.cardPressed]}
            >
               
              <Image source={{ uri: pokemon.image }} style={styles.image} />
              
              <View style={styles.cardLeft}>
                <Text style={[styles.cardId, { color: colors.text }]}>{padId(pokemon.id)}</Text>
                <Text style={styles.cardName}>{capitalize(pokemon.name)}</Text>

               
                <View style={styles.pillRow}>
                  <View style={[styles.pill, { borderColor: colors.text }]}>
                    <Text style={[styles.pillText, { color: colors.text }]}>{capitalize(typeName)}</Text>
                  </View>
                  {secondType && colorsByType[secondType] && (
                    <View style={[styles.pill, { borderColor: colorsByType[secondType].text }]}>
                      <Text style={[styles.pillText, { color: colorsByType[secondType].text }]}>
                        {capitalize(secondType)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.hpText, { color: colors.text }]}>HP {pokemon.hp}</Text>
              </View>

             
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: "#F7F7F5",
  },
  container: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F5",
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -1,
    marginBottom: 8,
  },
  errorText: {
    color: "#E3350D",
    fontSize: 15,
  },

  card: {
  borderRadius: 20,
  paddingHorizontal: 20,
  paddingVertical: 24,
  flexDirection: "column",   
  alignItems: "center",      
  justifyContent: "center",
},
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  cardLeft: {
    alignItems: "center",  
    gap: 5,
  },
  cardId: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.6,
    textAlign: "center", 
  },
  cardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    textAlign: "center",  
  },

  pillRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  pill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  hpText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 4,
    opacity: 0.7,
  },

  image: {
    width: 100,
    height: 100,
    alignSelf: "center",
  },
});