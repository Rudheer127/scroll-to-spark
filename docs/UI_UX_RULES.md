# UI and UX rules

These rules apply to every screen. The look is the Instagram theme from the Figma mockups: a light grey page, white bordered cards, near-black text and one sunset gradient used sparingly (round group stories with a sunset ring, pill tabs), with Reddit-style threads and nested replies. It stays kind and unpressured through plain words.

## Hard rules

1. **No em dashes** in any interface text, label, message or placeholder.
2. **No blank or non-functioning buttons.** Every button, link, tab, menu item and icon that looks clickable does something real. If a feature is not built, the control is not on the screen. Do not render a button that does nothing, and do not disable one without showing why.
3. **No clutter inside boxes.** A card has one purpose, one main action and a small amount of text. If a box needs more, split it into two boxes or move the detail to its own page.
4. **No center alignment of UI boxes unless necessary.** Content boxes, cards, forms and text are left-aligned and sit in the layout grid. Do not float a single box in the middle of the page.
5. **Use the whole desktop width.** Screens are built on a full-width layout with a fixed navigation rail and a fluid content area. No narrow centered column that leaves the rest of the screen empty.

## Using the full desktop width

- The app frame is: a navigation rail on the left, a fluid main area, and a right column where it adds value (for example suggestions, rules or a guide).
- The main area is a grid that grows with the window. At wide widths, show more columns or add a side panel, instead of adding empty margin.
- Do not set a small maximum width and center it. Where a line of text would become too long to read, limit the text measure only (about 70 characters) and keep the box left-aligned, with other content filling the space beside it.
- Suggested breakpoints: one column below 768px, two columns from 768px, three columns from 1280px, four columns from 1792px for card grids. Threads and long text use a main column plus a side column.
- Check every screen at 1280, 1536 and 1920 pixels wide. If there is a large empty area, fix the layout.

## What counts as necessary centering

Center alignment is allowed only here:

- A modal or dialog opening over the page, because it must sit above the content.
- A loading spinner shown alone.
- A small text label inside a round or square control, for example initials in an avatar, or an icon inside a button.
- An empty state for a list that has no items, where a short message and one action replace the list.

Everything else is left-aligned. Sign-in and sign-up screens use a full-width split layout, not a centered card.

## No clutter

- One main action per card. A second action is quieter (outline or text).
- At most three pieces of information in a small card: for example title, time and one tag.
- About 80 words or fewer visible on one screen section. Move the rest to a detail page or a collapsed area.
- Spacing is generous and uses a 4 pixel scale: 4, 8, 12, 16, 24, 32, 48.
- No cards inside cards. Use spacing and a divider line inside a card instead.
- No decorative badges, dots or lines that carry no meaning.
- No tracked capital letters and no all-caps labels. Labels use the normal font, one size smaller, in sentence case.
- No middle-dot separated meta text such as "Tiny Acts . 3h". Put items in their own small elements with spacing.
- No emoji as icons. Use lucide icons. Emoji are allowed only as user content, such as a reaction a person chose.

## Look and feel

| Item | Rule |
|---|---|
| Font | Inter for everything. Headings are bold with slightly tight letter spacing |
| Page background | Very light grey (`#FAFAFA`) so white cards lift off it |
| Surface | White cards with a 1 pixel grey border (`#E6E6E6`), 16 pixel corners and a two-layer shadow |
| Text | Near-black ink (`#262626`) and a mid grey (`#6B6B6B`) for secondary text |
| Links and focus | Deep blue (`#0A58B8`). Red for destructive actions |
| Standard action | A solid near-black pill button (`primary` variant). The active tab and the active effort size use the same fill |
| Gradient | One sunset blend (`--gradient-spark`) for the Spark wordmark, group story rings, the Create group button, a hairline on the step card, and the peak day in the weekly chart. Nowhere else |
| Supporting colors | Soft purple chips for labels and sample data, soft green for thank-yous. Quiet, never filled blocks |
| Emoji | None in the interface |
| Dark mode | Light is the default. A moon/sun button beside the Spark wordmark switches, and the choice is remembered on that device. Dark tokens live under `:root[data-theme="dark"]` in `globals.css`. Text on an ink fill uses `text-on-ink`, never `text-white`. The landing page stays light |
| Control edges | Inputs and other controls use the control border token so their edge is at least 3:1 against the page |
| Radius | 16 pixels on cards, 12 on inputs, full round on buttons, pills and avatars |
| Depth | Page grey, white card, then a floating layer. `shadow-card` on cards, `shadow-lift` on hover, `shadow-pop` on floating layers |
| Motion | Short and subtle. Never animate width, height or position of layout. Honor reduced motion |

All colors, fonts and spacing come from design tokens defined once in the Tailwind theme. No raw hex color or font name inside a component.

## Words

- Plain, short and kind. Write as you would talk to a friend.
- No guilt, no pressure and no fake urgency. Never "You are about to lose your streak".
- Say what will happen before it happens: "A real person from the group will reply within 48 hours."
- Label who wrote a message: "From a real group" or "From the app". Never let app text look like it came from a person.
- Say that the guide is AI everywhere it appears.
- Sample content is labeled as sample content.

## Navigation and structure

- A persistent left navigation rail: Home, Discussions, My steps, Messages, Notifications, Profile.
- The current location is always visible and the way back is always one click.
- The Spark Guide opens as a popup, and can expand to a full page with history, like a chat app. Both views use the same component and the same data.
- The popup's Expand button opens a maximised chat window: a modal over almost the whole screen (all of it on a phone) with the title, the AI label, New chat, Minimize and Close. Escape closes it, focus stays inside and returns to the launcher, and the page behind does not scroll. Message text keeps a reading width of about 70 characters while the window uses the full space. The composer sits at the bottom; the mic shows only when the browser supports speech recognition, and the attach button only when image reading is on.
- Group partners use a separate portal area with its own navigation.

## Discussions

- Groups can be created, joined, left and deleted.
- Only the owner sees Edit and Delete. Deleting asks the owner to type the group name and says what will be removed.
- Threads show votes, comment count and a way to share. Comments are nested with a visible thread line and can be collapsed.
- A comment can contain text, an image, an emoji reaction or a GIF. The composer shows a preview of an attachment with a button to remove it.
- Image limits are shown before upload, not after a failure.

## States every screen needs

| State | Rule |
|---|---|
| Loading | A placeholder that matches the final layout. No blank screen |
| Empty | A short message and the one action that fills it |
| Error | Plain words, what happened, and a button to retry |
| Success | Quiet confirmation near the action. No full-screen celebration |
| Disabled | Only with a visible reason |

## Forms

- A label above every field. Placeholder text is a hint, not a label.
- Errors appear next to the field in plain words.
- The main button says what it does: "Create group", not "Submit".
- A form that can lose work asks before leaving.

## Accessibility

- Contrast meets WCAG AA.
- Every control is reachable and usable by keyboard with a visible focus ring that appears instantly.
- Touch targets are at least 44 by 44 pixels on small screens.
- Text can be enlarged without losing content.
- Page content is readable with scripting off where the framework allows.

## Review checklist for every screen

1. Does any text contain an em dash? Remove it.
2. Does every button and link work? Click each one.
3. Is any box doing more than one job? Split it.
4. Is anything centered that does not need to be? Left-align it.
5. At 1920 pixels wide, is the space used well?
6. Are loading, empty and error states designed?
7. Is it clear who wrote each message, a person or the app?
