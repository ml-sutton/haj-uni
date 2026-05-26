import {
  useTheme,
  primaryTextColor,
  secondaryTextColor,
  cardBackgroundColor,
} from "@/contexts/theme";
import type { User } from "@/models/user";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const RECENT_COUNT = 5;

/**
 * Props for {@link NotepadNav}.
 */
export type NotepadNavProps = {
  /**
   * @param user - Authenticated user whose notes are listed (most recent first).
   */
  user: User;
};

/**
 * Home-screen notepad section showing recent notes with navigation to detail and full list.
 *
 * @param props - User record containing notes.
 * @returns A section title, up to five note cards, optional "View more" link, or empty state copy.
 */
export function NotepadNav({ user }: NotepadNavProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);

  const recentNotes = useMemo(() => {
    const notes = [...(user.notes ?? [])];
    notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return notes.slice(0, RECENT_COUNT);
  }, [user.notes]);

  const hasMore = (user.notes?.length ?? 0) > RECENT_COUNT;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>Notepad</Text>
      {recentNotes.length === 0 ? (
        <Text style={[styles.empty, { color: secondaryColor }]}>No notes yet.</Text>
      ) : (
        recentNotes.map((note) => (
          <Pressable
            key={note.id}
            style={[styles.noteCard, { backgroundColor: cardBg }]}
            onPress={() => router.push(`/(tabs)/notes/${note.id}`)}
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
      {hasMore ? (
        <Pressable
          style={[styles.viewMoreButton, { backgroundColor: cardBg }]}
          onPress={() => router.push("/(tabs)/notes")}
        >
          <Text style={[styles.viewMoreText, { color: titleColor }]}>View more</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  empty: { fontSize: 15, paddingVertical: 8, marginBottom: 8 },
  noteCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  noteTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  noteSnippet: { fontSize: 14 },
  viewMoreButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  viewMoreText: { fontSize: 16, fontWeight: "600" },
});
