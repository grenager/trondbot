import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface VocabInsertBody {
  word: string;
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
}

function isVocabInsertBody(value: unknown): value is VocabInsertBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.word === "string" &&
    r.word.trim().length > 0 &&
    typeof r.translation === "string" &&
    r.translation.trim().length > 0 &&
    typeof r.sourceLanguage === "string" &&
    r.sourceLanguage.length > 0 &&
    typeof r.targetLanguage === "string" &&
    r.targetLanguage.length > 0
  );
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("vocab")
    .select("id, word, translation, source_language, target_language, created_at, last_reviewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isVocabInsertBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stripPunctuation = (text: string): string =>
    text.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "").trim();

  let cleanWord: string = stripPunctuation(body.word.trim()).toLowerCase();
  let cleanTranslation: string = stripPunctuation(body.translation.trim()).toLowerCase();
  let sourceLang: string = body.sourceLanguage;
  let targetLang: string = body.targetLanguage;

  if (sourceLang > targetLang) {
    [cleanWord, cleanTranslation] = [cleanTranslation, cleanWord];
    [sourceLang, targetLang] = [targetLang, sourceLang];
  }

  if (!cleanWord || !cleanTranslation) {
    return NextResponse.json({ error: "Word is empty after cleaning" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("vocab")
    .select("id")
    .eq("user_id", user.id)
    .eq("word", cleanWord)
    .eq("source_language", sourceLang)
    .eq("target_language", targetLang)
    .maybeSingle();

  const existed: boolean = existing !== null;

  const { error } = await supabase.from("vocab").upsert(
    {
      user_id: user.id,
      word: cleanWord,
      translation: cleanTranslation,
      source_language: sourceLang,
      target_language: targetLang,
    },
    { onConflict: "user_id,word,source_language,target_language" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, existed });
}

interface VocabUpdateBody {
  id: string;
  word: string;
  translation: string;
  swapLanguages?: boolean;
}

function isVocabUpdateBody(value: unknown): value is VocabUpdateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const r = value as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    r.id.length === 0 ||
    typeof r.word !== "string" ||
    r.word.trim().length === 0 ||
    typeof r.translation !== "string" ||
    r.translation.trim().length === 0
  ) {
    return false;
  }
  if (r.swapLanguages !== undefined && typeof r.swapLanguages !== "boolean") {
    return false;
  }
  return true;
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isVocabUpdateBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const stripPunctuation = (text: string): string =>
    text.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "").trim();

  const cleanWord: string = stripPunctuation(body.word.trim()).toLowerCase();
  const cleanTranslation: string = stripPunctuation(body.translation.trim()).toLowerCase();

  if (!cleanWord || !cleanTranslation) {
    return NextResponse.json({ error: "Fields are empty after cleaning" }, { status: 400 });
  }

  const updateFields: Record<string, string> = { word: cleanWord, translation: cleanTranslation };

  if (body.swapLanguages) {
    const { data: existing } = await supabase
      .from("vocab")
      .select("source_language, target_language")
      .eq("id", body.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      updateFields.source_language = existing.target_language;
      updateFields.target_language = existing.source_language;
    }
  }

  const { error } = await supabase
    .from("vocab")
    .update(updateFields)
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    word: cleanWord,
    translation: cleanTranslation,
    ...(updateFields.source_language
      ? { source_language: updateFields.source_language, target_language: updateFields.target_language }
      : {}),
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id: string | null = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const { error } = await supabase
    .from("vocab")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
