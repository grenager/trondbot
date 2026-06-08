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

  return NextResponse.json({ ok: true });
}

interface VocabUpdateBody {
  id: string;
  word: string;
  translation: string;
}

function isVocabUpdateBody(value: unknown): value is VocabUpdateBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.word === "string" &&
    r.word.trim().length > 0 &&
    typeof r.translation === "string" &&
    r.translation.trim().length > 0
  );
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

  const { error } = await supabase
    .from("vocab")
    .update({ word: cleanWord, translation: cleanTranslation })
    .eq("id", body.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, word: cleanWord, translation: cleanTranslation });
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
