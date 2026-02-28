import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { api } from "../services/api";

const RAILS_API = "http://192.168.1.32:3000/favorites";

interface PokemonType { type: { name: string } }
interface PokemonStat { base_stat: number; stat: { name: string } }
interface PokemonAbility { ability: { name: string }; is_hidden: boolean }
interface Pokemon {
    id: number;
    name: string;
    sprites: { front_default: string; other: { "official-artwork": { front_default: string } } };
    types: PokemonType[];
    height: number;
    weight: number;
    stats: PokemonStat[];
    abilities: PokemonAbility[];
    base_experience: number;
}

const colorsByType: Record<string, { bg: string; text: string; bar: string }> = {
    normal: { bg: "#F0EFE8", text: "#7A7A58", bar: "#A8A77A" },
    fire: { bg: "#FEF0E6", text: "#B85A1A", bar: "#EE8130" },
    water: { bg: "#EBF0FE", text: "#3A63C8", bar: "#6390F0" },
    electric: { bg: "#FEFBE6", text: "#C8A000", bar: "#F7D02C" },
    grass: { bg: "#EDF7E6", text: "#4E9626", bar: "#7AC74C" },
    ice: { bg: "#E8F8F7", text: "#5AAFAB", bar: "#96D9D6" },
    fighting: { bg: "#FAEAEA", text: "#8C1410", bar: "#C22E28" },
    poison: { bg: "#F7EAF7", text: "#721874", bar: "#A33EA1" },
    ground: { bg: "#FBF5E6", text: "#B08A30", bar: "#E2BF65" },
    flying: { bg: "#F3EFFE", text: "#7458C8", bar: "#A98FF3" },
    psychic: { bg: "#FEEBF2", text: "#C41E55", bar: "#F95587" },
    bug: { bg: "#F4F7E5", text: "#728000", bar: "#A6B91A" },
    rock: { bg: "#F6F2E6", text: "#847018", bar: "#B6A136" },
    ghost: { bg: "#EEE9F5", text: "#4A2E6E", bar: "#735797" },
    dragon: { bg: "#EDE5FE", text: "#4400CC", bar: "#6F35FC" },
    dark: { bg: "#EDEAE8", text: "#3E2E20", bar: "#705746" },
    steel: { bg: "#F1F1F5", text: "#8080A0", bar: "#B7B7CE" },
    fairy: { bg: "#FDF0F6", text: "#A84878", bar: "#D685AD" },
};

const fallback = { bg: "#F5F5F5", text: "#555", bar: "#aaa" };

const STAT_ABBR: Record<string, string> = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "SpATK",
    "special-defense": "SpDEF",
    speed: "SPD",
};

