from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
import json

load_dotenv()

CONTEXT_META = {
    "work": {
        "meeting":      "in-person work meetings with colleagues or a manager",
        "video_call":   "video calls and online meetings (Teams, Zoom, Google Meet)",
        "small_talk":   "workplace small talk — casual, friendly conversations not about work tasks",
        "presentation": "workplace presentations and pitches to an audience",
        "messenger":    "work messaging on Slack or Teams — short, async, typed",
        "work_email":   "formal work emails to colleagues, managers, or external contacts",
    },
    "friends": {
        "in_person":  "casual in-person conversations or voice calls with friends",
        "whatsapp":   "WhatsApp or casual text messages to a friend",
        "group_chat": "group chat messages to multiple friends",
    },
    "academia": {
        "prof_meeting":  "one-on-one meetings with a professor or academic supervisor",
        "seminar":       "academic seminars or lab presentations",
        "conference_qa": "Q&A sessions at academic conferences",
        "thesis":        "thesis or academic paper writing",
        "prof_email":    "formal emails to professors or academic contacts",
    },
    "todo": {
        None: "personal to-do lists — short verb phrases, action-oriented",
    },
}


def generate_expressions(
    category: str,
    sub_category: str | None,
    role_model_description: str | None,
    details: str | None = None,
) -> list[dict]:
    role_model = role_model_description or (
        "articulate, warm but powerful, precise word choice — "
        "inspired by Michelle Obama and Cate Blanchett"
    )

    cat_meta = CONTEXT_META.get(category, {})
    context_description = cat_meta.get(sub_category) or cat_meta.get(None) or f"{category} context"

    details_line = f"\nAdditional details from the user: {details}" if details and details.strip() else ""

    system_prompt = f"""You are an expert English expression coach helping a Korean professional learn practical English.

Your job: generate 3 English expressions that native speakers genuinely and frequently use in the following context.
These are NOT translations — they are standalone phrases that come naturally to a native speaker in this situation.

Context: {context_description}{details_line}
Target English style (role model): {role_model}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation outside the JSON):
[
  {{
    "expression": "The English expression",
    "situation_label": "Short label for when to use this (e.g. 'Asking for an update', 'Wrapping up a call')",
    "explanation": "One sentence: when or why a native speaker would naturally say this",
    "korean_equivalent": "Natural Korean sentence that means the same thing in this context (colloquial, not a literal translation)"
  }},
  ...
]

Rules:
- Exactly 3 expressions
- CRITICAL: every expression must be something a native speaker would actually say — not textbook English, not overly formal, not literal translations of common phrases. If a native wouldn't say it, don't include it.
- Each expression must be immediately usable — copy-paste or say-it-out-loud ready
- Cover a variety of situations within the context (don't repeat similar scenarios)
- Keep explanations short and practical (1 sentence max)
- Reflect the target style in tone and word choice"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Generate 3 useful expressions for: {context_description}"),
    ]

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    response = llm.invoke(messages)
    content = response.content.strip()

    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    return json.loads(content)
