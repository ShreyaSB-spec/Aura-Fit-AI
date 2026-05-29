# AuraFit AI Dashboard

A personalized, AI-driven fitness dashboard engineered for adaptive health tracking and user-centric data persistence.

### Key Engineering Features:
* **Adaptive Health Logic**: Implements scientific BMI and Ideal Weight formulas:
    * $BMI = \frac{weight(kg)}{height(m)^2}$
    * $Ideal Weight (Devine) \approx 50kg + 2.3kg \times (height\_in\_inches - 60)$
* **Persistence Layer**: Leverages `LocalStorage` to ensure user questionnaire data persists, providing a seamless multi-session experience.
* **Interactive UX**: Designed with React state-based navigation for fluid component switching.
* **Tech Stack**: Next.js (App Router), React, TypeScript, Tailwind CSS.

### Why this project?
Built to bridge the gap between static health apps and intelligent, responsive health tracking. The dashboard adapts based on user questionnaire inputs, reflecting a clean, minimalist design aesthetic.
