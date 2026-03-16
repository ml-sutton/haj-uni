import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  cardBackgroundColor,
  inputBackgroundColor,
  inputBorderColor,
  ERROR_TEXT_COLOR,
} from "@/contexts/theme";
import type { Note } from "@/models/note";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function NoteEditScreen() {
  const params = useLocalSearchParams<{ noteId: string }>();
  const noteId = typeof params.noteId === "string" ? params.noteId : params.noteId?.[0] ?? null;
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);

  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");

  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const inputBg = inputBackgroundColor(resolvedTheme);
  const inputBorder = inputBorderColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const loading = encryptionKey != null && user === null;

  const isNew = noteId === "new";
  const note = useMemo(() => {
    if (!user || isNew || !noteId) return null;
    return (user.notes ?? []).find((n) => n.id === noteId) ?? null;
  }, [user, noteId, isNew]);

  useEffect(() => {
    if (note) {
      setFormTitle(note.title);
      setFormBody(note.body);
    } else if (isNew) {
      setFormTitle("");
      setFormBody("");
    }
  }, [note?.id, isNew]);

  const save = useCallback(() => {
    if (!user) return;
    const trimmedTitle = formTitle.trim() || "Untitled";
    const trimmedBody = formBody.trim();
    const notes = user.notes ?? [];

    if (isNew) {
      const newNote: Note = {
        id: generateId(),
        title: trimmedTitle,
        body: trimmedBody,
        createdAt: new Date().toISOString(),
      };
      setUser({ ...user, notes: [...notes, newNote] });
    } else if (note) {
      const updated: Note = { ...note, title: trimmedTitle, body: trimmedBody };
      setUser({
        ...user,
        notes: notes.map((n) => (n.id === note.id ? updated : n)),
      });
    }
    router.back();
  }, [user, isNew, note, formTitle, formBody, setUser, router]);

  const deleteNote = useCallback(() => {
    if (!user || !note) return;
    setUser({ ...user, notes: (user.notes ?? []).filter((n) => n.id !== note.id) });
    router.back();
  }, [user, note, setUser, router]);

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
            {!encryptionKey ? "Sign in to edit notes." : "Loading…"}
          </Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: titleColor }]}>Go back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  if (!isNew && !note) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: secondaryColor }]}>Note not found.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: titleColor }]}>Go back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: titleColor }]}>← Back</Text>
        </Pressable>

        <Text style={[styles.screenTitle, { color: titleColor }]}>
          {isNew ? "New note" : "Edit note"}
        </Text>

        <Text style={[styles.label, { color: secondaryColor }]}>Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }]}
          placeholder="Title"
          placeholderTextColor={secondaryColor}
          value={formTitle}
          onChangeText={setFormTitle}
        />

        <Text style={[styles.label, { color: secondaryColor }]}>Content</Text>
        <TextInput
          style={[styles.input, styles.bodyInput, { backgroundColor: inputBg, borderColor: inputBorder, color: titleColor }]}
          placeholder="Write your note…"
          placeholderTextColor={secondaryColor}
          value={formBody}
          onChangeText={setFormBody}
          multiline
        />

        <View style={styles.actions}>
          <Pressable style={[styles.saveBtn, { backgroundColor: cardBg }]} onPress={save}>
            <Text style={[styles.saveBtnText, { color: titleColor }]}>Save</Text>
          </Pressable>
          {!isNew && note && (
            <Pressable style={styles.deleteBtn} onPress={deleteNote}>
              <Text style={[styles.deleteBtnText, { color: ERROR_TEXT_COLOR }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backBtnText: { fontSize: 16 },
  screenTitle: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  bodyInput: { height: 140, paddingVertical: 10, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10 },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
  deleteBtn: { paddingVertical: 14, paddingHorizontal: 28, justifyContent: "center" },
  deleteBtnText: { fontWeight: "600" },
  hint: { fontSize: 16 },
});
