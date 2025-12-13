export default {
    CALORIES_PROMPT: `Based on Weight,Height,Gender,Goal 
    calculate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
    Then provide personalized daily macronutrient targets in JSON format.
    Consider Age as 28.
    
    IMPORTANT: Use the Mifflin-St Jeor Equation for BMR calculation:
    - For Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
    - For Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
    
    For TDEE: Multiply BMR by 1.55 (moderate activity level)
    
    Adjust calories based on goal:
    - Weight Loss: TDEE - 500 calories
    - Muscle Gain: TDEE + 300 calories
    - Weight Gain: TDEE + 500 calories
    
    For macronutrient distribution (based on adjusted calories):
    - If goal is "Weight Loss": 40% carbs, 30% protein, 30% fat
    - If goal is "Muscle Gain": 45% carbs, 30% protein, 25% fat
    - If goal is "Weight Gain": 50% carbs, 20% protein, 30% fat
    
    Convert percentages to grams:
    - Protein: (calories × protein%) / 4 (1g protein = 4 calories)
    - Carbohydrates: (calories × carb%) / 4 (1g carb = 4 calories)
    - Fat: (calories × fat%) / 9 (1g fat = 9 calories)
    
    For sodium: Use 2300mg as daily limit (FDA recommendation)
    For sugar: Limit to 10% of total calories (WHO recommendation) = (calories × 0.10) / 4 grams
    
    Follow this exact schema:
    {
        calories: <number> (daily calorie target based on TDEE and goal adjustment),
        proteins: <number> (grams per day, calculated from protein percentage),
        carbohydrates: <number> (grams per day, calculated from carb percentage),
        fat: <number> (grams per day, calculated from fat percentage),
        sodium: <number> (milligrams per day, default 2300),
        sugar: <number> (grams per day, calculated as 10% of calories / 4)
    }
    
    Return ONLY valid JSON, no other text.`,

    GENERATE_RECIPE_OPTION_PROMPT: `:Depends on user instruction create 3 different Recipe variant with Recipe Name with Emoji, 
    2 line description and main ingredient list in JSON format with field recipeName,description,ingredients (without size) only, Do not give me text response`,

    GENERATE_COMPLETE_RECIPE_PROMPT: ` 
            - As per recipeName and description give me recipeName and description as field, Give me all list of ingredients as ingredient ,
            - emoji icons for each ingredient as icon, quantity as quantity, along with detail step by step  recipe as steps
            - Total calories as calories (only number), Minutes to cook as cookTime and serving number as serveTo
            - relastic image Text prompt as per reciepe as imagePrompt
            - Give me category List for reciepe from [Breakfast,Lunch,Dinner,Salad,Dessert,Fastfood,Drink,Cake] as category
            - Give me response in JSON format only
            - Schema fromat should be:
            {
        "description": "string",
        "recipeName": "string",
        "calories": "number",
        "category": ["string"],
        "cookTime": "number",
        "imagePrompt": "string",
        "ingredients": [
            {
                "icon": "string",
                "ingredient": "string",
                "quantity": "string"
            }
        ],
        calories:<Single Person Serve>,
        proteins:<single person serve>
        "serveTo": "number",
        "steps": ["string"]
    }
    `
}