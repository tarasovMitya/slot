import type { Service, FieldValues, PriceBreakdown } from "../types/calculator";

export function calculatePrice(
  service: Service | null,
  fieldValues: FieldValues,
  travelCost?: number
): PriceBreakdown {
  if (!service) return { items: [], total: 0 };

  const items = [];
  let total = service.basePrice;
  let multiplier = 1;

  // find stepper with priceMultiplier first
  for (const field of service.fields) {
    if (field.type === "stepper" && field.priceMultiplier) {
      const val = fieldValues[field.id];
      multiplier = typeof val === "number" ? val : 1;
    }
  }

  items.push({
    label: `${service.name} × ${multiplier}`,
    amount: service.basePrice * multiplier,
  });
  total = service.basePrice * multiplier;

  for (const field of service.fields) {
    if (field.type === "stepper" && field.priceMultiplier) continue;

    if (field.type === "select") {
      const val = fieldValues[field.id];
      const option = field.options?.find((o) => o.value === val);
      if (option && option.price > 0) {
        const amount = option.price * multiplier;
        items.push({ label: option.label, amount });
        total += amount;
      }
    }

    if (field.type === "toggle") {
      const val = fieldValues[field.id];
      if (val === true && field.price) {
        items.push({ label: field.label, amount: field.price });
        total += field.price;
      }
    }

    if (field.type === "stepper" && !field.priceMultiplier && field.price) {
      const val = fieldValues[field.id];
      const count = typeof val === "number" ? val : 0;
      if (count > 0) {
        items.push({ label: field.label, amount: field.price * count });
        total += field.price * count;
      }
    }
  }

  if (travelCost && travelCost > 0) {
    items.push({ label: "Выезд исполнителя", amount: travelCost });
    total += travelCost;
  }

  return { items, total };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function pluralService(n: number): string {
  return pluralRu(n, "услуга", "услуги", "услуг");
}
