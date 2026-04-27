export default {
    GENERATE_RECIPE_OPTION_PROMPT: `Generate exactly 3 recipe variants as a JSON array.
Each item must have: recipeName (string with emoji),
description (max 2 sentences), ingredients (array of name strings, no quantities).
Input:`,

    GENERATE_COMPLETE_RECIPE_PROMPT: `Given recipeName and description, return ONLY a JSON object:
{
  "recipeName": "string",
  "description": "string",
  "calories": number (per serving),
  "proteins": number (per serving),
  "category": ["string"] (from: Breakfast,Lunch,Dinner,Salad,Dessert,Fastfood,Drink,Cake),
  "cookTime": number (minutes),
  "serveTo": number,
  "imagePrompt": "string (realistic image description for the dish)",
  "ingredients": [{ "icon": "string", "ingredient": "string", "quantity": "string" }],
  "steps": ["string"]
}
Return ONLY valid JSON. No markdown. No code fences.`,
}