function capitalize(text: string) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function Details() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const queryClient = useQueryClient();

    const { data: pokemon, isLoading, error } = useQuery({
        queryKey: ["pokemon", name],
        queryFn: async () => {
            const res = await api.get(`/pokemon/${name}`);
            return res.data as Pokemon;
        },
        enabled: !!name,
    });

    const favMutation = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post(RAILS_API, { name });  // ✅ directly calls Rails
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    });
    if (isLoading)
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#111" />
            </View>
        );

    if (error || !pokemon)
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load Pokémon</Text>
            </View>
        );

    const mainTypeName = pokemon.types[0]?.type?.name ?? "normal";
    const colors = colorsByType[mainTypeName] ?? fallback;
    const secondTypeName = pokemon.types[1]?.type?.name;
    const officialArt =
        pokemon.sprites.other?.["official-artwork"]?.front_default ??
        pokemon.sprites.front_default;

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

            {/* HERO */}
            <View style={[styles.hero, { backgroundColor: colors.bg }]}>
                <Image source={{ uri: officialArt }} style={styles.heroImage} />
                <Text style={[styles.heroId, { color: colors.text }]}>
                    #{String(pokemon.id).padStart(3, "0")}
                </Text>
                <Text style={styles.heroName}>{capitalize(pokemon.name)}</Text>

                {/* Type pills */}
                <View style={styles.pillRow}>
                    {pokemon.types.map((t) => {
                        const c = colorsByType[t.type.name] ?? fallback;
                        return (
                            <View key={t.type.name} style={[styles.pill, { borderColor: c.text }]}>
                                <Text style={[styles.pillText, { color: c.text }]}>
                                    {capitalize(t.type.name)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* INFO ROW */}
            <View style={styles.infoRow}>
                {[
                    { label: "Height", value: `${pokemon.height / 10} m` },
                    { label: "Weight", value: `${pokemon.weight / 10} kg` },
                    { label: "Base Exp", value: `${pokemon.base_experience}` },
                ].map((item, i, arr) => (
                    <View
                        key={item.label}
                        style={[styles.infoCell, i < arr.length - 1 && styles.infoCellBorder]}
                    >
                        <Text style={styles.infoCellLabel}>{item.label}</Text>
                        <Text style={[styles.infoCellValue, { color: colors.text }]}>{item.value}</Text>
                    </View>
                ))}
            </View>

            {/* ABILITIES */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Abilities</Text>
                <View style={styles.pillRow}>
                    {pokemon.abilities
                        .filter((a) => !a.is_hidden)
                        .map((a) => (
                            <View key={a.ability.name} style={[styles.pill, { borderColor: colors.text }]}>
                                <Text style={[styles.pillText, { color: colors.text }]}>
                                    {capitalize(a.ability.name)}
                                </Text>
                            </View>
                        ))}
                </View>
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* STATS */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Base Stats</Text>
                {pokemon.stats.map((stat) => {
                    const pct = Math.round((stat.base_stat / 255) * 100);
                    return (
                        <View key={stat.stat.name} style={styles.statRow}>
                            <Text style={styles.statLabel}>
                                {STAT_ABBR[stat.stat.name] ?? capitalize(stat.stat.name)}
                            </Text>
                            <Text style={[styles.statNumber, { color: colors.text }]}>
                                {stat.base_stat}
                            </Text>
                            <View style={styles.barTrack}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${pct}%` as any, backgroundColor: colors.bar },
                                    ]}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* FAVORITE BUTTON */}
            <Pressable
                style={({ pressed }) => [
                    styles.favButton,
                    { borderColor: colors.text },
                    favMutation.isSuccess && { backgroundColor: colors.bg },
                    pressed && styles.favButtonPressed,
                ]}
                onPress={() => favMutation.mutate()}
                disabled={favMutation.isPending || favMutation.isSuccess}
            >
                <Text style={[styles.favButtonText, { color: colors.text }]}>
                    {favMutation.isSuccess
                        ? "✓  Saved to Favorites"
                        : favMutation.isPending
                            ? "Saving..."
                            : "♥  Add to Favorites"}
                </Text>
            </Pressable>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: { backgroundColor: "#F7F7F5" },
    content: { paddingBottom: 48 },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F7F7F5",
    },
    errorText: { color: "#E3350D", fontSize: 15 },


    hero: {
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 28,
        paddingHorizontal: 24,
    },
    heroImage: { width: 180, height: 180 },
    heroId: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.5,
        opacity: 0.6,
        marginTop: 8,
    },
    heroName: {
        fontSize: 34,
        fontWeight: "900",
        color: "#111",
        letterSpacing: -1,
        marginTop: 2,
        marginBottom: 12,
    },

    pillRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    pill: {
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    pillText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },


    infoRow: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 20,
        borderRadius: 16,
        marginTop: 16,
        overflow: "hidden",
    },
    infoCell: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
    },
    infoCellBorder: {
        borderRightWidth: 1,
        borderRightColor: "#EBEBEB",
    },
    infoCellLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#aaa",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    infoCellValue: {
        fontSize: 16,
        fontWeight: "800",
    },


    section: {
        paddingHorizontal: 24,
        paddingTop: 20,
        gap: 12,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#aaa",
        letterSpacing: 2,
        textTransform: "uppercase",
    },

    divider: {
        height: 1,
        backgroundColor: "#EBEBEB",
        marginHorizontal: 24,
        marginTop: 20,
    },


    statRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    statLabel: {
        width: 52,
        fontSize: 11,
        fontWeight: "700",
        color: "#aaa",
        letterSpacing: 0.3,
    },
    statNumber: {
        width: 30,
        fontSize: 14,
        fontWeight: "800",
        textAlign: "right",
    },
    barTrack: {
        flex: 1,
        height: 6,
        backgroundColor: "#EBEBEB",
        borderRadius: 6,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 6,
    },


    favButton: {
        marginHorizontal: 24,
        marginTop: 24,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    favButtonPressed: {
        opacity: 0.6,
        transform: [{ scale: 0.98 }],
    },
    favButtonText: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
});