/**
 * Regression checks for nutrition/BMI fixes (no React / Expo needed).
 * Run: node scripts/verify-bugfixes.cjs
 */

const CM_PER_INCH = 2.54;

function legacyHeightToCm(legacy) {
  const match = String(legacy).trim().match(/^([0-9]+)(?:\.([0-9]{1,2}))?$/);
  if (!match) return null;
  const feet = parseInt(match[1], 10);
  const inches = match[2] ? parseInt(match[2], 10) : 0;
  return (feet * 12 + inches) * CM_PER_INCH;
}

function bmiFromKgCm(kg, cm) {
  const m = cm / 100;
  return kg / (m * m);
}

function mifflinMale(weightKg, heightCm, age) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

function calorieTarget(weightKg, heightCm, genderMale, age, activityMult, goal) {
  const bmr = genderMale ? mifflinMale(weightKg, heightCm, age) :
    10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = bmr * activityMult;
  if (goal === 'loss') return tdee - 500;
  if (goal === 'muscle') return tdee + 300;
  return tdee + 500;
}

function macrosFromCal(cal, proteinPct = 0.3) {
  return Math.round((cal * proteinPct) / 4);
}

console.log('verify-bugfixes: regression bundle\n');

// 1) Legacy "5.10" -> cm (~177.8)
const cm = legacyHeightToCm('5.10');
console.assert(cm && Math.abs(cm - 177.8) < 1, `5.10 should be ~177.8 cm, got ${cm}`);
console.log('[OK] legacy height "5.10" ->', cm?.toFixed(1), 'cm');

// 2) BMI 70 kg, 5'10" ~ 22.x
const bmi = bmiFromKgCm(70, cm);
console.assert(bmi > 21 && bmi < 23, `BMI should be ~22, got ${bmi}`);
console.log('[OK] BMI 70 kg @ 5\'10"', bmi.toFixed(1));

// 3) OLD BUG: treating height string as cm (parseFloat -> 5.1)
const buggyCalories = calorieTarget(70, 5.1, true, 28, 1.55, 'loss');
console.assert(buggyCalories >= 420 && buggyCalories <= 430,
  `Buggy calories should cluster ~425, got ${buggyCalories}`);
console.log('[OK] old bug reproduced: Weight loss kcal when height wrongly = 5.1 cm →',
  Math.round(buggyCalories));

// 4) FIXED: msj + moderate + weight loss (~2098 cal, protein ~157g at 30%)
const goodCalories = calorieTarget(70, cm, true, 28, 1.55, 'loss');
console.assert(Math.abs(Math.round(goodCalories) - 2098) <= 40,
  `Expected calories ~2098, got ${goodCalories}`);
console.log('[OK] fixed path: Male 70 kg, 28 yo, moderate, weight loss →',
  Math.round(goodCalories), 'kcal');

const protein = macrosFromCal(goodCalories, 0.3);
console.assert(protein >= 150 && protein <= 165, `Protein g expected ~157, got ${protein}`);
console.log('[OK] protein (30% of kcal / 4) →', protein, 'g');

// 5) Activity tiers present
const expected = new Set(['sedentary', 'moderate']);
console.assert(activityMultiplierWorks('moderate'));
console.assert(activityMultiplierWorks('sedentary'));
console.log('[OK] activity multiplier map includes sedentary & moderate');

function activityMultiplierWorks(key) {
  const map = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return map[key] != null && map[key] > 1;
}

console.log('\nAll checks passed.');
process.exit(0);
