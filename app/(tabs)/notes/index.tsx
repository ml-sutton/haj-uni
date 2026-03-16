import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  cardBackgroundColor,
  inputBackgroundColor,
  inputBorderColor,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function NotepadScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const user = useDatabaseStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");

  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const inputBg = inputBackgroundColor(resolvedTheme);
  const inputBorder = inputBorderColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const loading = encryptionKey != null && user === null;

  const notes = useMemo(() => user?.notes ?? [], [user?.notes]);
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  if (loading) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>Loading…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!encryptionKey || !user) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {!encryptionKey ? "Sign in to use the notepad." : "Loading…"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)" as import("expo-router").Href)}
        >
          <Text style={[styles.backBtnText, { color: titleColor }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: titleColor }]}>Notepad</Text>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: inputBg, borderColor: inputBorder, color: titleColor },
          ]}
          placeholder="Search notes…"
          placeholderTextColor={secondaryColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Pressable
          style={[styles.newButton, { backgroundColor: cardBg }]}
          onPress={() => router.push("/(tabs)/notes/new")}
        >
          <Text style={[styles.newButtonText, { color: titleColor }]}>New note</Text>
        </Pressable>

        {filteredNotes.length === 0 ? (
          <Text style={[styles.empty, { color: secondaryColor }]}>
            {notes.length === 0 ? "No notes yet." : "No notes match your search."}
          </Text>
        ) : (
          filteredNotes.map((note) => (
            <Pressable
              key={note.id}
              style={[styles.noteCard, { backgroundColor: cardBg }]}
              onPress={() => router.push({ pathname: "/(tabs)/notes/[noteId]", params: { noteId: note.id } })}
            >
              <Text style={[styles.noteTitle, { color: titleColor }]} numberOfLines={1}>
                {note.title || "Untitled"}
              </Text>
              {note.body ? (
                <Text style={[styles.noteSnippet, { color: secondaryColor }]} numberOfLines={2}>
                  {note.body}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", marginBottom: 12 },
  backBtnText: { fontSize: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  searchInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  newButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  newButtonText: { fontSize: 16, fontWeight: "600" },
  empty: { fontSize: 15 },
  noteCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  noteTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  noteSnippet: { fontSize: 14 },
  hint: { fontSize: 16 },
});
