import json
import logging
import os

from google import genai
from google.genai import types
from pydantic import BaseModel


# IMPORTANT: KEEP THIS COMMENT
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# - Sometimes the google genai SDK has occasional type errors. You might need to run to validate, at time.  
# The SDK was recently renamed from google-generativeai to google-genai. This file reflects the new name and the new APIs.

# This API key is from Gemini Developer API Key, not vertex AI API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def maritime_phraseology_chat(user_message: str) -> str:
    """
    Chat function specifically for maritime phraseology translations and basic maritime vocabulary.
    """
    system_prompt = (
        "You are a specialized maritime phraseology and translation assistant for the Venezuelan Nautical School. "
        "Your expertise includes:\n\n"
        "1. Translating maritime terms and phrases to/from any language\n"
        "2. Providing basic maritime vocabulary lists\n"
        "3. Explaining nautical terminology used in merchant marine operations\n"
        "4. Helping with international maritime communication standards\n\n"
        "Always respond in Spanish unless specifically asked to translate to another language. "
        "Focus on practical maritime terminology used in:\n"
        "- Ship operations and navigation\n"
        "- Port communications\n"
        "- Safety procedures\n"
        "- Maritime engineering\n"
        "- International maritime regulations\n\n"
        "If asked for a basic vocabulary list, provide 20-30 essential maritime terms with translations."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=user_message)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=1000
            )
        )

        return response.text or "Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo."

    except Exception as e:
        logging.error(f"Error in maritime phraseology chat: {e}")
        return f"Error al procesar tu consulta: {str(e)}"


def get_basic_maritime_vocabulary() -> str:
    """
    Get a basic maritime vocabulary list in multiple languages.
    """
    prompt = (
        "Proporciona una lista básica de 25 términos esenciales de fraseología marítima "
        "con traducciones al inglés, francés, alemán y chino mandarín. "
        "Incluye términos como: puerto, ancla, cubierta, motor, navegación, etc. "
        "Presenta la información en formato de tabla clara."
    )
    
    return maritime_phraseology_chat(prompt)