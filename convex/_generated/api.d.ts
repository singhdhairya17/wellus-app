/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as AdaptiveMonitoring from "../AdaptiveMonitoring.js";
import type * as Billing from "../Billing.js";
import type * as MealPlan from "../MealPlan.js";
import type * as Profiles from "../Profiles.js";
import type * as Recipes from "../Recipes.js";
import type * as Reminders from "../Reminders.js";
import type * as Tracking from "../Tracking.js";
import type * as Users from "../Users.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  AdaptiveMonitoring: typeof AdaptiveMonitoring;
  Billing: typeof Billing;
  MealPlan: typeof MealPlan;
  Profiles: typeof Profiles;
  Recipes: typeof Recipes;
  Reminders: typeof Reminders;
  Tracking: typeof Tracking;
  Users: typeof Users;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
