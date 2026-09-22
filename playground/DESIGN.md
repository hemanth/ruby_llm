# Design System: RubyLLM Playground & Codelab
*Grounded in the visual identity and design language of [rubyllm.com](https://rubyllm.com/)*

## 1. Visual Theme & Atmosphere

**Atmosphere:** Warm, editorial, crafted, and Ruby-native. The design reflects the ethos of Ruby: programmer happiness, human-centered aesthetics, and timeless typography. Rather than generic dark-mode cybernetic neon, it uses warm tactile surfaces (linen/paper in light mode, warm charcoal/stone in dark mode) punctuated by the iconic Ruby Red accent.

**Density:** Balanced and readable. Generous line heights, clean typography, comfortable card padding, and subtle grid alignment.

**Dual-Theme First:** First-class support for both Light and Dark themes, sharing identical spatial rhythm and typography.

## 2. Color Palette & Roles

| Token | Light Theme | Dark Theme | Role |
|---|---|---|---|
| `--home-bg` | `#F7F3F1` | `#1B1B1A` | Canvas background |
| `--home-band-bg` | `#F3ECE7` | `#181817` | Alternating section bands |
| `--home-card-bg` | `#FAF9F7` | `#232323` | Cards, sidebars, panel containers |
| `--home-line` | `#E0D9D5` | `#30302F` | Borders, dividers, inactive indicators |
| `--home-grid-line` | `#F0E9E5` | `#242423` | Subtle 120px geometric grid lines |
| `--home-red` | `#C9271E` | `#ED3434` | Primary brand accent — buttons, active states, highlights |
| `--home-red-dark` | `#B30000` | `#D52E2A` | Hover states and deep accents |
| `--home-red-glow` | `rgba(201,39,30,0.12)` | `rgba(237,52,52,0.16)` | Badges, pills hover wash, active glow |
| `--home-heading` | `#3A3430` | `#ECE9E6` | Headings, titles (Lora serif) |
| `--home-text` | `#2C2926` | `#D6D0CC` | Body text, explanations |
| `--home-muted` | `#5C5353` | `#8F8A86` | Secondary text, captions, subtitles |
| `--home-soft` | `#796B67` | `#7C7773` | Line numbers, meta info |

## 3. Typography Rules

- **Serif Headings:** `"Lora", Georgia, "Times New Roman", serif`
  - Weight 700/800 for main hero headlines: `Build AI features <span class="home-hero-highlight">the Ruby way</span>`.
  - Weight 600/700 for lesson titles and section banners.
- **Interface & Body:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif`
  - Crisp readability for UI controls, navigation, and long-form instructions.
- **Code & Telemetry:** `"JetBrains Mono", "Fira Code", monospace`
  - Used in the Monaco editor, IRB terminal, and token telemetry.
  - Gruvbox syntax palette: keywords in red, strings in olive/lime, symbols in slate/cyan, constants in purple/rose, types in amber.

## 4. Component Stylings

### Buttons
- **Primary Action (Run / Get Started):** Solid pill (`border-radius: 999px`), background `var(--home-red)`, text `#ffffff`, font weight 600. Lifts on hover with subtle shadow.
- **Secondary / Outline (Solution / Restart):** Pill shape with `border: 1px solid var(--home-line)`, text `var(--home-heading)`. Border tints to `var(--home-red)` on hover.

### Cards & Grid Map
- **Surface:** `var(--home-card-bg)` with `border: 1px solid var(--home-line)`.
- **Corners:** Rounded with `border-radius: 16px`.
- **Shadow:** `var(--home-shadow-soft)`.
- **Feature Pills:** Pill shaped (`border-radius: 999px`), subtle border, active/hover wash in `var(--home-red-glow)`.

### Grid Background
- The signature `rubyllm.com` 120px grid background:
  ```css
  background-image:
    linear-gradient(var(--home-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--home-grid-line) 1px, transparent 1px);
  background-size: 120px 120px;
  ```

## 5. WebGPU Syntax Highlighting (gpu-lexer)

Powered by [gpu-lexer](https://gpu-lexer.vercel.app/) using a 41,321-parameter WebGPU neural/transformer model:
- Classifies code spans into 9 visual classes: `plain`, `comment`, `string`, `number`, `keyword`, `type`, `function`, `constant`, `operator`.
- Token classes are styled with the Gruvbox-inspired palette matching `rubyllm-overrides.css` in both light mode and dark mode.
- Includes a seamless zero-delay fallback lexical tokenizer with the exact same 9 classes for browsers or devices without WebGPU enabled.
- Displays an interactive status badge (`⚡ gpu-lexer (WebGPU)`) in the editor header and landing page preview card.

