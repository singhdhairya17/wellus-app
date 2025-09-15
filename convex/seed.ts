import { mutation } from "./_generated/server";

export const seed = mutation(async ({ db }) => {
  // 👇 Check if we already seeded
  const existingUsers = await db.query("users").collect();
  if (existingUsers.length > 0) {
    return { message: "Seed skipped: users already exist" };
  }

  // Insert demo user
  const userId = await db.insert("users", {
    name: "Alice Johnson",
    email: "alice@example.com",
    picture: "https://example.com/alice.png",
    subscriptionId: "sub_789",
    credits: 100,
    height: "165cm",
    weight: "60kg",
    gender: "female",
    goal: "muscle_gain",
    calories: 2000,
    proteins: 120,
  });

  // Insert demo recipe linked to Alice
  const recipeId = await db.insert("recipes", {
    jsonData: {
      ingredients: ["150g chicken breast", "100g broccoli", "1 tbsp olive oil"],
      steps: [
        "Grill the chicken until fully cooked.",
        "Steam the broccoli.",
        "Serve with olive oil drizzle.",
      ],
      servings: 1,
      prepTime: 25,
    },
    uid: userId,
    imageUrl: "https://example.com/chicken-broccoli.jpg",
    recipeName: "Grilled Chicken with Broccoli",
  });

  // Insert a meal plan
  await db.insert("mealPlan", {
    recipeId,
    date: "2025-09-01",
    mealType: "dinner",
    uid: userId,
    status: true,
    calories: 550,
  });

  return { message: "Seed complete", userId, recipeId };
});
