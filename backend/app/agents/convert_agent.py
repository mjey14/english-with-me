from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import json

load_dotenv()

# mode: "speaking" | "texting" | "writing"
SUB_CATEGORY_META = {
    "work": {
        "meeting":      {"mode": "speaking",   "description": "in-person work meeting (face-to-face with colleagues or manager)"},
        "video_call":   {"mode": "speaking",   "description": "video call / online meeting (Teams, Zoom, Google Meet)"},
        "small_talk":   {"mode": "speaking",   "description": "workplace small talk (casual, friendly, not about work tasks)"},
        "presentation": {"mode": "speaking",   "description": "workplace presentation or pitch (structured, clear, confident delivery to an audience)"},
        "messenger":    {"mode": "messaging",  "description": "work messenger / chat (Slack, Teams — short, async, typed message)"},
        "work_email":   {"mode": "email",      "description": "formal work email to a colleague, manager, or external contact (complete, structured, professional)"},
    },
    "friends": {
        "in_person":  {"mode": "speaking",   "description": "casual in-person conversation or voice call with friends"},
        "whatsapp":   {"mode": "messaging",  "description": "WhatsApp or casual text message to a friend (informal, short, async)"},
        "group_chat": {"mode": "messaging",  "description": "group chat message to multiple friends (casual, inclusive, light — not directed at one person)"},
    },
    "academia": {
        "prof_meeting":  {"mode": "speaking", "description": "one-on-one meeting with a professor or academic supervisor (respectful, clear, professional)"},
        "seminar":       {"mode": "speaking", "description": "academic seminar or lab presentation (formal spoken English, precise terminology)"},
        "conference_qa": {"mode": "speaking", "description": "Q&A session at an academic conference (concise, precise, confident spoken delivery to an expert audience)"},
        "thesis":        {"mode": "writing",  "description": "thesis or academic paper writing (formal written academic English, precise and impersonal)"},
        "prof_email":    {"mode": "email",    "description": "formal email to a professor or academic contact (respectful, structured, complete — not casual)"},
    },
    "todo": None,
}

MODE_INSTRUCTIONS = {
    "speaking": (
        "This expression will be SPOKEN out loud. "
        "Use natural spoken rhythm — contractions (I'm, we'll, let's), conversational connectors, "
        "the way a native speaker would actually say it in real time. "
        "Avoid phrasing that sounds written or formal when spoken aloud."
    ),
    "messaging": (
        "This expression will be sent as a short chat message (Slack, WhatsApp, Teams). "
        "Keep it brief and message-ready. Contractions are fine. Casual tone is appropriate. "
        "Match the register of a real instant message — not an email, not a speech. "
        "Shorter is usually better. No formal salutation or sign-off needed."
    ),
    "email": (
        "This expression will be sent as a formal email. "
        "Use complete, structured sentences. Professional but not stiff. "
        "Appropriate greeting and closing are expected. "
        "Clearer and more deliberate than a chat message — the reader may forward or reference it later."
    ),
    "writing": (
        "This is formal written text. "
        "Use appropriate written register for the context — "
        "precise academic prose for thesis/paper, or concise action phrases for to-do items."
    ),
}


def convert(
    korean_input: str,
    category: str,
    sub_category: str | None,
    role_model_description: str | None,
    user_context: str | None = None,
) -> list[dict]:
    role_model = role_model_description or (
        "articulate, warm but powerful, precise word choice — "
        "inspired by Michelle Obama and Cate Blanchett"
    )

    if category == "todo":
        mode = "writing"
        context_description = (
            "a personal to-do list item. "
            "Native English speakers write to-do items as short verb phrases (not full sentences). "
            "Start with an action verb. Be concise and scannable."
        )
    else:
        sub_meta = (SUB_CATEGORY_META.get(category) or {}).get(sub_category or "")
        if sub_meta:
            mode = sub_meta["mode"]
            context_description = sub_meta["description"]
        else:
            mode = "speaking"
            context_description = f"{category} context"

    mode_instruction = MODE_INSTRUCTIONS[mode]

    system_prompt = f"""You are an expert English expression assistant helping a Korean professional communicate naturally in English.

Your job: translate the Korean input into 2-3 natural English expressions suited to the specific context.

Target English style (role model): {role_model}
Apply this style consistently — word choice, tone, and register should reflect it.

Context: {context_description}

Medium: {mode_instruction}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation outside the JSON):
[
  {{
    "expression": "The English expression",
    "situation_label": "Short label for when to use this (e.g. 'More formal', 'Warmer tone', 'Shorter version')",
    "explanation": "One sentence: why this phrasing works or what makes it natural"
  }},
  ...
]

Rules:
- 2 options minimum, 3 maximum
- Expressions must be immediately usable — copy-paste or say-it-out-loud ready
- Differentiate options meaningfully (tone, formality, length — not just synonyms)
- Keep explanations short (1 sentence max)
- CRITICAL: Do not add nuance, assumptions, or implications that are NOT in the original Korean or the user context. Stay faithful to the original intent."""

    user_message = f"Korean input: {korean_input}"
    if user_context:
        user_message += f"\n\nAdditional context from user: {user_context}"

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_message),
    ]

    llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
    response = llm.invoke(messages)
    content = response.content.strip()

    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    return json.loads(content)
