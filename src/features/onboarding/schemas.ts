import { z } from "zod";

export const NAME_MAX = 40;
export const DISPLAY_NAME_MAX = 60;

const part = (what: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${what}.`)
    .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`);

/** Everything setup asks for. All of it is needed, and nothing else is collected. */
export const onboardingSchema = z.object({
  firstName: part("first name"),
  lastName: part("last name"),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter the name other people will see.")
    .max(DISPLAY_NAME_MAX, `Use ${DISPLAY_NAME_MAX} characters or fewer.`),
  ageConfirmed: z.literal(true, { error: "Please confirm that you are 18 or older." }),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
